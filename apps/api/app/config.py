from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    openai_api_key: SecretStr | None = None
    openai_embedding_model: str = "text-embedding-3-small"
    openai_chat_model: str = "gpt-6-luna"
    chroma_path: Path = REPOSITORY_ROOT / "chroma_data"

    model_config = SettingsConfigDict(
        env_file=REPOSITORY_ROOT / ".env",
        extra="ignore",
    )

    def model_post_init(self, __context: object) -> None:
        if not self.chroma_path.is_absolute():
            self.chroma_path = REPOSITORY_ROOT / self.chroma_path


@lru_cache
def get_settings() -> Settings:
    return Settings()
