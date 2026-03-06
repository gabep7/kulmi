from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class ChatRequest(BaseModel):
    session_id: int | None = None
    document_ids: list[int]
    message: str
    mode: Literal["chat", "explain", "exam"] = "chat"
    provider: str | None = None   # "ollama", "groq", "openai"
    model: str | None = None      # model name
    question_count: int = 10
    question_type: Literal["mcq", "short_answer", "essay"] = "mcq"


class ChatResponse(BaseModel):
    session_id: int
    message: str


class ExamConfig(BaseModel):
    document_ids: list[int]
    num_questions: int = 5
    question_type: Literal["mcq", "short", "essay"] = "mcq"


class ChatSessionOut(BaseModel):
    id: int
    title: str | None
    document_ids: list[int]
    provider: str | None
    model: str | None
    created_at: str | None
