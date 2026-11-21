---
title: Configuration
icon: material/cog
hide:
  - toc
features:
  - title: Config file
    icon: material/file-cog
    description: YAML or JSON schema for server, auth, frontend, and users
    link: configuration/config-file/
  - title: Environment variables
    icon: material/variable
    description: Override any setting via env — useful for secrets and deploys
    link: configuration/environment-variables/
---

# Configuration

Config is optional for a quick local try (`ROOT_PATH` alone is enough). For real deployments, use a config file and/or environment variables.

**Load order:** environment variables → config file → defaults.

The cards above open the full references. Quick start:

1. Copy [`config.example.yaml`](https://github.com/heapoftrash/filetree/blob/main/config.example.yaml) (or the [JSON example](https://github.com/heapoftrash/filetree/blob/main/config.example.json)) to `config.yaml`.
2. Set at least:

```yaml
server:
  root_path: ./data   # or rely on ROOT_PATH env

auth:
  jwt_secret: change-me-in-production
```

3. Start with `CONFIG_FILE` pointing at that file — see [Container](../getting-started/container.md) or [Single binary](../getting-started/single-binary.md).

Auth setup: [Authentication](../authentication/).
