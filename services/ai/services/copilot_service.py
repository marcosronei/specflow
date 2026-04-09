import httpx
from config import settings


class CopilotService:
    def __init__(self):
        self.api_key = settings.copilot_api_key
        # TODO: Verify the correct GitHub Copilot API endpoint before using in production
        self.base_url = "https://api.githubcopilot.com"

    async def generate(self, system_prompt: str, user_prompt: str) -> tuple[str, int]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                },
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            tokens = data.get("usage", {}).get("total_tokens", 0)
            return content, tokens


copilot_service = CopilotService()
