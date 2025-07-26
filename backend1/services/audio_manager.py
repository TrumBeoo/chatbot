import sounddevice as sd
import soundfile as sf
import os
import time
from queue import Queue
from threading import Thread, Event
import tempfile
import edge_tts
import asyncio
from config import Config

class AudioManager:
    def __init__(self):
        self.audio_queue = Queue()
        self.audio_finished_event = Event()
        self.audio_finished_event.set()
        
        # Khởi động thread phát âm thanh
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
                    sd.wait()
                    
                    time.sleep(0.5)  # Delay để đảm bảo âm thanh kết thúc hoàn toàn
                    
                    # Xóa file sau khi phát xong
                    if os.path.exists(audio_file):
                        os.remove(audio_file)
                        
                    print("✅ Âm thanh đã phát xong")
                    
                except Exception as e:
                    print(f"Lỗi phát âm thanh: {e}")
                finally:
                    self.audio_finished_event.set()
            
            time.sleep(0.01)
    
    def text_to_speech(self, text, lang='vi'):
        """Chuyển text thành giọng nói và thêm vào queue"""
        try:
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
                filename = tmp_file.name
            
            print("🎵 Đang tạo âm thanh...")
            
            voice = Config.EDGE_VOICES.get(lang, Config.EDGE_VOICES['vi'])
            
            async def create_tts():
                communicate = edge_tts.Communicate(text, voice)
                await communicate.save(filename)
            
            asyncio.run(create_tts())
            self.audio_queue.put(filename)
            print("📝 Âm thanh đã được thêm vào queue")
            
        except Exception as e:
            print(f"❌ Lỗi tạo âm thanh: {e}")
            self.audio_finished_event.set()
    
    def wait_for_audio_completion(self):
        """Chờ cho đến khi tất cả âm thanh đã phát xong"""
        print("⏳ Chờ âm thanh phát xong...")
        
        while not self.audio_queue.empty():
            time.sleep(0.1)
        
        self.audio_finished_event.wait()
        print("✅ Tất cả âm thanh đã phát xong, sẵn sàng lắng nghe!")