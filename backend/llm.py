"""
Research report synthesis via the Anthropic API.
Fails loudly if ANTHROPIC_API_KEY isn't set — never fabricates a report.
"""
import os
from anthropic import Anthropic

_client: Anthropic | None = None


def _get_client() -> Anthropic:
    global _client
    if _client is None:
        _client = Anthropic()  # reads ANTHROPIC_API_KEY from env
    return _client


def synthesize_report(topic: str, snippets: list[str]) -> str:
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise RuntimeError("ANTHROPIC_API_KEY not configured on the backend")

    numbered = "\n\n".join(f"[Source {i + 1}] {s}" for i, s in enumerate(snippets))
    response = _get_client().messages.create(
        model="claude-sonnet-5",
        max_tokens=1024,
        system=(
            "You are a research analyst. Synthesize the provided paid data sources "
            "into a concise, well-organized report on the user's topic. Cite sources "
            "by their [Source N] number. Do not invent information beyond what the "
            "sources contain."
        ),
        messages=[{"role": "user", "content": f"Topic: {topic}\n\nSources:\n{numbered}"}],
    )
    return "".join(block.text for block in response.content if block.type == "text")
