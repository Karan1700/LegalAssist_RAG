from fastapi import FastAPI, Depends, Body
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from database import SessionLocal, init_db
from models import User, ChatSession, ChatMessage
from rag_pipeline import load_rag_pipeline, ask_question

import os

app = FastAPI()

print("🚀 FastAPI starting...")

init_db()

# Load RAG once when server starts
@app.on_event("startup")
def startup_event():
    print("📚 Loading RAG pipeline...")
    load_rag_pipeline()
    print("✅ RAG pipeline ready")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DB ---------------- #
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------- SIGNUP ---------------- #
@app.post("/signup")
def signup(data: dict = Body(...), db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return {"success": False, "message": "Please enter username and password"}

    existing = db.query(User).filter(User.username == username).first()

    if existing:
        return {"success": False, "message": "User already exists"}

    new_user = User(username=username, password=password)
    db.add(new_user)
    db.commit()

    return {"success": True, "message": "Signup successful 🎉"}


# ---------------- LOGIN ---------------- #
@app.post("/login")
def login(data: dict = Body(...), db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return {"success": False, "message": "Please enter username and password"}

    user = db.query(User).filter(
        User.username == username,
        User.password == password
    ).first()

    if not user:
        return {"success": False, "message": "User not found ❌"}

    return {"success": True, "message": "Login successful ✅"}


# ---------------- ASK ---------------- #
@app.post("/ask")
def ask(data: dict = Body(...), db: Session = Depends(get_db)):
    question = data.get("question")
    username = data.get("username")
    session_id = data.get("session_id")

    if not question:
        return {"answer": "No question provided", "sources": []}

    answer, sources = ask_question(question)

    if username and session_id:
        msg1 = ChatMessage(session_id=session_id, role="user", message=question)
        msg2 = ChatMessage(session_id=session_id, role="assistant", message=answer)

        db.add(msg1)
        db.add(msg2)
        db.commit()

    return {"answer": answer, "sources": list(sources)}


# ---------------- NEW CHAT ---------------- #
@app.post("/new_chat/{username}")
def new_chat(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()

    if not user:
        return {"success": False, "message": "User not found"}

    session = ChatSession(user_id=user.id)
    db.add(session)
    db.commit()
    db.refresh(session)

    return {"success": True, "session_id": session.id}


# ---------------- CHAT LIST ---------------- #
@app.get("/chats/{username}")
def get_chats(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()

    if not user:
        return []

    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == user.id
    ).all()

    return [{"id": s.id} for s in sessions]


# ---------------- LOAD CHAT ---------------- #
@app.get("/messages/{session_id}")
def get_messages(session_id: int, db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).all()

    return [{"role": m.role, "message": m.message} for m in messages]


@app.get("/")
def health():
    return {"status": "running"}