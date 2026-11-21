---
title: Getting Started
icon: material/rocket-launch
hide:
  - toc
features:
  - title: Container
    icon: material/docker
    description: Pull a prebuilt image from GHCR and run with Docker or Podman
    link: "#container"
  - title: Single binary
    icon: material/application-braces
    description: Download a release binary for Linux, macOS, or Windows
    link: "#single-binary"
  - title: Configuration
    icon: material/cog
    description: Point Filetree at your files and optional auth settings
    link: "#configuration"
---

# Getting Started

Deploy Filetree in a few minutes. Pick a path below — **container** (recommended), **single binary**, then add a **config** if you need auth or custom paths.

## Container

Prebuilt multi-arch images are published to [GitHub Container Registry](https://github.com/heapoftrash/filetree/pkgs/container/filetree) on every release.

### Image and tags

| Tag | When to use |
|-----|-------------|
| `latest` | Newest stable release (not updated from `main` CI) |
| `1.0.0` (semver) | Pin a specific release; matches the Git tag without the `v` prefix |
| `sha-<commit>` | Pin an exact image build from a release workflow |

Image name:

```text
ghcr.io/heapoftrash/filetree
```

Platforms: `linux/amd64`, `linux/arm64`, `linux/arm/v7`.

### Run

```bash
docker pull ghcr.io/heapoftrash/filetree:latest

docker run -d --name filetree -p 8080:8080 \
  -v /path/to/your/files:/data \
  ghcr.io/heapoftrash/filetree:latest
```

Open **http://localhost:8080**. The image defaults to `ROOT_PATH=/data` — mount your files there.

Pin a version:

```bash
docker run -d -p 8080:8080 \
  -v /path/to/your/files:/data \
  ghcr.io/heapoftrash/filetree:1.0.0
```

With a config file:

```bash
docker run -d -p 8080:8080 \
  -v /path/to/your/files:/data \
  -v /path/to/config.yaml:/app/config.yaml \
  -e CONFIG_FILE=/app/config.yaml \
  ghcr.io/heapoftrash/filetree:latest
```

If the package is private, run `docker login ghcr.io` first. Podman works the same way (`podman pull` / `podman run`).

Build your own image from source: see [Installation](installation.md). Hardening and reverse proxies: [Production](production.md).

## Single binary

Release binaries ship on [GitHub Releases](https://github.com/heapoftrash/filetree/releases) with the UI embedded — one file to download and run.

### Where to get it

1. Open [Releases](https://github.com/heapoftrash/filetree/releases/latest).
2. Download the archive for your OS/CPU (and `sha256sums.txt` to verify).
3. Extract the `filetree` binary (or `filetree.exe` on Windows).

### Available builds

Asset names look like `filetree_<version>_<os>_<arch>.tar.gz` (`.zip` on Windows):

| Asset pattern | Platform |
|---------------|----------|
| `…_linux_amd64.tar.gz` | Linux x86_64 |
| `…_linux_arm64.tar.gz` | Linux aarch64 |
| `…_linux_armv7.tar.gz` | Linux ARMv7 |
| `…_darwin_amd64.tar.gz` | macOS Intel |
| `…_darwin_arm64.tar.gz` | macOS Apple Silicon |
| `…_windows_amd64.zip` | Windows x86_64 |

Example for Linux amd64:

```bash
# replace VERSION with e.g. v1.0.0
curl -fsSL -O "https://github.com/heapoftrash/filetree/releases/download/VERSION/filetree_VERSION_linux_amd64.tar.gz"
tar -xzf filetree_VERSION_linux_amd64.tar.gz
chmod +x filetree
```

### Run

```bash
ROOT_PATH=/path/to/your/files ./filetree
```

With a config file:

```bash
ROOT_PATH=/path/to/your/files CONFIG_FILE=./config.yaml ./filetree
```

Then open **http://localhost:8080**.

Build from source instead of downloading: [Installation](installation.md). Production tips: [Production](production.md).

## Configuration

Config is optional for a quick local try (`ROOT_PATH` alone is enough). For real deployments, use a config file and/or environment variables.

**Load order:** environment variables → config file → defaults.

### Minimal setup

1. Copy [`config.example.yaml`](https://github.com/heapoftrash/filetree/blob/main/config.example.yaml) (or the [JSON example](https://github.com/heapoftrash/filetree/blob/main/config.example.json)) to `config.yaml`.
2. Set at least:

```yaml
server:
  root_path: ./data   # or rely on ROOT_PATH env

auth:
  jwt_secret: change-me-in-production
```

3. Start with `CONFIG_FILE` pointing at that file (binary or container examples above).

### Useful knobs

| What | Config / env |
|------|----------------|
| Files directory | `server.root_path` / `ROOT_PATH` |
| JWT secret | `auth.jwt_secret` / `JWT_SECRET` |
| Public site URL | `frontend.url` / `FRONTEND_URL` |
| OAuth callback | `auth.oauth_redirect_url` / `OAUTH_REDIRECT_URL` |
| Upload size | `server.max_upload_bytes` / `UPLOAD_SIZE_LIMIT` |

Full schema: [Config file](../configuration/config-file.md). Env reference: [Environment variables](../configuration/environment-variables.md). Auth setup: [Authentication](../authentication/).

### Example (YAML)

```yaml
server:
  root_path: ./data
  max_upload_bytes: 104857600

auth:
  jwt_secret: change-me-in-production
  local_auth_enabled: true

frontend:
  url: http://localhost:8080

users:
  local_users:
    - username: admin
      password: change-me
      is_admin: true
```

## Next steps

- Build from source or run a dev split (API + Vite): [Installation](installation.md)
- Reverse proxy, HTTPS, embedded vs disk UI: [Production](production.md)
- Google / GitHub OAuth and local users: [Authentication](../authentication/)
