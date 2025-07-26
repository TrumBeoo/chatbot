from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import speech_recognition
import edge_tts
import asyncio
import os
import requests
import langdetect
from langdetect import detect
import tempfile
import logging
from werkzeug.utils import secure_filename
import uuid
import io
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cấu hình Groq API
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = "your_api_key"  # Thay bằng key thật

headers = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

# Cấu hình giọng nói cho Edge TTS
EDGE_VOICES = {
    'vi': 'vi-VN-HoaiMyNeural',  # Giọng nữ tiếng Việt
    'en': 'en-US-AriaNeural'     # Giọng nữ tiếng Anh
}

# Khởi tạo speech recognition
recognizer = speech_recognition.Recognizer()
recognizer.energy_threshold = 4000  # Tăng ngưỡng năng lượng để tránh tiếng ồn
recognizer.dynamic_energy_threshold = True

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

        logger.info(f"🤖 Đang gọi AI cho input: {user_input}")
        response = requests.post(GROQ_API_URL, headers=headers, json=data)
        
        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"]
            
            # Làm sạch nội dung - loại bỏ các ký tự đặc biệt và dấu câu thừa
            content = content.replace('*', '')  # Loại bỏ dấu sao
            
            # Đảm bảo câu kết thúc bằng dấu câu phù hợp
            if content and not content[-1] in ['.', '!', '?']:
                content += '.'
                
            return content
        else:
            logger.error(f"API Error: {response.status_code} - {response.text}")
            return "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau!" if detected_lang == 'vi' else "Sorry, I'm having issues. Please try again later!"
            
    except Exception as e:
        logger.error(f"Lỗi API: {e}")
        return "Tôi đang bận, vui lòng thử lại sau!" if detected_lang == 'vi' else "I'm busy, please try again later!"

async def text_to_speech_async(text, lang='vi'):
    """Chuyển text thành giọng nói sử dụng Edge TTS"""
    try:
        logger.info(f"🎵 Đang tạo âm thanh cho: {text[:50]}...")
        
        # Tạo file tạm thời
        temp_file = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
        filename = temp_file.name
        temp_file.close()
        
        # Sử dụng Edge TTS
        voice = EDGE_VOICES.get(lang, EDGE_VOICES['vi'])
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(filename)
        
        logger.info(f"📝 Âm thanh đã được tạo: {filename}")
        return filename
        
    except Exception as e:
        logger.error(f"❌ Lỗi tạo âm thanh: {e}")
        return None

def text_to_speech(text, lang='vi'):
    """Wrapper synchronous cho text_to_speech_async"""
    return asyncio.run(text_to_speech_async(text, lang))

@app.route('/chat', methods=['POST'])
def chat():
    """Endpoint cho chat text"""
    try:
        # Lấy tin nhắn từ request
        request_data = request.get_json()
        user_message = request_data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'Không có tin nhắn'}), 400
        
        logger.info(f"📨 Nhận tin nhắn text: {user_message}")
        
        # Nhận diện ngôn ngữ
        detected_lang = detect_language(user_message)
        logger.info(f"🔤 Ngôn ngữ nhận diện: {detected_lang}")
        
        # Lấy phản hồi từ AI
        ai_response = get_ai_response(user_message, detected_lang)
        
        return jsonify({
            "status": "success",
            "response": ai_response,
            "language": detected_lang
        })
        
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        return jsonify({'error': 'Lỗi server'}), 500

@app.route('/chat-voice', methods=['POST'])
def chat_voice():
    """Endpoint cho chat voice"""
    try:
        # Kiểm tra file audio
        if 'audio' not in request.files:
            return jsonify({'error': 'Không có file audio'}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({'error': 'Không có file được chọn'}), 400
        
        logger.info("🎤 Nhận file audio từ client")
        
        # Lưu file audio tạm thời
        temp_audio = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        audio_file.save(temp_audio.name)
        
        # Nhận diện giọng nói
        user_text = ""
        detected_lang = 'vi'
        
        try:
            with speech_recognition.AudioFile(temp_audio.name) as source:
                audio_data = recognizer.record(source)
            
            # Thử nhận diện tiếng Việt trước
            try:
                user_text = recognizer.recognize_google(audio_data, language="vi-VN")
                detected_lang = 'vi'
                logger.info(f"🇻🇳 Nhận diện tiếng Việt: {user_text}")
            except:
                try:
                    # Nếu không được, thử tiếng Anh
                    user_text = recognizer.recognize_google(audio_data, language="en-US")
                    detected_lang = 'en'
                    logger.info(f"🇺🇸 Nhận diện tiếng Anh: {user_text}")
                except:
                    logger.error("❌ Không thể nhận diện giọng nói")
                    # Cleanup và trả lỗi
                    os.unlink(temp_audio.name)
                    return jsonify({'error': 'Không thể nhận diện giọng nói'}), 400
                
        except Exception as e:
            logger.error(f"Lỗi nhận diện giọng nói: {e}")
            os.unlink(temp_audio.name)
            return jsonify({'error': 'Lỗi xử lý file audio'}), 500
        
        # Cleanup file audio tạm thời
        os.unlink(temp_audio.name)
        
        if not user_text:
            return jsonify({'error': 'Không nhận diện được văn bản'}), 400
        
        # Xác nhận ngôn ngữ bằng phân tích văn bản
        if user_text:
            text_lang = detect_language(user_text)
            if text_lang != detected_lang:
                detected_lang = text_lang
                logger.info(f"🔄 Đã chuyển ngôn ngữ thành: {detected_lang}")
        
        # Kiểm tra lệnh kết thúc
        exit_commands = ['bye', 'goodbye', 'tạm biệt', 'chào tạm biệt', 'kết thúc', 'stop']
        if any(cmd in user_text.lower() for cmd in exit_commands):
            farewell = "Chào tạm biệt! Chúc bạn có chuyến du lịch vui vẻ!" if detected_lang == 'vi' else "Goodbye! Have a wonderful trip!"
            logger.info(f"👋 Lệnh kết thúc được nhận diện: {user_text}")
            
            return jsonify({
                'response': farewell,
                'user_text': user_text,
                'language': detected_lang,
                'is_farewell': True
            })
        
        # Lấy phản hồi từ AI
        ai_response = get_ai_response(user_text, detected_lang)
        
        return jsonify({
            'response': ai_response,
            'user_text': user_text,
            'language': detected_lang,
            'is_farewell': False
        })
        
    except Exception as e:
        logger.error(f"Error in chat_voice: {e}")
        return jsonify({'error': 'Lỗi server'}), 500

@app.route('/text-to-speech', methods=['POST'])
def generate_speech():
    """Endpoint để tạo file âm thanh từ text"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        lang = data.get('language', 'vi')
        
        if not text:
            return jsonify({'error': 'Không có văn bản'}), 400
        
        logger.info(f"🔊 Yêu cầu tạo âm thanh: {text[:50]}... (lang: {lang})")
        
        # Tạo file âm thanh
        audio_file = text_to_speech(text, lang)
        
        if audio_file and os.path.exists(audio_file):
            # Tạo unique filename để tránh conflict
            unique_filename = f"speech_{uuid.uuid4().hex}.mp3"
            
            def cleanup_file():
                """Cleanup file sau khi gửi"""
                try:
                    if os.path.exists(audio_file):
                        os.unlink(audio_file)
                        logger.info(f"🗑️ Đã xóa file tạm thời: {audio_file}")
                except Exception as e:
                    logger.error(f"Lỗi cleanup file: {e}")
            
            # Trả file và cleanup sau khi gửi
            try:
                response = send_file(
                    audio_file,
                    as_attachment=True,
                    download_name=unique_filename,
                    mimetype='audio/mpeg'
                )
                
                # Cleanup file sau khi response được gửi
                @response.call_on_close
                def cleanup():
                    cleanup_file()
                
                return response
                
            except Exception as e:
                logger.error(f"Lỗi gửi file: {e}")
                cleanup_file()
                return jsonify({'error': 'Lỗi gửi file âm thanh'}), 500
        else:
            return jsonify({'error': 'Không thể tạo file âm thanh'}), 500
            
    except Exception as e:
        logger.error(f"Error in generate_speech: {e}")
        return jsonify({'error': 'Lỗi server'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'API đang hoạt động',
        'endpoints': {
            'chat': 'POST /chat - Chat bằng text',
            'chat_voice': 'POST /chat-voice - Chat bằng voice',
            'text_to_speech': 'POST /text-to-speech - Tạo file âm thanh',
            'health': 'GET /health - Health check'
        }
    })

if __name__ == '__main__':
    print("🚀 Flask API Server đang khởi động...")
    print("📍 Các endpoint có sẵn:")
    print("  - POST /chat: Chat bằng text")
    print("  - POST /chat-voice: Chat bằng voice (upload audio file)")
    print("  - POST /text-to-speech: Tạo file âm thanh từ text")
    print("  - GET /health: Health check")
    print("🎯 Server sẽ chạy tại: http://localhost:5000")
    print("💡 Nhớ thay đổi GROQ_API_KEY trong code!")
    
    app.run(host='0.0.0.0', port=5000, debug=True)