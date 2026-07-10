"""
Multi-provider AI routing — a fixed, design-time task -> provider assignment,
not a dynamic meta-router. Each function fails with a clear error if its
provider's key isn't configured; callers decide whether that's fatal
(chat dispatch, research synthesis) or should degrade gracefully
(advisory insights on DeFi/Finance/Travel — see backend/main.py).
"""
import os

_anthropic_client = None
_openai_client = None
_gemini_client = None


def claude_chat(system: str, messages: list[dict], tools: list[dict] | None = None):
    """Claude drives the chat dispatcher (routing + conversation)."""
    global _anthropic_client
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise RuntimeError("ANTHROPIC_API_KEY not configured on the backend")
    if _anthropic_client is None:
        from anthropic import Anthropic
        _anthropic_client = Anthropic()

    kwargs = {}
    if tools:
        kwargs["tools"] = tools
    return _anthropic_client.messages.create(
        model="claude-sonnet-5",
        max_tokens=1024,
        system=system,
        messages=messages,
        **kwargs,
    )


def gpt_reason(prompt: str) -> str:
    """GPT reasons about DeFi trades — advisory text only, never executes anything."""
    global _openai_client
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY not configured on the backend")
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI()

    response = _openai_client.chat.completions.create(
        model="gpt-5.5",
        messages=[
            {"role": "system", "content": "You are a concise crypto trading risk assistant. Respond in 1-2 sentences, plain text, no markdown."},
            {"role": "user", "content": prompt},
        ],
    )
    return response.choices[0].message.content.strip()


def gemini_reason(prompt: str) -> str:
    """Gemini writes short rationale text for Finance/Travel suggestions — advisory only."""
    global _gemini_client
    if not os.getenv("GEMINI_API_KEY"):
        raise RuntimeError("GEMINI_API_KEY not configured on the backend")
    if _gemini_client is None:
        from google import genai
        _gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    response = _gemini_client.models.generate_content(
        model="gemini-3.5-flash",
        contents=f"In 1-2 short sentences, plain text, no markdown: {prompt}",
    )
    return response.text.strip()


def _openai_compatible_reason(prompt: str, system: str, env_key: str, base_url: str, model: str) -> str:
    """Grok, DeepSeek, and Kimi all expose OpenAI-compatible chat completions —
    same SDK, just a different base_url/key/model per provider. These are
    infrequent advisory calls, so a fresh lightweight client per call is fine —
    no persistent connection to manage."""
    key = os.getenv(env_key)
    if not key:
        raise RuntimeError(f"{env_key} not configured on the backend")
    from openai import OpenAI
    client = OpenAI(api_key=key, base_url=base_url)
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content.strip()


def grok_reason(prompt: str) -> str:
    """Grok explains the value of an API/compute payment before the user confirms it."""
    return _openai_compatible_reason(
        prompt,
        "You are a concise assistant explaining whether a compute/API payment looks reasonable. Respond in 1-2 sentences, plain text, no markdown.",
        "GROK_API_KEY", "https://api.x.ai/v1", "grok-4.3",
    )


def deepseek_reason(prompt: str) -> str:
    """DeepSeek recommends which data sources to consult for a research topic."""
    return _openai_compatible_reason(
        prompt,
        "You are a concise research assistant recommending which data sources best fit a topic. Respond in 1-2 sentences, plain text, no markdown.",
        "DEEPSEEK_API_KEY", "https://api.deepseek.com", "deepseek-v4-flash",
    )


def kimi_reason(prompt: str) -> str:
    """Kimi writes a short spending-pattern summary across an agent's transaction history."""
    return _openai_compatible_reason(
        prompt,
        "You are a concise financial analyst summarizing spending patterns across transactions. Respond in 2-3 sentences, plain text, no markdown.",
        "KIMI_API_KEY", "https://api.moonshot.ai/v1", "kimi-k2.6",
    )
