import speech_recognition
import time
from typing import Optional, Tuple
from config import Config

class SpeechRecognizer:
    """Lớp nhận diện giọng nói"""
    
    def __init__(self):
        self.recognizer = speech_recognition.Recognizer()
        self.config = Config()
        
        # Cấu hình recognizer
        self.recognizer.energy_threshold = self.config.ENERGY_THRESHOLD
        self.recognizer.dynamic_energy_threshold = self.config.DYNAMIC_ENERGY_THRESHOLD
    
    def listen_for_speech(self) -> Tuple[Optional[str], str]:
        """
        Lắng nghe và nhận diện giọng nói
        
        Returns:
            Tuple[Optional[str], str]: (text nhận diện được, ngôn ngữ phát hiện)
        """
        try:
            with speech_recognition.Microphone() as mic:
                print("🎤 Chatbot: Tôi đang lắng nghe...")
                self.recognizer.adjust_for_ambient_noise(mic, duration=self.config.AMBIENT_NOISE_DURATION)
                
                try:
                    # Lắng nghe với timeout hợp lý
                    audio = self.recognizer.listen(
                        mic, 
                        timeout=self.config.LISTEN_TIMEOUT, 
                        phrase_time_limit=self.config.PHRASE_TIME_LIMIT
                    )
                except speech_recognition.WaitTimeoutError:
                    print("⏰ Timeout - không nghe thấy gì")
                    return None, 'vi'
            
            # Nhận diện giọng nói
            return self._recognize_audio(audio)
            
        except Exception as e:
            print(f"Lỗi khi lắng nghe: {e}")
            return None, 'vi'
    
    def _recognize_audio(self, audio) -> Tuple[Optional[str], str]:
        """
        Nhận diện audio và xác định ngôn ngữ
        
        Args:
            audio: Audio data từ microphone
            
        Returns:
            Tuple[Optional[str], str]: (text nhận diện được, ngôn ngữ)
        """
        # Thử nhận diện tiếng Việt trước
        try:
            text = self.recognizer.recognize_google(audio, language="vi-VN")
            print(f"🇻🇳 Nhận diện tiếng Việt: {text}")
            return text, 'vi'
        except:
            try:
                # Nếu không được, thử tiếng Anh
                text = self.recognizer.recognize_google(audio, language="en-US")
                print(f"🇺🇸 Nhận diện tiếng Anh: {text}")
                return text, 'en'
            except:
                print("❌ Không thể nhận diện giọng nói")
                return None, 'vi'