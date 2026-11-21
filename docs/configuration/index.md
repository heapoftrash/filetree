---
title: Configuration
icon: material/cog
hide:
  - toc
---

# Configuration

Config is optional for a quick local try (`ROOT_PATH` alone is enough). For real deployments, use a config file and/or environment variables.

**Load order:** environment variables → config file → defaults.

## Minimal setup

1. Copy [`config.example.yaml`](https://github.com/heapoftrash/filetree/blob/main/config.example.yaml) (or the [JSON example](https://github.com/heapoftrash/filetree/blob/main/config.example.json)) to `config.yaml`.
2. Set at least:

```yaml
server:
  root_path: ./data   # or rely on ROOT_PATH env

auth:
  jwt_secret: change-me-in-production
```

3. Start with `CONFIG_FILE` pointing at that file — see [Container](../getting-started/container.md) or [Single binary](../getting-started/single-binary.md).

## Useful knobs

| What | Config / env |
|------|----------------|
| Files directory | `server.root_path` / `ROOT_PATH` |
| JWT secret | `auth.jwt_secret` / `JWT_SECRET` |
| Public site URL | `frontend.url` / `FRONTEND_URL` |
| OAuth callback | `auth.oauth_redirect_url` / `OAUTH_REDIRECT_URL` |
| Upload size | `server.max_upload_bytes` / `UPLOAD_SIZE_LIMIT` |

## Reference

| Page | Purpose |
|------|---------|
| [Config file](config-file.md) | Full schema for `server`, `auth`, `frontend`, `users` |
| [Environment variables](environment-variables.md) | Override any setting via env |

Auth setup: [Authentication](../authentication/).

## Example (YAML)

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
