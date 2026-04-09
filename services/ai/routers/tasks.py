from fastapi import APIRouter
from models.task import TasksGenerateRequest, TasksGenerateResponse, TaskItem
import json
from services.claude_service import claude_service

router = APIRouter()

TASKS_SYSTEM_PROMPT = """You are an expert developer breaking down technical plans into actionable tasks.
Return a JSON array of tasks with fields: title, description, priority (low/medium/high), agent (copilot/claude).
Return ONLY valid JSON, no markdown."""


@router.post("/generate", response_model=TasksGenerateResponse)
async def generate_tasks(request: TasksGenerateRequest):
    prompt = f"Break down this technical plan into tasks:\n\n{request.plan}"

    content, tokens = await claude_service.generate(TASKS_SYSTEM_PROMPT, prompt)

    try:
        tasks_data = json.loads(content)
        tasks = [TaskItem(**task) for task in tasks_data]
    except (json.JSONDecodeError, ValueError):
        tasks = [TaskItem(title="Implement feature", description=content, priority="medium")]

    return TasksGenerateResponse(tasks=tasks, tokens_used=tokens)
