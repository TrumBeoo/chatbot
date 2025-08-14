import os
import json
from typing import Optional, Dict, Any, List
from datetime import datetime
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain.schema import Document
from dotenv import load_dotenv
from loader import DocumentLoader
import logging

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGEngine:
    """Enhanced RAG Engine with better error handling, caching, and configuration."""
    
    def __init__(self, 
                 data_dir: str = "data/", 
                 vectorstore_path: str = "vectorstore/index",
                 embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2",
                 llm_model: str = "llama3-8b-8192",
                 chunk_size: int = 1000,
                 chunk_overlap: int = 200,
                 temperature: float = 0.7):
        """
        Initialize RAG Engine with configurable parameters.
        
        Args:
            data_dir: Directory containing source documents
            vectorstore_path: Path to save/load vector store
            embedding_model: HuggingFace embedding model name
            llm_model: Groq LLM model name
            chunk_size: Text chunk size for splitting
            chunk_overlap: Overlap between chunks
            temperature: LLM temperature setting
        """
        self.data_dir = data_dir
        self.vectorstore_path = vectorstore_path
        self.embedding_model = embedding_model
        self.llm_model = llm_model
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.temperature = temperature
        
        # Initialize components
        self.embeddings = None
        self.vectorstore = None
        self._qa_chain = None
        self._llm = None
        
        # Metadata file for tracking updates
        self.metadata_path = os.path.join(os.path.dirname(vectorstore_path), "metadata.json")
        
        # Initialize embeddings
        self._load_embeddings()
    
    def _load_embeddings(self) -> None:
        """Initialize embeddings model."""
        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=self.embedding_model,
                model_kwargs={'device': 'cpu'}  # Use CPU for compatibility
            )
            logger.info(f"Loaded embeddings model: {self.embedding_model}")
        except Exception as e:
            raise RuntimeError(f"Failed to load embeddings: {e}")
    
    def _get_llm(self) -> ChatGroq:
        """Get or create LLM instance with caching."""
        if self._llm is None:
            try:
                groq_api_key = os.getenv("GROQ_API_KEY")
                if not groq_api_key:
                    raise ValueError("GROQ_API_KEY environment variable is required")
                
                self._llm = ChatGroq(
                    model=self.llm_model,
                    temperature=self.temperature,
                    groq_api_key=groq_api_key,
                    max_tokens=1024
                )
                logger.info(f"Initialized LLM: {self.llm_model}")
            except Exception as e:
                raise RuntimeError(f"Failed to initialize LLM: {e}")
        return self._llm
    
    def _needs_rebuild(self) -> bool:
        """Check if vector store needs rebuilding based on source files."""
        try:
            if not os.path.exists(self.vectorstore_path + ".faiss"):
                logger.info("Vector store doesn't exist, needs building")
                return True
            
            if not os.path.exists(self.metadata_path):
                logger.info("Metadata file missing, rebuilding vector store")
                return True
            
            with open(self.metadata_path, 'r') as f:
                metadata = json.load(f)
            
            # Check if source directory is newer than last build
            if os.path.exists(self.data_dir):
                last_build = metadata.get('last_build_time', 0)
                dir_mtime = os.path.getmtime(self.data_dir)
                
                if dir_mtime > last_build:
                    logger.info("Source directory updated, rebuilding vector store")
                    return True
            
            return False
        except Exception as e:
            logger.warning(f"Error checking rebuild status: {e}")
            return True
    
    def _save_metadata(self, document_count: int) -> None:
        """Save metadata about the vector store build."""
        try:
            metadata = {
                'last_build_time': datetime.now().timestamp(),
                'document_count': document_count,
                'embedding_model': self.embedding_model,
                'chunk_size': self.chunk_size,
                'chunk_overlap': self.chunk_overlap
            }
            
            os.makedirs(os.path.dirname(self.metadata_path), exist_ok=True)
            with open(self.metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
                
        except Exception as e:
            logger.warning(f"Failed to save metadata: {e}")
    
    def create_vector_store(self, force_rebuild: bool = False) -> None:
        """
        Create and save vector store from documents.
        
        Args:
            force_rebuild: Force rebuild even if not needed
        """
        try:
            if not force_rebuild and not self._needs_rebuild():
                logger.info("Vector store is up to date, skipping rebuild")
                return
            
            logger.info("Building vector store...")
            
            # Load documents
            if not os.path.exists(self.data_dir):
                raise FileNotFoundError(f"Data directory not found: {self.data_dir}")
            
            documents = DocumentLoader.load_documents(self.data_dir)
            if not documents:
                raise ValueError(f"No documents found in {self.data_dir}")
            
            logger.info(f"Loaded {len(documents)} documents")
            
            # Split documents
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap,
                length_function=len,
                separators=["\n\n", "\n", " ", ""]
            )
            
            texts = splitter.split_documents(documents)
            logger.info(f"Created {len(texts)} text chunks")
            
            # Create vector store
            vectorstore = FAISS.from_documents(texts, embedding=self.embeddings)
            
            # Save vector store
            os.makedirs(os.path.dirname(self.vectorstore_path), exist_ok=True)
            vectorstore.save_local(self.vectorstore_path)
            
            # Save metadata
            self._save_metadata(len(texts))
            
            # Clear cached components
            self.vectorstore = None
            self._qa_chain = None
            
            logger.info(f"Vector store saved to {self.vectorstore_path}")
            
        except Exception as e:
            raise RuntimeError(f"Failed to create vector store: {e}")
    
    def _load_vectorstore(self) -> FAISS:
        """Load vector store with caching."""
        if self.vectorstore is None:
            try:
                if not os.path.exists(self.vectorstore_path + ".faiss"):
                    logger.info("Vector store not found, creating new one...")
                    self.create_vector_store()
                
                self.vectorstore = FAISS.load_local(
                    self.vectorstore_path,
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                logger.info("Vector store loaded successfully")
                
            except Exception as e:
                raise RuntimeError(f"Failed to load vector store: {e}")
        
        return self.vectorstore
    
    def _create_custom_prompt(self) -> PromptTemplate:
        """Create custom prompt template for tourism Q&A."""
        template = """
        Bạn là một trợ lý du lịch thông minh của tỉnh Quảng Ninh, Việt Nam. Bạn tên là QBot.
                Khi được hỏi bằng tiếng Việt, bạn phải trả lời bằng tiếng Việt. 
                Bạn chỉ trả lời các câu hỏi liên quan đến du lịch như: địa điểm tham quan, lịch trình, 
                khách sạn, nhà hàng, ẩm thực địa phương, văn hóa, lịch sử, giao thông, thời tiết, 
                chi phí du lịch, hoạt động giải trí, v.v. 
                
                Phạm vi trả lời của bạn CHỈ giới hạn trong các địa phương và các địa điểm du lịch tỉnh Quảng Ninh (bao gồm Hạ Long, Cẩm Phả, 
                Móng Cái, Đông Triều, Quảng Yên, v.v.). 
                
                Nếu câu hỏi không liên quan đến du lịch hoặc nằm ngoài tỉnh Quảng Ninh, hãy lịch sự 
                từ chối và gợi ý người dùng hỏi về du lịch tại Quảng Ninh.
                
                Hãy trả lời một cách thân thiện, nhiệt tình và cung cấp thông tin hữu ích.

        Thông tin liên quan:
        {context}

        Câu hỏi: {question}

        Hướng dẫn trả lời:
        - Trả lời bằng tiếng Việt nếu câu hỏi bằng tiếng Việt
        - Trả lời bằng tiếng Anh nếu câu hỏi bằng tiếng Anh
        - Cung cấp thông tin chính xác và cụ thể
        - Nếu không có thông tin trong tài liệu, hãy thông báo rõ ràng
        - Đưa ra lời khuyên thực tế cho du khách

        Câu trả lời:
        """
        
        return PromptTemplate(
            template=template,
            input_variables=["context", "question"]
        )
    
    def _load_qa_chain(self) -> RetrievalQA:
        """Load QA chain with caching and custom prompt."""
        if self._qa_chain is None:
            try:
                vectorstore = self._load_vectorstore()
                retriever = vectorstore.as_retriever(
                    search_kwargs={"k": 5}  # Return top 5 relevant chunks
                )
                
                llm = self._get_llm()
                custom_prompt = self._create_custom_prompt()
                
                self._qa_chain = RetrievalQA.from_chain_type(
                    llm=llm,
                    chain_type="stuff",
                    retriever=retriever,
                    return_source_documents=True,
                    chain_type_kwargs={"prompt": custom_prompt}
                )
                
                logger.info("QA chain loaded successfully")
                
            except Exception as e:
                raise RuntimeError(f"Failed to load QA chain: {e}")
        
        return self._qa_chain
    
    def ask_question(self, query: str, return_sources: bool = False) -> str:
        """
        Ask a question and get response from RAG system.
        
        Args:
            query: User question
            return_sources: Whether to include source information
            
        Returns:
            Answer string or dict with sources if return_sources=True
        """
        if not query.strip():
            return "Vui lòng cung cấp câu hỏi hợp lệ."
        
        try:
            chain = self._load_qa_chain()
            result = chain({"query": query})
            
            answer = result.get("result", "")
            
            if return_sources:
                sources = []
                for doc in result.get("source_documents", []):
                    sources.append({
                        "content": doc.page_content[:200] + "...",
                        "source": doc.metadata.get("source_file", "Unknown"),
                        "page": doc.metadata.get("page", "N/A")
                    })
                
                return {
                    "answer": answer,
                    "sources": sources
                }
            
            return answer
            
        except Exception as e:
            logger.error(f"Error processing question: {e}")
            return f"Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn: {str(e)}"
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the RAG system."""
        try:
            stats = {
                "data_directory": self.data_dir,
                "vectorstore_path": self.vectorstore_path,
                "embedding_model": self.embedding_model,
                "llm_model": self.llm_model
            }
            
            if os.path.exists(self.metadata_path):
                with open(self.metadata_path, 'r') as f:
                    metadata = json.load(f)
                stats.update(metadata)
            
            return stats
        except Exception as e:
            return {"error": str(e)}


# Global instance for backward compatibility
_rag_engine = None

def get_rag_engine() -> RAGEngine:
    """Get singleton RAG engine instance."""
    global _rag_engine
    if _rag_engine is None:
        _rag_engine = RAGEngine()
    return _rag_engine

# Backward compatibility functions
def create_vector_store():
    return get_rag_engine().create_vector_store()

def ask_question(query: str) -> str:
    return get_rag_engine().ask_question(query)