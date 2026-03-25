.PHONY: build build-app build-frontend build-app-embed test commitlint clean run run-frontend

# Build Go binary (output: app/filetree or app/filetree.exe)
build-app:
	cd app && go build -o filetree .

# Build frontend (output: app/web/dist/)
build-frontend:
	cd app/web && npm run build

# Single binary with embedded UI (Vite writes to app/web/dist; no copy step)
build-app-embed: build-frontend
	cd app && go build -tags embed -o filetree .

# Build both Go binary and frontend assets
all: build-app build-frontend

# Alias
build: all

# Validate last commit message (Conventional Commits)
commitlint:
	npx commitlint --last --verbose

# Run tests
test:
	cd app && go vet ./... && go test ./...
	cd app/web && npm run build

# Run Go server (dev)
run:
	./app/filetree

# Run frontend dev server (proxies /api to backend)
run-frontend:
	cd app/web && npm run dev

# Remove build artifacts
clean:
	rm -f app/filetree app/filetree.exe
	rm -rf app/web/dist frontend/dist
