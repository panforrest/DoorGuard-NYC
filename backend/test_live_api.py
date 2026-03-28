import asyncio
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv("../.env")
API_KEY = os.getenv("GOOGLE_API_KEY")

async def test_live():
    client = genai.Client(api_key=API_KEY, http_options={'api_version': 'v1beta'})
    model_id = "gemini-2.0-flash-exp"
    
    config = types.LiveConnectConfig(
        response_modalities=["TEXT"]
    )
    
    print(f"Testing connection to {model_id}...")
    try:
        async with client.aio.live.connect(model=model_id, config=config) as session:
            print("Connected!")
            await session.send(input="Hello", end_of_turn=True)
            async for response in session.receive():
                print(f"Received: {response}")
                break
            print("Success!")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_live())
