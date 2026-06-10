# Desktop Packaging Notes

The project includes a Tauri 2 scaffold in `src-tauri/`, but this machine currently needs the Rust toolchain before desktop builds can run.

## Development Flow

1. Start backend:

   ```powershell
   .\scripts\start-backend.ps1
   ```

2. Start frontend:

   ```powershell
   .\scripts\start-frontend.ps1
   ```

3. Open the Vite URL.

## Future Tauri Flow

After installing Rust and Tauri CLI dependencies:

```powershell
cd frontend
npm.cmd install
npm.cmd run build
cd ..
cargo tauri dev
```

The current scaffold embeds `backend/` as a bundle resource. The next packaging step is to add a Tauri sidecar command that starts the Python backend or a PyInstaller-built backend executable.
