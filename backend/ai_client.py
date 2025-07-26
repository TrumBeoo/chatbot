import requests
from typing import Optional
from config import Config

class AIClient:
    """Lớp giao tiếp với AI API"""
    
    def __init__(self):
        self.config = Config()
        self.headers = {
            "Authorization": f"Bearer {self.config.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
    
    def get_response(self, user_input: str, detected_lang: str) -> str:
        """
        Gọi API để lấy phản hồi từ AI
        
        Args:
            user_input: Câu hỏi từ người dùng
            detected_lang: Ngôn ngữ được phát hiện
            
        Returns:
            str: Phản hồi từ AI
        """
        try:
            system_prompt = (self.config.SYSTEM_PROMPT_VI 
                           if detected_lang == 'vi' 
                           else self.config.SYSTEM_PROMPT_EN)
            
            data = {
                "model": self.config.AI_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ],
                "temperature": self.config.AI_TEMPERATURE,
                "max_tokens": self.config.AI_MAX_TOKENS
            }

            print("🤖 Đang gọi AI...")
            response = requests.post(self.config.GROQ_API_URL, headers=self.headers, json=data)
            
            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]
                return self._clean_content(content)
            else:
                return self._get_error_message(detected_lang)
                
        except Exception as e:
            print(f"Lỗi API: {e}")
            return self._get_busy_message(detected_lang)
    
    def _clean_content(self, content: str) -> str:
        """
        Làm sạch nội dung phản hồi
        
        Args:
            content: Nội dung cần làm sạch
            
        Returns:
            str: Nội dung đã được làm sạch
        """
        # Loại bỏ các ký tự đặc biệt
        content = content.replace('*', '')
        
        # Đảm bảo câu kết thúc bằng dấu câu phù hợp
        if content and content[-1] not in ['.', '!', '?']:
            content += '.'
            
        return content
    
    def _get_error_message(self, lang: str) -> str:
        """Trả về thông báo lỗi theo ngôn ngữ"""
        return ("Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau!" 
                if lang == 'vi' 
                else "Sorry, I'm having issues. Please try again later!")
    
    def _get_busy_message(self, lang: str) -> str:
        """Trả về thông báo bận theo ngôn ngữ"""
        return ("Tôi đang bận, vui lòng thử lại sau!" 
                if lang == 'vi' 
                else "I'm busy, please try again later!")