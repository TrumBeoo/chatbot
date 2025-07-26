import speech_recognition
import time
from config import Config

class SpeechService:
    def __init__(self):
        self.recognizer = speech_recognition.Recognizer()
        self.recognizer.energy_threshold = Config.ENERGY_THRESHOLD
        self.recognizer.dynamic_energy_threshold = Config.DYNAMIC_ENERGY_THRESHOLD
    
    def listen_and_recognize(self):
        """Lắng nghe và nhận diện giọng nói"""
        with speech_recognition.Microphone() as mic:
            print("🎤 Chatbot: Tôi đang lắng nghe...")
            self.recognizer.adjust_for_ambient_noise(mic, duration=Config.AMBIENT_NOISE_DURATION)
            
            try:
                audio = self.recognizer.listen(
                    mic, 
                    timeout=Config.AUDIO_TIMEOUT, 
                    phrase_time_limit=Config.PHRASE_TIME_LIMIT
                )
            except speech_recognition.WaitTimeoutError:
                print("⏰ Timeout - không nghe thấy gì")
                return None, None
        
        # Nhận diện giọng nói
        text = ""
        detected_lang = 'vi'
        
        try:
            # Thử nhận diện tiếng Việt trước
            text = self.recognizer.recognize_google(audio, language="vi-VN")
            detected_lang = 'vi'
            print(f"🇻🇳 Nhận diện tiếng Việt: {text}")
        except:
            try:
                # Nếu không được, thử tiếng Anh
                text = self.recognizer.recognize_google(audio, language="en-US")
                detected_lang = 'en'
                print(f"🇺🇸 Nhận diện tiếng Anh: {text}")
            except:
                print("❌ Không thể nhận diện giọng nói")
                return None, None
        
        return text, detected_lang