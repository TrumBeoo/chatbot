import asyncio
import edge_tts
import sounddevice as sd
import soundfile as sf
import tempfile
import os
import time
from queue import Queue
from threading import Thread, Event
from typing import Optional
from config import Config

class AudioManager:
    """Lớp quản lý âm thanh: TTS và phát âm thanh"""
    
    def __init__(self):
        self.audio_queue = Queue()
        self.audio_finished_event = Event()
        self.audio_finished_event.set()  # Khởi tạo là True
        self.config = Config()
        
        # Khởi động worker thread
        self.audio_thread = Thread(target=self._play_audio_worker, daemon=True)
        self.audio_thread.start()
    
    def _play_audio_worker(self):
        """Worker thread để phát âm thanh tuần tự"""
        while True:
            if not self.audio_queue.empty():
                audio_file = self.audio_queue.get()
                
                # Báo hiệu bắt đầu phát âm thanh
                self.audio_finished_event.clear()
                
                try:
                    print("🔊 Đang phát âm thanh...")
                    data, sample_rate = sf.read(audio_file)
                    sd.play(data, sample_rate)
                    sd.wait()  # Chờ cho đến khi phát xong hoàn toàn
                    
                    # Thêm delay nhỏ để đảm bảo âm thanh đã kết thúc hoàn toàn
                    time.sleep(self.config.AUDIO_DELAY)
                    
                    # Xóa file sau khi phát xong
                    if os.path.exists(audio_file):
                        os.remove(audio_file)
                        
                    print("✅ Âm thanh đã phát xong")
                    
                except Exception as e:
                    print(f"Lỗi phát âm thanh: {e}")
                finally:
                    # Báo hiệu âm thanh đã phát xong
                    self.audio_finished_event.set()
            
            time.sleep(self.config.AUDIO_CHECK_INTERVAL)
    
    def text_to_speech(self, text: str, lang: str = 'vi'):
        """
        Chuyển text thành giọng nói và thêm vào queue
        
        Args:
            text: Văn bản cần chuyển thành giọng nói
            lang: Ngôn ngữ ('vi' hoặc 'en')
        """
        try:
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
                filename = tmp_file.name
            
            print("🎵 Đang tạo âm thanh...")
            
            # Sử dụng Edge TTS
            voice = self.config.EDGE_VOICES.get(lang, self.config.EDGE_VOICES['vi'])
            
            async def create_tts():
                communicate = edge_tts.Communicate(text, voice)
                await communicate.save(filename)
            
            # Chạy async function
            asyncio.run(create_tts())
            
            self.audio_queue.put(filename)
            print("📝 Âm thanh đã được thêm vào queue")
            
        except Exception as e:
            print(f"❌ Lỗi tạo âm thanh: {e}")
            # Nếu lỗi, vẫn set event để không bị treo
            self.audio_finished_event.set()
    
    def wait_for_audio_completion(self):
        """Chờ cho đến khi tất cả âm thanh đã phát xong"""
        print("⏳ Chờ âm thanh phát xong...")
        
        # Chờ cho đến khi queue trống VÀ âm thanh cuối cùng đã phát xong
        while not self.audio_queue.empty():
            time.sleep(0.1)
        
        # Chờ cho đến khi event được set (âm thanh đã phát xong)
        self.audio_finished_event.wait()
        
        print("✅ Tất cả âm thanh đã phát xong, sẵn sàng lắng nghe!")
    
    def is_audio_playing(self) -> bool:
        """
        Kiểm tra xem có âm thanh đang phát không
        
        Returns:
            bool: True nếu có âm thanh đang phát
        """
        return not self.audio_finished_event.is_set() or not self.audio_queue.empty()