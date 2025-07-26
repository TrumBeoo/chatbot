from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import json
from services.ai_service import AIService
from utils.language_detector import LanguageDetector

app = Flask(__name__)
CORS(app)

# Khởi tạo services
ai_service = AIService()
language_detector = LanguageDetector()

@app.route('/')
def index():
    """Trang chủ"""
    return render_template('index.html')


@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route('/api/chat', methods=['POST'])
def chat():
    """API endpoint để chat với bot"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400
        
        user_message = data['message']
        detected_lang = data.get('language', 'auto')
        
        # Tự động phát hiện ngôn ngữ nếu không được chỉ định
        if detected_lang == 'auto':
            detected_lang = language_detector.detect_language(user_message)
        
        # Lấy phản hồi từ AI
        response = ai_service.get_response(user_message, detected_lang)
        
        return jsonify({
            'response': response,
            'detected_language': detected_lang,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Travel Chatbot API'
    })

@app.route('/api/languages', methods=['GET'])
def get_supported_languages():
    """Lấy danh sách ngôn ngữ được hỗ trợ"""
    return jsonify({
        'languages': ['vi', 'en'],
        'default': 'vi'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)