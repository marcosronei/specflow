from pydantic import BaseModel
from typing import Optional


class SpecGenerateRequest(BaseModel):
    prompt: str
    context: Optional[str] = None
    feature_name: Optional[str] = None


class SpecGenerateResponse(BaseModel):
    content: str
    tokens_used: Optional[int] = None
