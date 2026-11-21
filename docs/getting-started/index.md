---
title: Getting Started
icon: material/rocket-launch
hide:
  - toc
features:
  - title: Container
    icon: material/docker
    description: Pull a prebuilt image from GHCR and run with Docker or Podman
    link: getting-started/container/
  - title: Single binary
    icon: material/application-braces
    description: Download a release binary for Linux, macOS, or Windows
    link: getting-started/single-binary/
  - title: Configuration
    icon: material/cog
    description: Point Filetree at your files and optional auth settings
    link: getting-started/configuration/
---

# Getting Started

Deploy Filetree in a few minutes. Choose how you want to run it, then add configuration if you need auth or custom paths.

The cards above open the full guides. Quick links:

| Guide | What you’ll do |
|-------|----------------|
| [Container](container.md) | Pull from GHCR, pick a tag, `docker run` |
| [Single binary](single-binary.md) | Download a release archive and run one binary |
| [Configuration](configuration/) | Config file + environment variables |

Also useful once you’re running:

- [Installation](installation.md) — build from source / local development
- [Production](production.md) — reverse proxy, HTTPS, embed vs disk UI
- [Authentication](../authentication/) — Google, GitHub, or local users
