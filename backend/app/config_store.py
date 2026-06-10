from __future__ import annotations

import json
import os
from pathlib import Path

from .models import AppConfig


APP_DIR = Path(os.getenv("APPDATA", Path.home())) / "AIAutoRemix"
CONFIG_PATH = APP_DIR / "config.json"


def load_config() -> AppConfig:
    if not CONFIG_PATH.exists():
        return AppConfig()
    try:
        return AppConfig.model_validate_json(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return AppConfig()


def save_config(config: AppConfig) -> AppConfig:
    APP_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_PATH.write_text(
        json.dumps(config.model_dump(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return config
