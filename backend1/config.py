import os

class Config:
    # API Configuration
    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your_api_key")  # Đọc từ environment variable
    
    # Model Configuration
    MODEL_NAME = "llama3-70b-8192"
    TEMPERATURE = 0.7
    MAX_TOKENS = 300
    
    # Audio Configuration
    ENERGY_THRESHOLD = 4000
    DYNAMIC_ENERGY_THRESHOLD = True
    AUDIO_TIMEOUT = 10
    PHRASE_TIME_LIMIT = 10
    AMBIENT_NOISE_DURATION = 0.5
    
    # TTS Configuration
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