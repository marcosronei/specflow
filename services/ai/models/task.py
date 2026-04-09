from pydantic import BaseModel
from typing import Optional, List


class TaskItem(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    agent: str = "copilot"


class TasksGenerateRequest(BaseModel):
    plan: str
    feature_name: Optional[str] = None


class TasksGenerateResponse(BaseModel):
    tasks: List[TaskItem]
    tokens_used: Optional[int] = None
