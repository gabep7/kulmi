from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.document import Document
from models.folder import Folder
from models.user import User
from schemas.folder import FolderCreate, FolderOut
from utils.jwt import get_current_user

router = APIRouter()


@router.get("/", response_model=list[FolderOut])
def list_folders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Folder).filter(Folder.user_id == current_user.id).order_by(Folder.name).all()


@router.post("/", response_model=FolderOut, status_code=status.HTTP_201_CREATED)
def create_folder(
    body: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = Folder(user_id=current_user.id, name=body.name.strip())
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.patch("/{folder_id}", response_model=FolderOut)
def rename_folder(
    folder_id: int,
    body: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="folder not found")
    folder.name = body.name.strip()
    db.commit()
    db.refresh(folder)
    return folder


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="folder not found")
    # unassign docs in this folder rather than deleting them
    db.query(Document).filter(Document.folder_id == folder_id, Document.user_id == current_user.id).update({"folder_id": None})
    db.delete(folder)
    db.commit()


@router.patch("/assign/{doc_id}", status_code=status.HTTP_200_OK)
def assign_document(
    doc_id: int,
    folder_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """move a document into a folder (or out of one by passing folder_id=null)."""
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="document not found")
    if folder_id is not None:
        folder = db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == current_user.id).first()
        if not folder:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="folder not found")
    doc.folder_id = folder_id
    db.commit()
    return {"ok": True}
