import asyncio
import anthropic
from config import settings
from fastapi import HTTPException


class ClaudeService:
    def __init__(self):
        self.model = settings.ai_model

    def _get_client(self) -> anthropic.Anthropic:
        if not settings.anthropic_api_key:
            raise HTTPException(
                status_code=503,
                detail="AI service not configured: ANTHROPIC_API_KEY is missing"
            )
        return anthropic.Anthropic(api_key=settings.anthropic_api_key)

    async def generate(self, system_prompt: str, user_prompt: str) -> tuple[str, int]:
        client = self._get_client()
        message = await asyncio.to_thread(
            client.messages.create,
            model=self.model,
            max_tokens=settings.max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        content = message.content[0].text if message.content else ""
        tokens = message.usage.input_tokens + message.usage.output_tokens
        return content, tokens


claude_service = ClaudeService()
