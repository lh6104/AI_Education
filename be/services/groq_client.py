"""Small shared wrapper around Groq chat completions."""

import os
from typing import Optional

from groq import Groq


DEFAULT_MODEL = "openai/gpt-oss-120b"


def generate_text(
    prompt: str,
    *,
    model_name: Optional[str] = None,
    system_prompt: Optional[str] = None,
    json_mode: bool = False,
) -> str:
    """Generate a complete response through the configured Groq model."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    request = {
        "model": model_name or os.getenv("GROQ_MODEL", DEFAULT_MODEL),
        "messages": messages,
    }
    if json_mode:
        request["response_format"] = {"type": "json_object"}

    completion = Groq(api_key=api_key).chat.completions.create(**request)
    content = completion.choices[0].message.content
    if not content:
        raise RuntimeError("Groq returned an empty response")
    return content
