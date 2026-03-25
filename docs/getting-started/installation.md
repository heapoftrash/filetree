---
title: Installation
icon: material/package-variant
---

# Installation

Filetree runs as a single binary that serves both the API and the frontend. Prerequisites: **Go 1.21+** and **Node.js 18+** (Node is needed to build the frontend assets).

## Installation

=== "with make"

    Build and run with one process:

    ```bash
    make build
    ROOT_PATH=./data ./backend/filetree
    ```

    Then open **http://localhost:8080**. By default the binary serves the UI from `frontend/dist` when that folder exists relative to the working directory. For a **single binary** with the UI inside it, run `make build-frontend` and `make build-backend-embed` instead of `build-backend`, then run `./backend/filetree` (built with `-tags embed`).

    For production, set `CONFIG_FILE` and `ROOT_PATH`:

    ```bash
    ROOT_PATH=/path/to/files CONFIG_FILE=./config.yaml ./backend/filetree
    ```

=== "with Docker"

    Build and run with Docker or Podman:

    ```bash
    docker build -f Containerfile -t filetree .
    docker run -p 8080:8080 -v /path/to/files:/data filetree
    ```

    Or with Podman:

    ```bash
    podman build -f Containerfile -t filetree .
    podman run -p 8080:8080 -v /path/to/files:/data filetree
    ```

    Then open **http://localhost:8080**. The image uses `ROOT_PATH=/data` by default; mount your files at `/data`.

    For custom config:

    ```bash
    docker run -p 8080:8080 -v /path/to/files:/data -v /path/to/config.yaml:/app/config.yaml \
      -e CONFIG_FILE=/app/config.yaml filetree
    ```

=== "from source"

    Build the frontend and backend manually:

    ```bash
    cd frontend && npm install && npm run build
    cd ..
    rm -rf backend/web/dist && cp -R frontend/dist backend/web/dist
    cd backend && go mod tidy && go build -tags embed -o filetree .
    ```

    Omit `-tags embed` and the `web/dist` copy if you prefer to run with `frontend/dist` on disk (e.g. run `./backend/filetree` from the repo root after only `go build -o filetree .`).

    Run from the project root:

    ```bash
    ROOT_PATH=./data ./backend/filetree
    ```

    Then open **http://localhost:8080**.

=== "development"

    For local development with hot reload, run the backend and frontend in two terminals:

    **Terminal 1 — Backend:**
    ```bash
    cd backend && go run .
    ```
    API runs at **http://localhost:8080**.

    **Terminal 2 — Frontend:**
    ```bash
    cd frontend && npm install && npm run dev
    ```
    App runs at **http://localhost:5173** and proxies `/api` to the backend.

    Open **http://localhost:5173** in your browser. Ensure `frontend.url` in config matches `http://localhost:5173` for CORS and OAuth.

## First run

1. Open **http://localhost:8080** (or **http://localhost:5173** in development)
2. If auth is enabled, you'll be redirected to `/login`. Configure OAuth or local users in [Configuration](../configuration/config-file.md)
3. If no auth is configured, the API may allow unauthenticated access (check your config)

## Troubleshooting

- **CORS errors** — Ensure `frontend.url` in config matches your dev URL (e.g. `http://localhost:5173`)
- **OAuth redirect** — Set `oauth_redirect_url` to `http://localhost:8080/api/auth/google/callback` (or your production URL) for OAuth to work. See [Configuration](../configuration/config-file.md).
