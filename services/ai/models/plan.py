from pydantic import BaseModel
from typing import Optional


class PlanGenerateRequest(BaseModel):
    spec: str
    context: Optional[str] = None
    feature_name: Optional[str] = None


class PlanGenerateResponse(BaseModel):
    content: str
    tokens_used: Optional[int] = None
