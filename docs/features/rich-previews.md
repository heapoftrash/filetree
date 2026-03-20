---
title: Rich previews
icon: material/file-document-outline
---

# Rich previews

Preview files directly in the browser without downloading. No extra plugins or apps required. The backend serves content with appropriate MIME types; the frontend chooses the renderer based on file category.

## Supported formats

| Category | Extensions |
|---------|------------|
| **Images** | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico`, `.tiff`, `.tif`, `.avif` |
| **Video** | `.mp4`, `.webm`, `.ogg`, `.ogv`, `.mov` |
| **Audio** | `.mp3`, `.wav`, `.m4a`, `.flac` |
| **PDF** | `.pdf` |
| **Markdown** | `.md`, `.markdown` |
| **JSON** | `.json` |
| **CSV** | `.csv` |
| **HTML** | `.html`, `.htm` |
| **Text** | `.txt`, `.log`, `.env`, `.sh`, `.bat`, `.ps1`, `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`, `.css`, `.scss`, `.less`, `.xml`, `.yaml`, `.yml`, `.toml`, `.ini`, `.cfg`, `.conf` |

## How it works

- **Binary files** (images, video, audio, PDF) — Served with the correct `Content-Type`; the browser or frontend component handles display.
- **Text-based files** — Rendered as plain text, or with syntax highlighting for code. Markdown, JSON, and CSV get dedicated preview components.
- **Size limit** — Text previews are capped at 512 KB. Larger files fall back to download.

## Signed URLs

For sharing previews without exposing your session, use [signed URLs](signed-urls.md). Generate a short-lived link for preview or download; the link works without a JWT.
