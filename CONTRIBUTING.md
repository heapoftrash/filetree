# Contributing to Filetree

Thank you for your interest in contributing.

## Development setup

1. **Backend:** `cd backend && go mod tidy && go run .`
2. **Frontend:** `cd frontend && npm install && npm run dev`
3. Set `CONFIG_FILE=./config.yaml` and configure auth (see `config.example.yaml`).

## Commit messages

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/). CI validates messages on push and pull requests.

Format: `type(scope): subject` — e.g. `feat: add dark mode`, `fix(auth): resolve token expiry`.

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

Validate locally: `make commitlint` or `npx commitlint --last --verbose`

## Pull requests

1. Create a branch from `main`.
2. Ensure `go build ./... && go vet ./... && go test ./...` passes in `backend`.
3. Ensure `npm run build` passes in `frontend`.
4. Open a PR with a clear description of the change.

## Code style

- **Go:** `gofmt`, `go vet`, `golangci-lint`
- **TypeScript/React:** Follow existing patterns in the codebase

## Go score & quality

CI runs these checks on the backend:

| Tool | Purpose |
|------|---------|
| `go build` | Compile |
| `go vet` | Static analysis |
| `go test` | Unit tests |
| `golangci-lint` | Linting (gofmt, errcheck, staticcheck, etc.) |
| `gosec` | Security scan |

Run locally:

```bash
cd backend
go build ./... && go vet ./... && go test ./...
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest && golangci-lint run
go install github.com/securego/gosec/v2/cmd/gosec@latest && gosec ./...
```

Replace `YOUR_ORG` in the Go Report Card badge (README) with your GitHub org/username to see the score at [goreportcard.com](https://goreportcard.com).
