"""
Авторизация: mentors из test, JWT.
Тот же флоу что в дашборде — tg-ник + пароль.
"""
import os
import time

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from db import get_db_auth
from models import Mentor

security = HTTPBearer(auto_error=False)


def create_access_token(mentor_id: int, role: str) -> str:
    secret = os.environ.get("JWT_SECRET", "")
    if not secret:
        raise ValueError("JWT_SECRET not set")
    payload = {"sub": str(mentor_id), "role": role, "exp": int(time.time()) + 7 * 86400}
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_token(token: str) -> dict | None:
    secret = os.environ.get("JWT_SECRET", "")
    if not secret:
        return None
    try:
        return jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db_auth),
) -> Mentor:
    if not creds or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(creds.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    mentor_id = int(payload.get("sub", 0))
    mentor = db.query(Mentor).filter(Mentor.id == mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return mentor


def get_admin_user(mentor: Mentor = Depends(get_current_user)) -> Mentor:
    """Только админ. Для публикации и обновления ссылок."""
    if not getattr(mentor, "is_admin", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return mentor
