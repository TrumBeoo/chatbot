import time
from services.audio_manager import AudioManager
from services.speech_service import SpeechService
from services.ai_service import AIService
from utils.language_detector import LanguageDetector

class TravelChatbot:
    def __init__(self):
        self.audio_manager = AudioManager()
        self.speech_service = SpeechService()
        self.ai_service = AIService()
        self.language_detector = LanguageDetector()
    
    def start(self):
        """Khởi động chatbot"""
        print("🚀 Chatbot du lịch đã sẵn sàng!")
        
        # Chào hỏi ban đầu
        self._welcome()
        
        # Vòng lặp chính
        while True:
            try:
                # Chờ cho đến khi tất cả âm thanh đã phát xong
                self.audio_manager.wait_for_audio_completion()
                time.sleep(0.3)
                
                # Lắng nghe và nhận diện
                text, detected_lang = self.speech_service.listen_and_recognize()
                
                if not text:
                    continue
                
                # Xác nhận ngôn ngữ bằng phân tích văn bản
                if text:
                    text_lang = self.language_detector.detect_language(text)
                    if text_lang != detected_lang:
                        detected_lang = text_lang
                        print(f"🔄 Đã chuyển ngôn ngữ thành: {detected_lang}")
                
                # Kiểm tra lệnh kết thúc
                if self.language_detector.is_exit_command(text):
                    self._farewell(detected_lang)
                    break
                
                # Lấy phản hồi từ AI
                response = self.ai_service.get_response(text, detected_lang)
                print(f"🤖 Chatbot: {response}")
                
                # Phát âm thanh
                self.audio_manager.text_to_speech(response, detected_lang)
                
            except KeyboardInterrupt:
                print("\n Đang thoát...")
                break
            except Exception as e:
                print(f"Lỗi: {e}")
                self.audio_manager.audio_finished_event.set()
                continue

        print("👋 Chatbot đã kết thúc!")
    
    def _welcome(self):
        """Tin nhắn chào hỏi"""
        welcome_msg_vi = "Xin chào! Tôi là trợ lý du lịch của bạn. Bạn có thể hỏi tôi về địa điểm, lịch trình, khách sạn, ẩm thực và nhiều thông tin du lịch khác!"
        welcome_msg_en = "Hello! I am your travel assistant. You can ask me about destinations, itineraries, hotels, food, and more travel information!"
        
        print(f"Chatbot: {welcome_msg_vi}")
        self.audio_manager.text_to_speech(welcome_msg_vi, 'vi')
        
        print(f"Chatbot: {welcome_msg_en}")
        self.audio_manager.text_to_speech(welcome_msg_en, 'en')
    
    def _farewell(self, lang):
        """Tin nhắn tạm biệt"""
        farewell = ("Chào tạm biệt! Chúc bạn có chuyến du lịch vui vẻ!" 
                   if lang == 'vi' 
                   else "Goodbye! Have a wonderful trip!")
        print(f"👋 Chatbot: {farewell}")
        self.audio_manager.text_to_speech(farewell, lang)
        self.audio_manager.wait_for_audio_completion()

if __name__ == "__main__":
    chatbot = TravelChatbot()
    chatbot.start()