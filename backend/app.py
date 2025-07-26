from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tempfile
import os
import base64
import asyncio
import edge_tts
import io
import wave
import speech_recognition
from audio_manager import AudioManager
from language_detector import LanguageDetector
from ai_client import AIClient
from config import Config
from db.routes import api_bp
from db import mongo_db  # Thêm dòng này (import mongo_db object)

app = Flask(__name__)
CORS(app)  # Cho phép CORS cho frontend
app.mongo_db = mongo_db  # Gắn DB vào app để current_app.mongo_db hoạt động đúng

app.register_blueprint(api_bp, url_prefix='/api')


# Khởi tạo các component
audio_manager = AudioManager()
language_detector = LanguageDetector()
ai_client = AIClient()
config = Config()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Kiểm tra trạng thái API"""
    return jsonify({
        'status': 'healthy',
        'message': 'Travel Chatbot API is running'
    })

@app.route('/api/chat/text', methods=['POST'])
def chat_text():
    """
    API chat qua text
    Body: {
        "message": "câu hỏi của user",
        "language": "vi" hoặc "en" (optional)
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({
                'error': 'Missing message in request body'
            }), 400
        
        user_message = data['message']
        
        # Phát hiện ngôn ngữ
        detected_lang = data.get('language') or language_detector.detect_language(user_message)
        
        # Kiểm tra lệnh kết thúc
        is_exit = language_detector.is_exit_command(user_message, config.EXIT_COMMANDS)
        
        if is_exit:
            farewell = (config.FAREWELL_MSG_VI 
                       if detected_lang == 'vi' 
                       else config.FAREWELL_MSG_EN)
            return jsonify({
                'response': farewell,
                'language': detected_lang,
                'is_exit': True
            })
        
        # Lấy phản hồi từ AI
        ai_response = ai_client.get_response(user_message, detected_lang)
        
        return jsonify({
            'response': ai_response,
            'language': detected_lang,
            'is_exit': False
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """
    API chuyển đổi text thành speech
    Body: {
        "text": "text cần chuyển thành giọng nói",
        "language": "vi" hoặc "en"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing text in request body'
            }), 400
        
        text = data['text']
        language = data.get('language', 'vi')
        
        # Tạo file audio tạm thời
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
            filename = tmp_file.name
        
        # Sử dụng Edge TTS để tạo audio
        import asyncio
        import edge_tts
        
        voice = config.EDGE_VOICES.get(language, config.EDGE_VOICES['vi'])
        
        async def create_tts():
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(filename)
        
        asyncio.run(create_tts())
        
        # Trả về file audio
        return send_file(
            filename,
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name='speech.mp3'
        )
        
    except Exception as e:
        return jsonify({
            'error': f'TTS error: {str(e)}'
        }), 500

@app.route('/api/stt', methods=['POST'])
def speech_to_text():
    """
    API chuyển đổi speech thành text
    Body: audio file (multipart/form-data)
    """
    try:
        if 'audio' not in request.files:
            return jsonify({
                'error': 'Missing audio file'
            }), 400
        
        audio_file = request.files['audio']
        
        if audio_file.filename == '':
            return jsonify({
                'error': 'No audio file selected'
            }), 400
        
        # Lưu file tạm thời
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            audio_file.save(tmp_file.name)
            tmp_filename = tmp_file.name
        
        try:
            # Khởi tạo recognizer
            recognizer = speech_recognition.Recognizer()
            
            # Đọc file audio
            with speech_recognition.AudioFile(tmp_filename) as source:
                audio_data = recognizer.record(source)
            
            # Thử nhận diện tiếng Việt trước
            try:
                text = recognizer.recognize_google(audio_data, language="vi-VN")
                detected_lang = 'vi'
            except:
                try:
                    # Nếu không được, thử tiếng Anh
                    text = recognizer.recognize_google(audio_data, language="en-US")
                    detected_lang = 'en'
                except:
                    return jsonify({
                        'error': 'Could not recognize speech'
                    }), 400
            
            # Xác nhận ngôn ngữ bằng phân tích văn bản
            text_lang = language_detector.detect_language(text)
            if text_lang != detected_lang:
                detected_lang = text_lang
            
            return jsonify({
                'text': text,
                'language': detected_lang
            })
            
        finally:
            # Xóa file tạm thời
            if os.path.exists(tmp_filename):
                os.remove(tmp_filename)
        
    except Exception as e:
        return jsonify({
            'error': f'STT error: {str(e)}'
        }), 500

@app.route('/api/chat/voice', methods=['POST'])
def chat_voice():
    """
    API chat qua voice (kết hợp STT + Chat + TTS)
    Body: audio file (multipart/form-data)
    """
    try:
        # Bước 1: Speech to Text
        if 'audio' not in request.files:
            return jsonify({
                'error': 'Missing audio file'
            }), 400
        
        audio_file = request.files['audio']
        
        # STT
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            audio_file.save(tmp_file.name)
            tmp_filename = tmp_file.name
        
        try:
            recognizer = speech_recognition.Recognizer()
            
            with speech_recognition.AudioFile(tmp_filename) as source:
                audio_data = recognizer.record(source)
            
            # Nhận diện giọng nói
            try:
                text = recognizer.recognize_google(audio_data, language="vi-VN")
                detected_lang = 'vi'
            except:
                try:
                    text = recognizer.recognize_google(audio_data, language="en-US")
                    detected_lang = 'en'
                except:
                    return jsonify({
                        'error': 'Could not recognize speech'
                    }), 400
            
            # Xác nhận ngôn ngữ
            text_lang = language_detector.detect_language(text)
            if text_lang != detected_lang:
                detected_lang = text_lang
            
        finally:
            if os.path.exists(tmp_filename):
                os.remove(tmp_filename)
        
        # Bước 2: Xử lý chat
        is_exit = language_detector.is_exit_command(text, config.EXIT_COMMANDS)
        
        if is_exit:
            response_text = (config.FAREWELL_MSG_VI 
                            if detected_lang == 'vi' 
                            else config.FAREWELL_MSG_EN)
        else:
            response_text = ai_client.get_response(text, detected_lang)
        
        # Bước 3: TTS
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
            tts_filename = tmp_file.name
        
        
        
        voice = config.EDGE_VOICES.get(detected_lang, config.EDGE_VOICES['vi'])
       
        async def create_tts():
            communicate = edge_tts.Communicate(response_text, voice)
            await communicate.save(tts_filename)
        
        asyncio.run(create_tts())
        
        # Đọc file audio và encode base64 để trả về
        with open(tts_filename, 'rb') as f:
            audio_data = base64.b64encode(f.read()).decode('utf-8')
        
        # Xóa file tạm thời
        if os.path.exists(tts_filename):
            os.remove(tts_filename)
        
        return jsonify({
            'recognized_text': text,
            'response_text': response_text,
            'language': detected_lang,
            'is_exit': is_exit,
            'audio_data': audio_data  # Base64 encoded audio
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Voice chat error: {str(e)}'
        }), 500

@app.route('/api/welcome', methods=['GET'])
def get_welcome_messages():
   """
   API lấy thông điệp chào hỏi
   """
   try:
       return jsonify({
           'vi': {
               'text': config.WELCOME_MSG_VI,
               'voice': config.EDGE_VOICES['vi']
           },
           'en': {
               'text': config.WELCOME_MSG_EN,
               'voice': config.EDGE_VOICES['en']
           }
       })
       
   except Exception as e:
       return jsonify({
           'error': f'Error getting welcome messages: {str(e)}'
       }), 500

@app.route('/api/status/audio', methods=['GET'])
def audio_status():
   """
   API kiểm tra trạng thái audio
   """
   try:
       return jsonify({
           'is_playing': audio_manager.is_audio_playing(),
           'queue_size': audio_manager.audio_queue.qsize()
       })
       
   except Exception as e:
       return jsonify({
           'error': f'Error checking audio status: {str(e)}'
       }), 500


    
if __name__ == '__main__':
   app.run(debug=True, host='0.0.0.0', port=5000)