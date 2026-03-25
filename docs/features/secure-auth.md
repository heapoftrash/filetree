---
title: Secure auth
icon: material/shield-account
---

# Secure auth

Sign in with Google OAuth, GitHub OAuth, or local username/password. All API routes require a valid JWT. You can enable one or more providers and manage local users in the admin UI.

## Auth providers

| Provider | Description |
|----------|-------------|
| **Google OAuth** | Sign in with a Google account. Requires OAuth 2.0 credentials from Google Cloud Console |
| **GitHub OAuth** | Sign in with a GitHub account. Requires an OAuth App from GitHub Developer Settings |
| **Local** | Username and password stored in config. Passwords are bcrypt-hashed |

You can enable multiple providers; users choose which one to use at login.

## JWT sessions

- **Token expiry** — JWTs expire after 24 hours. The frontend stores the token and uses it for API calls.
- **Storage** — Tokens are kept in memory (or localStorage, depending on frontend implementation). No server-side session store.
- **Usage** — Send the token as `Authorization: Bearer <token>` or as `?token=<token>` for GET requests (e.g. preview links).

## OAuth allowlist

Only addresses in **`admin_emails`** ∪ **`allowed_oauth_emails`** can complete OAuth sign-in. `admin_emails` grants **admin** access; `allowed_oauth_emails` grants **regular** access (Settings UI remains admin-only). If Google or GitHub is enabled but both lists are empty, OAuth sign-in is denied (use local auth or add at least one email). The server logs a warning at startup in that case.

## Admin access

Users listed in `admin_emails` (for OAuth) or with `is_admin: true` (for local users) can access the admin UI to manage auth providers and local users. A `default_admin` user can be bootstrapped on first run when no users exist.
