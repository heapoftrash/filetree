<p align="center">
  <a href="https://heapoftrash.github.io/filetree/">
    <img src="frontend/public/favicon.svg" width="320" alt="Material for MkDocs">
  </a>
</p>

<p align="center">
  <strong>
    Browse, upload, preview, and manage files from your browser.
  </strong>
</p>


<p align="center">
  <a href="https://goreportcard.com/report/github.com/heapoftrash/filetree">
    <img src="https://goreportcard.com/report/github.com/heapoftrash/filetree">
  </a>
  <a href="https://github.com/heapoftrash/filetree/actions/workflows/ci.yml">
    <img src="https://github.com/heapoftrash/filetree/actions/workflows/ci.yml/badge.svg">
  </a>
</p>
<p align="center">
<strong>Filetree</strong> is a minimalistic, self-hosted file manager — browse, upload, preview, and manage files from your browser. No cloud lock-in, no database. Simple YAML or JSON config, single binary deployment.
</p>


## Features

- **Browse & manage** — List, create folders, rename, move, copy, delete (with trash)
- **Upload** — Drag-and-drop, multipart uploads
- **Rich previews** — Images, video, audio, PDF, Markdown, JSON, CSV, HTML, text
- **Auth** — Google OAuth, GitHub OAuth, local users (bcrypt)
- **Admin settings** — YAML or JSON config file, no database. Provider toggles, local users
- **Security** — Short-lived signed URLs for previews, JWT auth

## Tech stack

- **Backend:** Go, Gin, JWT, OAuth2 (Google, GitHub)
- **Frontend:** React, TypeScript, Ant Design, Vite

## Prerequisites

- Go 1.21+
- Node.js 18+

## Quick start

### 1. Backend

```bash
cd backend
go mod tidy
go run .
```

API runs at **http://localhost:8080**. Root directory is `./data` unless you set `ROOT_PATH`.

### 2. Frontend (dev)

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173** and proxies `/api` to the backend.

### 3. Production (single binary)

Build the frontend and backend, then run the binary:

```bash
# Build frontend assets
cd frontend && npm run build

# Build backend binary
cd ../backend && go build -o filetree .

# Run (from project root)
ROOT_PATH=/path/to/files CONFIG_FILE=./config.yaml ./backend/filetree
```

Then open **http://localhost:8080**. The binary serves the built frontend from `frontend/dist` when present. Deploy by copying the binary and `frontend/dist` folder.

See [docs/API.md](docs/API.md) for the API reference. Full documentation (MkDocs Material) can be built with `pip install mkdocs-material && mkdocs serve`.

## Authentication

The app supports **Google OAuth**, **GitHub OAuth**, and **local username/password**. All `/api/entries/*` routes require a valid JWT.

### Setup

1. Copy [config.example.yaml](config.example.yaml) or [config.example.json](config.example.json) to `config.yaml` / `config.json` and set `CONFIG_FILE=./config.yaml`.
2. Configure providers in `auth.providers` (Google, GitHub) and/or enable `auth.local_auth_enabled` for local users.
3. Set environment variables (or use config file):

```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export JWT_SECRET="a-random-secret-for-signing-tokens"
# For dev (frontend on different port):
export FRONTEND_URL="http://localhost:5173"
export OAUTH_REDIRECT_URL="http://localhost:8080/api/auth/google/callback"
```

### Flow

- Unauthenticated users are redirected to `/login`.
- Sign in with Google, GitHub, or local username/password.
- After sign-in, the backend issues a JWT; the frontend stores it and uses it for API calls.

## Configuration

Configuration is loaded in this order: **environment variables** override **config file** override **defaults**.

### Config file (optional)

Set `CONFIG_FILE` to the path of a YAML or JSON config file:

```bash
export CONFIG_FILE=./config.yaml
```

Copy [config.example.yaml](config.example.yaml) or [config.example.json](config.example.json) to `config.yaml` / `config.json` and edit. Example:

```yaml
server:
  root_path: ./data
  max_upload_bytes: 104857600   # 100MB

auth:
  jwt_secret: change-me-in-production
  oauth_redirect_url: http://localhost:8080/api/auth/google/callback
  local_auth_enabled: false
  providers:
    google:
      enabled: true
      client_id: xxx.apps.googleusercontent.com
      client_secret: xxx
    github:
      enabled: false

frontend:
  url: http://localhost:5173

users:
  admin_emails: []
  local_users: []
```

### Environment variables

- `CONFIG_FILE` — path to config file (YAML or JSON)
- `ROOT_PATH` — root directory for file operations (default: `./data`)
- `GIN_MODE` — `debug` or `release` (default: `release` when not set; controls Gin debug logs)
- `GOOGLE_CLIENT_ID` — Google OAuth client ID (required for auth)
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
- `JWT_SECRET` — secret for signing JWTs (default: dev placeholder)
- `FRONTEND_URL` — frontend base URL for OAuth redirect (default: `/` for same-origin)
- `OAUTH_REDIRECT_URL` — OAuth callback URL (default: `http://localhost:8080/api/auth/google/callback`)
- `ADMIN_EMAILS` — comma-separated admin emails (for future admin features)

At startup, the backend logs each config value and its source (environment, config file, or default).

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
