# AI Auto Remix Workstation

> 免费分享开源。  
> 这是一个本地部署的 AI 自动混剪软件 MVP 项目。

## 项目简介

本项目用于蒸馏并开发 AI 自动混剪软件，目标是把视频素材管理、AI 混剪规划、FFmpeg 渲染、前端工作台和桌面端打包流程逐步整理成一套可长期迭代的本地工具。

当前项目结构包含：

- React 前端工作台
- FastAPI 本地后端
- FFmpeg 渲染流程
- Tauri 桌面端打包脚手架
- 项目蒸馏文档和开发记录

## 快速启动

启动后端：

```powershell
python -m uvicorn backend.app.main:app --reload --port 8765
```

启动前端：

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

启动后，打开终端里显示的 Vite 地址。前端默认连接后端：

```text
http://127.0.0.1:8765
```

## 当前已具备能力

- 本地保存 API Key 配置
- 扫描素材文件夹并读取视频元数据
- 根据文案和素材生成混剪计划
- 创建 FFmpeg 导出任务
- 显示导出进度、日志和结果
- 预留 Tauri 2 桌面端打包配置

## 环境要求

- Node.js 20+
- Python 3.11+
- FFmpeg 和 ffprobe 已加入 PATH
- Rust 工具链，仅在需要 Tauri 桌面端打包时使用

## 项目目录

```text
backend/      FastAPI 本地后端
frontend/     React 前端工作台
src-tauri/    Tauri 2 桌面端脚手架
docs/         产品蒸馏和项目文档
logs/         日志
scripts/      启动和检查脚本
```

## 项目管理

本项目已纳入 Workspace 规范管理：

- 项目编号：Project_01
- 项目名称：蒸馏AI自动混剪软件
- 项目路径：`E:\Workspace\Project_01_蒸馏AI自动混剪软件`

