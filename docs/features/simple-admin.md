---
title: Simple admin
icon: material/cog
---

# Simple admin

No database — configuration is stored in a single YAML or JSON file. The admin UI lets you manage auth and users without editing config manually.

## Config file

- **Format** — YAML or JSON. Set `CONFIG_FILE` to the path (e.g. `./config.yaml`).
- **Sections** — `server`, `auth`, `frontend`, `users`. See [Config file](../configuration/config-file.md) for the full schema.
- **Override** — Environment variables override config file values. Useful for secrets in production.

## Admin UI

Admins (users in `admin_emails` or with `is_admin`) can access the Settings page to:

- **Auth providers** — Enable/disable Google and GitHub OAuth, set client ID and secret
- **Local users** — Add, edit, remove username/password users
- **Server settings** — Root path, max upload size, debug mode, CORS origins
- **OAuth redirect URL** — Base callback URL for OAuth providers

Changes are written back to the config file. No database migrations or extra setup.

## Default admin bootstrap

When no users exist, you can define a `default_admin` in config with `username` and `password`. On first successful login, the password is hashed and stored in `default_admin.password_hash`. The user is not added to `local_users`; change the password via the admin UI or config to persist.
