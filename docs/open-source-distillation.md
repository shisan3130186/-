# Open Source Distillation Notes

## Directly Compatible Candidates

- FunClip: MIT. Useful reference for ASR subtitle timestamps and LLM-driven clipping workflow.
- MoneyPrinterTurbo: MIT. Useful reference for one-click video generation pipeline and task orchestration.
- auto-editor: Unlicense/Public Domain. Useful reference for silence detection and automatic edit decisions.

## Reference-Only Candidates

- pyVideoTrans: GPL-3.0. Good reference for subtitle, translation, dubbing, and provider abstraction, but do not copy code into a closed-source product.
- LosslessCut: GPL-2.0. Good reference for FFmpeg-based desktop UX and lossless clipping, but do not copy code into a closed-source product.

## MVP Borrowed Ideas

- Keep AI decisions separate from FFmpeg rendering.
- Treat clip plans as JSON data that can be edited before export.
- Provide deterministic fallback behavior when AI provider credentials are not set.
- Use FFmpeg and ffprobe as the source of truth for media metadata and rendering.
