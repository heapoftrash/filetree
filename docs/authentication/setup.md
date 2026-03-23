---
title: Setup
icon: material/cog
---

# Setup

Copy `config.example.yaml` to `config.yaml` and set `CONFIG_FILE=./config.yaml`.

## Local users

=== "Config file"

    Enable local auth and add users:

    ```yaml
    auth:
      jwt_secret: change-me-in-production
      local_auth_enabled: true
      oauth_redirect_url: ""   # omit for local-only

    users:
      default_admin:
        username: admin
        password: changeme   # hashed on first run
      local_users: []       # or add {username, password, is_admin} — password hashed on first run
    ```

=== "Environment variables"

    | Variable | Purpose |
    |----------|---------|
    | `JWT_SECRET` | Secret for signing JWTs (required) |
    | `CONFIG_FILE` | Path to config file |

    ```bash
    export JWT_SECRET="your-long-random-secret"
    export CONFIG_FILE=./config.yaml
    ```

## OAuth (Google / GitHub)

=== "Config file"

    ```yaml
    auth:
      jwt_secret: change-me-in-production
      oauth_redirect_url: https://your-domain.com/api/auth/google/callback
      providers:
        google:
          enabled: true
          client_id: xxx.apps.googleusercontent.com
          client_secret: xxx
        github:
          enabled: true
          client_id: xxx
          client_secret: xxx
    ```

=== "Environment variables"

    | Variable | Overrides | Purpose |
    |----------|-----------|---------|
    | `JWT_SECRET` | `auth.jwt_secret` | Sign JWTs |
    | `OAUTH_REDIRECT_URL` | `auth.oauth_redirect_url` | OAuth callback URL |
    | `GOOGLE_CLIENT_ID` | `auth.providers.google.client_id` | Google client ID |
    | `GOOGLE_CLIENT_SECRET` | `auth.providers.google.client_secret` | Google secret |
    | `GITHUB_CLIENT_ID` | `auth.providers.github.client_id` | GitHub client ID |
    | `GITHUB_CLIENT_SECRET` | `auth.providers.github.client_secret` | GitHub secret |

    ```bash
    export JWT_SECRET="your-secret"
    export OAUTH_REDIRECT_URL="https://your-domain.com/api/auth/google/callback"
    export GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
    export GOOGLE_CLIENT_SECRET="xxx"
    export GITHUB_CLIENT_ID="xxx"
    export GITHUB_CLIENT_SECRET="xxx"
    ```

## Admin users

!!! note "OAuth admins only"
    `admin_emails` applies **only to OAuth users** (Google/GitHub). For local users, use `is_admin: true` in `local_users`.

=== "Config file"

    OAuth admins (by email):

    ```yaml
    users:
      admin_emails:
        - admin@example.com
        - other-admin@example.com
    ```

    Local admins (per-user):

    ```yaml
    users:
      local_users:
        - username: admin
          password: $2a$10$...
          is_admin: true
    ```

=== "Environment variables"

    | Variable | Overrides | Purpose |
    |----------|-----------|---------|
    | `ADMIN_EMAILS` | `users.admin_emails` | Comma-separated OAuth admin emails |

    ```bash
    export ADMIN_EMAILS="admin@example.com,other@example.com"
    ```

    Local admins must use `is_admin: true` in config; no env override.

## Frontend (CORS / dev)

=== "Config file"

    ```yaml
    frontend:
      url: http://localhost:5173   # dev; use https://your-domain.com in prod
    ```

=== "Environment variables"

    | Variable | Overrides | Purpose |
    |----------|-----------|---------|
    | `FRONTEND_URL` | `frontend.url` | Frontend base URL for CORS/OAuth |

    ```bash
    export FRONTEND_URL="http://localhost:5173"
    ```

## First run

1. Open **http://localhost:8080** (or **http://localhost:5173** in development)
2. If auth is enabled, you'll be redirected to `/login`
3. Use the default admin (`admin` / `changeme`) or OAuth to sign in
4. Admins can add users and manage auth from the Settings page
