from RAG.simple_rag import rag_system

# Test RAG functionality with multiple data formats
test_queries = [
    "Vịnh Hạ Long có gì đặc biệt?",
    "Khách sạn nào tốt ở Hạ Long?",
    "Giá phòng khách sạn ở Cô Tô?",
    "Món ăn nổi tiếng ở Quảng Ninh?",
    "Hoạt động gì ở đảo Cô Tô?"
]

print("🧪 Testing Multi-Format RAG System...")
print(f"📊 Loaded {len(rag_system.documents)} documents")

for query in test_queries:
    print(f"\n❓ Query: {query}")
    relevant_docs = rag_system.retrieve_relevant_docs(query)
    print(f"📄 Found {len(relevant_docs)} relevant documents")
    response = rag_system.get_rag_response(query)
    print(f"🤖 Response: {response}")
    print("-" * 50)