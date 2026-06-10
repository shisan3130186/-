from __future__ import annotations

import json
import urllib.error
import urllib.request

from .models import ClipSegment, PlanRequest, ProviderConfig


def generate_ai_plan(request: PlanRequest, provider: ProviderConfig) -> tuple[list[ClipSegment], str] | None:
    if not provider.llm_api_key or not provider.llm_base_url:
        return None

    url = provider.llm_base_url.rstrip("/")
    if not url.endswith("/chat/completions"):
        url = f"{url}/chat/completions"

    payload = {
        "model": provider.llm_model or "gpt-4o-mini",
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a video editor. Return only valid JSON with a 'segments' array. "
                    "Each segment must include asset_path, asset_name, start, end, caption, reason. "
                    "Use only provided assets and keep start/end within duration."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "script": request.script,
                        "target_seconds": request.target_seconds,
                        "desired_segments": request.segments,
                        "assets": [
                            {
                                "path": asset.path,
                                "name": asset.name,
                                "duration": asset.duration,
                                "width": asset.width,
                                "height": asset.height,
                                "has_audio": asset.has_audio,
                            }
                            for asset in request.assets
                            if asset.duration > 0 and not asset.error
                        ],
                    },
                    ensure_ascii=False,
                ),
            },
        ],
    }

    data = json.dumps(payload).encode("utf-8")
    http_request = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {provider.llm_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(http_request, timeout=45) as response:
            raw = response.read().decode("utf-8")
    except (urllib.error.URLError, TimeoutError) as exc:
        raise RuntimeError(f"LLM request failed: {exc}") from exc

    parsed = json.loads(raw)
    content = parsed["choices"][0]["message"]["content"]
    result = _parse_json_content(content)
    segments = [ClipSegment.model_validate(item) for item in result.get("segments", [])]
    return segments, "Generated clip plan with configured LLM provider."


def _parse_json_content(content: str) -> dict:
    stripped = content.strip()
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        if stripped.startswith("json"):
            stripped = stripped[4:]
    return json.loads(stripped.strip())
