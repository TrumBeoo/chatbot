#!/usr/bin/env python3
"""
Test script for the chat API
"""
import requests
import json

def test_chat_api():
    """Test the chat API endpoint"""
    url = "http://localhost:5000/chat"
    
    # Test message
    test_message = "Xin chào! Bạn có thể giới thiệu về du lịch Quảng Ninh không?"
    
    payload = {
        "message": test_message
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        print(f"Testing API with message: {test_message}")
        print("Sending request to:", url)
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            if data.get("status") == "success":
                print("\n✅ API test successful!")
                print(f"Bot response: {data.get('response')}")
            else:
                print("\n❌ API returned error status")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Could not connect to the server.")
        print("Make sure the backend server is running on http://localhost:5000")
    except requests.exceptions.Timeout:
        print("❌ Timeout Error: Request took too long to complete.")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_health_check():
    """Test the health check endpoint"""
    url = "http://localhost:5000/health"
    
    try:
        print("\nTesting health check endpoint...")
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed!")
            print(f"Response: {data}")
        else:
            print(f"❌ Health check failed with status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Health check error: {e}")

if __name__ == "__main__":
    print("🚀 Testing Chat API...")
    print("=" * 50)
    
    # Test health check first
    test_health_check()
    
    # Test chat API
    test_chat_api()
    
    print("\n" + "=" * 50)
    print("Test completed!")