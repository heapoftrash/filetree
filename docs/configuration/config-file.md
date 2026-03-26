---
title: Config file
icon: material/file-cog
---

# Config file

Set `CONFIG_FILE` to the path of a YAML or JSON config file:

```bash
export CONFIG_FILE=./config.yaml
```

Copy `config.example.yaml` or `config.example.json` to `config.yaml` / `config.json` and edit.

## Schema

### server

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `root_path` | string | `./data` | Root directory for file operations |
| `debug` | bool | `false` | Gin debug mode (verbose logs) |
| `max_upload_bytes` | int | 100MB | Max multipart upload size |

### auth

| Key | Type | Description |
|-----|------|-------------|
| `jwt_secret` | string | Secret for signing JWTs. **Change in production.** |
| `oauth_redirect_url` | string | Base OAuth callback URL (e.g. `https://your-domain.com/api/auth/google/callback`) |
| `local_auth_enabled` | bool | Enable username/password auth |
| `providers` | object | `google` and `github` provider configs |

### providers (google, github)

| Key | Type | Description |
|-----|------|-------------|
| `enabled` | bool | Enable this provider |
| `client_id` | string | OAuth client ID |
| `client_secret` | string | OAuth client secret |
| `callback_url` | string | Optional; derived from `oauth_redirect_url` if empty |

### frontend

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `url` | string | `/` | Frontend base URL for CORS and OAuth redirect |
| `cors_origins` | []string | derived from `url` | Allowed CORS origins |

### users

| Key | Type | Description |
|-----|------|-------------|
| `oauth_admin_emails` | []string | OAuth emails with admin access; also counted as allowed to sign in |
| `oauth_allowed_emails` | []string | OAuth emails allowed to sign in as regular (non-admin) users; union with `oauth_admin_emails`. If OAuth is enabled and both lists are empty, OAuth sign-in is rejected unless `oauth_allow_all_users` is true |
| `oauth_allow_all_users` | bool | Default `false`. If `true`, skip email allowlist for OAuth sign-in (any OAuth user with an email may sign in). `oauth_admin_emails` still controls admin access only |
| `local_users` | []object | `{username, password, is_admin}` — `password` accepts plaintext (hashed on first run) or bcrypt hash |
| `default_admin` | object | `{username, password}` — `password` accepts plaintext (hashed on first run) or bcrypt hash |

## Example

=== "YAML"

    ```yaml
    server:
      root_path: ./data
      debug: false
      max_upload_bytes: 104857600   # 100MB

    auth:
      jwt_secret: change-me-in-production
      oauth_redirect_url: http://localhost:8080/api/auth/google/callback
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
      url: http://localhost:5173

    users:
      oauth_admin_emails: []
      oauth_allowed_emails: []
      oauth_allow_all_users: false
      local_users: []
      default_admin:
        username: admin
        password: changeme
    ```

=== "JSON"

    ```json
    {
      "server": {
        "root_path": "./data",
        "debug": false,
        "max_upload_bytes": 104857600
      },
      "auth": {
        "jwt_secret": "change-me-in-production",
        "oauth_redirect_url": "http://localhost:8080/api/auth/google/callback",
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
        "url": "http://localhost:5173"
      },
      "users": {
        "oauth_admin_emails": [],
        "oauth_allowed_emails": [],
        "oauth_allow_all_users": false,
        "local_users": []
      }
    }
    ```
