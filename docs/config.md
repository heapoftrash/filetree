# Configuration

Configuration is loaded in this order: **environment variables** override **config file** override **defaults**.

## Config file (optional)

Set `CONFIG_FILE` to the path of a YAML or JSON config file:

```bash
export CONFIG_FILE=./config.yaml
```

Copy `config.example.yaml` or `config.example.json` to `config.yaml` / `config.json` and edit. Example:

```yaml
server:
  root_path: ./data
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

frontend:
  url: http://localhost:5173

users:
  admin_emails: []
  local_users: []
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `CONFIG_FILE` | Path to config file (YAML or JSON) |
| `ROOT_PATH` | Root directory for file operations (default: `./data`) |
| `GIN_MODE` | `debug` or `release` (default: `release`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `JWT_SECRET` | Secret for signing JWTs (default: dev placeholder) |
| `FRONTEND_URL` | Frontend base URL for OAuth redirect (default: `/`) |
| `OAUTH_REDIRECT_URL` | OAuth callback URL |
| `ADMIN_EMAILS` | Comma-separated admin emails |

At startup, the backend logs each config value and its source (environment, config file, or default).
