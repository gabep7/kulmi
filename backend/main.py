from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import engine
import models  # noqa: F401 — ensures all models are registered with Base
from database import Base
from routers import auth, chat, documents, folders

app = FastAPI(title="Kulmi API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(folders.router, prefix="/api/folders", tags=["folders"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

    # sqlite migrations — add columns/tables that didn't exist on first run
    from sqlalchemy import text, inspect
    with engine.connect() as conn:
        inspector = inspect(engine)
        existing_cols = [c['name'] for c in inspector.get_columns('chat_sessions')]
        if 'document_ids' not in existing_cols:
            conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN document_ids TEXT"))
        if 'provider' not in existing_cols:
            conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN provider TEXT"))
        if 'model' not in existing_cols:
            conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN model TEXT"))
        doc_cols = [c['name'] for c in inspector.get_columns('documents')]
        if 'folder_id' not in doc_cols:
            conn.execute(text("ALTER TABLE documents ADD COLUMN folder_id INTEGER REFERENCES folders(id)"))
        conn.commit()


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
