
import speech_recognition
import edge_tts
import asyncio
import sounddevice as sd
import soundfile as sf
from queue import Queue
from threading import Thread, Event
import time
import os
import requests
import langdetect
from langdetect import detect
import tempfile

   
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = "your_api_key"  # Thay bằng key thật 
headers = {
    "Authorization": f"Bearer {GROQ_API_KEY}",   # Thay bằng key thật
    "Content-Type": "application/json"
}


# Khởi tạo
robot_ear = speech_recognition.Recognizer()
robot_brain = ""

# Tăng energy threshold để tránh nghe âm thanh từ loa
robot_ear.energy_threshold = 4000  # Tăng ngưỡng năng lượng để tránh tiếng ồn
robot_ear.dynamic_energy_threshold = True

# Queue, Event và thread cho việc phát âm thanh
audio_queue = Queue()
audio_finished_event = Event()  # Event để báo hiệu âm thanh đã phát xong
audio_finished_event.set()  # Khởi tạo là True (không có âm thanh đang phát)

# Cấu hình giọng nói cho Edge TTS
EDGE_VOICES = {
    'vi': 'vi-VN-HoaiMyNeural',  # Giọng nữ tiếng Việt
    'en': 'en-US-AriaNeural'     # Giọng nữ tiếng Anh
}

def play_audio_worker():
    """Worker thread để phát âm thanh tuần tự"""
    global audio_finished_event
    
    while True:
        if not audio_queue.empty():
            audio_file = audio_queue.get()
            
            # Báo hiệu bắt đầu phát âm thanh
            audio_finished_event.clear()
            
            try:
                print("🔊 Đang phát âm thanh...")
                data, sample_rate = sf.read(audio_file)
                sd.play(data, sample_rate)
                sd.wait()  # Chờ cho đến khi phát xong hoàn toàn
                
                # Thêm delay nhỏ để đảm bảo âm thanh đã kết thúc hoàn toàn
                time.sleep(0.5)
                
                # Xóa file sau khi phát xong
                if os.path.exists(audio_file):
                    os.remove(audio_file)
                    
                print("✅ Âm thanh đã phát xong")
                
            except Exception as e:
                print(f"Lỗi phát âm thanh: {e}")
            finally:
                # Báo hiệu âm thanh đã phát xong
                audio_finished_event.set()
        
        time.sleep(0.01)

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

def text_to_speech(text, lang='vi'):
    """Chuyển text thành giọng nói và thêm vào queue"""
    try:
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
            filename = tmp_file.name
        
        print("🎵 Đang tạo âm thanh...")
        
        # Sử dụng Edge TTS thay vì gTTS
        voice = EDGE_VOICES.get(lang, EDGE_VOICES['vi'])
        
        # Tạo và chạy async function
        async def create_tts():
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(filename)
        
        # Chạy async function
        asyncio.run(create_tts())
        
        audio_queue.put(filename)
        print("📝 Âm thanh đã được thêm vào queue")
        
    except Exception as e:
        print(f"❌ Lỗi tạo âm thanh: {e}")
        # Nếu lỗi, vẫn set event để không bị treo
        audio_finished_event.set()

def get_ai_response(user_input, detected_lang):
    """Gọi API để lấy phản hồi từ AI"""
    try:
        if detected_lang == 'vi':
            system_prompt = """Bạn là một trợ lý du lịch thông minh. Khi được hỏi bằng tiếng Việt, bạn sẽ trả lời bằng tiếng Việt. 
        Bạn chỉ trả lời các câu hỏi liên quan đến du lịch như: địa điểm, lịch trình, khách sạn, ẩm thực, văn hóa, giao thông, 
        thời tiết, chi phí du lịch, v.v. Phạm vi trả lời của bạn chỉ giới hạn trong tỉnh Quảng Ninh. 
        Nếu câu hỏi không liên quan đến du lịch hoặc nằm ngoài tỉnh Quảng Ninh, hãy lịch sự từ chối và gợi ý người dùng hỏi về du lịch tại Quảng Ninh."""
        else:
            system_prompt = """You are a smart travel assistant. When asked in English, you will respond in English. 
        You only answer questions related to travel such as: destinations, itineraries, hotels, food, culture, transportation, 
        weather, travel costs, etc. Your answers are strictly limited to the Quang Ninh province. 
        If the question is not travel-related or is outside Quang Ninh, politely decline and suggest asking about travel in Quang Ninh."""

        data = {
            "model": "llama3-70b-8192",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ],
            "temperature": 0.7,
            "max_tokens": 300
        }

        print("🤖 Đang gọi AI...")
        response = requests.post(GROQ_API_URL, headers=headers, json=data)
        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"]
            
            # Làm sạch nội dung
            # Loại bỏ các ký tự đặc biệt và dấu câu thừa
            content = content.replace('*', '')  # Loại bỏ dấu sao
          
            
            # Đảm bảo câu kết thúc bằng dấu câu phù hợp
            if content and not content[-1] in ['.', '!', '?']:
                content += '.'
                
            return content
        else:
            return "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau!" if detected_lang == 'vi' else "Sorry, I'm having issues. Please try again later!"
            
    except Exception as e:
        print(f"Lỗi API: {e}")
        return "Tôi đang bận, vui lòng thử lại sau!" if detected_lang == 'vi' else "I'm busy, please try again later!"

def wait_for_audio_completion():
    """Chờ cho đến khi tất cả âm thanh đã phát xong"""
    print("⏳ Chờ âm thanh phát xong...")
    
    # Chờ cho đến khi queue trống VÀ âm thanh cuối cùng đã phát xong
    while not audio_queue.empty():
        time.sleep(0.1)
    
    # Chờ cho đến khi event được set (âm thanh đã phát xong)
    audio_finished_event.wait()
    
    print("✅ Tất cả âm thanh đã phát xong, sẵn sàng lắng nghe!")

# Khởi động thread phát âm thanh
audio_thread = Thread(target=play_audio_worker, daemon=True)
audio_thread.start()

print("🚀 Chatbot du lịch đã sẵn sàng!")

# Chào hỏi ban đầu
welcome_msg = "Xin chào! Tôi là trợ lý du lịch của bạn. Bạn có thể hỏi tôi về địa điểm, lịch trình, khách sạn, ẩm thực và nhiều thông tin du lịch khác!"
print(f"Chatbot: {welcome_msg}")
text_to_speech(welcome_msg, 'vi')
welcome_msg_en = "Hello! I am your travel assistant. You can ask me about destinations, itineraries, hotels, food, and more travel information!"
print(f"Chatbot: {welcome_msg_en}")
text_to_speech(welcome_msg_en, 'en')

while True:
    try:
        # Chờ cho đến khi tất cả âm thanh đã phát xong
        wait_for_audio_completion()
        
        # Thêm delay nhỏ để đảm bảo âm thanh đã kết thúc hoàn toàn
        time.sleep(0.3)
        
        # Bắt đầu lắng nghe
        with speech_recognition.Microphone() as mic:
            print("🎤 Chatbot: Tôi đang lắng nghe...")
            robot_ear.adjust_for_ambient_noise(mic, duration=0.5)
            
            try:
                # Lắng nghe với timeout hợp lý
                audio = robot_ear.listen(mic, timeout=10, phrase_time_limit=10)
            except speech_recognition.WaitTimeoutError:
                print("⏰ Timeout - không nghe thấy gì")
                continue
        
        # Nhận diện giọng nói
        you = ""
        detected_lang = 'vi'
        
        try:
            # Thử nhận diện tiếng Việt trước
            you = robot_ear.recognize_google(audio, language="vi-VN")
            detected_lang = 'vi'
            print(f"🇻🇳 Nhận diện tiếng Việt: {you}")
        except:
            try:
                # Nếu không được, thử tiếng Anh
                you = robot_ear.recognize_google(audio, language="en-US")
                detected_lang = 'en'
                print(f"🇺🇸 Nhận diện tiếng Anh: {you}")
            except:
                print("❌ Không thể nhận diện giọng nói")
                continue
        
        if you == "":
            continue
            
        # Xác nhận ngôn ngữ bằng phân tích văn bản
        if you:
            text_lang = detect_language(you)
            if text_lang != detected_lang:
                detected_lang = text_lang
                print(f"🔄 Đã chuyển ngôn ngữ thành: {detected_lang}")
        
        # Kiểm tra lệnh kết thúc
        exit_commands = ['bye', 'goodbye', 'tạm biệt', 'chào tạm biệt', 'kết thúc', 'stop']
        if any(cmd in you.lower() for cmd in exit_commands):
            farewell = "Chào tạm biệt! Chúc bạn có chuyến du lịch vui vẻ!" if detected_lang == 'vi' else "Goodbye! Have a wonderful trip!"
            print(f"👋 Chatbot: {farewell}")
            text_to_speech(farewell, detected_lang)
            
            # Chờ phát xong âm thanh cuối cùng
            wait_for_audio_completion()
            break
        
        # Lấy phản hồi từ AI
        robot_brain = get_ai_response(you, detected_lang)
        print(f"🤖 Chatbot: {robot_brain}")
        
        # Phát âm thanh
        text_to_speech(robot_brain, detected_lang)
        
    except KeyboardInterrupt:
        print("\n Đang thoát...")
        break
    except Exception as e:
        print(f"Lỗi: {e}")
        # Nếu có lỗi, đảm bảo event được set để không bị treo
        audio_finished_event.set()
        continue

print("👋 Chatbot đã kết thúc!")