import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "api":
        # Chạy Flask API
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        # Chạy chatbot console
        from chatbot import TravelChatbot
        chatbot = TravelChatbot()
        chatbot.start()