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

## Releases and changelog

Release automation uses [Release Please](https://github.com/googleapis/release-please) (`.github/workflows/release-please.yml`):

- Land **conventional commits** on `main` (`feat:`, `fix:`, `chore:`, …).
- Release Please opens a **release PR** that bumps `version.txt` / `.release-please-manifest.json` and updates `CHANGELOG.md`. **Merge that PR** to cut a release (tag + GitHub Release). Versions use **beta** prereleases (e.g. `v0.0.4-beta`). `bump-patch-for-minor-pre-major` keeps `feat:` on **0.0.x** before 1.0.
- If a release PR shows the wrong version (e.g. `0.1.0` after a config change), **close it without merging** and let the next Release Please run refresh the PR, or push a small commit to `main` to retrigger.
- The **Release** workflow (`.github/workflows/release.yml`) runs on **version tags** and adds binaries, `sha256sums.txt`, and the multi-arch container image.

**Token (recommended):** Add a [fine-grained or classic PAT](https://github.com/settings/tokens) with `contents` (and `workflow` if needed) as repository secret **`RELEASE_PLEASE_TOKEN`**, and reference it in the Release Please workflow. If you use only the default `GITHUB_TOKEN`, tag pushes from Release Please **may not** trigger other workflows (GitHub limitation); a PAT avoids that.

Enable **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests** so Release Please can open/update release PRs.

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
