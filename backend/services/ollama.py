"""Backwards-compatibility shim — delegates to services.llm."""
from services.llm import stream_llm_response  # noqa: F401
