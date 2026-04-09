from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    copilot_api_key: str = ""
    ai_model: str = "claude-3-5-sonnet-20241022"
    max_tokens: int = 8192

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
