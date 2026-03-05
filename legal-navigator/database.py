from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./users.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()


# ✅ ADD THIS FUNCTION (IMPORTANT)
def init_db():
    from models import User, ChatSession, ChatMessage
    Base.metadata.create_all(bind=engine)