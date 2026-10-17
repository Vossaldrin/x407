"""
Real work behind six of the agent templates' paid demo sources (backend/x407.py's
DEMO_SOURCES) — Log & Incident Triage, Dependency & Security Patch, Inbox & Document
Filer, Appointment & Calendar, Form-Filler & Data Entry, Receipt & Expense Logger.

check_dependency_vulns hits OSV.dev, a real public vulnerability database, no API key
needed. The other five use Claude (via ai_providers.claude_chat) to do real reasoning
over the caller's own input text — there's no third-party inbox/calendar/OCR API wired
up behind them (that would need real OAuth/paid integrations, out of scope here), so
the "tool" being paid for is the reasoning itself, same honesty line as everything else
in this file: real payment, real model call, no fabricated integration pretending to be
something it isn't.

Every function catches its own failures and returns a fallback dict rather than
raising: by the time this runs, the on-chain payment has already been verified — a
downstream hiccup must not make a real payment look like it failed.
"""
import httpx
import ai_providers


async def check_dependency_vulns(input: str) -> dict:
    package, _, ecosystem = input.partition(":")
    package = package.strip()
    ecosystem = (ecosystem.strip() or "npm")
    if not package:
        return {"source": "OSV.dev", "error": "no package name given"}
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://api.osv.dev/v1/query",
                json={"package": {"name": package, "ecosystem": ecosystem}},
                timeout=10,
            )
        res.raise_for_status()
        vulns = res.json().get("vulns", [])
        return {
            "source": "OSV.dev", "package": package, "ecosystem": ecosystem,
            "vulnerabilityCount": len(vulns),
            "vulnerabilities": [
                {"id": v.get("id"), "summary": v.get("summary"), "severity": (v.get("database_specific") or {}).get("severity")}
                for v in vulns[:5]
            ],
        }
    except Exception as e:
        return {"source": "OSV.dev", "package": package, "error": f"vulnerability lookup temporarily unavailable ({e.__class__.__name__})"}


async def _claude_task(system: str, user_input: str, label: str) -> dict:
    try:
        response = ai_providers.claude_chat(system, [{"role": "user", "content": user_input}])
        text = "".join(b.text for b in response.content if b.type == "text")
        return {"source": "Claude", "output": text}
    except Exception as e:
        return {"source": "Claude", "error": f"{label} temporarily unavailable ({e.__class__.__name__})"}


async def triage_incident(input: str) -> dict:
    return await _claude_task(
        "You are an SRE triaging a production incident. Given a log snippet or alert "
        "payload, respond with: a severity (low/medium/high/critical), a one-sentence "
        "root-cause guess, and a recommended next action. Be concise.",
        input, "incident triage",
    )


async def classify_document(input: str) -> dict:
    return await _claude_task(
        "You are filing an inbound email or document. Given its text, extract: sender "
        "or source, a short category label, any due date mentioned, and a one-sentence "
        "summary. Be concise and factual — do not invent details not present in the text.",
        input, "document filing",
    )


async def plan_appointment(input: str) -> dict:
    return await _claude_task(
        "You are scheduling an appointment from a plain-language description. Extract: "
        "the proposed date/time, attendee(s), and purpose. If a detail is missing, say "
        "so rather than inventing it.",
        input, "appointment scheduling",
    )


async def fill_form(input: str) -> dict:
    return await _claude_task(
        "You are filling out a form. The input contains the target field names and the "
        "source data to pull values from — figure out both parts from the text. Return "
        "the filled field values. If a field's value isn't present in the source data, "
        "say so rather than inventing it.",
        input, "form filling",
    )


async def parse_receipt(input: str) -> dict:
    return await _claude_task(
        "You are logging a receipt or expense line item from plain text. Extract: "
        "merchant, amount, and the best-fit expense category. Do not invent amounts "
        "not present in the text.",
        input, "receipt parsing",
    )
