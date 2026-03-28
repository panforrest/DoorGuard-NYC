import { useState, useRef, useCallback } from 'react';

export function useVoice(onTranscript) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const wsRef = useRef(null);
  
  // Audio playback queue for Gemini responses
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  const connect = useCallback(async () => {
    try {
      console.log("Voice: Attempting to connect to backend...");
      // 1. Setup WebSocket to our FastAPI backend
      const ws = new WebSocket('ws://127.0.0.1:8000/ws/chat');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Voice: WebSocket opened successfully.");
        setIsConnected(true);
        // Initial setup payload
        const initMsg = { type: 'init', text: 'Hello DoorGuard. A visitor is here.' };
        console.log("Voice: Sending init message:", initMsg);
        ws.send(JSON.stringify(initMsg));
      };

      ws.onmessage = async (event) => {
        // console.log("Voice: Message received", event.data);
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.type === 'text') {
            console.log("Voice: Transcript received:", data.text);
            if (onTranscript) onTranscript(data);
          } else if (data.type === 'error') {
            console.error("Voice: Server Error:", data.text);
            alert("Voice Error: " + data.text);
            setIsConnected(false);
          }
        } else {
          // Binary audio data (PCM16 from Gemini)
          const arrayBuffer = await event.data.arrayBuffer();
          audioQueueRef.current.push(arrayBuffer);
          playNextAudio();
        }
      };

      ws.onclose = (event) => {
        console.warn(`Voice: WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
        setIsConnected(false);
        stopMic();
      };

      ws.onerror = (err) => {
        console.error("Voice: WebSocket Error:", err);
      };

      // 2. Setup Mic Capture (downsample to 16kHz PCM16 for Gemini)
      console.log("Voice: Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Voice: Microphone access granted.");
      mediaStreamRef.current = stream;
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Using ScriptProcessor for hackathon simplicity (AudioWorklet is better but more complex to setup in a single file)
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processorRef.current.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 (PCM16)
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Send base64 to FastAPI (or better, raw bytes)
        // FastAPI `websocket.receive()` with `bytes` handles raw bytes
        ws.send(pcm16.buffer);
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

    } catch (err) {
      console.error("Voice connection failed:", err);
      setIsConnected(false);
    }
  }, [onTranscript]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    stopMic();
    setIsConnected(false);
  }, []);

  const stopMic = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  // Playback queue mechanism
  const playNextAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    
    isPlayingRef.current = true;
    setIsSpeaking(true);
    
    const arrayBuffer = audioQueueRef.current.shift();
    if (!audioContextRef.current) return;
    
    try {
      // Decode the raw PCM16? Web Audio API decodeAudioData expects a file format with headers (WAV/MP3).
      // Since Gemini sends raw PCM16, we have to manually create the AudioBuffer.
      const int16 = new Int16Array(arrayBuffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }
      
      const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000); // Gemini returns 24kHz audio
      audioBuffer.getChannelData(0).set(float32);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        isPlayingRef.current = false;
        setIsSpeaking(false);
        playNextAudio();
      };
      
      source.start();
    } catch (e) {
      console.error("Playback error", e);
      isPlayingRef.current = false;
      setIsSpeaking(false);
      playNextAudio();
    }
  }, []);

  return { connect, disconnect, isConnected, isSpeaking };
}
