import os
from dataclasses import dataclass

@dataclass
class Config:
    # API Configuration
    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your_api_key")  # Đặt trong environment variable
    
    # Speech Recognition Configuration
    ENERGY_THRESHOLD = 4000
    DYNAMIC_ENERGY_THRESHOLD = True
    LISTEN_TIMEOUT = 10
    PHRASE_TIME_LIMIT = 10
    AMBIENT_NOISE_DURATION = 0.5
    
    # Audio Configuration
    AUDIO_DELAY = 0.5
    AUDIO_CHECK_INTERVAL = 0.01
    COMPLETION_DELAY = 0.3
    
    # Edge TTS Voices
    EDGE_VOICES = {
        'vi': 'vi-VN-HoaiMyNeural',
        'en': 'en-US-AriaNeural'
    }
    
    # System Prompts
    SYSTEM_PROMPT_VI = """Bạn là một trợ lý du lịch thông minh. Khi được hỏi bằng tiếng Việt, bạn sẽ trả lời bằng tiếng Việt. 
    Bạn chỉ trả lời các câu hỏi liên quan đến du lịch như: địa điểm, lịch trình, khách sạn, ẩm thực, văn hóa, giao thông, 
    thời tiết, chi phí du lịch, v.v. Phạm vi trả lời của bạn chỉ giới hạn trong tỉnh Quảng Ninh. 
    Nếu câu hỏi không liên quan đến du lịch hoặc nằm ngoài tỉnh Quảng Ninh, hãy lịch sự từ chối và gợi ý người dùng hỏi về du lịch tại Quảng Ninh."""
    
    SYSTEM_PROMPT_EN = """You are a smart travel assistant. When asked in English, you will respond in English. 
    You only answer questions related to travel such as: destinations, itineraries, hotels, food, culture, transportation, 
    weather, travel costs, etc. Your answers are strictly limited to the Quang Ninh province. 
    If the question is not travel-related or is outside Quang Ninh, politely decline and suggest asking about travel in Quang Ninh."""
    
    # AI Model Configuration
    AI_MODEL = "llama3-70b-8192"
    AI_TEMPERATURE = 0.7
    AI_MAX_TOKENS = 300
    
    # Exit Commands
    EXIT_COMMANDS = ['bye', 'goodbye', 'tạm biệt', 'chào tạm biệt', 'kết thúc', 'stop']
    
    # Welcome Messages
    WELCOME_MSG_VI = "Xin chào! Tôi là trợ lý du lịch của bạn. Bạn có thể hỏi tôi về địa điểm, lịch trình, khách sạn, ẩm thực và nhiều thông tin du lịch khác!"
    WELCOME_MSG_EN = "Hello! I am your travel assistant. You can ask me about destinations, itineraries, hotels, food, and more travel information!"
    
    # Farewell Messages
    FAREWELL_MSG_VI = "Chào tạm biệt! Chúc bạn có chuyến du lịch vui vẻ!"
    FAREWELL_MSG_EN = "Goodbye! Have a wonderful trip!"