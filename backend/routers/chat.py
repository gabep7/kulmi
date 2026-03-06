from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models.chat import ChatMessage, ChatSession
from models.document import Document
from models.user import User
from schemas.chat import ChatRequest
from services.embeddings import query_collection
from services.llm import stream_llm_response, get_providers_info
from services.rag import build_chat_prompt, build_explain_prompt, build_exam_prompt
from utils.jwt import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_context(document_ids: list[int], query: str, db: Session, user_id: int) -> list[str]:
    """Gather context chunks from all specified document collections."""
    context: list[str] = []
    logger.info("getting context for doc_ids=%s user_id=%s query='%s'", document_ids, user_id, query[:60])
    for doc_id in document_ids:
        doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
        if not doc or not doc.chroma_collection_id:
            logger.warning("doc %s not found or no collection (user=%s)", doc_id, user_id)
            continue
        try:
            chunks = query_collection(doc.chroma_collection_id, query, n_results=5)
            logger.info("doc %s → %d chunks", doc_id, len(chunks))
            context.extend(chunks)
        except Exception as exc:
            logger.error("query_collection failed for doc %s: %s", doc_id, exc)
    logger.info("total context chunks: %d", len(context))
    return context


def _parse_document_ids(session: ChatSession) -> list[int]:
    """Parse document_ids from session, falling back to legacy document_id."""
    if session.document_ids:
        try:
            return json.loads(session.document_ids)
        except (json.JSONDecodeError, TypeError):
            pass
    if session.document_id is not None:
        return [session.document_id]
    return []


@router.get("/providers")
def list_providers():
    """Return all supported LLM providers and their configuration status."""
    return get_providers_info()


@router.post("/stream")
async def stream_chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Determine document IDs: prefer request, fall back to session
    doc_ids = request.document_ids
    logger.info("stream_chat request: doc_ids=%s session_id=%s user=%s", doc_ids, request.session_id, current_user.id)

    async def event_generator():
        nonlocal doc_ids

        # Resolve or create the chat session
        session_id = request.session_id
        if session_id is None:
            first_doc_id = doc_ids[0] if doc_ids else None
            session = ChatSession(
                user_id=current_user.id,
                document_id=first_doc_id,
                document_ids=json.dumps(doc_ids),
                title=request.message[:80],
                provider=request.provider,
                model=request.model,
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            session_id = session.id
        else:
            session = db.query(ChatSession).filter(
                ChatSession.id == session_id,
                ChatSession.user_id == current_user.id,
            ).first()
            if not session:
                yield f"data: {json.dumps({'type': 'error', 'detail': 'Session not found'})}\n\n"
                return
            # Fall back to session's stored document IDs if none in request
            if not doc_ids:
                doc_ids = _parse_document_ids(session)

        context = _get_context(doc_ids, request.message, db, current_user.id)

        if request.mode == "chat":
            system, prompt = build_chat_prompt(context, request.message)
        elif request.mode == "explain":
            system, prompt = build_explain_prompt(context, request.message)
        else:  # exam
            system, prompt = build_exam_prompt(
                context,
                num_questions=request.question_count,
                question_type=request.question_type,
            )

        # Send session_id as first SSE event
        yield f"data: {json.dumps({'type': 'session_id', 'session_id': session_id})}\n\n"

        # Stream tokens from LLM provider and collect full response
        full_response: list[str] = []
        try:
            async for token in stream_llm_response(
                prompt=prompt,
                system=system,
                provider=request.provider,
                model=request.model,
            ):
                full_response.append(token)
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
        except ValueError as exc:
            yield f"data: {json.dumps({'type': 'error', 'detail': str(exc)})}\n\n"
            return

        # Persist messages
        assistant_text = "".join(full_response)
        db.add(ChatMessage(session_id=session_id, role="user", content=request.message))
        db.add(ChatMessage(session_id=session_id, role="assistant", content=assistant_text))
        db.commit()

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    return [
        {
            "id": s.id,
            "title": s.title,
            "document_ids": _parse_document_ids(s),
            "provider": s.provider,
            "model": s.model,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return {
        "id": session.id,
        "title": session.title,
        "document_ids": _parse_document_ids(session),
        "provider": session.provider,
        "model": session.model,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
    }


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
    db.delete(session)
    db.commit()
