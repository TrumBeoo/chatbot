from flask import Flask, request, jsonify
from flask_cors import CORS
import speech_recognition
import tempfile
import os
from dotenv import load_dotenv
import langdetect
from langdetect import detect

load_dotenv()

app = Flask(__name__)
CORS(app)

# Khởi tạo speech recognition (giữ nguyên từ noi.py)
robot_ear = speech_recognition.Recognizer()
robot_ear.energy_threshold = 4000
robot_ear.dynamic_energy_threshold = True

def detect_language(text):
    """Nhận diện ngôn ngữ của văn bản (giữ nguyên từ noi.py)"""
    try:
        lang = detect(text)
        return 'vi' if lang == 'vi' else 'en'
    except:
        vietnamese_chars = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ'
        if any(char in text.lower() for char in vietnamese_chars):
            return 'vi'
        return 'en'

@app.route('/voice-to-text', methods=['POST'])
def voice_to_text():
    """
    API endpoint để chuyển đổi giọng nói thành văn bản
    Sử dụng mô hình từ noi.py
    """
    try:
        # Kiểm tra file audio trong request
        if 'audio' not in request.files:
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy file audio"
            }), 400
        
        audio_file = request.files['audio']
        language_hint = request.form.get('language', 'vi')  # Gợi ý ngôn ngữ
        
        print(f"🎤 Nhận file audio, gợi ý ngôn ngữ: {language_hint}")
        
        # Lưu file tạm thời
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            audio_file.save(tmp_file.name)
            
            try:
                # Sử dụng speech recognition từ noi.py
                with speech_recognition.AudioFile(tmp_file.name) as source:
                    audio_data = robot_ear.record(source)
                    
                    # Thử nhận diện theo gợi ý ngôn ngữ trước
                    recognized_text = ""
                    detected_lang = language_hint
                    
                    try:
                        if language_hint == 'vi':
                            recognized_text = robot_ear.recognize_google(audio_data, language="vi-VN")
                            detected_lang = 'vi'
                            print(f"🇻🇳 Nhận diện tiếng Việt: {recognized_text}")
                        else:
                            recognized_text = robot_ear.recognize_google(audio_data, language="en-US")
                            detected_lang = 'en'
                            print(f"🇺🇸 Nhận diện tiếng Anh: {recognized_text}")
                    except:
                        # Nếu không nhận diện được, thử ngôn ngữ khác
                        try:
                            if language_hint == 'vi':
                                recognized_text = robot_ear.recognize_google(audio_data, language="en-US")
                                detected_lang = 'en'
                                print(f"🔄 Chuyển sang tiếng Anh: {recognized_text}")
                            else:
                                recognized_text = robot_ear.recognize_google(audio_data, language="vi-VN")
                                detected_lang = 'vi'
                                print(f"🔄 Chuyển sang tiếng Việt: {recognized_text}")
                        except:
                            return jsonify({
                                "status": "error",
                                "message": "Không thể nhận diện giọng nói"
                            }), 400
                    
                    # Xác nhận ngôn ngữ bằng phân tích văn bản (giữ nguyên từ noi.py)
                    if recognized_text:
                        text_lang = detect_language(recognized_text)
                        if text_lang != detected_lang:
                            detected_lang = text_lang
                            print(f"🔄 Đã chuyển ngôn ngữ thành: {detected_lang}")
                    
                    # Xóa file tạm
                    os.unlink(tmp_file.name)
                    
                    return jsonify({
                        "status": "success",
                        "text": recognized_text,
                        "language": detected_lang
                    })
                    
            except Exception as e:
                # Xóa file tạm nếu có lỗi
                if os.path.exists(tmp_file.name):
                    os.unlink(tmp_file.name)
                
                print(f"❌ Lỗi nhận diện: {str(e)}")
                return jsonify({
                    "status": "error",
                    "message": f"Lỗi nhận diện giọng nói: {str(e)}"
                }), 500
                
    except Exception as e:
        print(f"❌ Lỗi xử lý: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Lỗi xử lý request: {str(e)}"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Voice-to-Text API is running"
    })

if __name__ == '__main__':
    print("🚀 Voice-to-Text API đã sẵn sàng!")
    app.run(host='0.0.0.0', port=5002, debug=True)