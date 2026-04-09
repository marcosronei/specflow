from fastapi import APIRouter
from models.spec import SpecGenerateRequest, SpecGenerateResponse
from services.claude_service import claude_service

router = APIRouter()

SPEC_SYSTEM_PROMPT = """You are an expert software architect helping to create detailed feature specifications.
Create a well-structured specification in Markdown format including:
- Overview
- User Stories
- Acceptance Criteria
- Technical Requirements
- Out of Scope"""


@router.post("/generate", response_model=SpecGenerateResponse)
async def generate_spec(request: SpecGenerateRequest):
    prompt = f"Create a detailed specification for: {request.prompt}"
    if request.context:
        prompt += f"\n\nContext: {request.context}"
    if request.feature_name:
        prompt += f"\n\nFeature name: {request.feature_name}"

    content, tokens = await claude_service.generate(SPEC_SYSTEM_PROMPT, prompt)
    return SpecGenerateResponse(content=content, tokens_used=tokens)
