---
title: Environment variables
icon: material/variable
---

# Environment variables

Environment variables override config file values. Useful for secrets and deployment-specific settings.

## Server

| Variable | Overrides | Description |
|----------|-----------|-------------|
| `CONFIG_FILE` | — | Path to config file (YAML or JSON) |
| `ROOT_PATH` | `server.root_path` | Root directory for file operations (default: `./data`) |
| `GIN_MODE` | `server.debug` | `debug` or `release` (default: `release`) |
| `UPLOAD_SIZE_LIMIT` | `server.max_upload_bytes` | Max upload size in bytes |

## Auth

| Variable | Overrides | Description |
|----------|-----------|-------------|
| `JWT_SECRET` | `auth.jwt_secret` | Secret for signing JWTs (default: dev placeholder) |
| `GOOGLE_CLIENT_ID` | `auth.providers.google.client_id` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | `auth.providers.google.client_secret` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | `auth.providers.github.client_id` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | `auth.providers.github.client_secret` | GitHub OAuth client secret |
| `OAUTH_REDIRECT_URL` | `auth.oauth_redirect_url` | OAuth callback URL |

## Frontend

| Variable | Overrides | Description |
|----------|-----------|-------------|
| `FRONTEND_URL` | `frontend.url` | Frontend base URL for OAuth redirect (default: `/`) |
| `CORS_ORIGINS` | `frontend.cors_origins` | Comma-separated allowed CORS origins |

## Users

| Variable | Overrides | Description |
|----------|-----------|-------------|
| `ADMIN_EMAILS` | `users.admin_emails` | Comma-separated OAuth admin emails (admin + may sign in) |
| `ALLOWED_OAUTH_EMAILS` | `users.allowed_oauth_emails` | Comma-separated OAuth emails allowed to sign in without admin |

## Startup logging

At startup, the backend logs each config value and its source (environment, config file, or default). Secrets are masked in logs.
