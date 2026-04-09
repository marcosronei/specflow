from fastapi import APIRouter, HTTPException
from models.task import TasksGenerateRequest, TasksGenerateResponse, TaskItem
import json
from services.claude_service import claude_service
from config import settings

router = APIRouter()

TASKS_SYSTEM_PROMPT = """You are an expert developer breaking down technical plans into actionable tasks.
Return ONLY a valid JSON array of tasks (no markdown, no explanations).

Each task must have these fields:
- title: string (short, actionable, imperative)
- description: string (detailed what and how)
- priority: "high" | "medium" | "low"
- isParallel: boolean (true if this can run in parallel with other tasks)
- order: number (sequence order, starting from 1)

Example format:
[
  {
    "title": "Setup database schema",
    "description": "Create Prisma models for User and Session with migrations",
    "priority": "high",
    "isParallel": false,
    "order": 1
  }
]

Return 5-15 tasks that cover the full implementation."""


@router.post("/generate", response_model=TasksGenerateResponse)
async def generate_tasks(request: TasksGenerateRequest):
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="AI service not configured: ANTHROPIC_API_KEY is missing"
        )

    prompt = f"Break down this technical plan into implementation tasks:\n\n{request.plan}"
    if request.feature_name:
        prompt += f"\n\nFeature name: {request.feature_name}"

    content, tokens = await claude_service.generate(TASKS_SYSTEM_PROMPT, prompt)

    try:
        # Try to extract JSON if wrapped in markdown
        if "```" in content:
            start = content.find("[")
            end = content.rfind("]") + 1
            if start != -1 and end > start:
                content = content[start:end]
        tasks_data = json.loads(content)
        tasks = [TaskItem(**task) for task in tasks_data]
    except (json.JSONDecodeError, ValueError):
        tasks = [TaskItem(title="Implement feature", description=content, priority="medium")]

    return TasksGenerateResponse(tasks=tasks, tokens_used=tokens)
