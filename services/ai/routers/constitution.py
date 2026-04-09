from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.claude_service import claude_service
from config import settings

router = APIRouter()


class ConstitutionGenerateRequest(BaseModel):
    project_name: str
    description: str
    stack: str | None = None


class ConstitutionGenerateResponse(BaseModel):
    content: str
    tokens_used: int


CONSTITUTION_SYSTEM_PROMPT = """You are a software architect creating a project constitution document.
Generate a comprehensive constitution in Markdown that guides AI agents working on this project.

Include these sections:
## Princípios de Código
## Stack Técnica
## Padrões de Testes
## Convenções de Nomenclatura
## O que NUNCA fazer

Be specific and practical. Write in the same language as the input."""


@router.post("/generate", response_model=ConstitutionGenerateResponse)
async def generate_constitution(request: ConstitutionGenerateRequest):
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    prompt = f"Project: {request.project_name}\nDescription: {request.description}"
    if request.stack:
        prompt += f"\nTech Stack: {request.stack}"

    content, tokens = await claude_service.generate(CONSTITUTION_SYSTEM_PROMPT, prompt)
    return ConstitutionGenerateResponse(content=content, tokens_used=tokens)
