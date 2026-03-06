from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    secret_key: str = "changeme"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080

    # Ollama (local)
    ollama_base_url: str = "http://localhost:11434"
    ollama_llm_model: str = "llama3"
    ollama_embed_model: str = "nomic-embed-text"

    # OpenAI
    openai_api_key: str = ""
    openai_default_model: str = "gpt-4o-mini"

    # Groq (free tier)
    groq_api_key: str = ""
    groq_default_model: str = "llama-3.3-70b-versatile"

    # Default provider: "ollama" | "openai" | "groq"
    default_provider: str = "ollama"

    chroma_persist_dir: str = "./chroma_db"
    database_url: str = "sqlite:///./kulmi.db"
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"


settings = Settings()
