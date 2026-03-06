from __future__ import annotations

import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True, index=True)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    page_count = Column(Integer, default=0)
    chroma_collection_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
