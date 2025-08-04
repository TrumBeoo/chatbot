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
from datetime import datetime
import jwt
import uuid

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"], supports_credentials=True)

app.mongo_db = mongo_db
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this in production

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
        pass

def generate_jwt_token(user_id):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow().timestamp() + 86400  # 24 hours
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_jwt_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def handle_speech_recognition(audio_file):
    """Handle speech recognition with language detection"""
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
        audio_file.save(tmp_file.name)
        tmp_filename = tmp_file.name
    
    try:
        recognizer = speech_recognition.Recognizer()
        
        with speech_recognition.AudioFile(tmp_filename) as source:
            audio_data = recognizer.record(source)
        
        for lang_code, lang_name in [("vi-VN", 'vi'), ("en-US", 'en')]:
            try:
                text = recognizer.recognize_google(audio_data, language=lang_code)
                detected_lang = lang_name
                break
            except:
                continue
        else:
            raise ChatbotError('Could not recognize speech')
        
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
    
    if language_detector.is_exit_command(user_message, config.EXIT_COMMANDS):
        farewell = (config.FAREWELL_MSG_VI 
                   if detected_lang == 'vi' 
                   else config.FAREWELL_MSG_EN)
        return {
            'response': farewell,
            'language': detected_lang,
            'is_exit': True
        }
    
    ai_response = ai_client.get_response(user_message, detected_lang)
    
    return {
        'response': ai_response,
        'language': detected_lang,
        'is_exit': False
    }

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Travel Chatbot API is running',
        'timestamp': datetime.utcnow().isoformat()
    })

# Main chat endpoint - FIX THE MISSING ENDPOINT
@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        if 'message' not in data:
            return jsonify({'error': 'Missing message in request body'}), 400
        
        user_message = data['message']
        if not user_message or not user_message.strip():
            return jsonify({'error': 'Message cannot be empty'}), 400
            
        language = data.get('language', 'vi')
        
        result = process_chat_message(user_message.strip(), language)
        
        # Ensure consistent response format
        response_data = {
            'response': result['response'],
            'message': result['response'],  # Fallback field
            'language': result['language'],
            'is_exit': result['is_exit'],
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Chat error: {str(e)}")  # Log for debugging
        return jsonify({
            'error': f'Chat error: {str(e)}',
            'timestamp': datetime.utcnow().isoformat()
        }), 500

# Authentication endpoints
@app.route('/api/auth/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['name', 'email', 'password']
        for field in required_fields:
            if field not in data or not data[field].strip():
                return jsonify({'error': f'Missing {field}'}), 400
        
        # Basic email validation
        email = data['email'].lower().strip()
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user already exists (mock implementation)
        # In real implementation, check MongoDB
        
        user_id = str(uuid.uuid4())
        token = generate_jwt_token(user_id)
        
        user_data = {
            'id': user_id,
            'name': data['name'].strip(),
            'email': email,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'user': user_data,
            'token': token,
            'message': 'User registered successfully'
        })
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({'error': f'Registration error: {str(e)}'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        if not email or not password:
            return jsonify({'error': 'Email and password cannot be empty'}), 400
        
        # Mock authentication - implement real auth logic
        user_id = str(uuid.uuid4())
        token = generate_jwt_token(user_id)
        
        user_data = {
            'id': user_id,
            'name': 'Demo User',  # Get from database
            'email': email,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'user': user_data,
            'token': token,
            'message': 'Login successful'
        })
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': f'Login error: {str(e)}'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """User logout endpoint"""
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/validate', methods=['GET'])
def validate_token():
    """Validate JWT token"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'valid': False}), 401
        
        token = auth_header.split(' ')[1]
        user_id = verify_jwt_token(token)
        
        if user_id:
            return jsonify({'valid': True, 'user_id': user_id})
        else:
            return jsonify({'valid': False}), 401
            
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 401

# Chat history endpoints
@app.route('/api/chat/history/<user_id>', methods=['GET'])
def get_chat_history(user_id):
    """Get chat history for user"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        conversation_id = request.args.get('conversationId')
        
        # Mock data - implement real database queries
        mock_conversations = [
            {
                'id': 'conv-1',
                'title': 'Travel Planning Chat',
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat(),
                'message_count': 5,
                'messages': [
                    {
                        'id': 'msg-1',
                        'text': 'Hello! How can I help you with your travel plans?',
                        'sender': 'bot',
                        'timestamp': datetime.utcnow().isoformat()
                    }
                ]
            }
        ]
        
        return jsonify({
            'conversations': mock_conversations,
            'messages': mock_conversations[0]['messages'] if conversation_id else [],
            'total': len(mock_conversations),
            'page': page,
            'limit': limit
        })
        
    except Exception as e:
        print(f"Error getting chat history: {str(e)}")
        return jsonify({
            'conversations': [],
            'messages': [],
            'total': 0,
            'error': str(e)
        }), 500

@app.route('/api/chat/history/<user_id>', methods=['POST'])
def save_chat_history(user_id):
    """Save chat history for user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Mock implementation - save to database
        return jsonify({
            'message': 'Chat history saved successfully',
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        print(f"Error saving chat history: {str(e)}")
        return jsonify({'error': f'Error saving chat history: {str(e)}'}), 500

@app.route('/api/conversations', methods=['POST'])
def create_conversation():
    """Create new conversation"""
    try:
        data = request.get_json()
        
        conversation_id = str(uuid.uuid4())
        conversation_data = {
            'id': conversation_id,
            'title': data.get('title', 'New Conversation'),
            'userId': data.get('userId'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'message_count': 0
        }
        
        return jsonify(conversation_data)
        
    except Exception as e:
        return jsonify({'error': f'Error creating conversation: {str(e)}'}), 500

@app.route('/api/conversations/<conversation_id>', methods=['PUT'])
def update_conversation(conversation_id):
    """Update conversation"""
    try:
        data = request.get_json()
        
        # Mock implementation
        return jsonify({
            'message': 'Conversation updated successfully',
            'conversation_id': conversation_id,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Error updating conversation: {str(e)}'}), 500

@app.route('/api/conversations/<conversation_id>', methods=['DELETE'])
def delete_conversation(conversation_id):
    """Delete conversation"""
    try:
        # Mock implementation
        return jsonify({
            'message': 'Conversation deleted successfully',
            'conversation_id': conversation_id,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Error deleting conversation: {str(e)}'}), 500

# Existing endpoints (keep as they are)
@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """Text to speech endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text in request body'}), 400
        
        text = data['text']
        language = data.get('language', 'vi')
        
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
        
        text, detected_lang = handle_speech_recognition(audio_file)
        chat_result = process_chat_message(text, detected_lang)
        response_text = chat_result['response']
        is_exit = chat_result['is_exit']
        
        tts_filename = asyncio.run(generate_tts_audio(response_text, detected_lang))
        
        try:
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
    print("Starting Travel Chatbot API...")
    print("Available endpoints:")
    print("- GET  /api/health")
    print("- POST /api/chat")
    print("- POST /api/auth/register")
    print("- POST /api/auth/login")
    print("- POST /api/auth/logout")
    print("- GET  /api/chat/history/<user_id>")
    print("- POST /api/chat/history/<user_id>")
    app.run(debug=True, host='0.0.0.0', port=5000)