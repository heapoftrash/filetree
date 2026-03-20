---
title: API Reference
icon: material/api
---

# Filetree API

All `/api/entries/*` routes require a valid JWT, except where noted. Use `Authorization: Bearer <token>` or `?token=<token>` for GET requests. Preview and download also accept [signed URLs](features/signed-urls.md) (`path`, `exp`, `sig`, `action`).

## Authentication

```http
Authorization: Bearer <jwt_token>
```

For GET requests, you can also pass the token as a query parameter: `?token=<jwt_token>`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/entries?path=` | List directory |
| POST | `/api/entries` | Create folder (JSON: `path`, `name`) or upload (multipart: `path`, `files`) |
| GET | `/api/entries/download?path=` | Download file |
| PATCH | `/api/entries` | Rename (JSON: `path`, `newName`, optional `overwrite`) |
| DELETE | `/api/entries?path=` | Move to trash (use `?permanent=true` for hard delete) |
| POST | `/api/entries/restore` | Restore from trash (JSON: `path` = trash path, e.g. `.trash/1736940645/foo/bar.txt`) |
| POST | `/api/entries/move` | Move (JSON: `from`, `to` dir path, optional `overwrite`, `newName`) |
| POST | `/api/entries/copy` | Copy (JSON: `from`, `to` dir path, optional `overwrite`, `newName`) |
| POST | `/api/entries/zip` | Download as zip (JSON: `paths` array) |
| POST | `/api/entries/signed-url` | Get signed URL (JSON: `path`, `action`: `"preview"` or `"download"`) |
| GET | `/api/entries/preview?path=` | Preview file inline (images, video, audio, pdf, text, markdown, json, csv, html) |
| GET | `/api/entries/preview/info?path=` | Preview metadata: `{ category, mimeType, previewable }` |

## Request examples

### Create folder

```json
POST /api/entries
Content-Type: application/json

{"path": "documents", "name": "reports"}
```

### Upload files

```
POST /api/entries
Content-Type: multipart/form-data

path: documents/reports
files: <file1>, <file2>, ...
```

### Move (with overwrite)

```json
POST /api/entries/move
{"from": "old/file.txt", "to": "new/", "overwrite": true}
```

### Rename (with overwrite)

```json
PATCH /api/entries
{"path": "doc/old.txt", "newName": "new.txt", "overwrite": true}
```

### Signed URL

```json
POST /api/entries/signed-url
{"path": "documents/report.pdf", "action": "preview"}

→ {"url": "/api/entries/preview?path=...&exp=...&sig=..."}
```

## Errors

- `400` — Invalid path, missing required fields, or validation error
- `401` — Invalid or missing JWT
- `404` — File or folder not found
- `409` — Conflict (e.g. target already exists, use `overwrite`)
