import asyncio
import httpx
import json

async def test_long_response():
    print("--- Testing Fix for Long AI Responses ---")
    
    # Using 'globex' as the user's previous examples were from globex/synthesis
    tenant_id = "globex"
    email = "hr@globex.com"
    message = "I lost my office keycard and I need a replacement. What are the exact steps to get a new one?"
    
    print(f"\n[Input] Message: {message}")
    
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        try:
            response = await client.post("/tickets", json={
                "tenant_id": tenant_id,
                "email": email,
                "message": message
            }, timeout=60.0)
            
            if response.status_code != 200:
                print(f"Error: {response.status_code} - {response.text}")
                return
                
            data = response.json()
            resolution = data.get('suggested_resolution', '')
            
            print("\n[Output] AI Response:")
            print(f"Priority: {data.get('priority')}")
            print("-" * 40)
            try:
                print(resolution)
            except UnicodeEncodeError:
                print(resolution.encode('ascii', 'ignore').decode('ascii'))
            print("-" * 40)
            
            # Verify if it's JSON
            if resolution.strip().startswith('{'):
                print("\nFAILED: Response is still raw JSON.")
            elif len(resolution) > 500:
                print(f"\nSUCCESS: Received a long, clean response ({len(resolution)} chars).")
            else:
                print(f"\nSUCCESS: Received a clean response ({len(resolution)} chars).")
                
            if resolution.endswith('}'):
                print("WARNING: Response ends with '}', might still be JSON.")
                
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_long_response())
