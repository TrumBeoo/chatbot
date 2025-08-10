from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import base64
import os

from noi import detect_language, get_ai_response, synthesize_speech_to_bytes
from auth import auth_bp, token_required
from chat_history import chat_bp
from db import chat_collection
from bson import ObjectId
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

# Set JWT secret key
app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'your-secret-key-change-this-in-production')

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(chat_bp, url_prefix='/api/chat')


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Chat and Voice API running'
    })


@app.route('/chat', methods=['POST'])
def chat():
    """Public chat endpoint (no authentication required)"""
    try:
        data = request.get_json(force=True)
        message = (data or {}).get('message', '').strip()
        lang = (data or {}).get('language')
        
        if not message:
            return jsonify({'status': 'error', 'message': 'Missing message'}), 400
        
        if not lang:
            lang = detect_language(message)
        
        response_text = get_ai_response(message, lang)
        
        return jsonify({
            'status': 'success', 
            'response': response_text, 
            'language': lang
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/chat-authenticated', methods=['POST'])
@token_required
def chat_authenticated(current_user_id):
    """Authenticated chat endpoint that saves to history"""
    try:
        data = request.get_json(force=True)
        message = (data or {}).get('message', '').strip()
        lang = (data or {}).get('language')
        conversation_id = (data or {}).get('conversation_id')
        
        if not message:
            return jsonify({'status': 'error', 'message': 'Missing message'}), 400
        
        if not lang:
            lang = detect_language(message)
        
        # Get AI response
        response_text = get_ai_response(message, lang)
        
        # Save to chat history if conversation_id is provided
        if conversation_id:
            try:
                if ObjectId.is_valid(conversation_id):
                    # Check if conversation exists and belongs to user
                    conversation = chat_collection.find_one({
                        '_id': ObjectId(conversation_id),
                        'user_id': ObjectId(current_user_id)
                    })
                    
                    if conversation:
                        # Add messages to existing conversation
                        timestamp = datetime.utcnow()
                        
                        user_msg = {
                            '_id': ObjectId(),
                            'text': message,
                            'sender': 'user',
                            'timestamp': timestamp,
                            'language': lang
                        }
                        
                        bot_msg = {
                            '_id': ObjectId(),
                            'text': response_text,
                            'sender': 'bot',
                            'timestamp': timestamp,
                            'language': lang
                        }
                        
                        chat_collection.update_one(
                            {'_id': ObjectId(conversation_id)},
                            {
                                '$push': {'messages': {'$each': [user_msg, bot_msg]}},
                                '$set': {'updated_at': timestamp}
                            }
                        )
            except Exception as e:
                print(f"Error saving to chat history: {str(e)}")
                # Continue even if saving fails
        
        return jsonify({
            'status': 'success', 
            'response': response_text, 
            'language': lang
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/voice-chat', methods=['POST'])
def voice_chat():
    """Public voice chat endpoint (no authentication required)"""
    try:
        data = request.get_json(force=True)
        text = (data or {}).get('text', '').strip()
        lang = (data or {}).get('language')
        
        if not text:
            return jsonify({'status': 'error', 'message': 'Missing text'}), 400
        
        if not lang:
            lang = detect_language(text)
        
        # Get AI response
        response_text = get_ai_response(text, lang)
        
        # TTS synthesize
        audio_bytes = synthesize_speech_to_bytes(response_text, lang)
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else ''
        
        return jsonify({
            'status': 'success',
            'response': response_text,
            'language': lang,
            'audio': audio_b64
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/voice-chat-authenticated', methods=['POST'])
@token_required
def voice_chat_authenticated(current_user_id):
    """Authenticated voice chat endpoint that saves to history"""
    try:
        data = request.get_json(force=True)
        text = (data or {}).get('text', '').strip()
        lang = (data or {}).get('language')
        conversation_id = (data or {}).get('conversation_id')
        
        if not text:
            return jsonify({'status': 'error', 'message': 'Missing text'}), 400
        
        if not lang:
            lang = detect_language(text)
        
        # Get AI response
        response_text = get_ai_response(text, lang)
        
        # TTS synthesize
        audio_bytes = synthesize_speech_to_bytes(response_text, lang)
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8') if audio_bytes else ''
        
        # Save to chat history if conversation_id is provided
        if conversation_id:
            try:
                if ObjectId.is_valid(conversation_id):
                    # Check if conversation exists and belongs to user
                    conversation = chat_collection.find_one({
                        '_id': ObjectId(conversation_id),
                        'user_id': ObjectId(current_user_id)
                    })
                    
                    if conversation:
                        # Add messages to existing conversation
                        timestamp = datetime.utcnow()
                        
                        user_msg = {
                            '_id': ObjectId(),
                            'text': text,
                            'sender': 'user',
                            'timestamp': timestamp,
                            'language': lang
                        }
                        
                        bot_msg = {
                            '_id': ObjectId(),
                            'text': response_text,
                            'sender': 'bot',
                            'timestamp': timestamp,
                            'language': lang
                        }
                        
                        chat_collection.update_one(
                            {'_id': ObjectId(conversation_id)},
                            {
                                '$push': {'messages': {'$each': [user_msg, bot_msg]}},
                                '$set': {'updated_at': timestamp}
                            }
                        )
            except Exception as e:
                print(f"Error saving to chat history: {str(e)}")
                # Continue even if saving fails
        
        return jsonify({
            'status': 'success',
            'response': response_text,
            'language': lang,
            'audio': audio_b64
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


if __name__ == '__main__':
    print('🚀 Chat API is ready on http://0.0.0.0:5000')
    print('🔐 Authentication endpoints available at /api/auth/*')
    print('💬 Chat history endpoints available at /api/chat/*')
    app.run(host='0.0.0.0', port=5000, debug=True)
