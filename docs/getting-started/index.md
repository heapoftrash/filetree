---
title: Getting Started
icon: material/rocket-launch
---

# Getting Started

You're minutes away from a self-hosted file manager. No database to configure, no cloud sign-up, no vendor lock-in — just a single binary and a config file. Your files stay under your control.

## Why Filetree?

- **Minimal setup** — Build once, run anywhere. One process serves both the API and the web UI.
- **No database** — Everything lives in a YAML or JSON file. Add users, toggle auth providers, and adjust settings without migrations or extra services.
- **Fast and lightweight** — Built with Go. Starts in milliseconds, uses little memory. Copy the binary and `frontend/dist` to deploy.
- **Works everywhere** — Responsive interface for desktop, tablet, and mobile. Access your files from any browser.

## Prerequisites

- **Go 1.21+** — For the backend
- **Node.js 18+** — For building the frontend assets (only needed at build time; not required at runtime)

## Quick start

From the project root:

```bash
make build
ROOT_PATH=./data ./backend/filetree
```

Open **http://localhost:8080**. You'll see the file manager — browse, upload, preview, and manage files from your browser. Drag-and-drop uploads, rich previews for images and documents, and a folder tree for quick navigation.

## What's next?

| Step | What to do |
|------|------------|
| [Installation](installation.md) | Choose your path: make, from source, or development mode with hot reload |
| [Production](production.md) | Deploy to a server — reverse proxy, HTTPS, and production config |
| [Configuration](../configuration/index.md) | Set up your config file and environment variables |
| [Authentication](../authentication/index.md) | Enable Google OAuth, GitHub OAuth, or local username/password |

## Features at a glance

- **Browse & manage** — Create folders, rename, move, copy, delete (with trash). Drag-and-drop to upload.
- **Rich previews** — Images, video, audio, PDF, Markdown, JSON, CSV, HTML, text — preview in the browser.
- **Secure auth** — Sign in with Google, GitHub, or local users. JWT-based sessions.
- **Signed URLs** — Share short-lived links for previews and downloads. Time-limited, no long-lived links.
- **Admin UI** — Manage auth providers and users from the Settings page. No config editing required.

## Open source

Filetree is MIT licensed. Host it yourself, modify it, contribute. No vendor lock-in — your files stay under your control.
