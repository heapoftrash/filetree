# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.0.3-beta] - 2026-03-24

### Breaking changes

- **User / OAuth config keys** (YAML, JSON, and `/api/config` payloads) use a consistent `oauth_*` prefix:
  - `admin_emails` → `oauth_admin_emails` — OAuth accounts with admin access (and included in the sign-in allowlist).
  - `allowed_oauth_emails` → `oauth_allowed_emails` — OAuth accounts that may sign in without admin (union with `oauth_admin_emails`).
  - `allow_all_oauth_users` → `oauth_allow_all_users` — when `true`, any OAuth user with an email may sign in; email lists are ignored for sign-in (admin access still follows `oauth_admin_emails`).
- **Environment variables**:
  - `ADMIN_EMAILS` → `OAUTH_ADMIN_EMAILS` (overrides `users.oauth_admin_emails`).
  - `ALLOWED_OAUTH_EMAILS` → `OAUTH_ALLOWED_EMAILS` (overrides `users.oauth_allowed_emails`).
  - `OAUTH_ALLOW_ALL_USERS` is unchanged and overrides `users.oauth_allow_all_users`.

There is no automatic migration: update config files, env vars, and any automation that referenced the old names.

### Added

- OAuth sign-in **allowlist**: only emails in `oauth_admin_emails` ∪ `oauth_allowed_emails` can complete OAuth login unless `oauth_allow_all_users` is enabled.
- **Settings** UI and config schema for `oauth_allowed_emails` and `oauth_allow_all_users`, with a warning when OAuth is enabled but no allowlist is configured.
- **Startup logging** when Google/GitHub OAuth is enabled but the allowlist is empty (or when open OAuth sign-in is enabled).
- **Login** error query parameters `oauth_no_allowlist` and `oauth_not_allowed` with user-facing messages.
- `AuthHandler` reads user/OAuth settings from the live `*config.Config` so admin updates apply without restart where applicable.

### Documentation

- Examples, env reference, and auth docs updated for the new keys and variables.

## [0.0.2-beta] - earlier

Prior releases; see [GitHub Releases](https://github.com/heapoftrash/filetree/releases) for tags before this changelog was added.
