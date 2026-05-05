import requests
import json

def test_analytics():
    try:
        response = requests.get("http://localhost:8000/analytics")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_analytics()
