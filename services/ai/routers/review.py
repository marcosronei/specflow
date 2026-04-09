from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.claude_service import claude_service

router = APIRouter()

REVIEW_SYSTEM_PROMPT = """You are an expert code reviewer. Review the provided diff and give:
- Summary of changes
- Potential issues or bugs
- Security concerns
- Suggestions for improvement
- Overall quality score (1-10)"""


class ReviewRequest(BaseModel):
    diff: str
    context: Optional[str] = None


class ReviewResponse(BaseModel):
    review: str
    tokens_used: Optional[int] = None


@router.post("/code", response_model=ReviewResponse)
async def review_code(request: ReviewRequest):
    prompt = f"Review this code diff:\n\n```diff\n{request.diff}\n```"
    if request.context:
        prompt += f"\n\nContext: {request.context}"

    content, tokens = await claude_service.generate(REVIEW_SYSTEM_PROMPT, prompt)
    return ReviewResponse(review=content, tokens_used=tokens)
