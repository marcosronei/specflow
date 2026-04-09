import anthropic
from config import settings


class ClaudeService:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model = settings.ai_model

    async def generate(self, system_prompt: str, user_prompt: str) -> tuple[str, int]:
        message = self.client.messages.create(
            model=self.model,
            max_tokens=settings.max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        content = message.content[0].text if message.content else ""
        tokens = message.usage.input_tokens + message.usage.output_tokens
        return content, tokens


claude_service = ClaudeService()
