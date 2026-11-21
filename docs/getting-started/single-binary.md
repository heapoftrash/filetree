---
title: Single binary
icon: material/application-braces
---

# Single binary

Release binaries ship on [GitHub Releases](https://github.com/heapoftrash/filetree/releases) with the UI embedded — one file to download and run.

## Where to get it

1. Open [Releases](https://github.com/heapoftrash/filetree/releases/latest).
2. Download the archive for your OS/CPU (and `sha256sums.txt` to verify).
3. Extract the `filetree` binary (or `filetree.exe` on Windows).

## Available builds

Asset names look like `filetree_<version>_<os>_<arch>.tar.gz` (`.zip` on Windows):

| Asset pattern | Platform |
|---------------|----------|
| `…_linux_amd64.tar.gz` | Linux x86_64 |
| `…_linux_arm64.tar.gz` | Linux aarch64 |
| `…_linux_armv7.tar.gz` | Linux ARMv7 |
| `…_darwin_amd64.tar.gz` | macOS Intel |
| `…_darwin_arm64.tar.gz` | macOS Apple Silicon |
| `…_windows_amd64.zip` | Windows x86_64 |

Example for Linux amd64:

```bash
# replace VERSION with e.g. v1.0.0
curl -fsSL -O "https://github.com/heapoftrash/filetree/releases/download/VERSION/filetree_VERSION_linux_amd64.tar.gz"
tar -xzf filetree_VERSION_linux_amd64.tar.gz
chmod +x filetree
```

## Run

```bash
ROOT_PATH=/path/to/your/files ./filetree
```

With a config file:

```bash
ROOT_PATH=/path/to/your/files CONFIG_FILE=./config.yaml ./filetree
```

Then open **http://localhost:8080**.

## Next steps

- [Configuration](../configuration/) — config file and environment variables
- [Build from source](build-from-source.md) — build from source instead of downloading
