# AI Auto Remix Workstation

本项目是一个本地部署的 AI 混剪桌面软件 MVP：React 前端 + 本地 FastAPI 后端 + FFmpeg 渲染层 + Tauri 打包脚手架。

## Quick Start

Backend:

```powershell
python -m uvicorn backend.app.main:app --reload --port 8765
```

Frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open the Vite URL shown in the terminal. The frontend expects the backend at `http://127.0.0.1:8765`.

## What Works Now

- 本地配置保存 API Key。
- 扫描素材文件夹并读取视频元数据。
- 基于文案和素材生成混剪计划。
- 创建 FFmpeg 导出任务，显示进度、日志和结果。
- Tauri 2 配置已预留；安装 Rust 后可继续完善桌面打包。

## Requirements

- Node.js 20+
- Python 3.11+
- FFmpeg and ffprobe on PATH
- Rust toolchain only for Tauri desktop packaging

## Project Layout

- `backend/`: FastAPI local service.
- `frontend/`: React workstation UI.
- `src-tauri/`: Tauri 2 desktop scaffold.
- `docs/`: product and distillation notes.
