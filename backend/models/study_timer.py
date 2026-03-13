from __future__ import annotations

import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from database import Base


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    method = Column(String, nullable=False)  # "pomodoro", "52-17", "flowtime", etc.
    
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    
    planned_duration = Column(Integer, nullable=False)  # seconds
    actual_duration = Column(Integer, nullable=True)  # seconds
    break_duration = Column(Integer, nullable=True)  # seconds
    
    status = Column(String, default="active")  # "active", "completed", "cancelled", "paused"
    notes = Column(Text, nullable=True)
    document_ids = Column(Text, nullable=True)  # json array of doc ids
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
