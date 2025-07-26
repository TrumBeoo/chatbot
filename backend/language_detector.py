from langdetect import detect
from typing import Optional

class LanguageDetector:
    """Lớp phát hiện ngôn ngữ của văn bản"""
    
    @staticmethod
    def detect_language(text: str) -> str:
        """
        Nhận diện ngôn ngữ của văn bản
        
        Args:
            text: Văn bản cần phát hiện ngôn ngữ
            
        Returns:
            str: 'vi' cho tiếng Việt, 'en' cho tiếng Anh
        """
        try:
            lang = detect(text)
            return 'vi' if lang == 'vi' else 'en'
        except:
            # Fallback: kiểm tra ký tự tiếng Việt
            vietnamese_chars = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ'
            if any(char in text.lower() for char in vietnamese_chars):
                return 'vi'
            return 'en'
    
    @staticmethod
    def is_exit_command(text: str, exit_commands: list) -> bool:
        """
        Kiểm tra xem văn bản có phải là lệnh kết thúc không
        
        Args:
            text: Văn bản cần kiểm tra
            exit_commands: Danh sách các lệnh kết thúc
            
        Returns:
            bool: True nếu là lệnh kết thúc
        """
        return any(cmd in text.lower() for cmd in exit_commands)