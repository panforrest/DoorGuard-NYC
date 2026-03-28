import asyncio
import os
import json
import traceback
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google import genai
from google.genai import types

# Initialize the router and Gemini client
router = APIRouter()

# Get the API key from environment
API_KEY = os.getenv("GEMINI_API_KEY") 
if not API_KEY:
    # Fallback to the user's likely env variable name from earlier
    API_KEY = os.getenv("GOOGLE_API_KEY")

print(f"Voice API Debug: API_KEY found? {bool(API_KEY)}")
if API_KEY:
    print(f"Voice API Debug: API_KEY starts with: {API_KEY[:5]}...")

# We use the recommended 2.0 flash model for live bidi-streaming
MODEL_ID = "gemini-2.5-flash-native-audio-latest"

async def receive_from_client(websocket: WebSocket, session):
    """Receive audio from the React frontend and send to Gemini"""
    try:
        while True:
            # Receive text or bytes from the frontend
            data = await websocket.receive()
            
            if "bytes" in data:
                # This is raw audio from the mic
                audio_bytes = data["bytes"]
                # Send raw PCM16 to Gemini via real-time input
                # The google-genai SDK uses session.send for both text and audio parts
                try:
                    await session.send(input=types.Part.from_bytes(data=audio_bytes, mime_type="audio/pcm;rate=16000"))
                except Exception as e:
                    print(f"Error sending audio to Gemini: {e}")
                    break
            elif "text" in data:
                # This is a text message or system instruction
                text_msg = data["text"]
                print(f"Received text from client: {text_msg}")
                try:
                    payload = json.loads(text_msg)
                    if payload.get("type") == "init":
                        # Send initial context to the model
                        init_text = payload.get("text", "Hello")
                        print(f"Sending init message to Gemini: {init_text}")
                        await session.send(input=init_text, end_of_turn=True)
                except json.JSONDecodeError:
                    print(f"Sending raw text to Gemini: {text_msg}")
                    await session.send(input=text_msg, end_of_turn=True)
                except Exception as e:
                    print(f"Error sending text to Gemini: {e}")
                    traceback.print_exc()
                    break
                    
    except WebSocketDisconnect:
        print("Client disconnected from WebSocket.")
    except Exception as e:
        print(f"Error in receive_from_client: {e}")
        traceback.print_exc()

async def send_to_client(websocket: WebSocket, session):
    """Receive audio and text from Gemini and send to React frontend"""
    try:
        async for response in session.receive():
            # print(f"Received response from Gemini: {response}") # Very verbose
            server_content = response.server_content
            if server_content is not None:
                model_turn = server_content.model_turn
                if model_turn is not None:
                    for part in model_turn.parts:
                        # 1. Send Text (Transcript)
                        if part.text:
                            print(f"Gemini says: {part.text}")
                            await websocket.send_json({
                                "type": "text",
                                "role": "agent",
                                "text": part.text
                            })
                        
                        # 2. Send Audio (Voice)
                        if part.inline_data:
                            # Send raw bytes to the frontend for playback
                            await websocket.send_bytes(part.inline_data.data)
                            
                # Check for tool calls (if we integrated tools later)
                if server_content.turn_complete:
                    pass
    except asyncio.CancelledError:
        pass
    except Exception as e:
        print(f"Error receiving from Gemini: {e}")
        traceback.print_exc()

@router.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Websocket connection accepted.")
    
    if not API_KEY:
        print("Error: Gemini API key is not configured.")
        await websocket.send_json({"type": "error", "text": "Gemini API key is not configured."})
        await websocket.close()
        return
        
    try:
        client = genai.Client(api_key=API_KEY, http_options={'api_version': 'v1alpha'})
        print("Gemini client initialized.")
    except Exception as e:
        print(f"Failed to initialize Gemini client: {e}")
        await websocket.send_json({"type": "error", "text": f"Failed to initialize Gemini: {e}"})
        await websocket.close()
        return

    # Configuration for the DoorGuard Persona
    system_instruction = """
    You are DoorGuard, an AI assistant for a tenant living in NYC. 
    A visitor is at the door. You are talking to them through an intercom.
    Your goal is to figure out who they are and what their purpose is.
    Keep your responses short, conversational, and strict. Do not let them in unless 
    you ascertain their exact role (e.g., HPD Inspector, ConEd worker, Delivery driver).
    """
    
    config = types.LiveConnectConfig(
        response_modalities=["TEXT"], # Simplified to TEXT first to test stability
    )

    try:
        print(f"Attempting to connect to Gemini Live (Model: {MODEL_ID})...")
        # Establish the Bidi-Streaming connection with Gemini Live
        async with client.aio.live.connect(model=MODEL_ID, config=config) as session:
            print("Successfully connected to Gemini Live API!")
            
            # Start concurrent tasks for bidi communication
            client_task = asyncio.create_task(receive_from_client(websocket, session))
            gemini_task = asyncio.create_task(send_to_client(websocket, session))
            
            # Wait for either to finish (or error out)
            done, pending = await asyncio.wait(
                [client_task, gemini_task],
                return_when=asyncio.FIRST_COMPLETED
            )
            
            # Cancel pending tasks
            for task in pending:
                task.cancel()
            
            # Wait for tasks to clean up
            await asyncio.gather(*pending, return_exceptions=True)
            print("Tasks completed/canceled.")
                
    except Exception as e:
        print(f"Failed to connect to Gemini Live: {e}")
        traceback.print_exc()
        await websocket.send_json({"type": "error", "text": f"Connection failed: {e}"})
        await websocket.close(code=1011)
    finally:
        print("Websocket closing.")
