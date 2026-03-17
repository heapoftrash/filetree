---
template: home.html
title: Filetree
hide: [navigation]
hero:
  title: Self-hosted web file manager
  subtitle: Browse, upload, preview, and manage files from your browser. Google OAuth, GitHub OAuth, or local auth. Single binary deployment.
  install_button: Getting Started
  source_button: Source Code
  config_button: Configuration
features:
  - title: Browse & manage
    image: assets/images/browse-manage.svg
    description: List, create folders, rename, move, copy, delete (with trash). Drag-and-drop uploads.
  - title: Rich previews
    image: assets/images/rich-preview.svg
    description: Images, video, audio, PDF, Markdown, JSON, CSV, HTML, text — preview in the browser.
  - title: Secure auth
    image: assets/images/secure-auth.svg
    description: Google OAuth, GitHub OAuth, or local username/password. JWT-based sessions.
---

# Welcome

**Filetree** is a minimalistic, self-hosted file manager you run on your own server. No cloud lock-in, full control over your data.

## Features

- **Browse & manage** — List, create folders, rename, move, copy, delete (with trash)
- **Upload** — Drag-and-drop, multipart uploads
- **Rich previews** — Images, video, audio, PDF, Markdown, JSON, CSV, HTML, text
- **Auth** — Google OAuth, GitHub OAuth, local users (bcrypt)
- **Admin settings** — YAML/JSON config, provider toggles, local users
- **Security** — Short-lived signed URLs for previews, JWT auth

## Quick start

[Getting Started](getting-started.md){ .md-button .md-button--primary }
[Configuration](config.md){ .md-button }

## Tech stack

- **Backend:** Go, Gin, JWT, OAuth2 (Google, GitHub)
- **Frontend:** React, TypeScript, Ant Design, Vite
