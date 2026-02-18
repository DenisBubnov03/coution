"""
API страниц и блоков.
"""
import json
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel, field_serializer
from sqlalchemy.orm import Session

from db import get_db
from models import Mentor, Page, Block
from auth import get_current_user, get_admin_user

router = APIRouter(prefix="/api/kb", tags=["kb"])


class BlockCreate(BaseModel):
    type: str
    content: Optional[str] = None
    props: Optional[dict] = None
    position: int = 0


class BlockUpdate(BaseModel):
    type: Optional[str] = None
    content: Optional[str] = None
    props: Optional[dict] = None
    position: Optional[int] = None


class BlockOut(BaseModel):
    id: int
    type: str
    content: Optional[str]
    props: Optional[dict]
    position: int

    @field_serializer("props")
    def serialize_props(self, v):
        return v if v is not None else {}

    class Config:
        from_attributes = True


class PageCreate(BaseModel):
    title: str = "Untitled"
    icon: Optional[str] = None
    parent_id: Optional[int] = None


class PageUpdate(BaseModel):
    title: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[int] = None


def _page_to_out(p: Page, include_children: bool = False, include_blocks: bool = False) -> dict:
    out = {
        "id": p.id,
        "title": p.title,
        "icon": p.icon,
        "parent_id": p.parent_id,
        "is_public": bool(p.is_public),
        "public_slug": p.public_slug,
        "position": p.position,
    }
    if include_children:
        out["children"] = [_page_to_out(c, include_children=True) for c in sorted(p.children, key=lambda x: x.position)]
    if include_blocks:
        blocks_out = []
        for b in sorted(p.blocks, key=lambda x: x.position):
            raw_props = getattr(b, "props", None)
            props_val = dict(raw_props) if raw_props else {}
            blocks_out.append({
                "id": int(b.id),
                "type": str(b.type),
                "content": b.content,
                "props": props_val,
                "position": int(b.position),
            })
        out["blocks"] = blocks_out
    return out


# --- Pages ---


@router.get("/pages")
def list_pages(
    parent_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    mentor: Mentor = Depends(get_current_user),
):
    q = db.query(Page)
    if parent_id is None:
        q = q.filter(Page.parent_id.is_(None))
    else:
        q = q.filter(Page.parent_id == parent_id)
    pages = q.order_by(Page.position, Page.id).all()
    return [_page_to_out(p, include_children=True) for p in pages]


@router.post("/pages")
def create_page(
    data: PageCreate,
    db: Session = Depends(get_db),
    mentor: Mentor = Depends(get_current_user),
):
    parent_id = data.parent_id if data.parent_id else None  # 0 → NULL для корневой
    page = Page(
        title=data.title,
        icon=data.icon,
        parent_id=parent_id,
        created_by_id=mentor.id,
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return _page_to_out(page)


@router.get("/pages/{page_id}")
def get_page(
    page_id: int,
    db: Session = Depends(get_db),
    mentor: Mentor = Depends(get_current_user),
):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(404, "Page not found")
    # children не возвращаем; blocks — всегда с props
    out = _page_to_out(page, include_children=False, include_blocks=True)
    body = json.dumps(out, ensure_ascii=False)
    return Response(content=body, media_type="application/json")


@router.patch("/pages/{page_id}")
def update_page(
    page_id: int,
    data: PageUpdate,
    db: Session = Depends(get_db),
    mentor: Mentor = Depends(get_current_user),
):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(404, "Page not found")
    if data.title is not None:
        page.title = data.title
    if data.icon is not None:
        page.icon = data.icon
    if data.parent_id is not None:
        page.parent_id = data.parent_id if data.parent_id else None
    db.commit()
    db.refresh(page)
    return _page_to_out(page)


@router.delete("/pages/{page_id}")
def delete_page(
    page_id: int,
    db: Session = Depends(get_db),
    mentor: Mentor = Depends(get_current_user),
):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(404, "Page not found")
    db.delete(page)
    db.commit()
    return {"ok": True}


@router.post("/pages/{page_id}/publish")
def publish_page(
    page_id: int,
    db: Session = Depends(get_db),
    admin: Mentor = Depends(get_admin_user),
):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(404, "Page not found")
    page.is_public = True
    if not page.public_slug:
        page.public_slug = secrets.token_urlsafe(16)
    db.commit()
    db.refresh(page)
    return {"ok": True, "public_slug": page.public_slug}


@router.post("/pages/{page_id}/refresh-slug")
def refresh_public_slug(
    page_id: int,
    db: Session = Depends(get_db),
    admin: Mentor = Depends(get_admin_user),
):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(404, "Page not found")
    page.public_slug = secrets.token_urlsafe(16)
    db.commit()
    db.refresh(page)
    return {"ok": True, "public_slug": page.public_slug}


@router.post("/pages/{page_id}/unpublish")
def unpublish_page(
    page_id: int,
    db: Session = Depends(get_db),
    admin: Mentor = Depends(get_admin_user),
):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(404, "Page not found")
    page.is_public = False
    page.public_slug = None
    db.commit()
    return {"ok": True}


# --- Blocks ---


@router.post("/pages/{page_id}/blocks")
def create_block(
    page_id: int,
    data: BlockCreate,
    db: Session = Depends(get_db),
    mentor: Mentor = Depends(get_current_user),
):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(404, "Page not found")
    block = Block(
        page_id=page_id, type=data.type, content=data.content or None,
        props=data.props, position=data.position
    )
    db.add(block)
    db.commit()
    db.refresh(block)
    return BlockOut.model_validate(block)


@router.patch("/blocks/{block_id}")
def update_block(
    block_id: int,
    data: BlockUpdate,
    db: Session = Depends(get_db),
    mentor: Mentor = Depends(get_current_user),
):
    block = db.query(Block).filter(Block.id == block_id).first()
    if not block:
        raise HTTPException(404, "Block not found")
    if data.type is not None:
        block.type = data.type
    if data.content is not None:
        block.content = data.content
    if data.props is not None:
        block.props = data.props
    if data.position is not None:
        block.position = data.position
    db.commit()
    db.refresh(block)
    return BlockOut.model_validate(block)


@router.delete("/blocks/{block_id}")
def delete_block(
    block_id: int,
    db: Session = Depends(get_db),
    mentor: Mentor = Depends(get_current_user),
):
    block = db.query(Block).filter(Block.id == block_id).first()
    if not block:
        raise HTTPException(404, "Block not found")
    db.delete(block)
    db.commit()
    return {"ok": True}


# --- Публичный доступ ---


@router.get("/public/{slug}")
def get_public_page(slug: str, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.public_slug == slug, Page.is_public == True).first()
    if not page:
        raise HTTPException(404, "Page not found")
    return _page_to_out(page, include_children=True, include_blocks=True)
