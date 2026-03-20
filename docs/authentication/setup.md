---
title: Setup
icon: material/cog
---

# Setup

## 1. Config file

Copy `config.example.yaml` or `config.example.json` to `config.yaml` / `config.json` and set:

```bash
export CONFIG_FILE=./config.yaml
```

## 2. Configure providers

- **OAuth** — Set `auth.providers.google` and/or `auth.providers.github` with `enabled`, `client_id`, `client_secret`
- **Local** — Set `auth.local_auth_enabled: true` and add users to `users.local_users` (or use the admin UI)

## 3. Required settings

| Setting | Purpose |
|---------|---------|
| `jwt_secret` | **Required in production.** Used to sign JWTs. Use a long random string |
| `oauth_redirect_url` | **Required for OAuth.** Must match the redirect URI configured in Google/GitHub. Use `https://your-domain.com/api/auth/google/callback` (or `/api/auth/github/callback`) in production |
| `frontend.url` | Used for CORS and OAuth redirect. In dev, use `http://localhost:5173` |

## 4. Environment variables (optional)

Override via env instead of config file:

```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export JWT_SECRET="a-random-secret-for-signing-tokens"
# For dev (frontend on different port):
export FRONTEND_URL="http://localhost:5173"
export OAUTH_REDIRECT_URL="http://localhost:8080/api/auth/google/callback"
```

## 5. Admin access

Add OAuth user emails to `admin_emails` or set `is_admin: true` for local users. Admins can access the Settings page to manage auth and users.
