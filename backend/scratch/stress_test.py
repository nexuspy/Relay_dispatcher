import asyncio
import httpx
import time

async def send_ticket(client, i):
    tenant_id = "acme_corp"
    email = f"stress_user_{i}@example.com"
    message = f"Stress test ticket #{i}. I need help with my password reset."
    
    start = time.time()
    try:
        response = await client.post("/tickets", json={
            "tenant_id": tenant_id,
            "email": email,
            "message": message
        }, timeout=60.0)
        latency = round((time.time() - start) * 1000)
        print(f"Request #{i}: Status {response.status_code}, Latency {latency}ms")
        return response.status_code, latency
    except Exception as e:
        print(f"Request #{i}: Failed - {e}")
        return 500, 0

async def stress_test(concurrency=5):
    print(f"--- Starting Stress Test with {concurrency} Concurrent Requests ---")
    
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        start_time = time.time()
        tasks = [send_ticket(client, i) for i in range(concurrency)]
        results = await asyncio.gather(*tasks)
        total_time = time.time() - start_time
        
        status_codes = [r[0] for r in results]
        latencies = [r[1] for r in results if r[1] > 0]
        
        print("\n--- Stress Test Results ---")
        print(f"Total Requests: {concurrency}")
        print(f"Success Rate: {status_codes.count(200) / concurrency * 100}%")
        print(f"Average Latency: {sum(latencies) / len(latencies) if latencies else 0:.2f}ms")
        print(f"Total Time: {total_time:.2f}s")
        print(f"Throughput: {concurrency / total_time:.2f} req/s")

if __name__ == "__main__":
    # Starting with a safe concurrency level for AI APIs
    asyncio.run(stress_test(concurrency=5))
