import os
import asyncio
import tempfile
import base64
import requests
import edge_tts
from langdetect import detect

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
        lang = detect(text)
        return 'vi' if lang == 'vi' else 'en'
    except Exception:
        vietnamese_chars = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ'
        if any(char in text.lower() for char in vietnamese_chars):
            return 'vi'
        return 'en'


def get_ai_response(user_input: str, detected_lang: str) -> str:
    """Call Groq Chat Completions to get an AI response constrained by domain/lang."""
    try:
        if detected_lang == 'vi':
            system_prompt = (
                """Bạn là một trợ lý du lịch thông minh. Khi được hỏi bằng tiếng Việt, bạn sẽ trả lời bằng tiếng Việt. 
        Bạn chỉ trả lời các câu hỏi liên quan đến du lịch như: địa điểm, lịch trình, khách sạn, ẩm thực, văn hóa, giao thông, 
        thời tiết, chi phí du lịch, v.v. Phạm vi trả lời của bạn chỉ giới hạn trong tỉnh Quảng Ninh. 
        Nếu câu hỏi không liên quan đến du lịch hoặc nằm ngoài tỉnh Quảng Ninh, hãy lịch sự từ chối và gợi ý người dùng hỏi về du lịch tại Quảng Ninh."""
            )
        else:
            system_prompt = (
                """You are a smart travel assistant. When asked in English, you will respond in English. 
        You only answer questions related to travel such as: destinations, itineraries, hotels, food, culture, transportation, 
        weather, travel costs, etc. Your answers are strictly limited to the Quang Ninh province. 
        If the question is not travel-related or is outside Quang Ninh, politely decline and suggest asking about travel in Quang Ninh."""
            )

        data = {
            "model": "llama3-70b-8192",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ],
            "temperature": 0.7,
            "max_tokens": 300
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=data, timeout=60)
        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"]
            content = content.replace('*', '')
            if content and content[-1] not in ['.', '!', '?']:
                content += '.'
            return content
        else:
            return (
                "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau!" if detected_lang == 'vi' 
                else "Sorry, I'm having issues. Please try again later!"
            )
    except Exception as e:
        print(f"Lỗi API: {e}")
        return (
            "Tôi đang bận, vui lòng thử lại sau!" if detected_lang == 'vi' 
            else "I'm busy, please try again later!"
        )


def synthesize_speech_to_bytes(text: str, lang: str = 'vi') -> bytes:
    """Synthesize speech with Edge TTS and return MP3 bytes."""
    voice = EDGE_VOICES.get(lang, EDGE_VOICES['vi'])

    async def _run() -> bytes:
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
            tmp_path = tmp.name
        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(tmp_path)
            with open(tmp_path, 'rb') as f:
                data = f.read()
            return data
        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass

    # Run the async function in a fresh loop to avoid conflicts
    return asyncio.run(_run())


if __name__ == '__main__':
    # Module test: simple prompt/response loop without audio I/O
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
            answer = get_ai_response(user, lang)
            print(f"Bot: {answer}")
        except KeyboardInterrupt:
            print("\n👋 Tạm biệt!")
            break
