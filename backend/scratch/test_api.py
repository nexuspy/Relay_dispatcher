
import requests
import json

def test_api():
    url = "http://localhost:8000/tickets"
    data = {
        "tenant_id": "acme_corp",
        "email": "user@example.com",
        "message": "I have a billing issue, can you help?"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
