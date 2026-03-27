.PHONY: build all build-app build-frontend embed-ui build-app-embed test commitlint clean run run-frontend

VERSION := $(shell tr -d '\n' < version.txt 2>/dev/null || echo dev)
COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo unknown)
GO_LDFLAGS := -X github.com/heapoftrash/filetree/app/version.Version=$(VERSION) -X github.com/heapoftrash/filetree/app/version.Commit=$(COMMIT)

# One binary with embedded UI: Vite → app/web/dist → app/uiembed/dist → go build -tags embed
build: embed-ui
	cd app && go build -tags embed -ldflags "$(GO_LDFLAGS)" -o filetree .

all: build

# Same as build (kept for scripts and docs that name it explicitly)
build-app-embed: build

# Go only, no embed (dev: skip npm when UI unchanged; serve from app/web/dist on disk if present)
build-app:
	cd app && go build -ldflags "$(GO_LDFLAGS)" -o filetree .

# Frontend (output: app/web/dist/)
build-frontend:
	cd app/web && npm run build

# Stage static files for go:embed (used by build). Prereqs build-frontend so `make -j` cannot copy before Vite finishes.
embed-ui: build-frontend
	rm -rf app/uiembed/dist
	mkdir -p app/uiembed/dist
	cp -R app/web/dist/. app/uiembed/dist/

commitlint:
	npx commitlint --last --verbose

test:
	cd app && go vet ./... && go test ./...
	cd app/web && npm run build

run:
	./app/filetree

run-frontend:
	cd app/web && npm run dev

clean:
	rm -f app/filetree app/filetree.exe
	rm -rf app/web/dist app/uiembed/dist frontend/dist
