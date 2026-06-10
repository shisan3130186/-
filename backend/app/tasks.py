from __future__ import annotations

import asyncio
import shutil
import subprocess
import tempfile
from pathlib import Path

from .models import ExportRequest, ExportTask, TaskStatus


TASKS: dict[str, ExportTask] = {}
RUNNERS: dict[str, asyncio.Task[None]] = {}


def create_task(request: ExportRequest) -> ExportTask:
    task = ExportTask(request=request)
    TASKS[task.id] = task
    RUNNERS[task.id] = asyncio.create_task(_run_export(task))
    return task


def get_task(task_id: str) -> ExportTask | None:
    return TASKS.get(task_id)


def list_tasks() -> list[ExportTask]:
    return sorted(TASKS.values(), key=lambda item: item.id)


def cancel_task(task_id: str) -> ExportTask | None:
    task = TASKS.get(task_id)
    if not task:
        return None
    runner = RUNNERS.get(task_id)
    if runner and not runner.done():
        runner.cancel()
    task.status = TaskStatus.cancelled
    task.logs.append("Task cancelled.")
    return task


async def _run_export(task: ExportTask) -> None:
    task.status = TaskStatus.running
    task.progress = 5
    task.logs.append("Export task started.")
    try:
        output_dir = _resolve_output_dir(task.request)
        output_dir.mkdir(parents=True, exist_ok=True)
        task.progress = 15

        if not task.request.segments:
            raise RuntimeError("No clip segments to export.")
        if shutil.which("ffmpeg") is None:
            raise RuntimeError("ffmpeg was not found on PATH.")

        output_path = output_dir / f"ai-remix-{task.id[:8]}.mp4"
        await _render_concat(task, output_path)
        task.output_path = str(output_path)
        task.status = TaskStatus.completed
        task.progress = 100
        task.logs.append(f"Export completed: {output_path}")
    except asyncio.CancelledError:
        task.status = TaskStatus.cancelled
        task.logs.append("Export task cancelled by user.")
    except Exception as exc:
        task.status = TaskStatus.failed
        task.error = str(exc)
        task.logs.append(f"Export failed: {exc}")


def _resolve_output_dir(request: ExportRequest) -> Path:
    if request.settings.output_dir:
        return Path(request.settings.output_dir).expanduser()
    if request.settings.source_folder:
        return Path(request.settings.source_folder).expanduser()
    return Path.home() / "Videos" / "AIAutoRemix"


async def _render_concat(task: ExportTask, output_path: Path) -> None:
    with tempfile.TemporaryDirectory(prefix="ai-remix-") as tmp:
        tmp_dir = Path(tmp)
        clip_paths: list[Path] = []
        total = len(task.request.segments)

        for index, segment in enumerate(task.request.segments):
            if task.status == TaskStatus.cancelled:
                return
            source = Path(segment.asset_path)
            if not source.exists():
                raise RuntimeError(f"Missing source video: {source}")
            clip_path = tmp_dir / f"clip-{index:04d}.mp4"
            duration = max(0.2, segment.end - segment.start)
            args = [
                "ffmpeg",
                "-y",
                "-ss",
                str(max(0, segment.start)),
                "-t",
                str(duration),
                "-i",
                str(source),
                "-vf",
                "scale=1280:-2,format=yuv420p",
                "-af",
                f"volume={task.request.settings.audio.original_volume / 100}",
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-c:a",
                "aac",
                "-movflags",
                "+faststart",
                str(clip_path),
            ]
            await _run_ffmpeg(args, task, f"Render clip {index + 1}/{total}")
            clip_paths.append(clip_path)
            task.progress = 15 + (index + 1) / total * 65

        concat_file = tmp_dir / "concat.txt"
        concat_file.write_text(
            "\n".join(f"file '{path.as_posix()}'" for path in clip_paths),
            encoding="utf-8",
        )
        args = [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_file),
            "-c",
            "copy",
            str(output_path),
        ]
        task.progress = 88
        await _run_ffmpeg(args, task, "Concat clips")
        task.progress = 96


async def _run_ffmpeg(args: list[str], task: ExportTask, label: str) -> None:
    task.logs.append(label)
    process = await asyncio.create_subprocess_exec(
        *args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    _, stderr = await process.communicate()
    if process.returncode != 0:
        details = stderr.decode("utf-8", errors="replace")[-2000:]
        raise RuntimeError(f"{label} failed: {details}")
