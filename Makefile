.PHONY: build build-backend build-frontend test commitlint clean run-backend run-frontend

# Build Go binary (output: backend/filetree or backend/filetree.exe)
build-backend:
	cd backend && go build -o filetree .

# Build frontend (output: frontend/dist/)
build-frontend:
	cd frontend && npm run build

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
	rm -rf frontend/dist
