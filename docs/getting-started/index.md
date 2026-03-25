---
title: Getting Started
icon: material/rocket-launch
---

# Getting Started

<strong>Filetree</strong> is minimalistic, self-hosted file manager. No database to configure, no cloud sign-up, no vendor lock-in — just a single binary and a config file. Your files stay under your control.

## From homelab to open source

Filetree started as a simple homelab project — a way to browse and manage files on my home server without exposing it to the cloud or dealing with heavy, database-backed alternatives. I wanted something minimal: one binary, a config file and control over my own data.

Over time, it grew, I added auth, previews, signed URLs, and an admin UI. What began as a personal tool became something I thought others might find useful. If you're running a homelab, a small team server, or just want your files under your control, Filetree is for you.

## Features

- **Minimal setup** — Build once, run anywhere. Single binary or a small Container image.
- **No database** — No complex setup, everything lives in a [config](/configuration) file. Add local users, toggle auth providers, and adjust settings without migrations or extra services.
- **Fast and lightweight** — Built with Go. Starts in milliseconds, uses little memory.
- **Works everywhere** — Responsive interface for desktop, tablet, and mobile. Access your files from any browser.
- **Browse & manage** — Create folders, rename, move, copy, delete (with trash). Drag-and-drop to upload.
- **Rich previews** — Images, video, audio, PDF, Markdown, JSON, CSV, HTML, text — preview in the browser.
- **Secure auth** — Sign in with Google, GitHub, or local users. JWT-based sessions.
- **Signed URLs** — Share short-lived links for previews and downloads. Time-limited, no long-lived links.
- **Admin UI** — Manage auth providers and users from the Settings page. No config editing required.

## Quick start

=== "Single binary"

    **Download** pre-built binaries from [GitHub Releases](https://github.com/heapoftrash/filetree/releases/latest) if available. If the release ships a UI bundle, place it where the binary expects it (see [Installation](installation.md)), then:

    ```bash
    ROOT_PATH=./data ./filetree
    ```

    Or build from source (**one embedded binary**):

    ```bash
    make build
    ROOT_PATH=./data ./app/filetree
    ```

    For a **disk-only** UI (no embed), use `make build-app` and `make build-frontend`, then run `./app/filetree` from the repo root so it serves `app/web/dist` (or `app/uiembed/dist` if you ran `make embed-ui`).

    For production:

    ```bash
    ROOT_PATH=/path/to/files CONFIG_FILE=./config.yaml ./filetree
    ```

=== "Container image :material-information:{ .info } <small>recommended</small>"

    The prebuilt OCI complaint container image is a great way to get up and running in a few minutes, as it comes with all dependencies pre-installed. 
    **Pull** the pre-built image from [GitHub Container Registry](https://github.com/heapoftrash/filetree/pkgs/container/filetree):

    ```bash
    docker pull ghcr.io/heapoftrash/filetree:latest
    docker run -p 8080:8080 -v /path/to/files:/data ghcr.io/heapoftrash/filetree:latest
    ```

    Or build from source:

    ```bash
    docker build -f Containerfile -t filetree .
    docker run -p 8080:8080 -v /path/to/files:/data filetree
    ```

    Then open **http://localhost:8080**. Use `ghcr.io/heapoftrash/filetree:v1.0.0` for a specific version.

=== "From git"

    Filetree can be directly used from GitHub by cloning the repository into a subfolder of your project root which might be useful if you want to use the very latest version:

    Clone and build from source:
    ```bash
    git clone https://github.com/heapoftrash/filetree.git
    cd filetree
    ```
    Build the UI and Go binary:
    ```bash
    make build
    ```
    Run from the project root:
    ```bash
    ROOT_PATH=./data ./app/filetree
    ```
    Then open **http://localhost:8080**.

## Open source

Filetree is MIT licensed. Host it yourself, modify it, contribute. No vendor lock-in — your files stay under your control.
