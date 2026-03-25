---
title: Production
icon: material/application-export
---

# Production

Build with `make build` (or see [Installation](installation.md)), then run:

```bash
ROOT_PATH=/path/to/files CONFIG_FILE=./config.yaml ./backend/filetree
```

Then open **http://localhost:8080**.

## Deployment

### Option A: Binary

**Embedded UI (recommended for a single file to deploy):** from a source tree, run `make build-frontend` then `make build-backend-embed`. Deploy only `backend/filetree` (plus your config). The UI is baked into the binary via `go:embed` and `-tags embed`.

**UI beside the binary:** if you build with `make build` (or `go build` without `embed`), copy **`frontend/dist`** next to the runtime layout the binary expects (`./frontend/dist` or `../frontend/dist` relative to the process working directory), or run from the repository root after `make build`.

Then:

1. **Set** `ROOT_PATH` to the directory where files should be stored
2. **Set** `CONFIG_FILE` to your config file (e.g. `./config.yaml`)
3. **Use** a reverse proxy (nginx, Caddy) for the production URL if needed
4. **Set** `JWT_SECRET` and `oauth_redirect_url` for production (e.g. `https://your-domain.com/api/auth/google/callback`)

### Option B: Docker

1. **Build** the image: `docker build -f Containerfile -t filetree .`
2. **Run** with a volume for files: `docker run -d -p 8080:8080 -v /path/to/files:/data filetree`
3. **Mount** your config file and set `CONFIG_FILE` if needed
4. **Use** a reverse proxy in front for HTTPS and custom domains

## Serving the UI

- **Embedded build** (`-tags embed`, with `backend/web/dist` populated at compile time): the backend serves the UI from memory; no `frontend/dist` folder at runtime.
- **Disk layout:** when `./frontend/dist` or `../frontend/dist` exists (from the process working directory), the backend serves those files instead.

No separate web server is required for the frontend. For HTTPS and custom domains, put a reverse proxy in front.
