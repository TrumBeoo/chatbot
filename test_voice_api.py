#!/usr/bin/env python3
"""
Test script for the voice chat API with language detection
"""
import requests
import json

def test_voice_api_with_language_detection():
    """Test the voice API endpoint with automatic language detection"""
    url = "http://localhost:5000/voice-chat"
    
    # Test cases: Vietnamese and English
    test_cases = [
        {
            "text": "Xin chào! Bạn có thể giới thiệu về du lịch Quảng Ninh không?",
            "expected_lang": "vi",
            "description": "Vietnamese text"
        },
        {
            "text": "Hello! Can you tell me about tourism in Quang Ninh?",
            "expected_lang": "en", 
            "description": "English text"
        },
        {
            "text": "Vịnh Hạ Long có gì đặc biệt?",
            "expected_lang": "vi",
            "description": "Vietnamese text about Ha Long Bay"
        },
        {
            "text": "What are the best places to visit in Quang Ninh?",
            "expected_lang": "en",
            "description": "English text about Quang Ninh attractions"
        }
    ]
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print("🎤 Testing Voice API with Language Detection")
    print("=" * 60)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['description']}")
        print(f"Input: {test_case['text']}")
        print(f"Expected language: {test_case['expected_lang']}")
        
        # Send request without language parameter to test auto-detection
        payload = {
            "text": test_case['text']
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("status") == "success":
                    detected_lang = data.get("language")
                    response_text = data.get("response")
                    has_audio = bool(data.get("audio"))
                    
                    print(f"✅ Success!")
                    print(f"   Detected language: {detected_lang}")
                    print(f"   Response: {response_text[:100]}{'...' if len(response_text) > 100 else ''}")
                    print(f"   Audio generated: {'Yes' if has_audio else 'No'}")
                    
                    # Check if language detection is correct
                    if detected_lang == test_case['expected_lang']:
                        print(f"   ✅ Language detection correct!")
                    else:
                        print(f"   ⚠️  Language detection mismatch. Expected: {test_case['expected_lang']}, Got: {detected_lang}")
                        
                else:
                    print(f"❌ API returned error: {data.get('message', 'Unknown error')}")
                    
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection Error: Could not connect to the server.")
            print("   Make sure the backend server is running on http://localhost:5000")
            break
        except requests.exceptions.Timeout:
            print("❌ Timeout Error: Request took too long to complete.")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            
        print("-" * 40)

def test_voice_api_with_explicit_language():
    """Test the voice API endpoint with explicit language parameter"""
    url = "http://localhost:5000/voice-chat"
    
    print("\n🎯 Testing Voice API with Explicit Language Parameter")
    print("=" * 60)
    
    # Test with explicit language parameter
    test_case = {
        "text": "Hello, this is a test message",
        "language": "en",
        "description": "English text with explicit language parameter"
    }
    
    payload = {
        "text": test_case['text'],
        "language": test_case['language']
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print(f"Input: {test_case['text']}")
    print(f"Explicit language: {test_case['language']}")
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("status") == "success":
                detected_lang = data.get("language")
                response_text = data.get("response")
                has_audio = bool(data.get("audio"))
                
                print(f"✅ Success!")
                print(f"   Returned language: {detected_lang}")
                print(f"   Response: {response_text[:100]}{'...' if len(response_text) > 100 else ''}")
                print(f"   Audio generated: {'Yes' if has_audio else 'No'}")
                
            else:
                print(f"❌ API returned error: {data.get('message', 'Unknown error')}")
                
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_health_check():
    """Test the health check endpoint"""
    url = "http://localhost:5000/health"
    
    try:
        print("🏥 Testing health check endpoint...")
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed!")
            print(f"   Response: {data}")
        else:
            print(f"❌ Health check failed with status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Health check error: {e}")

if __name__ == "__main__":
    print("🚀 Testing Voice Chat API with Language Detection...")
    print("=" * 70)
    
    # Test health check first
    test_health_check()
    
    # Test voice API with automatic language detection
    test_voice_api_with_language_detection()
    
    # Test voice API with explicit language parameter
    test_voice_api_with_explicit_language()
    
    print("\n" + "=" * 70)
    print("🎉 Voice API test completed!")
    print("\nNote: Make sure the backend server is running with:")
    print("cd backend && python app.py")