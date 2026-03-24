<p align="center">
  <a href="https://heapoftrash.github.io/filetree/">
    <img src="docs/assets/logo-animated.svg" width="320" alt="Material for MkDocs">
  </a>
</p>

<p align="center">
  <strong>
    Browse, upload, preview, and manage files from your browser.
  </strong>
</p>


<p align="center">
  <a href="https://goreportcard.com/report/github.com/heapoftrash/filetree/backend">
    <img src="https://goreportcard.com/badge/github.com/heapoftrash/filetree/backend" alt="Go Report Card"/>
  </a>
  <a href="https://github.com/heapoftrash/filetree/actions/workflows/ci.yml">
    <img src="https://github.com/heapoftrash/filetree/actions/workflows/ci.yml/badge.svg" alt="Build status"/>
  </a>
  <a href="https://github.com/heapoftrash/filetree/releases">
    <img src="https://img.shields.io/github/v/release/heapoftrash/filetree.svg" alt="Latest release" />
  </a>
</p>
<p align="center">
<strong>Filetree</strong> is a minimalistic, self-hosted file manager — browse, upload, preview, and manage files from your browser. No cloud lock-in, no database. Simple YAML or JSON config, single binary deployment.
</p>


## Features

- **Browse & manage** — List, create folders, rename, move, copy, delete (with trash)
- **Upload** — Drag-and-drop, multipart uploads
- **Rich previews** — Images, video, audio, PDF, Markdown, JSON, CSV, HTML, text
- **Auth** — Google OAuth, GitHub OAuth, local users
- **Configuration** — YAML or JSON config file, no database.
- **Security** — Short-lived signed URLs for content previews, JWT auth

## Tech stack

- **Backend:** Go, Gin, JWT, OAuth2 (Google, GitHub)
- **Frontend:** React, TypeScript, Ant Design, Vite

## Quick start

Full guides: **[Documentation](https://heapoftrash.github.io/filetree/)** — installation, production, configuration, authentication.

### Docker (prebuilt image) <small> recommended </small>

```bash
docker run -d -p 8080:8080 \
  -v /path/to/your/files:/data \
  -v /path/to/config.yaml:/app/config.yaml \
  -e CONFIG_FILE=/app/config.yaml \
  ghcr.io/heapoftrash/filetree:latest
```

If the package is private, run `docker login ghcr.io` before `docker pull`.

### Config file

1. Copy [config.example.yaml](config.example.yaml) or [config.example.json](config.example.json) to `config.yaml` / `config.json`.
2. Set **`CONFIG_FILE`** to that path when you start the binary or container (see [Configuration](#configuration)).
3. Environment variables override the file. Full schema: [config file (docs)](https://heapoftrash.github.io/filetree/configuration/config-file/).

### Production binary

```bash
git clone https://github.com/heapoftrash/filetree.git
make build
ROOT_PATH=/path/to/files CONFIG_FILE=./config.yaml ./backend/filetree
```

Ship `backend/filetree` and `frontend/dist`. The binary serves the built UI when `frontend/dist` is present.

See [docs/API.md](docs/API.md) for the API. Build docs locally: `pip install mkdocs-material && mkdocs serve`.

### Development

**API** — `cd backend && go mod tidy && go run .` → **http://localhost:8080**

**UI** — `cd frontend && npm install && npm run dev` → **http://localhost:5173** (proxies `/api` to the backend)

Set `frontend.url` in config to `http://localhost:5173` for CORS and OAuth.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
