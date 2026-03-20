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

1. **Copy** the `filetree` binary and the `frontend/dist` folder to your server
2. **Set** `ROOT_PATH` to the directory where files should be stored
3. **Set** `CONFIG_FILE` to your config file (e.g. `./config.yaml`)
4. **Use** a reverse proxy (nginx, Caddy) for the production URL if needed
5. **Set** `JWT_SECRET` and `oauth_redirect_url` for production (e.g. `https://your-domain.com/api/auth/google/callback`)

## Single binary

When `frontend/dist` exists next to the binary, the backend serves it directly. No separate web server is required for the frontend. For HTTPS and custom domains, put a reverse proxy in front.
