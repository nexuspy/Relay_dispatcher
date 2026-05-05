
import asyncio
from openai import AsyncOpenAI

async def main():
    client = AsyncOpenAI(api_key="sk-test")
    print(f"Has responses: {hasattr(client, 'responses')}")
    if hasattr(client, 'responses'):
        print(f"responses methods: {dir(client.responses)}")
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())
