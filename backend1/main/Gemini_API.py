import google.generativeai as genai

# Khóa API của bạn từ bước 1
GOOGLE_API_KEY = "AIzaSyCqSU24Z2TgtLliBsrhJoJCJ0fSO22VBeQ"
genai.configure(api_key=GOOGLE_API_KEY)

# Chọn model: Gemini 1.5 Flash hoặc Gemini 1.5 Pro
model = genai.GenerativeModel("gemini-1.5-flash")
# Gửi câu hỏi
print("Hãy đặt câu hỏi của bạn!!")
you = input("Bạn: ")

try:
    temperature = 0.7 # Điều chỉnh độ sáng tạo của phản hồi

    # Thiết lập cấu hình cho model
    generation_config = {
        "temperature": temperature,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 50,
    }

    # Thiết lập system prompt
    chat = model.start_chat(history=[])
    chat.send_message("Bạn là một trợ lý ảo thông minh, hãy trả lời câu hỏi một cách tự nhiên và thân thiện.", generation_config=generation_config)

    # Gửi câu hỏi và nhận phản hồi
    response = chat.send_message(
        you,
        generation_config=generation_config
    )
    print("Phản hồi từ Gemini:")
    print(response.text)
except:
    print(f"Tôi đang bận vui lòng thử lại sau!!")
