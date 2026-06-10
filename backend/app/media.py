from __future__ import annotations

import json
import subprocess
from pathlib import Path

from .models import ScanResponse, VideoAsset, is_video_path


def run_command(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")


def check_binary(name: str) -> bool:
    result = run_command([name, "-version"])
    return result.returncode == 0


def probe_video(path: Path) -> VideoAsset:
    asset = VideoAsset(path=str(path), name=path.name)
    args = [
        "ffprobe",
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        str(path),
    ]
    result = run_command(args)
    if result.returncode != 0:
        asset.error = result.stderr.strip() or "ffprobe failed"
        return asset

    try:
        data = json.loads(result.stdout)
        streams = data.get("streams", [])
        video = next((s for s in streams if s.get("codec_type") == "video"), {})
        audio = next((s for s in streams if s.get("codec_type") == "audio"), None)
        fmt = data.get("format", {})
        duration = float(video.get("duration") or fmt.get("duration") or 0)
        fps = _parse_rate(video.get("avg_frame_rate") or video.get("r_frame_rate") or "0/1")
        asset.duration = round(duration, 3)
        asset.width = int(video.get("width") or 0)
        asset.height = int(video.get("height") or 0)
        asset.fps = round(fps, 3)
        asset.has_audio = audio is not None
    except Exception as exc:
        asset.error = f"Could not parse ffprobe output: {exc}"
    return asset


def scan_folder(folder: str) -> ScanResponse:
    root = Path(folder).expanduser()
    assets: list[VideoAsset] = []
    rejected: list[str] = []
    if not root.exists() or not root.is_dir():
        return ScanResponse(folder=folder, assets=[], rejected=[f"Folder not found: {folder}"])

    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if is_video_path(path):
            if path.name.lower().startswith("ai-remix-"):
                rejected.append(str(path))
                continue
            assets.append(probe_video(path))
        else:
            rejected.append(str(path))
    return ScanResponse(folder=str(root), assets=assets, rejected=rejected)


def _parse_rate(rate: str) -> float:
    try:
        top, bottom = rate.split("/")
        denom = float(bottom)
        if denom == 0:
            return 0
        return float(top) / denom
    except Exception:
        return 0
