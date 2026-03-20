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

1. **Copy** the `filetree` binary and the `frontend/dist` folder to your server
2. **Set** `ROOT_PATH` to the directory where files should be stored
3. **Set** `CONFIG_FILE` to your config file (e.g. `./config.yaml`)
4. **Use** a reverse proxy (nginx, Caddy) for the production URL if needed
5. **Set** `JWT_SECRET` and `oauth_redirect_url` for production (e.g. `https://your-domain.com/api/auth/google/callback`)

### Option B: Docker

1. **Build** the image: `docker build -f Containerfile -t filetree .`
2. **Run** with a volume for files: `docker run -d -p 8080:8080 -v /path/to/files:/data filetree`
3. **Mount** your config file and set `CONFIG_FILE` if needed
4. **Use** a reverse proxy in front for HTTPS and custom domains

## Single binary

When `frontend/dist` exists next to the binary, the backend serves it directly. No separate web server is required for the frontend. For HTTPS and custom domains, put a reverse proxy in front.
