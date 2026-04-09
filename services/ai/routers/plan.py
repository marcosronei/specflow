from fastapi import APIRouter
from models.plan import PlanGenerateRequest, PlanGenerateResponse
from services.claude_service import claude_service

router = APIRouter()

PLAN_SYSTEM_PROMPT = """You are an expert software architect creating technical implementation plans.
Create a detailed technical plan in Markdown format including:
- Architecture Overview
- Data Model
- API Specification
- Implementation Steps
- Dependencies"""


@router.post("/generate", response_model=PlanGenerateResponse)
async def generate_plan(request: PlanGenerateRequest):
    prompt = f"Create a technical plan for this spec:\n\n{request.spec}"
    if request.context:
        prompt += f"\n\nContext: {request.context}"

    content, tokens = await claude_service.generate(PLAN_SYSTEM_PROMPT, prompt)
    return PlanGenerateResponse(content=content, tokens_used=tokens)
