import os
import asyncio
import tempfile
import base64
import requests
import edge_tts
from langdetect import detect
import pytz
from datetime import datetime
from flask import jsonify

# API configuration
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your_api_key")
headers = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

EDGE_VOICES = {
    'vi': 'vi-VN-HoaiMyNeural',
    'en': 'en-US-AriaNeural'
}


def detect_language(text: str) -> str:
    """Detect language for given text, fallback to vi/en heuristic."""
    try:
        detected = detect(text)
        # Map common language codes to supported ones
        if detected in ['vi', 'vietnamese']:
            return 'vi'
        elif detected in ['en', 'english']:
            return 'en'
        else:
            # Fallback to character-based detection
            vietnamese_chars = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ'
            if any(char in text.lower() for char in vietnamese_chars):
                return 'vi'
            return 'en'
    except Exception:
        # Enhanced fallback detection
        text_lower = text.lower()
        vietnamese_chars = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ'
        vietnamese_words = ['tôi', 'bạn', 'chúng', 'của', 'trong', 'một', 'có', 'được', 'này', 'đó']
        english_words = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with']
        
        # Check Vietnamese characters
        if any(char in text_lower for char in vietnamese_chars):
            return 'vi'
        
        # Check Vietnamese words
        if any(word in text_lower for word in vietnamese_words):
            return 'vi'
            
        # Check English words
        if any(word in text_lower for word in english_words):
            return 'en'
            
        return 'vi'  # Default to Vietnamese


def get_ai_response(user_input: str, detected_lang: str) -> str:
    """Call Groq Chat Completions to get an AI response constrained by domain/lang."""
    try:
        if detected_lang == 'vi':
            system_prompt = (
                """Bạn là một trợ lý du lịch thông minh của tỉnh Quảng Ninh, Việt Nam. Bạn tên là QBot.
                Khi được hỏi bằng tiếng Việt, bạn phải trả lời bằng tiếng Việt. 
                Bạn chỉ trả lời các câu hỏi liên quan đến du lịch như: địa điểm tham quan, lịch trình, 
                khách sạn, nhà hàng, ẩm thực địa phương, văn hóa, lịch sử, giao thông, thời tiết, 
                chi phí du lịch, hoạt động giải trí, v.v. 
                
                Phạm vi trả lời của bạn CHỈ giới hạn trong các địa phương và các địa điểm du lịch tỉnh Quảng Ninh (bao gồm Hạ Long, Cẩm Phả, 
                Móng Cái, Đông Triều, Quảng Yên, v.v.). 
                
                Nếu câu hỏi không liên quan đến du lịch hoặc nằm ngoài tỉnh Quảng Ninh, hãy lịch sự 
                từ chối và gợi ý người dùng hỏi về du lịch tại Quảng Ninh.
                
                Hãy trả lời một cách thân thiện, nhiệt tình và cung cấp thông tin hữu ích."""
            )
        else:
            system_prompt = (
                """You are a smart travel assistant specializing in Quang Ninh Province, Vietnam. Your name is QBot.
                When asked in English, you MUST respond in English. 
                You only answer questions related to travel such as: tourist destinations, itineraries, 
                hotels, restaurants, local cuisine, culture, history, transportation, weather, 
                travel costs, entertainment activities, etc. 
                
                Your answers are STRICTLY limited to Quang Ninh Province (including Ha Long, Cam Pha, 
                Mong Cai, Dong Trieu, Quang Yen, etc.). 
                
                If the question is not travel-related or is outside Quang Ninh Province, politely 
                decline and suggest asking about travel in Quang Ninh.
                
                Please respond in a friendly, enthusiastic manner and provide useful information."""
            )

        data = {
            "model": "llama3-70b-8192",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ],
            "temperature": 0.7,
            "max_tokens": 400  # Increased for better responses
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=data, timeout=60)
        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"]
            content = content.replace('*', '').strip()
            
            # Ensure proper sentence ending
            if content and content[-1] not in ['.', '!', '?']:
                content += '.'
                
            return content
        else:
            error_msg = (
                "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau!" 
                if detected_lang == 'vi' 
                else "Sorry, I'm experiencing technical issues. Please try again later!"
            )
            return error_msg
            
    except Exception as e:
        print(f"API Error: {e}")
        error_msg = (
            "Tôi đang bận, vui lòng thử lại sau!" 
            if detected_lang == 'vi' 
            else "I'm busy right now, please try again later!"
        )
        return error_msg


def synthesize_speech_to_bytes(text: str, lang: str = 'vi') -> bytes:
    """Synthesize speech with Edge TTS and return MP3 bytes."""
    # Ensure we use the correct voice for the detected language
    voice = EDGE_VOICES.get(lang, EDGE_VOICES['vi'])
    
    print(f"TTS: Using voice '{voice}' for language '{lang}'")

    async def _run() -> bytes:
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
            tmp_path = tmp.name
        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(tmp_path)
            with open(tmp_path, 'rb') as f:
                data = f.read()
            return data
        except Exception as e:
            print(f"TTS Error: {e}")
            return b''  # Return empty bytes on error
        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass

    # Run the async function in a fresh loop to avoid conflicts
    return asyncio.run(_run())


if __name__ == '__main__':
    print("🚀 Chatbot du lịch đã sẵn sàng (chế độ dòng lệnh)! Gõ 'exit' để thoát.")
    while True:
        try:
            user = input("Bạn: ").strip()
            if not user:
                continue
            if user.lower() in {"exit", "quit", "bye", "tạm biệt"}:
                print("👋 Tạm biệt!")
                break
            lang = detect_language(user)
            print(f"[Detected language: {lang}]")
            answer = get_ai_response(user, lang)
            print(f"Bot: {answer}")
        except KeyboardInterrupt:
            print("\n👋 Tạm biệt!")
            break