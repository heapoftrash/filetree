---
title: Getting Started
icon: material/rocket-launch
---
# Getting Started

## Prerequisites

- Go 1.21+
- Node.js 18+

## Quick start

### 1. Backend

```bash
cd backend
go mod tidy
go run .
```

API runs at **http://localhost:8080**. Root directory is `./data` unless you set `ROOT_PATH`.

### 2. Frontend (dev)

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173** and proxies `/api` to the backend.

### 3. Production (single binary)

Build the frontend and backend, then run the binary:

```bash
# Build frontend assets
cd frontend && npm run build

# Build backend binary
cd ../backend && go build -o filetree .

# Run (from project root)
ROOT_PATH=/path/to/files CONFIG_FILE=./config.yaml ./backend/filetree
```

Then open **http://localhost:8080**. The binary serves the built frontend from `frontend/dist` when present. Deploy by copying the binary and `frontend/dist` folder.
