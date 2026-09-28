"""
Real data behind the Research Agent's paid demo sources (backend/x407.py's
DEMO_SOURCES) — replaces what used to be hardcoded fake payloads returned
regardless of topic.

market_data (CoinGecko) and analytics (DeFiLlama) hit public endpoints, no
API key needed. web_search (Brave) needs BRAVE_API_KEY — fails soft with a
clear "not configured" result if unset, same posture as ai_providers.py.

Every function catches its own failures and returns a fallback dict rather
than raising: by the time this runs, the on-chain payment has already been
verified — a downstream API hiccup must not make a real payment look like
it failed.
"""
import os
import httpx

BRAVE_API_KEY = os.getenv("BRAVE_API_KEY", "")


async def market_data(topic: str) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={"ids": "ethereum,bitcoin,usd-coin", "vs_currencies": "usd", "include_24hr_change": "true"},
                timeout=10,
            )
        res.raise_for_status()
        return {"source": "CoinGecko", "prices": res.json()}
    except Exception as e:
        return {"source": "CoinGecko", "error": f"market data temporarily unavailable ({e.__class__.__name__})"}


async def analytics(topic: str) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get("https://api.llama.fi/v2/historicalChainTvl/Base", timeout=10)
        res.raise_for_status()
        data = res.json()
        latest = data[-1] if data else {}
        return {"source": "DeFiLlama", "chain": "Base", "latestTvlUsd": latest.get("tvl"), "asOfUnix": latest.get("date")}
    except Exception as e:
        return {"source": "DeFiLlama", "error": f"analytics temporarily unavailable ({e.__class__.__name__})"}


async def web_search(topic: str) -> dict:
    if not BRAVE_API_KEY:
        return {"source": "Brave Search", "error": "BRAVE_API_KEY not configured on the backend", "query": topic}
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://api.search.brave.com/res/v1/web/search",
                params={"q": topic, "count": 3},
                headers={"X-Subscription-Token": BRAVE_API_KEY, "Accept": "application/json"},
                timeout=10,
            )
        res.raise_for_status()
        data = res.json()
        results = [
            {"title": r.get("title"), "url": r.get("url"), "description": r.get("description")}
            for r in data.get("web", {}).get("results", [])[:3]
        ]
        return {"source": "Brave Search", "query": topic, "results": results}
    except Exception as e:
        return {"source": "Brave Search", "error": f"web search temporarily unavailable ({e.__class__.__name__})", "query": topic}
