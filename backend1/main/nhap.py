from flask import Flask, request, jsonify
from flask_cors import CORS
import requests


app = Flask(__name__)
CORS(app)  # Cho phép cross-origin requests

# Cấu hình Groq API
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = "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"  # thay bằng key thật

headers = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

@app.route('/chat', methods=['POST'])
def chat():
    try:
        # Lấy tin nhắn từ request
        request_data = request.get_json()
        user_message = request_data.get('message', '')

        # Chuẩn bị data cho Groq API
        data = {
            "model": "llama3-70b-8192",
            "messages": [
                {
                    "role": "system",
                    "content": """Bạn là một trợ lý du lịch thông minh, khi có câu hỏi bằng tiếng Việt thì bạn trả lời bằng tiếng Việt, khi có câu hỏi bằng tiếng Anh thì bạn trả lời bằng tiếng Anh.                 
                    Không bịa hoặc trả lời lung tung không đúng với ngôn ngữ mà người hỏi đặt ra, bạn chỉ có nhiệm vụ trả lời các câu hỏi liên quan đến du lịch và địa điểm bạn có thể trả lời hoặc tư vấn cho người hỏi chỉ có thể trong phạm vi tỉnh Quảng Ninh. 
                    Không trả lời các câu hỏi khác hay liên quan đến phạm vi ngoài tỉnh Quảng Ninh, nếu người dùng đặt câu hỏi liên quan đến chủ đề khác không phải chủ đề du lịch bạn không được trả lời hoặc bạn có thể đưa ra yêu cầu cho người dùng đặt ra những câu hỏi liên quan đến du lịch hoặc bạn có thể đưa ra yêu cầu hay gợi ý cho người hỏi nếu cần thiết. 
                    Bạn phải luôn đảm bảo kết thúc câu trả lời của mình bằng dấu câu phù hợp như dấu chấm, dấu chấm hỏi hoặc dấu chấm than.""",
                  
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }

        # Gọi Groq API
        response = requests.post(GROQ_API_URL, headers=headers, json=data)
        response.raise_for_status()  # Raise exception cho HTTP errors
        
        # Lấy phản hồi từ API
        bot_response = response.json()["choices"][0]["message"]["content"]
        
        # Loại bỏ các ký tự đặc biệt và dấu câu thừa
        bot_response = bot_response.replace('*', '')  # Loại bỏ dấu sao
      
        
           

        # Đảm bảo câu kết thúc bằng dấu câu phù hợp
        if bot_response and not bot_response[-1] in ['.', '!', '?']:
            bot_response += '.'
        
        return jsonify({
            "status": "success",
            "response": bot_response
        })

    except:
        print("Tôi đang gặp sự cố, vui lòng thử lại sau.")
  

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Server is running"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

