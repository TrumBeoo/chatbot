from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import speech_recognition as sr
import edge_tts
import asyncio
import os
import requests
from langdetect import detect
import tempfile
import io

app = Flask(__name__)
CORS(app)

url = "https://api.groq.com/openai/v1/chat/completions"
headers = {
    "Authorization": "Bearer your_api_key",  # Thay bằng key thật
    "Content-Type": "application/json"
}

# Cấu hình giọng nói cho Edge TTS
EDGE_VOICES = {
    'vi': 'vi-VN-HoaiMyNeural',  # Giọng nữ tiếng Việt
    'en': 'en-US-AriaNeural'     # Giọng nữ tiếng Anh
}

def detect_language(text):
    """Nhận diện ngôn ngữ của văn bản"""
    try:
        lang = detect(text)
        return 'vi' if lang == 'vi' else 'en'
    except:
        vietnamese_chars = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ'
        if any(char in text.lower() for char in vietnamese_chars):
            return 'vi'
        return 'en'

def get_ai_response(user_input, detected_lang):
    """Gọi API để lấy phản hồi từ AI"""
    try:
        if detected_lang == 'vi':
            system_prompt = """Bạn là một trợ lý du lịch thông minh. Khi được hỏi bằng tiếng Việt, bạn sẽ trả lời bằng tiếng Việt. 
        Bạn chỉ trả lời các câu hỏi liên quan đến du lịch như: địa điểm, lịch trình, khách sạn, ẩm thực, văn hóa, giao thông, 
        thời tiết, chi phí du lịch, v.v. Phạm vi trả lời của bạn chỉ giới hạn trong tỉnh Quảng Ninh. 
        Nếu câu hỏi không liên quan đến du lịch hoặc nằm ngoài tỉnh Quảng Ninh, hãy lịch sự từ chối và gợi ý người dùng hỏi về du lịch tại Quảng Ninh."""
        else:
            system_prompt = """You are a smart travel assistant. When asked in English, you will respond in English. 
        You only answer questions related to travel such as: destinations, itineraries, hotels, food, culture, transportation, 
        weather, travel costs, etc. Your answers are strictly limited to the Quang Ninh province. 
        If the question is not travel-related or is outside Quang Ninh, politely decline and suggest asking about travel in Quang Ninh."""

        data = {
            "model": "llama3-70b-8192",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ],
            "temperature": 0.7,
            "max_tokens": 300
        }

        print("🤖 Đang gọi AI...")
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"]
            content = content.replace('*', '')  # Loại bỏ dấu sao
            if content and not content[-1] in ['.', '!', '?']:
                content += '.'
            return content, detected_lang
        else:
            error_msg = "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau!" if detected_lang == 'vi' else "Sorry, I'm having issues. Please try again later!"
            return error_msg, detected_lang
            
    except Exception as e:
        print(f"Lỗi API: {e}")
        error_msg = "Tôi đang bận, vui lòng thử lại sau!" if detected_lang == 'vi' else "I'm busy, please try again later!"
        return error_msg, detected_lang

async def text_to_speech(text, lang='vi'):
    """Chuyển text thành file âm thanh"""
    try:
        voice = EDGE_VOICES.get(lang, EDGE_VOICES['vi'])
        
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
            filename = tmp_file.name
            
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(filename)
        
        return filename
    except Exception as e:
        print(f"❌ Lỗi tạo âm thanh: {e}")
        return None

@app.route('/chat-voice', methods=['POST'])
def chat_voice():
    """Xử lý voice chat: nhận audio file, trả về audio response"""
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
        
    audio_file = request.files['audio']
    
    # Khởi tạo recognizer
    recognizer = sr.Recognizer()
    recognizer.energy_threshold = 4000
    recognizer.dynamic_energy_threshold = True
    
    try:
        # Đọc audio từ file
        with sr.AudioFile(audio_file) as source:
            print("🎤 Đang nhận dạng giọng nói...")
            audio_data = recognizer.record(source)
            
        # Thử nhận dạng tiếng Việt trước
        try:
            text = recognizer.recognize_google(audio_data, language="vi-VN")
            lang = 'vi'
            print(f"🇻🇳 Nhận diện tiếng Việt: {text}")
        except:
            try:
                # Nếu không được, thử tiếng Anh
                text = recognizer.recognize_google(audio_data, language="en-US")
                lang = 'en'
                print(f"🇺🇸 Nhận diện tiếng Anh: {text}")
            except sr.UnknownValueError:
                return jsonify({"error": "Không thể nhận dạng giọng nói"}), 400
            except sr.RequestError:
                return jsonify({"error": "Lỗi kết nối với Google Speech Recognition"}), 500
        
        # Xác nhận ngôn ngữ bằng phân tích văn bản
        if text:
            text_lang = detect_language(text)
            if text_lang != lang:
                lang = text_lang
                print(f"🔄 Đã chuyển ngôn ngữ thành: {lang}")
        
        # Lấy phản hồi từ AI
        response_text, detected_lang = get_ai_response(text, lang)
        print(f"🤖 Phản hồi AI: {response_text}")
        
        # Chuyển text thành speech
        audio_file = asyncio.run(text_to_speech(response_text, detected_lang))
        
        if audio_file and os.path.exists(audio_file):
            try:
                return send_file(
                    audio_file,
                    mimetype='audio/mpeg',
                    as_attachment=True,
                    download_name='response.mp3'
                )
            finally:
                # Cleanup: xóa file tạm sau khi gửi
                os.remove(audio_file)
        else:
            return jsonify({"error": "Không thể tạo âm thanh"}), 500
            
    except Exception as e:
        print(f"Lỗi: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/speak', methods=['POST'])
def speak():
    """Chuyển text thành speech"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        lang = data.get('lang', 'vi')
        
        if not text:
            return jsonify({"error": "Missing text parameter"}), 400
            
        print(f"🎵 Đang tạo âm thanh cho: {text}")
        
        audio_file = asyncio.run(text_to_speech(text, lang))
        
        if audio_file and os.path.exists(audio_file):
            try:
                return send_file(
                    audio_file,
                    mimetype='audio/mpeg',
                    as_attachment=True,
                    download_name='speech.mp3'
                )
            finally:
                # Cleanup: xóa file tạm sau khi gửi
                os.remove(audio_file)
        else:
            return jsonify({"error": "Không thể tạo âm thanh"}), 500
            
    except Exception as e:
        print(f"Lỗi: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/')
def index():
    return "Voice Chat API is running!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
