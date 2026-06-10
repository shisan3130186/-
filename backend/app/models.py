from __future__ import annotations

from enum import Enum
from pathlib import Path
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


VIDEO_EXTENSIONS = {".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v"}


class ProviderConfig(BaseModel):
    platform: str = "openai-compatible"
    llm_api_key: str = ""
    llm_base_url: str = ""
    llm_model: str = ""
    tts_api_key: str = ""


class AppConfig(BaseModel):
    provider: ProviderConfig = Field(default_factory=ProviderConfig)
    output_dir: str = ""


class VideoAsset(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    path: str
    name: str
    duration: float = 0
    width: int = 0
    height: int = 0
    fps: float = 0
    has_audio: bool = False
    error: str | None = None


class ScanRequest(BaseModel):
    folder: str


class ScanResponse(BaseModel):
    folder: str
    assets: list[VideoAsset]
    rejected: list[str] = Field(default_factory=list)


class DirectoryEntry(BaseModel):
    name: str
    path: str
    parent: str | None = None


class DirectoryListResponse(BaseModel):
    path: str
    parent: str | None = None
    directories: list[DirectoryEntry] = Field(default_factory=list)


class SubtitleStyle(BaseModel):
    font: str = "Microsoft YaHei"
    size: int = 56
    weight: int = 700
    outline: int = 4
    opacity: int = 100
    color: str = "#ffffff"
    outline_color: str = "#000000"


class AudioSettings(BaseModel):
    original_volume: int = 100
    bgm_enabled: bool = False
    bgm_path: str = ""
    bgm_volume: int = 30
    tts_enabled: bool = False
    voice: str = "xiaoke-2"
    voice_volume: int = 50
    voice_speed: float = 1.0


class ExportSettings(BaseModel):
    output_dir: str = ""
    source_folder: str = ""
    resolution: str = "keep"
    fps: str = "source"
    format: str = "mp4"
    keep_original: bool = True
    naming: str = "prefix-index"
    threads: int = 1
    copies: int = 1
    subtitle_style: SubtitleStyle = Field(default_factory=SubtitleStyle)
    audio: AudioSettings = Field(default_factory=AudioSettings)


class ClipSegment(BaseModel):
    asset_path: str
    asset_name: str = ""
    start: float = 0
    end: float = 0
    caption: str = ""
    reason: str = ""


class PlanRequest(BaseModel):
    script: str
    assets: list[VideoAsset]
    target_seconds: int = 45
    segments: int = 12
    clip_min_seconds: float = 2.2
    clip_max_seconds: float = 5.5
    prompt_type: str = "general"


class PlanResponse(BaseModel):
    segments: list[ClipSegment]
    used_ai: bool = False
    message: str = ""


class TaskStatus(str, Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class ExportRequest(BaseModel):
    script: str
    segments: list[ClipSegment]
    settings: ExportSettings = Field(default_factory=ExportSettings)


class ExportTask(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    status: TaskStatus = TaskStatus.queued
    progress: float = 0
    output_path: str | None = None
    logs: list[str] = Field(default_factory=list)
    error: str | None = None
    request: ExportRequest


def is_video_path(path: Path) -> bool:
    return path.suffix.lower() in VIDEO_EXTENSIONS
