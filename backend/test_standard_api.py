import os
from google import genai
from dotenv import load_dotenv

load_dotenv("../.env")
API_KEY = os.getenv("GOOGLE_API_KEY")

def test_standard():
    client = genai.Client(api_key=API_KEY)
    print("Testing standard prompt...")
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents="Say 'API Key is working!'"
        )
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_standard()
