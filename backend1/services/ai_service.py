import requests
from config import Config

class AIService:
    def __init__(self):
        self.url = Config.GROQ_API_URL
        self.headers = {
            "Authorization": f"Bearer {Config.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
    
    def get_response(self, user_input, detected_lang):
        """Gọi API để lấy phản hồi từ AI"""
        try:
            system_prompt = (Config.SYSTEM_PROMPT_VI if detected_lang == 'vi' 
                           else Config.SYSTEM_PROMPT_EN)
            
            data = {
                "model": Config.MODEL_NAME,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ],
                "temperature": Config.TEMPERATURE,
                "max_tokens": Config.MAX_TOKENS
            }

            print("🤖 Đang gọi AI...")
            response = requests.post(self.url, headers=self.headers, json=data)
            
            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]
                
                # Làm sạch nội dung
                content = content.replace('*', '')
                
                # Đảm bảo câu kết thúc bằng dấu câu phù hợp
                if content and not content[-1] in ['.', '!', '?']:
                    content += '.'
                    
                return content
            else:
                return ("Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau!" 
                       if detected_lang == 'vi' 
                       else "Sorry, I'm having issues. Please try again later!")
                
        except Exception as e:
            print(f"Lỗi API: {e}")
            return ("Tôi đang bận, vui lòng thử lại sau!" 
                   if detected_lang == 'vi' 
                   else "I'm busy, please try again later!")