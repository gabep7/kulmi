from __future__ import annotations
import json
from typing import AsyncGenerator
import httpx
from config import settings


PROVIDERS = {
    "ollama": {
        "name": "Ollama (Local)",
        "models": ["llama3", "llama3.1", "llama3.2", "mistral", "gemma2", "phi3", "deepseek-r1"],
        "requires_key": False,
    },
    "groq": {
        "name": "Groq (Free)",
        "models": [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "llama3-8b-8192",
            "llama3-70b-8192",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
        ],
        "requires_key": True,
    },
    "openai": {
        "name": "OpenAI",
        "models": ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
        "requires_key": True,
    },
}


async def stream_llm_response(
    prompt: str,
    system: str = "",
    provider: str | None = None,
    model: str | None = None,
) -> AsyncGenerator[str, None]:
    """Stream tokens from the configured LLM provider."""
    provider = provider or settings.default_provider

    if provider == "ollama":
        async for token in _stream_ollama(prompt, system, model or settings.ollama_llm_model):
            yield token
    elif provider in ("openai", "groq"):
        async for token in _stream_openai_compatible(prompt, system, provider, model):
            yield token
    else:
        raise ValueError(f"Unknown provider: {provider}")


async def _stream_ollama(prompt: str, system: str, model: str) -> AsyncGenerator[str, None]:
    url = f"{settings.ollama_base_url}/api/generate"
    payload = {"model": model, "prompt": prompt, "system": system, "stream": True}
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", url, json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    continue
                token = data.get("response", "")
                if token:
                    yield token
                if data.get("done", False):
                    break


async def _stream_openai_compatible(
    prompt: str, system: str, provider: str, model: str | None
) -> AsyncGenerator[str, None]:
    from openai import AsyncOpenAI

    if provider == "openai":
        api_key = settings.openai_api_key
        base_url = None
        default_model = settings.openai_default_model
    else:  # groq
        api_key = settings.groq_api_key
        base_url = "https://api.groq.com/openai/v1"
        default_model = settings.groq_default_model

    if not api_key:
        raise ValueError(f"{provider.upper()}_API_KEY is not set in .env")

    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    stream = await client.chat.completions.create(
        model=model or default_model,
        messages=messages,
        stream=True,
        max_tokens=4096,
    )
    async for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:
            yield token


def get_providers_info() -> dict:
    """Return provider info, marking which ones are configured."""
    result = {}
    for key, info in PROVIDERS.items():
        configured = True
        if key == "openai" and not settings.openai_api_key:
            configured = False
        elif key == "groq" and not settings.groq_api_key:
            configured = False
        result[key] = {**info, "configured": configured}
    return result
