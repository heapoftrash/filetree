---
title: Authentication
icon: material/shield-account
---

# Authentication

The app supports **Google OAuth**, **GitHub OAuth**, and **local username/password**. All `/api/entries/*` routes require a valid JWT.

## Flow

1. **Unauthenticated** — Users hitting protected routes are redirected to `/login`
2. **Sign in** — User chooses Google, GitHub, or local username/password
3. **OAuth** — Backend redirects to provider, receives callback with code, exchanges for token, fetches user info, issues JWT
4. **Local** — Backend verifies username/password against bcrypt hash, issues JWT
5. **Session** — Frontend stores JWT and sends it as `Authorization: Bearer <token>` (or `?token=` for GET). JWT expires after 24 hours

## Next steps

| Topic | Description |
|-------|-------------|
| [Setup](setup.md) | Config file and environment variables for auth |
| [OAuth providers](oauth-providers.md) | Google and GitHub OAuth setup steps |
