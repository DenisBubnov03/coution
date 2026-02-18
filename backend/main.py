"""
Coution — база знаний (Notion-like).
Auth: mentors из test. Данные: pages/blocks в coution.
"""
import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

import bcrypt

from db import get_db, get_db_auth, engine_kb
from models import Mentor, Page, Block
from auth import create_access_token, get_current_user, get_admin_user

# Создать pages, blocks в coution при старте
for t in [Page.__table__, Block.__table__]:
    t.create(engine_kb, checkfirst=True)

app = FastAPI(title="Coution", description="База знаний — notion для Coconut")

_cors_origins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]
if os.environ.get("CORS_ORIGINS"):
    _cors_origins.extend(o.strip() for o in os.environ["CORS_ORIGINS"].split(",") if o.strip())
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Auth ---


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/api/auth/login")
def auth_login(data: LoginRequest, db: Session = Depends(get_db_auth)):
    """Логин по tg-нику + паролю. Mentors из test DB."""
    if not os.environ.get("JWT_SECRET", "").strip():
        raise HTTPException(500, "JWT_SECRET not set")
    username = (data.username or "").strip()
    if not username:
        raise HTTPException(400, "Username required")
    telegram = f"@{username}" if not username.startswith("@") else username
    mentor = db.query(Mentor).filter(Mentor.telegram == telegram).first()
    if not mentor:
        raise HTTPException(401, "Access denied")
    pw = (mentor.password_hash or "").strip()
    if not pw:
        raise HTTPException(401, "Password not set. Задай пароль в дашборде: python .../set_mentor_password.py " + telegram)
    try:
        if not pw.startswith("$2"):
            raise HTTPException(500, "password_hash must be bcrypt")
        if not bcrypt.checkpw(data.password.encode("utf-8"), pw.encode("utf-8")):
            raise HTTPException(401, "Invalid password")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(401, "Invalid password")
    role = "admin" if getattr(mentor, "is_admin", False) else "curator"
    token = create_access_token(mentor.id, role)
    return {
        "token": token,
        "user": {"id": mentor.id, "full_name": mentor.full_name, "username": mentor.telegram, "role": role},
    }


@app.get("/api/auth/me")
def auth_me(mentor: Mentor = Depends(get_current_user)):
    role = "admin" if getattr(mentor, "is_admin", False) else "curator"
    return {"id": mentor.id, "full_name": mentor.full_name, "username": mentor.telegram, "role": role}


# --- KB API ---

import secrets
from typing import Optional

from routers.kb import router as kb_router

app.include_router(kb_router)


@app.get("/")
def root():
    return {"app": "coution", "docs": "/docs"}
