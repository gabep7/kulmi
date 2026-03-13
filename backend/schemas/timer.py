from __future__ import annotations

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class StudyMethod(BaseModel):
    id: str
    name: str
    description: str
    focus_time: str
    break_time: str
    benefits: List[str]
    pros: List[str]
    cons: List[str]
    ideal_for: List[str]


class StudySessionCreate(BaseModel):
    method: str
    planned_duration: int  # seconds
    document_ids: Optional[List[int]] = None


class StudySessionUpdate(BaseModel):
    status: Optional[str] = None
    actual_duration: Optional[int] = None
    break_duration: Optional[int] = None
    ended_at: Optional[datetime] = None
    notes: Optional[str] = None


class StudySessionResponse(BaseModel):
    id: int
    method: str
    started_at: datetime
    ended_at: Optional[datetime]
    planned_duration: int
    actual_duration: Optional[int]
    break_duration: Optional[int]
    status: str
    notes: Optional[str]
    document_ids: Optional[List[int]]
    created_at: datetime
    
    class Config:
        from_attributes = True


class StudyStats(BaseModel):
    total_sessions: int
    total_focus_time: int  # seconds
    total_break_time: int  # seconds
    favorite_method: str
    sessions_this_week: int
    sessions_today: int
