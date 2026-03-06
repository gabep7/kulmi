from __future__ import annotations

import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String, nullable=False)          # stored filename on disk
    original_name = Column(String, nullable=False)     # original upload name
    page_count = Column(Integer, default=0)
    chroma_collection_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
