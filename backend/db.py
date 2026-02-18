"""
Два подключения:
- AUTH_DATABASE_URL (test) — mentors, авторизация
- COUTION_DATABASE_URL (coution) — pages, blocks
"""
import os
from pathlib import Path

_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(_env_path)

AUTH_DATABASE_URL = os.getenv("AUTH_DATABASE_URL")
COUTION_DATABASE_URL = os.getenv("COUTION_DATABASE_URL")
if not AUTH_DATABASE_URL or not COUTION_DATABASE_URL:
    raise RuntimeError("AUTH_DATABASE_URL и COUTION_DATABASE_URL обязательны в .env")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()

engine_auth = create_engine(AUTH_DATABASE_URL)
engine_kb = create_engine(COUTION_DATABASE_URL)

SessionAuth = sessionmaker(autocommit=False, autoflush=False, bind=engine_auth)
SessionKB = sessionmaker(autocommit=False, autoflush=False, bind=engine_kb)


def get_db_auth():
    db = SessionAuth()
    try:
        yield db
    finally:
        db.close()


def get_db():
    """Сессия для pages/blocks (coution)."""
    session = SessionKB()
    try:
        yield session
    finally:
        session.close()
