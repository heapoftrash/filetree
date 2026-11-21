---
title: Build from source
icon: material/source-branch
---

# Build from source

For **prebuilt containers and release binaries**, see [Container](container.md) and [Single binary](single-binary.md).

This page covers cloning the repo, building locally, and deploying what you built. Prerequisites: **Go 1.21+** and **Node.js 18+** (Node builds the UI in `app/web/`).

## Build and run

=== "with make"

    From the repository root (install UI deps once: `cd app/web && npm ci`):

    ```bash
    make build
    ROOT_PATH=./data ./app/filetree
    ```

    Then open **http://localhost:8080**.

    `make build` produces one binary with the UI embedded (Vite output is staged under `app/uiembed/dist` at compile time).

    For a production-style run:

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

    Then open **http://localhost:8080**. The image uses `ROOT_PATH=/data` by default — mount your files there.

    With a config file:

    ```bash
    docker run -p 8080:8080 \
      -v /path/to/files:/data \
      -v /path/to/config.yaml:/app/config.yaml \
      -e CONFIG_FILE=/app/config.yaml \
      filetree
    ```

=== "without Make"

    After `npm run build` in `app/web`, from the repo root:

    ```bash
    make embed-ui
    cd app && go build -tags embed -o filetree .
    ```

    For disk-only UI (no embed), use `go build` without `-tags embed` and keep `app/web/dist` present. Run from the project root:

    ```bash
    ROOT_PATH=./data ./app/filetree
    ```

=== "development"

    Hot reload: run the Go API and Vite UI in two terminals.

    **Terminal 1 — API:**

    ```bash
    cd app && go run .
    ```

    API at **http://localhost:8080**.

    **Terminal 2 — UI:**

    ```bash
    cd app/web && npm install && npm run dev
    ```

    App at **http://localhost:5173** (proxies `/api` to the Go server). Set `frontend.url` in config to `http://localhost:5173` for CORS and OAuth.

## Deploy what you built

**Embedded UI (recommended):** `make build`, then deploy `app/filetree` plus your config. The UI is in the binary via `go:embed` and `-tags embed`.

**UI on disk:** `make build-app` and `make build-frontend` (no `-tags embed`), or plain `go build` after `npm run build`. Ensure `app/web/dist` exists when you run from the repo root.

Checklist:

1. Set `ROOT_PATH` to the directory for stored files
2. Set `CONFIG_FILE` to your config (e.g. `./config.yaml`)
3. Put a reverse proxy (nginx, Caddy) in front for HTTPS / custom domains if needed
4. Set `JWT_SECRET` and `oauth_redirect_url` for production (e.g. `https://your-domain.com/api/auth/google/callback`)

### Serving the UI

- **Embedded** (`-tags embed` with `app/uiembed/dist` at compile time): UI served from the binary; no static directory at runtime
- **Disk:** if nothing usable is embedded, the server looks for `./app/web/dist`, `./app/uiembed/dist`, `./web/dist`, or `./uiembed/dist` relative to the working directory

No separate web server is required for the UI.

## First run

1. Open **http://localhost:8080** (or **http://localhost:5173** in development)
2. If auth is enabled, configure OAuth or local users in [Configuration](../configuration/config-file.md)
3. If no auth is configured, the API may allow unauthenticated access (check your config)

## Troubleshooting

- **CORS errors** — Ensure `frontend.url` matches your UI URL (e.g. `http://localhost:5173`)
- **OAuth redirect** — Set `oauth_redirect_url` to `http://localhost:8080/api/auth/google/callback` (or your production URL). See [Configuration](../configuration/config-file.md).
