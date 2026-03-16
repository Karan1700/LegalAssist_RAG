import os
from dotenv import load_dotenv
import google.generativeai as genai

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS


load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = None
db = None


def load_rag_pipeline():
    global model, db

    print("🔹 Loading Gemini model...")
    model = genai.GenerativeModel("gemini-2.5-flash-lite")

    print("🔹 Loading FAISS index...")

    embeddings = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2"
    )

    db = FAISS.load_local(
        "faiss_index",
        embeddings,
        allow_dangerous_deserialization=True
    )

    print("✅ RAG pipeline ready")


def ask_question(query):
    global db, model

    if db is None:
        return "RAG system is still loading. Please try again.", []

    docs = db.similarity_search(query, k=3)

    context = "\n".join([doc.page_content for doc in docs])
    sources = [doc.metadata.get("source", "unknown") for doc in docs]

    prompt = f"""
You are an intelligent Legal AI Assistant.

Your role is to help users understand legal information from the provided documents.

Instructions:
- Use ONLY the provided context to answer.
- The wording of the question may differ from document text.
- Use reasoning to connect the query with relevant legal information.
- Summarize clearly in professional legal tone.

If the answer cannot be derived from context, say:
"Sorry, I cannot answer this question from the provided documents."

Context:
{context}

User Question:
{query}

Legal Answer:
"""

    response = model.generate_content(prompt)

    return response.text, set(sources)