# Filetree API

All `/api/entries/*` routes require a valid JWT (Bearer token or `?token=` for GET).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/entries?path=` | List directory |
| POST | `/api/entries` | Create folder (JSON: `path`, `name`) or upload (multipart: `path`, `files`) |
| GET | `/api/entries/download?path=` | Download file |
| PATCH | `/api/entries` | Rename (JSON: `path`, `newName`) |
| DELETE | `/api/entries?path=` | Move to trash (use `?permanent=true` for hard delete) |
| POST | `/api/entries/restore` | Restore from trash (JSON: `path` = trash path) |
| POST | `/api/entries/move` | Move (JSON: `from`, `to` dir path) |
| POST | `/api/entries/copy` | Copy (JSON: `from`, `to` dir path) |
| POST | `/api/entries/zip` | Download as zip (JSON: `paths` array) |
| GET | `/api/entries/preview?path=` | Preview file inline (images, video, audio, pdf, text, markdown, json, csv, html) |
| GET | `/api/entries/preview/info?path=` | Preview metadata: `{ category, mimeType, previewable }` |
