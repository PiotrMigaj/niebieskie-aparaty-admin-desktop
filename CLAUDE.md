# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start full dev environment (main process watch + Vite + Electron)
npm run build        # Compile main (tsc) + renderer (Vite) to dist/
npm run dist:mac     # Package macOS DMG (arm64)
npm run start        # Build then run Electron

# Individual processes
npm run dev:main     # TypeScript watch for main process only
npm run dev:renderer # Vite dev server on port 5173 only
npm run electron     # Run Electron app directly
```

No test runner is configured in this project.

## Architecture

Electron app with three processes communicating via IPC:

- **Main process** (`src/main/`) — Node.js, owns all AWS calls, filesystem ops, and window management
- **Renderer process** (`src/renderer/`) — Vue 3 + TypeScript SPA, handles all UI
- **Preload** (`src/preload/`) — Security bridge using `contextBridge` to expose a typed API surface

### IPC Pattern

Renderer calls `window.electronAPI.someMethod()` → preload forwards via `ipcRenderer.invoke('channel')` → main process `ipcMain.handle('channel', handler)` → service layer.

IPC channels are registered in `src/main/ipc/` (one file per domain: `upload`, `events`, `selection`, `dialog`, `auth`). Each file exports a registration function called during app init in `src/main/index.ts`.

### Upload Flow

`UploadView` → `upload:file` IPC → `upload.handler.ts` → `image-compressor.ts` (Sharp, WebP, max 2500px/85%) + `s3-upload.service.ts` (uploads original + compressed, returns presigned URLs) → `dynamo-gallery.service.ts` (saves metadata). In-session state tracked in `upload-store.ts`.

### AWS Integration

All AWS clients initialized in `src/main/services/aws-config.ts`. DynamoDB tables: **Events**, **Selection**, **Gallery**. S3 key format: `{eventId}/{username}/{fileName}`.

### Environment Configuration

Copy `.env.example` to `.env` in project root for development. In production the app reads `.env` from Electron's `userData` directory. Required vars: `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`, `PIOTR_PASSWORD`, `ANNA_PASSWORD`. Config validation runs on startup in `src/main/config.ts`.

### TypeScript Setup

Two separate `tsconfig.json` contexts:
- Main process: CommonJS modules, Node.js types
- Renderer: ESNext modules, Vue JSX support (via Vite)
