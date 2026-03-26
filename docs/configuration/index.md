---
title: Configuration
icon: material/cog
---

# Configuration

Configuration is loaded in this order: **environment variables** override **config file** override **defaults**.

## Full examples

=== "YAML"

    Copy to `config.yaml` and set `CONFIG_FILE=./config.yaml`:

    ```yaml
    server:
      root_path: ./data
      debug: false
      max_upload_bytes: 104857600   # 100MB

    auth:
      jwt_secret: change-me-in-production
      oauth_redirect_url: http://example.com/api/auth/google/callback
      local_auth_enabled: false
      providers:
        google:
          enabled: true
          client_id: xxx.apps.googleusercontent.com
          client_secret: xxx
        github:
          enabled: false
          client_id: ""

    frontend:
      url: http://example.com

    users:
      oauth_admin_emails: []
      local_users: []
    ```

=== "JSON"

    Copy to `config.json` and set `CONFIG_FILE=./config.json`:

    ```json
    {
      "server": {
        "root_path": "./data",
        "debug": false,
        "max_upload_bytes": 104857600
      },
      "auth": {
        "jwt_secret": "change-me-in-production",
        "oauth_redirect_url": "http://example.com/api/auth/google/callback",
        "local_auth_enabled": false,
        "providers": {
          "google": {
            "enabled": true,
            "client_id": "xxx.apps.googleusercontent.com",
            "client_secret": "xxx"
          },
          "github": { "enabled": false, "client_id": "" }
        }
      },
      "frontend": {
        "url": "http://example.com"
      },
      "users": {
        "oauth_admin_emails": [],
        "local_users": []
      }
    }
    ```

=== "Environment variables"

    Override any config value via env vars:

    ```bash
    export CONFIG_FILE=./config.yaml
    export ROOT_PATH=./data
    export GIN_MODE=release
    export UPLOAD_SIZE_LIMIT=104857600

    export JWT_SECRET="your-secret"
    export GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
    export GOOGLE_CLIENT_SECRET="xxx"
    export GITHUB_CLIENT_ID=""
    export GITHUB_CLIENT_SECRET=""
    export OAUTH_REDIRECT_URL="http://example.com/api/auth/google/callback"

    export FRONTEND_URL="http://example.com"
    export CORS_ORIGINS="http://localhost:5173"

    export OAUTH_ADMIN_EMAILS="admin@example.com"
    ```

    See [Environment variables](environment-variables.md) for the full reference.

## Sections

| Section | Purpose |
|---------|---------|
| [Config file](config-file.md) | Schema and options for `server`, `auth`, `frontend`, `users` |
| [Environment variables](environment-variables.md) | Override any config value via env vars |

## Quick reference

- **Server** — `root_path`, `max_upload_bytes`, `debug`
- **Auth** — `jwt_secret`, `oauth_redirect_url`, `local_auth_enabled`, `providers` (google, github)
- **Frontend** — `url`, `cors_origins`
- **Users** — `oauth_admin_emails`, `oauth_allowed_emails`, `oauth_allow_all_users`, `local_users`, `default_admin`
