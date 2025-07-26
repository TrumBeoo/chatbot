import langdetect
from langdetect import detect

class LanguageDetector:
    @staticmethod
    def detect_language(text):
        """Nhận diện ngôn ngữ của văn bản"""
        try:
            lang = detect(text)
            return 'vi' if lang == 'vi' else 'en'
        except:
            vietnamese_chars = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ'
            if any(char in text.lower() for char in vietnamese_chars):
                return 'vi'
            return 'en'
    
    @staticmethod
    def is_exit_command(text):
        """Kiểm tra lệnh kết thúc"""
        exit_commands = ['bye', 'goodbye', 'tạm biệt', 'chào tạm biệt', 'kết thúc', 'stop']
        return any(cmd in text.lower() for cmd in exit_commands)