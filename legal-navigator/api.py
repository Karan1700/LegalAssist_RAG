from fastapi import FastAPI, Depends, Body
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from database import SessionLocal, init_db
from models import User, ChatSession, ChatMessage
from rag_pipeline import load_rag_pipeline, ask_question
from auth import hash_password, verify_password

import threading

app = FastAPI()

print("🚀 FastAPI starting...")

init_db()

# ---------- RAG STATUS FLAG ----------
rag_ready = False


def load_rag_background():
    global rag_ready

    print("📚 Loading RAG pipeline...")
    load_rag_pipeline()
    rag_ready = True
    print("✅ RAG pipeline ready")


@app.on_event("startup")
def startup_event():
    thread = threading.Thread(target=load_rag_background)
    thread.start()


# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://legal-assist-rag.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ---------- DATABASE ----------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- SIGNUP ----------
@app.post("/signup")
def signup(data: dict = Body(...), db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return {"success": False, "message": "Please enter username and password"}

    existing = db.query(User).filter(User.username == username).first()

    if existing:
        return {"success": False, "message": "User already exists"}

    new_user = User(
        username=username,
        password=hash_password(password)
    )

    db.add(new_user)
    db.commit()

    return {"success": True, "message": "Signup successful 🎉"}


# ---------- LOGIN ----------
@app.post("/login")
def login(data: dict = Body(...), db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return {"success": False, "message": "Please enter username and password"}

    user = db.query(User).filter(User.username == username).first()

    if not user:
        return {"success": False, "message": "User not found"}

    if not verify_password(password, user.password):
        return {"success": False, "message": "Invalid password"}

    return {"success": True, "message": "Login successful", "username": username}


# ---------- ASK ----------
@app.post("/ask")
def ask(data: dict = Body(...), db: Session = Depends(get_db)):
    global rag_ready

    if not rag_ready:
        return {
            "answer": "⚠️ AI is still loading. Please try again in few seconds.",
            "sources": []
        }

    question = data.get("question")
    session_id = data.get("session_id")

    if not question:
        return {"answer": "No question provided", "sources": []}

    answer, sources = ask_question(question)

    # ✅ SAVE ONLY IF SESSION EXISTS (Logged in user)
    if session_id:
        msg_user = ChatMessage(
            session_id=session_id,
            role="user",
            message=question
        )

        msg_ai = ChatMessage(
            session_id=session_id,
            role="assistant",
            message=answer
        )

        db.add(msg_user)
        db.add(msg_ai)
        db.commit()

    return {"answer": answer, "sources": list(sources)}

# ---------- NEW CHAT ----------
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


# ---------- CHAT LIST ----------
@app.get("/chats/{username}")
def get_chats(username: str, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.username == username).first()

    if not user:
        return []

    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == user.id
    ).all()

    return [{"id": s.id} for s in sessions]


# ---------- LOAD CHAT ----------
@app.get("/messages/{session_id}")
def get_messages(session_id: int, db: Session = Depends(get_db)):

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).all()

    return [
        {
            "role": m.role,
            "message": m.message
        }
        for m in messages
    ]

# ---------- DELETE CHAT ----------
@app.delete("/chat/{session_id}")
def delete_chat(session_id: int, db: Session = Depends(get_db)):

    # check session exists
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id
    ).first()

    if not session:
        return {"success": False, "message": "Chat not found"}

    # delete all messages of that chat
    db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).delete()

    # delete chat session
    db.delete(session)

    db.commit()

    return {"success": True, "message": "Chat deleted successfully"}


# ---------- HEALTH ----------
@app.get("/")
def health():
    return {"status": "running"}