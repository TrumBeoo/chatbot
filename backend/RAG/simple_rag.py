import os
import json
import csv
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import requests
from dotenv import load_dotenv
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None
try:
    from docx import Document
except ImportError:
    Document = None

load_dotenv()

class SimpleRAG:
    def __init__(self, data_dir="data"):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.documents = []
        self.embeddings = None
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"
        
        if os.path.exists(data_dir):
            self.load_all_documents(data_dir)
            self.create_embeddings()
    
    def load_all_documents(self, data_dir):
        """Load documents from all supported formats"""
        for filename in os.listdir(data_dir):
            filepath = os.path.join(data_dir, filename)
            if os.path.isfile(filepath):
                try:
                    content = self.load_file_by_extension(filepath)
                    if content:
                        self.documents.extend(self.split_content(content, filename))
                except Exception as e:
                    print(f"Error loading {filename}: {e}")
    
    def load_file_by_extension(self, filepath):
        """Load file based on extension"""
        ext = os.path.splitext(filepath)[1].lower()
        
        if ext == '.txt':
            return self.load_txt(filepath)
        elif ext == '.json':
            return self.load_json(filepath)
        elif ext == '.csv':
            return self.load_csv(filepath)
        elif ext == '.pdf' and PyPDF2:
            return self.load_pdf(filepath)
        elif ext == '.docx' and Document:
            return self.load_docx(filepath)
        return None
    
    def load_txt(self, filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    
    def load_json(self, filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, dict):
                return json.dumps(data, ensure_ascii=False, indent=2)
            elif isinstance(data, list):
                return '\n'.join([json.dumps(item, ensure_ascii=False) for item in data])
            return str(data)
    
    def load_csv(self, filepath):
        content = []
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                content.append(' | '.join([f"{k}: {v}" for k, v in row.items()]))
        return '\n'.join(content)
    
    def load_pdf(self, filepath):
        if not PyPDF2:
            return None
        content = []
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                content.append(page.extract_text())
        return '\n'.join(content)
    
    def load_docx(self, filepath):
        if not Document:
            return None
        doc = Document(filepath)
        return '\n'.join([paragraph.text for paragraph in doc.paragraphs])
    
    def split_content(self, content, filename):
        """Split content into chunks with source info"""
        sections = content.split('\n\n')
        chunks = []
        for i, section in enumerate(sections):
            if section.strip():
                chunk = f"[{filename}] {section.strip()}"
                chunks.append(chunk)
        return chunks
    
    def create_embeddings(self):
        """Create embeddings for all documents"""
        if self.documents:
            self.embeddings = self.model.encode(self.documents)
    
    def retrieve_relevant_docs(self, query, top_k=3):
        """Retrieve most relevant documents"""
        if not self.embeddings.any():
            return []
        
        query_embedding = self.model.encode([query])
        similarities = cosine_similarity(query_embedding, self.embeddings)[0]
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        return [self.documents[i] for i in top_indices if similarities[i] > 0.3]
    
    def generate_response(self, query, context, language="vi"):
        """Generate response using Groq API with context"""
        system_prompt = f"""Bạn là trợ lý du lịch Quảng Ninh. Sử dụng thông tin sau để trả lời:

THÔNG TIN THAM KHẢO:
{context}

Quy tắc:
- Chỉ trả lời về du lịch Quảng Ninh
- Sử dụng thông tin từ context khi có thể
- Trả lời bằng tiếng Việt nếu hỏi tiếng Việt, tiếng Anh nếu hỏi tiếng Anh
- Kết thúc câu bằng dấu câu phù hợp"""

        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "llama3-70b-8192",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }
        
        try:
            response = requests.post(self.groq_url, headers=headers, json=data)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"].replace('*', '')
        except Exception as e:
            print(f"Groq API error: {e}")
            return "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau."
    
    def get_rag_response(self, query):
        """Main RAG function"""
        relevant_docs = self.retrieve_relevant_docs(query)
        context = "\n\n".join(relevant_docs) if relevant_docs else "Không có thông tin cụ thể."
        return self.generate_response(query, context)

# Global RAG instance
rag_system = SimpleRAG("data")