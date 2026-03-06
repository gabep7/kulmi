from __future__ import annotations

import datetime

from pydantic import BaseModel


class FolderCreate(BaseModel):
    name: str


class FolderOut(BaseModel):
    id: int
    name: str
    created_at: datetime.datetime

    model_config = {"from_attributes": True}
