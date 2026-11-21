---
title: Container
icon: material/docker
---

# Container

Prebuilt multi-arch images are published to [GitHub Container Registry](https://github.com/heapoftrash/filetree/pkgs/container/filetree) on every release.

## Image and tags

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

## Run

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

## Next steps

- [Configuration](../configuration/) — config file and environment variables
- [Installation](installation.md) — build your own image from source
- [Production](production.md) — reverse proxy and hardening
