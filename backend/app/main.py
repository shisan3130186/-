from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .config_store import load_config, save_config
from .filesystem import list_directories, list_roots
from .media import check_binary, scan_folder
from .models import AppConfig, ExportRequest, PlanRequest, ScanRequest
from .planner import build_clip_plan
from .tasks import cancel_task, create_task, get_task, list_tasks


app = FastAPI(title="AI Auto Remix Local API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "ffmpeg": check_binary("ffmpeg"),
        "ffprobe": check_binary("ffprobe"),
    }


@app.get("/config", response_model=AppConfig)
def get_config() -> AppConfig:
    return load_config()


@app.post("/config", response_model=AppConfig)
def update_config(config: AppConfig) -> AppConfig:
    return save_config(config)


@app.post("/scan")
def scan(request: ScanRequest):
    return scan_folder(request.folder)


@app.get("/filesystem/roots")
def filesystem_roots():
    return list_roots()


@app.get("/filesystem/list")
def filesystem_list(path: str):
    return list_directories(path)


@app.get("/media/preview")
def media_preview(path: str):
    file_path = Path(path)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Media file not found")
    return FileResponse(file_path)


@app.post("/plan")
def plan(request: PlanRequest):
    config = load_config()
    return build_clip_plan(request, config.provider)


@app.post("/export")
async def export(request: ExportRequest):
    return create_task(request)


@app.get("/tasks")
def tasks():
    return list_tasks()


@app.get("/tasks/{task_id}")
def task(task_id: str):
    existing = get_task(task_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    return existing


@app.post("/tasks/{task_id}/cancel")
def cancel(task_id: str):
    existing = cancel_task(task_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    return existing
