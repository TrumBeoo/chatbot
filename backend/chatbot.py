import time
from audio_manager import AudioManager
from speech_recognizer import SpeechRecognizer
from language_detector import LanguageDetector
from ai_client import AIClient
from config import Config

class TravelChatbot:
    """Lớp chatbot du lịch chính"""
    
    def __init__(self):
        self.config = Config()
        self.audio_manager = AudioManager()
        self.speech_recognizer = SpeechRecognizer()
        self.language_detector = LanguageDetector()
        self.ai_client = AIClient()
        
    def start(self):
        """Khởi động chatbot"""
        print("🚀 Chatbot du lịch đã sẵn sàng!")
        
        # Chào hỏi ban đầu
        self._welcome()
        
        # Vòng lặp chính
        self._main_loop()
        
        print("👋 Chatbot đã kết thúc!")
    
    def _welcome(self):
        """Phát thông điệp chào hỏi"""
        print(f"Chatbot: {self.config.WELCOME_MSG_VI}")
        self.audio_manager.text_to_speech(self.config.WELCOME_MSG_VI, 'vi')
        
        print(f"Chatbot: {self.config.WELCOME_MSG_EN}")
        self.audio_manager.text_to_speech(self.config.WELCOME_MSG_EN, 'en')
    
    def _main_loop(self):
        """Vòng lặp chính của chatbot"""
        while True:
            try:
                # Chờ cho đến khi tất cả âm thanh đã phát xong
                self.audio_manager.wait_for_audio_completion()
                
                # Thêm delay nhỏ để đảm bảo âm thanh đã kết thúc hoàn toàn
                time.sleep(self.config.COMPLETION_DELAY)
                
                # Lắng nghe người dùng
                user_text, detected_lang = self.speech_recognizer.listen_for_speech()
                
                if not user_text:
                    continue
                
                # Xác nhận ngôn ngữ bằng phân tích văn bản
                text_lang = self.language_detector.detect_language(user_text)
                if text_lang != detected_lang:
                    detected_lang = text_lang
                    print(f"🔄 Đã chuyển ngôn ngữ thành: {detected_lang}")
                
                # Kiểm tra lệnh kết thúc
                if self.language_detector.is_exit_command(user_text, self.config.EXIT_COMMANDS):
                    self._farewell(detected_lang)
                    break
                
                # Xử lý câu hỏi
                self._process_question(user_text, detected_lang)
                
            except KeyboardInterrupt:
                print("\n Đang thoát...")
                break
            except Exception as e:
                print(f"Lỗi: {e}")
                # Nếu có lỗi, đảm bảo event được set để không bị treo
                self.audio_manager.audio_finished_event.set()
                continue
    
    def _process_question(self, user_text: str, detected_lang: str):
        """
        Xử lý câu hỏi từ người dùng
        
        Args:
            user_text: Câu hỏi từ người dùng
            detected_lang: Ngôn ngữ được phát hiện
        """
        # Lấy phản hồi từ AI
        ai_response = self.ai_client.get_response(user_text, detected_lang)
        print(f"🤖 Chatbot: {ai_response}")
        
        # Phát âm thanh
        self.audio_manager.text_to_speech(ai_response, detected_lang)
    
    def _farewell(self, detected_lang: str):
        """
        Phát thông điệp tạm biệt
        
        Args:
            detected_lang: Ngôn ngữ để phát thông điệp
        """
        farewell = (self.config.FAREWELL_MSG_VI 
                   if detected_lang == 'vi' 
                   else self.config.FAREWELL_MSG_EN)
        
        print(f"👋 Chatbot: {farewell}")
        self.audio_manager.text_to_speech(farewell, detected_lang)
        
        # Chờ phát xong âm thanh cuối cùng
        self.audio_manager.wait_for_audio_completion()

# Hàm chạy chatbot (tương thích với code cũ)
def main():
    """Hàm main để chạy chatbot"""
    chatbot = TravelChatbot()
    chatbot.start()

if __name__ == "__main__":
    main()