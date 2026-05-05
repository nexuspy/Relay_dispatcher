
import asyncio
import os
import json
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def test_response_api_messages():
    client = AsyncOpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.getenv("NVIDIA_API_KEY")
    )
    
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Tell me a joke."}
    ]
    
    try:
        # Testing if input accepts a list of messages
        stream = await client.responses.create(
            model="openai/gpt-oss-120b",
            input=messages,
            stream=True
        )
        
        async for chunk in stream:
            print(f"Type: {chunk.type}")
            if hasattr(chunk, 'delta'):
                print(f"Delta: {chunk.delta}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(test_response_api_messages())
