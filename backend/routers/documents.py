from __future__ import annotations

import logging
import uuid
from pathlib import Path

import fitz  # PyMuPDF — used only to count pages
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from config import settings
from database import SessionLocal, get_db
from models.document import Document
from models.user import User
from schemas.document import DocumentOut
from services.embeddings import get_chroma_client, add_document_chunks
from services.pdf import extract_text_chunks
from utils.jwt import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def _upload_dir(user_id: int) -> Path:
    path = Path(settings.upload_dir).resolve() / str(user_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _embed_in_background(file_path: str, collection_name: str, doc_id: int) -> None:
    """extract chunks and embed — runs after the upload response is already sent."""
    try:
        chunks = extract_text_chunks(file_path)
        if chunks:
            add_document_chunks(collection_name, chunks, str(doc_id))
            logger.info("embedded %d chunks for doc %s", len(chunks), doc_id)
        else:
            logger.warning("no chunks extracted from doc %s", doc_id)
    except Exception as exc:
        logger.error("embedding failed for doc %s: %s", doc_id, exc)


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="only pdf files are accepted")

    user_dir = _upload_dir(current_user.id)
    stored_name = f"{uuid.uuid4().hex}.pdf"
    file_path = user_dir / stored_name

    content = await file.read()
    file_path.write_bytes(content)

    # count pages
    try:
        doc_fitz = fitz.open(str(file_path))
        page_count = len(doc_fitz)
        doc_fitz.close()
    except Exception:
        page_count = 0

    doc_record = Document(
        user_id=current_user.id,
        filename=stored_name,
        original_name=file.filename,
        page_count=page_count,
        chroma_collection_id=None,
    )
    db.add(doc_record)
    db.commit()
    db.refresh(doc_record)

    collection_name = f"doc_{doc_record.id}"
    doc_record.chroma_collection_id = collection_name
    db.commit()

    # respond immediately — embedding happens in the background
    background_tasks.add_task(_embed_in_background, str(file_path), collection_name, doc_record.id)

    return doc_record


@router.get("/", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Document).filter(Document.user_id == current_user.id).all()


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="document not found")

    if doc.chroma_collection_id:
        try:
            client = get_chroma_client()
            client.delete_collection(doc.chroma_collection_id)
        except Exception:
            pass

    file_path = Path(settings.upload_dir).resolve() / str(current_user.id) / doc.filename
    if file_path.exists():
        file_path.unlink()

    db.delete(doc)
    db.commit()
