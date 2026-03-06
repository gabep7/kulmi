from __future__ import annotations

import uuid
from pathlib import Path

import fitz  # PyMuPDF — used only to count pages
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models.document import Document
from models.user import User
from schemas.document import DocumentOut
from services.embeddings import get_chroma_client, add_document_chunks
from services.pdf import extract_text_chunks
from utils.jwt import get_current_user

router = APIRouter()


def _upload_dir(user_id: int) -> Path:
    path = Path(settings.upload_dir).resolve() / str(user_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are accepted")

    user_dir = _upload_dir(current_user.id)
    stored_name = f"{uuid.uuid4().hex}.pdf"
    file_path = user_dir / stored_name

    content = await file.read()
    file_path.write_bytes(content)

    # Count pages
    try:
        doc_fitz = fitz.open(str(file_path))
        page_count = len(doc_fitz)
        doc_fitz.close()
    except Exception:
        page_count = 0

    # Persist DB record first to get the id
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

    # Extract chunks and embed in background-friendly sync call
    try:
        chunks = extract_text_chunks(str(file_path))
        if chunks:
            add_document_chunks(collection_name, chunks, str(doc_record.id))
    except Exception as exc:
        # Don't fail the upload — just log; embeddings can be retried
        import logging
        logging.getLogger(__name__).warning("Embedding failed for doc %s: %s", doc_record.id, exc)

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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Remove ChromaDB collection
    if doc.chroma_collection_id:
        try:
            client = get_chroma_client()
            client.delete_collection(doc.chroma_collection_id)
        except Exception:
            pass

    # Remove file from disk
    file_path = Path(settings.upload_dir).resolve() / str(current_user.id) / doc.filename
    if file_path.exists():
        file_path.unlink()

    db.delete(doc)
    db.commit()
