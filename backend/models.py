"""
Модели.
- Mentor — в БД test (auth), таблица mentors
- Page, Block — в БД coution
"""
from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from db import Base


class Mentor(Base):
    """Ментор из дашборда (БД test). Для авторизации."""
    __tablename__ = "mentors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    telegram = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    chat_id = Column(String, nullable=True)
    direction = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False, server_default="false")
    password_hash = Column(String(255), nullable=True)


class Page(Base):
    """Страница базы знаний. БД coution."""
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    parent_id = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(500), nullable=False, default="Untitled")
    icon = Column(String(50), nullable=True)
    created_by_id = Column(Integer, nullable=True)  # mentor.id из test, без FK (другая БД)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    is_public = Column(Boolean, default=False, server_default="false")
    public_slug = Column(String(64), unique=True, nullable=True, index=True)

    position = Column(Integer, default=0)

    parent = relationship("Page", remote_side=[id], back_populates="children", foreign_keys=[parent_id])
    children = relationship("Page", back_populates="parent", foreign_keys=[parent_id])
    blocks = relationship("Block", back_populates="page", cascade="all, delete-orphan")


class Block(Base):
    """Блок контента. БД coution."""
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    page_id = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)
    content = Column(Text, nullable=True)
    position = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    page = relationship("Page", back_populates="blocks")
