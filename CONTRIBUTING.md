# Contributing to Filetree

Thank you for your interest in contributing.

## Development setup

1. **Go (API):** `cd app && go mod tidy && go run .`
2. **UI:** `cd app/web && npm install && npm run dev`
3. Set `CONFIG_FILE=./config.yaml` and configure auth (see `config.example.yaml`).

## Commit messages

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/). CI validates messages on push and pull requests.

Format: `type(scope): subject` — e.g. `feat: add dark mode`, `fix(auth): resolve token expiry`.

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

Validate locally: `make commitlint` or `npx commitlint --last --verbose`

## Changelog

`CHANGELOG.md` is **generated** by [git-cliff](https://github.com/orhun/git-cliff) from commit history (see `cliff.toml`). Do not edit it by hand — use clear conventional commit subjects so the release history stays readable.

- Local preview: install [git-cliff](https://github.com/orhun/git-cliff/releases) and run `git-cliff -o CHANGELOG.md` (or `make changelog`).
- Opening or updating a **same-repo** pull request (with changes other than `CHANGELOG.md` alone) runs `.github/workflows/changelog.yml`, which regenerates `CHANGELOG.md` and **pushes a commit to the PR branch**. Fork PRs are skipped (Actions cannot push to forks). Use **Actions → Changelog → Run workflow** to regenerate on a chosen branch (e.g. `main`) when needed.

## Pull requests

1. Create a branch from `main`.
2. Ensure `go build ./... && go vet ./... && go test ./...` passes in `app`.
3. Ensure `npm run build` passes in `app/web`.
4. Optional: `make build` verifies the full embedded binary (frontend + `go build -tags embed`).
5. Open a PR with a clear description of the change.

## Code style

- **Go:** `gofmt`, `go vet`, `golangci-lint`
- **TypeScript/React:** Follow existing patterns in the codebase

## Go score & quality

CI runs these checks on the Go module under `app/`:

| Tool | Purpose |
|------|---------|
| `go build` | Compile |
| `go vet` | Static analysis |
| `go test` | Unit tests |
| `golangci-lint` | Linting (gofmt, errcheck, staticcheck, etc.) |
| `gosec` | Security scan |

Run locally:

```bash
cd app
go build ./... && go vet ./... && go test ./...
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest && golangci-lint run
go install github.com/securego/gosec/v2/cmd/gosec@latest && gosec ./...
```

If you fork the repo, update the Go Report Card badge in the README to point to your fork module path (e.g. `github.com/YOUR_ORG/filetree/app`) to see the score at [goreportcard.com](https://goreportcard.com).
