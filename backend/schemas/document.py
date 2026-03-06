from __future__ import annotations

import datetime

from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: int
    filename: str
    original_name: str
    page_count: int
    created_at: datetime.datetime

    model_config = {"from_attributes": True}
