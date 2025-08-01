from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tempfile
import os
import base64
import asyncio
import edge_tts
import speech_recognition
from audio_manager import AudioManager
from language_detector import LanguageDetector
from ai_client import AIClient
from config import Config
from db.routes import api_bp
from db import mongo_db


app = Flask(__name__)
CORS(app, origins=["https://qbot-mu.vercel.app/"])
app.mongo_db = mongo_db

app.register_blueprint(api_bp, url_prefix='/api')

# Initialize components
audio_manager = AudioManager()
language_detector = LanguageDetector()
ai_client = AIClient()
config = Config()

class ChatbotError(Exception):
    """Custom exception for chatbot errors"""
    pass

def cleanup_temp_file(filename):
    """Utility function to clean up temporary files"""
    try:
        if os.path.exists(filename):
            os.remove(filename)
    except OSError:
        pass  # Ignore cleanup errors

def handle_speech_recognition(audio_file):
    """Handle speech recognition with language detection"""
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
        audio_file.save(tmp_file.name)
        tmp_filename = tmp_file.name
    
    try:
        recognizer = speech_recognition.Recognizer()
        
        with speech_recognition.AudioFile(tmp_filename) as source:
            audio_data = recognizer.record(source)
        
        # Try Vietnamese first, then English
        for lang_code, lang_name in [("vi-VN", 'vi'), ("en-US", 'en')]:
            try:
                text = recognizer.recognize_google(audio_data, language=lang_code)
                detected_lang = lang_name
                break
            except:
                continue
        else:
            raise ChatbotError('Could not recognize speech')
        
        # Confirm language using text analysis
        text_lang = language_detector.detect_language(text)
        if text_lang != detected_lang:
            detected_lang = text_lang
            
        return text, detected_lang
        
    finally:
        cleanup_temp_file(tmp_filename)

async def generate_tts_audio(text, language):
    """Generate TTS audio asynchronously"""
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
        filename = tmp_file.name
    
    voice = config.EDGE_VOICES.get(language, config.EDGE_VOICES['vi'])
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(filename)
    
    return filename

def process_chat_message(user_message, language=None):
    """Process chat message and return response"""
    detected_lang = language or language_detector.detect_language(user_message)
    
    # Check for exit command
    if language_detector.is_exit_command(user_message, config.EXIT_COMMANDS):
        farewell = (config.FAREWELL_MSG_VI 
                   if detected_lang == 'vi' 
                   else config.FAREWELL_MSG_EN)
        return {
            'response': farewell,
            'language': detected_lang,
            'is_exit': True
        }
    
    # Get AI response
    ai_response = ai_client.get_response(user_message, detected_lang)
    
    return {
        'response': ai_response,
        'language': detected_lang,
        'is_exit': False
    }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Travel Chatbot API is running'
    })

@app.route('/api/chat/text', methods=['POST'])
def chat_text():
    """Text chat endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Missing message in request body'}), 400
        
        user_message = data['message']
        language = data.get('language')
        
        result = process_chat_message(user_message, language)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """Text to speech endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text in request body'}), 400
        
        text = data['text']
        language = data.get('language', 'vi')
        
        # Generate TTS audio
        filename = asyncio.run(generate_tts_audio(text, language))
        
        return send_file(
            filename,
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name='speech.mp3'
        )
        
    except Exception as e:
        return jsonify({'error': f'TTS error: {str(e)}'}), 500

@app.route('/api/stt', methods=['POST'])
def speech_to_text():
    """Speech to text endpoint"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'Missing audio file'}), 400
        
        audio_file = request.files['audio']
        
        if audio_file.filename == '':
            return jsonify({'error': 'No audio file selected'}), 400
        
        text, detected_lang = handle_speech_recognition(audio_file)
        
        return jsonify({
            'text': text,
            'language': detected_lang
        })
        
    except ChatbotError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'STT error: {str(e)}'}), 500

@app.route('/api/chat/voice', methods=['POST'])
def chat_voice():
    """Voice chat endpoint (STT + Chat + TTS)"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'Missing audio file'}), 400
        
        audio_file = request.files['audio']
        
        # Step 1: Speech to Text
        text, detected_lang = handle_speech_recognition(audio_file)
        
        # Step 2: Process chat
        chat_result = process_chat_message(text, detected_lang)
        response_text = chat_result['response']
        is_exit = chat_result['is_exit']
        
        # Step 3: Text to Speech
        tts_filename = asyncio.run(generate_tts_audio(response_text, detected_lang))
        
        try:
            # Read audio file and encode to base64
            with open(tts_filename, 'rb') as f:
                audio_data = base64.b64encode(f.read()).decode('utf-8')
        finally:
            cleanup_temp_file(tts_filename)
        
        return jsonify({
            'recognized_text': text,
            'response_text': response_text,
            'language': detected_lang,
            'is_exit': is_exit,
            'audio_data': audio_data
        })
        
    except ChatbotError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Voice chat error: {str(e)}'}), 500

@app.route('/api/welcome', methods=['GET'])
def get_welcome_messages():
    """Get welcome messages endpoint"""
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
        return jsonify({'error': f'Error getting welcome messages: {str(e)}'}), 500

@app.route('/api/status/audio', methods=['GET'])
def audio_status():
    """Audio status endpoint"""
    try:
        return jsonify({
            'is_playing': audio_manager.is_audio_playing(),
            'queue_size': audio_manager.audio_queue.qsize()
        })
        
    except Exception as e:
        return jsonify({'error': f'Error checking audio status: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)