import os
from dotenv import load_dotenv
import google.generativeai as genai

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

# Load API key
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Load Gemini model
model = genai.GenerativeModel("gemini-2.5-flash-lite")

# Load ALL PDFs from data folder
all_docs = []
data_path = "data"

for file in os.listdir(data_path):
    if file.endswith(".pdf"):
        loader = PyPDFLoader(os.path.join(data_path, file))
        docs = loader.load()

        # Add source metadata
        for doc in docs:
            doc.metadata["source"] = file

        all_docs.extend(docs)

# Split documents
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
chunks = splitter.split_documents(all_docs)

# Create embeddings
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# Create vector DB
db = FAISS.from_documents(chunks, embeddings)

if os.path.exists("faiss_index"):
    db = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)
else:
    db = FAISS.from_documents(chunks, embeddings)
    db.save_local("faiss_index")


def ask_question(query):
    docs = db.similarity_search(query, k=6)

    # Debug (optional)
    # for doc in docs:
    #     print("\n--- Retrieved Chunk ---\n", doc.page_content[:300])

    context = "\n".join([doc.page_content for doc in docs])
    sources = [doc.metadata.get("source", "unknown") for doc in docs]

    prompt = f"""
You are an intelligent Legal AI Assistant.

Your role is to help users understand legal information from the provided documents.

Instructions:
- Use the provided context to answer the question.
- The wording of the question may differ from the text.
- Use reasoning to connect the question with relevant legal information.
- Summarize clearly and professionally.

If the answer cannot reasonably be derived from the context, reply:
"Sorry, I cannot answer this question from the provided documents."

Context:
{context}

User Question:
{query}

Legal Answer:
"""

    response = model.generate_content(prompt)

    return response.text, set(sources)
