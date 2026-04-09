from fastapi import APIRouter, HTTPException
from models.spec import SpecGenerateRequest, SpecGenerateResponse
from services.claude_service import claude_service
from config import settings

router = APIRouter()

SPEC_SYSTEM_PROMPT = """You are an expert software architect helping to create detailed feature specifications.
Generate a complete specification in Markdown format with ALL of the following sections:

## Objetivo
What will be built and why (2-3 sentences)

## User Stories
Use the format: "Como [usuário], quero [ação], para [benefício]"
List at least 3 user stories.

## Requisitos Funcionais
Numbered list of functional requirements (at least 5)

## Requisitos Não Funcionais
List of non-functional requirements: performance, security, usability

## Critérios de Aceite
Checklist format (- [ ] item) of acceptance criteria (at least 5)

## Fora de Escopo
What will NOT be done in this feature (at least 3 items)

Write in the same language as the input. Be specific and actionable."""


@router.post("/generate", response_model=SpecGenerateResponse)
async def generate_spec(request: SpecGenerateRequest):
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="AI service not configured: ANTHROPIC_API_KEY is missing"
        )

    prompt = f"Create a detailed specification for: {request.prompt}"
    if request.context:
        prompt += f"\n\nProject Constitution (follow these principles):\n{request.context}"
    if request.feature_name:
        prompt += f"\n\nFeature name: {request.feature_name}"

    content, tokens = await claude_service.generate(SPEC_SYSTEM_PROMPT, prompt)
    return SpecGenerateResponse(content=content, tokens_used=tokens)
