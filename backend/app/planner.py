from __future__ import annotations

import re
from dataclasses import dataclass

from .ai_provider import generate_ai_plan
from .models import ClipSegment, PlanRequest, PlanResponse, ProviderConfig, VideoAsset


@dataclass
class UsedWindow:
    start: float
    end: float


def build_clip_plan(request: PlanRequest, provider: ProviderConfig | None = None) -> PlanResponse:
    valid_assets = [
        asset
        for asset in request.assets
        if asset.duration > 0 and not asset.error and not asset.name.lower().startswith("ai-remix-")
    ]
    if not valid_assets:
        return PlanResponse(segments=[], used_ai=False, message="No usable video assets.")

    if provider:
        ai_result = generate_ai_plan(request, provider)
        if ai_result:
            segments, message = ai_result
            return PlanResponse(segments=segments, used_ai=True, message=message)

    sentence_chunks = _split_script(request.script)
    target_segments = _target_segment_count(request, sentence_chunks, valid_assets)
    caption_plan = _expand_captions(sentence_chunks, target_segments)
    used_by_asset: dict[str, list[UsedWindow]] = {asset.path: [] for asset in valid_assets}

    segments: list[ClipSegment] = []
    for index in range(target_segments):
        asset = _pick_asset(valid_assets, index)
        caption = caption_plan[index]
        clip_length = _clip_length(request, caption, index)
        start, end = _window_for_asset(asset, index, clip_length, used_by_asset[asset.path])
        used_by_asset[asset.path].append(UsedWindow(start, end))
        segments.append(
            ClipSegment(
                asset_path=asset.path,
                asset_name=asset.name,
                start=start,
                end=end,
                caption=caption,
                reason="Rhythm remix fallback: short sampled shot mapped to script beat.",
            )
        )

    return PlanResponse(
        segments=segments,
        used_ai=False,
        message="Generated rhythm-based remix plan. Configure LLM API for semantic matching.",
    )


def _split_script(script: str) -> list[str]:
    cleaned = script.strip()
    if not cleaned:
        return []
    chunks = [
        part.strip()
        for part in re.split(r"[\u3002\uff01\uff1f!?;；\n]+", cleaned)
        if part.strip()
    ]
    return chunks or [cleaned]


def _target_segment_count(
    request: PlanRequest, sentence_chunks: list[str], valid_assets: list[VideoAsset]
) -> int:
    text_beats = max(1, len(sentence_chunks))
    by_text = text_beats * 2
    by_assets = len(valid_assets) * 4
    requested = max(request.segments, by_text, min(by_assets, 12))
    return max(3, min(requested, 30))


def _expand_captions(sentence_chunks: list[str], target_segments: int) -> list[str]:
    if not sentence_chunks:
        return [f"Shot {index + 1}" for index in range(target_segments)]

    captions: list[str] = []
    for index in range(target_segments):
        sentence = sentence_chunks[index % len(sentence_chunks)]
        captions.append(sentence if index < len(sentence_chunks) else _shorten_caption(sentence, index))
    return captions


def _shorten_caption(sentence: str, index: int) -> str:
    limit = 22 + (index % 3) * 6
    if len(sentence) <= limit:
        return sentence
    return sentence[:limit].rstrip("，,、 ") + "..."


def _pick_asset(valid_assets: list[VideoAsset], index: int) -> VideoAsset:
    ordered = sorted(valid_assets, key=lambda item: (-item.duration, item.name.lower()))
    step = 2 if len(ordered) > 2 else 1
    return ordered[(index * step + index // max(1, len(ordered))) % len(ordered)]


def _clip_length(request: PlanRequest, caption: str, index: int) -> float:
    base = 2.4 + min(len(caption), 36) / 18
    pulse = [0.0, 0.45, -0.25, 0.7, -0.1][index % 5]
    return max(request.clip_min_seconds, min(request.clip_max_seconds, base + pulse))


def _window_for_asset(
    asset: VideoAsset, index: int, desired: float, used_windows: list[UsedWindow]
) -> tuple[float, float]:
    duration = max(0, asset.duration)
    length = min(max(1.5, desired), max(1.5, duration))
    if duration <= length:
        return 0, round(duration, 3)

    available = max(0.1, duration - length)
    candidates: list[tuple[float, float, float]] = []
    for attempt in range(9):
        ratio = ((index + 1) * 0.61803398875 + attempt * 0.137) % 1
        start = min(available, ratio * available)
        end = min(duration, start + length)
        overlap = sum(_overlap(start, end, item.start, item.end) for item in used_windows)
        candidates.append((overlap, start, end))

    _, start, end = min(candidates, key=lambda item: (item[0], item[1]))
    return round(start, 3), round(end, 3)


def _overlap(left_start: float, left_end: float, right_start: float, right_end: float) -> float:
    start = max(left_start, right_start)
    end = min(left_end, right_end)
    return max(0, end - start)
