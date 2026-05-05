
import asyncio
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def test_response_api():
    client = AsyncOpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.getenv("NVIDIA_API_KEY")
    )
    
    try:
        # Testing with a simple string input first
        stream = await client.responses.create(
            model="openai/gpt-oss-120b",
            input="Hello, tell me a joke and show your reasoning.",
            stream=True
        )
        
        async for chunk in stream:
            print(f"Chunk type: {chunk.type}")
            if hasattr(chunk, 'delta'):
                print(f"Delta: {chunk.delta}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(test_response_api())
