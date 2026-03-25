---
title: Installation
icon: material/package-variant
---

# Installation

Filetree runs as a single binary that serves both the API and the web UI. Prerequisites: **Go 1.21+** and **Node.js 18+** (Node is needed to build the UI in `app/web/`).

## Installation

=== "with make"

    Build and run with one process:

    ```bash
    make build
    ROOT_PATH=./data ./app/filetree
    ```

    Then open **http://localhost:8080**. `make build` produces one binary with the UI embedded (Vite output is staged under `app/uiembed/dist` at compile time). With `make build-app` plus `make build-frontend`, the binary serves the UI from `app/web/dist` (repo root) or other disk paths — see [Production](production.md).

    For production, set `CONFIG_FILE` and `ROOT_PATH`:

    ```bash
    ROOT_PATH=/path/to/files CONFIG_FILE=./config.yaml ./app/filetree
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

    From the repository root (install UI dependencies once: `cd app/web && npm ci`):

    ```bash
    make build
    ```

    Without Make: after `npm run build` in `app/web`, run `make embed-ui` from the repo root, then `cd app && go build -tags embed -o filetree .`. For disk-only serving, use `go build` (no `-tags embed`) with `app/web/dist` present.

    Run from the project root:

    ```bash
    ROOT_PATH=./data ./app/filetree
    ```

    Then open **http://localhost:8080**.

=== "development"

    For local development with hot reload, run the Go server and the Vite dev server in two terminals:

    **Terminal 1 — API (Go):**
    ```bash
    cd app && go run .
    ```
    API runs at **http://localhost:8080**.

    **Terminal 2 — UI:**
    ```bash
    cd app/web && npm install && npm run dev
    ```
    App runs at **http://localhost:5173** and proxies `/api` to the Go server.

    Open **http://localhost:5173** in your browser. Ensure `frontend.url` in config matches `http://localhost:5173` for CORS and OAuth.

## First run

1. Open **http://localhost:8080** (or **http://localhost:5173** in development)
2. If auth is enabled, you'll be redirected to `/login`. Configure OAuth or local users in [Configuration](../configuration/config-file.md)
3. If no auth is configured, the API may allow unauthenticated access (check your config)

## Troubleshooting

- **CORS errors** — Ensure `frontend.url` in config matches your dev URL (e.g. `http://localhost:5173`)
- **OAuth redirect** — Set `oauth_redirect_url` to `http://localhost:8080/api/auth/google/callback` (or your production URL) for OAuth to work. See [Configuration](../configuration/config-file.md).
