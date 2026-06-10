# Local AI Remix Workstation Product Spec

## Goal

Build a Windows-first local desktop app for AI-assisted batch video remixing. The MVP focuses on one complete workflow: import a folder of video素材, enter a script, generate a clip plan with AI, optionally add TTS/subtitles, and export an MP4 using FFmpeg.

## Reference Behavior

The reference app presents a dark desktop workstation with:

- Home tabs: Creation Center, Efficiency Tools, Automation.
- Feature cards for AI remixing, categorized remixing, effects batch processing, subtitles, poster design, copy rewriting, and content extraction.
- A user settings modal for profile and API keys.
- A remix workspace with left asset import, center preview/script/clip list, right render controls, and bottom export controls/progress.

The installer at `D:\学习文件\ECutAuto_1.2.8_x64-setup.exe` is treated only as a behavioral reference. No private implementation is copied or reverse engineered.

## MVP Scope

### Included

- Desktop-like React UI with the reference information architecture.
- Local FastAPI backend.
- API key storage in a local JSON config file.
- Video folder scanning via `ffprobe`.
- AI clip-plan endpoint with a deterministic fallback when no LLM API is configured.
- Export task queue with progress, logs, cancellation, retry-ready task state, and FFmpeg concat rendering.
- FFmpeg availability check.
- Tauri 2 scaffold for future Windows desktop packaging.

### Deferred

- Real ASR provider integration.
- Real TTS provider integration.
- Watermark removal.
- Full timeline editor.
- Account system, licensing, cloud backend, and automated publishing.

## Architecture

- `frontend/`: React + TypeScript + Vite UI.
- `backend/`: FastAPI local service.
- `src-tauri/`: Tauri packaging scaffold. Rust toolchain is required before building desktop bundles.
- `docs/`: open-source distillation notes and operational docs.

The app has a backend, but it is a local companion service rather than a public server.

## Acceptance Criteria

- The backend starts with `python -m uvicorn backend.app.main:app --reload --port 8765`.
- The frontend starts with `npm.cmd run dev` from `frontend/`.
- Health check reports FFmpeg/ffprobe availability.
- A folder scan returns video metadata for common formats.
- Creating a plan returns ordered segments.
- Creating an export task produces logs and either a completed MP4 or a clear FFmpeg error.
