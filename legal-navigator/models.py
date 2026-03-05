from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


# ---------------- USER ---------------- #
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    password = Column(String)

    # ✅ FIX: match back_populates
    sessions = relationship("ChatSession", back_populates="user")


# ---------------- CHAT SESSION ---------------- #
class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # ✅ FIX: match User.sessions
    user = relationship("User", back_populates="sessions")

    # relation with messages
    messages = relationship("ChatMessage", back_populates="session")


# ---------------- CHAT MESSAGE ---------------- #
class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String)
    message = Column(String)

    # ✅ FIX: match ChatSession.messages
    session = relationship("ChatSession", back_populates="messages")