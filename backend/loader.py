from langchain_community.document_loaders import TextLoader, PyPDFLoader, Docx2txtLoader
from langchain.schema import Document
import os
import logging
from typing import List, Optional

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentLoader:
    """Enhanced document loader with better error handling and logging."""
    
    SUPPORTED_FORMATS = {
        '.txt': TextLoader,
        '.pdf': PyPDFLoader,
        '.docx': Docx2txtLoader
    }
    
    @staticmethod
    def load_documents(directory: str, encoding: str = 'utf-8') -> List[Document]:
        """
        Load documents from directory with improved error handling.
        
        Args:
            directory: Path to directory containing documents
            encoding: Text file encoding (default: utf-8)
            
        Returns:
            List of loaded documents
        """
        if not os.path.exists(directory):
            raise FileNotFoundError(f"Directory not found: {directory}")
            
        docs = []
        failed_files = []
        
        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)
            
            # Skip directories
            if os.path.isdir(filepath):
                continue
                
            file_ext = os.path.splitext(filename)[1].lower()
            
            if file_ext not in DocumentLoader.SUPPORTED_FORMATS:
                logger.warning(f"Unsupported format: {filename}")
                continue
                
            try:
                loader_class = DocumentLoader.SUPPORTED_FORMATS[file_ext]
                
                # Handle encoding for text files
                if file_ext == '.txt':
                    loader = loader_class(filepath, encoding=encoding)
                else:
                    loader = loader_class(filepath)
                    
                file_docs = loader.load()
                
                # Add metadata to documents
                for doc in file_docs:
                    doc.metadata.update({
                        'source_file': filename,
                        'file_path': filepath,
                        'file_type': file_ext
                    })
                    
                docs.extend(file_docs)
                logger.info(f"Successfully loaded: {filename} ({len(file_docs)} documents)")
                
            except Exception as e:
                logger.error(f"Failed to load {filename}: {str(e)}")
                failed_files.append((filename, str(e)))
                continue
        
        if failed_files:
            logger.warning(f"Failed to load {len(failed_files)} files: {failed_files}")
            
        logger.info(f"Total documents loaded: {len(docs)} from {directory}")
        return docs

# Backward compatibility
def load_documents(directory: str) -> List[Document]:
    """Backward compatibility function."""
    return DocumentLoader.load_documents(directory)