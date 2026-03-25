---
title: Production
icon: material/application-export
---

# Production

Build with `make build` (or see [Installation](installation.md)), then run:

```bash
ROOT_PATH=/path/to/files CONFIG_FILE=./config.yaml ./app/filetree
```

Then open **http://localhost:8080**.

## Deployment

### Option A: Binary

**Embedded UI (recommended for a single file to deploy):** from a source tree, run `make build-frontend` then `make build-app-embed`. Deploy only `app/filetree` (plus your config). The UI is baked into the binary via `go:embed` and `-tags embed`. The build copies Vite output from `app/web/dist` into `app/uiembed/dist` so the embed package stays Go-only.

**UI on disk:** if you build with `make build` (or `go build` without `embed`), ensure `app/web/dist` exists — e.g. run from the repository root after `make build`, or use `./web/dist` / `./uiembed/dist` when running with working directory `app/`.

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

- **Embedded build** (`-tags embed`, with `app/uiembed/dist` populated at compile time): the server serves the UI from the binary; no separate static directory at runtime.
- **Disk layout:** if there is no usable embedded bundle (e.g. plain `go build` without `-tags embed`, or an empty embed), the server looks for `./app/web/dist`, `./app/uiembed/dist`, `./web/dist`, or `./uiembed/dist` (relative to the working directory) and serves those files.

No separate web server is required for the UI. For HTTPS and custom domains, put a reverse proxy in front.
