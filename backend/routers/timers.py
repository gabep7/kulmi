from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.study_timer import StudySession
from models.user import User
from schemas.timer import (
    StudyMethod,
    StudySessionCreate,
    StudySessionResponse,
    StudySessionUpdate,
    StudyStats,
)
from data.study_methods import get_all_study_methods, get_study_method
from utils.jwt import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/methods", response_model=List[StudyMethod])
def list_methods():
    """get all study timer methods."""
    return get_all_study_methods()


@router.get("/methods/{method_id}", response_model=StudyMethod)
def get_method(method_id: str):
    """get a specific method's details."""
    method = get_study_method(method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"method '{method_id}' not found"
        )
    return method


@router.post("/sessions", response_model=StudySessionResponse)
def create_session(
    data: StudySessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """start a new study session."""
    method = get_study_method(data.method)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"invalid method: {data.method}"
        )
    
    session = StudySession(
        user_id=current_user.id,
        method=data.method,
        planned_duration=data.planned_duration,
        document_ids=json.dumps(data.document_ids) if data.document_ids else None,
        status="active",
        started_at=datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return _serialize_session(session)


@router.get("/sessions", response_model=List[StudySessionResponse])
def list_sessions(
    status: str | None = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """list user's study sessions."""
    query = db.query(StudySession).filter(StudySession.user_id == current_user.id)
    
    if status:
        query = query.filter(StudySession.status == status)
    
    sessions = query.order_by(StudySession.created_at.desc()).limit(limit).all()
    return [_serialize_session(s) for s in sessions]


@router.get("/sessions/{session_id}", response_model=StudySessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """get a specific session."""
    session = db.query(StudySession).filter(
        StudySession.id == session_id,
        StudySession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="session not found"
        )
    
    return _serialize_session(session)


@router.patch("/sessions/{session_id}", response_model=StudySessionResponse)
def update_session(
    session_id: int,
    data: StudySessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """update a session — pause, complete, add notes, etc."""
    session = db.query(StudySession).filter(
        StudySession.id == session_id,
        StudySession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="session not found"
        )
    
    if data.status is not None:
        session.status = data.status
        if data.status in ("completed", "cancelled"):
            session.ended_at = datetime.utcnow()
    
    if data.actual_duration is not None:
        session.actual_duration = data.actual_duration
    
    if data.break_duration is not None:
        session.break_duration = data.break_duration
    
    if data.ended_at is not None:
        session.ended_at = data.ended_at
    
    if data.notes is not None:
        session.notes = data.notes
    
    db.commit()
    db.refresh(session)
    
    return _serialize_session(session)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """delete a session."""
    session = db.query(StudySession).filter(
        StudySession.id == session_id,
        StudySession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="session not found"
        )
    
    db.delete(session)
    db.commit()


@router.get("/stats", response_model=StudyStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """get user's study statistics."""
    from sqlalchemy import func
    from datetime import timedelta
    
    sessions = db.query(StudySession).filter(
        StudySession.user_id == current_user.id,
        StudySession.status == "completed"
    ).all()
    
    total_sessions = len(sessions)
    total_focus_time = sum(s.actual_duration or 0 for s in sessions)
    total_break_time = sum(s.break_duration or 0 for s in sessions)
    
    # find most used method
    method_counts = {}
    for s in sessions:
        method_counts[s.method] = method_counts.get(s.method, 0) + 1
    favorite_method = max(method_counts, key=method_counts.get) if method_counts else "pomodoro"
    
    week_ago = datetime.utcnow() - timedelta(days=7)
    sessions_this_week = db.query(StudySession).filter(
        StudySession.user_id == current_user.id,
        StudySession.created_at >= week_ago
    ).count()
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    sessions_today = db.query(StudySession).filter(
        StudySession.user_id == current_user.id,
        StudySession.created_at >= today
    ).count()
    
    return StudyStats(
        total_sessions=total_sessions,
        total_focus_time=total_focus_time,
        total_break_time=total_break_time,
        favorite_method=favorite_method,
        sessions_this_week=sessions_this_week,
        sessions_today=sessions_today,
    )


@router.get("/active", response_model=StudySessionResponse | None)
def get_active_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """get currently active session if any."""
    session = db.query(StudySession).filter(
        StudySession.user_id == current_user.id,
        StudySession.status.in_(["active", "paused"])
    ).order_by(StudySession.created_at.desc()).first()
    
    return _serialize_session(session) if session else None


def _serialize_session(session: StudySession) -> StudySessionResponse:
    """convert db model to response schema."""
    doc_ids = None
    if session.document_ids:
        try:
            doc_ids = json.loads(session.document_ids)
        except json.JSONDecodeError:
            pass
    
    return StudySessionResponse(
        id=session.id,
        method=session.method,
        started_at=session.started_at,
        ended_at=session.ended_at,
        planned_duration=session.planned_duration,
        actual_duration=session.actual_duration,
        break_duration=session.break_duration,
        status=session.status,
        notes=session.notes,
        document_ids=doc_ids,
        created_at=session.created_at,
    )
