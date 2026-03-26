.PHONY: build all build-app build-frontend embed-ui build-app-embed test commitlint changelog clean run run-frontend

# One binary with embedded UI: Vite → app/web/dist → app/uiembed/dist → go build -tags embed
build: embed-ui
	cd app && go build -tags embed -o filetree .

all: build

# Same as build (kept for scripts and docs that name it explicitly)
build-app-embed: build

# Go only, no embed (dev: skip npm when UI unchanged; serve from app/web/dist on disk if present)
build-app:
	cd app && go build -o filetree .

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

changelog:
	@command -v git-cliff >/dev/null 2>&1 && git-cliff -o CHANGELOG.md || (echo "Install git-cliff: https://github.com/orhun/git-cliff/releases"; exit 1)

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
