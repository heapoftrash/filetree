.PHONY: build build-backend build-frontend build-backend-embed embed-frontend test commitlint clean run-backend run-frontend

# Build Go binary (output: backend/filetree or backend/filetree.exe)
build-backend:
	cd backend && go build -o filetree .

# Build frontend (output: frontend/dist/)
build-frontend:
	cd frontend && npm run build

# Copy Vite output into backend/web/dist (required before build-backend-embed)
embed-frontend:
	rm -rf backend/web/dist
	cp -R frontend/dist backend/web/dist

# Single binary with embedded UI (needs frontend/dist; use after build-frontend)
build-backend-embed: embed-frontend
	cd backend && go build -tags embed -o filetree .

# Build both backend binary and frontend assets
all: build-backend build-frontend

# Alias
build: all

# Validate last commit message (Conventional Commits)
commitlint:
	npx commitlint --last --verbose

# Run tests
test:
	cd backend && go vet ./... && go test ./...
	cd frontend && npm run build

# Run Go backend (dev)
run:
	./backend/filetree

# Run frontend dev server (proxies /api to backend)
run-frontend:
	cd frontend && npm run dev

# Remove build artifacts
clean:
	rm -f backend/filetree backend/filetree.exe
	rm -rf frontend/dist backend/web/dist
