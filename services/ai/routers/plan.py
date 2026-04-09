from fastapi import APIRouter, HTTPException
from models.plan import PlanGenerateRequest, PlanGenerateResponse
from services.claude_service import claude_service
from config import settings

router = APIRouter()

PLAN_SYSTEM_PROMPT = """You are an expert software architect creating technical implementation plans.
Generate a complete technical plan in Markdown format with ALL of the following sections:

## Stack Técnica
Languages, frameworks, and libraries to be used

## Arquitetura
ASCII diagram or description of system components and their interactions

## Implementação
Detailed numbered steps for implementation

## Modelo de Dados
Database tables/schemas if applicable (use code blocks)

## Contratos de API
API endpoints if applicable (method, path, request/response)

## Dependências
Packages/libraries to install with versions

## Riscos e Mitigações
Table of potential problems and how to avoid them

Write in the same language as the input. Be specific and technical."""


@router.post("/generate", response_model=PlanGenerateResponse)
async def generate_plan(request: PlanGenerateRequest):
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="AI service not configured: ANTHROPIC_API_KEY is missing"
        )

    prompt = f"Create a technical implementation plan for this spec:\n\n{request.spec}"
    if request.context:
        prompt += f"\n\nProject Constitution (follow these principles):\n{request.context}"
    if request.feature_name:
        prompt += f"\n\nFeature name: {request.feature_name}"

    content, tokens = await claude_service.generate(PLAN_SYSTEM_PROMPT, prompt)
    return PlanGenerateResponse(content=content, tokens_used=tokens)
