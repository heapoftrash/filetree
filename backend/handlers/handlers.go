package handlers

import (
	"path/filepath"
)

type Handler struct {
	root            string
	maxUploadBytes  int64
}

func New(root string, maxUploadBytes int64) (*Handler, error) {
	abs, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}
	return &Handler{root: abs, maxUploadBytes: maxUploadBytes}, nil
}

// safePath resolves path relative to root and returns false if it escapes.
func (h *Handler) safePath(rel string) (string, bool) {
	if rel == "" || rel == "." {
		return h.root, true
	}
	joined := filepath.Join(h.root, filepath.Clean(rel))
	abs, err := filepath.Abs(joined)
	if err != nil {
		return "", false
	}
	root := filepath.Clean(h.root)
	if abs == root {
		return abs, true
	}
	sep := string(filepath.Separator)
	prefix := root + sep
	if len(abs) <= len(prefix) || abs[:len(prefix)] != prefix {
		return "", false
	}
	return abs, true
}

// pathUnderRoot returns true if abs is root or a descendant of root (respects path boundaries).
func pathUnderRoot(abs, root string) bool {
	root = filepath.Clean(root)
	abs = filepath.Clean(abs)
	if abs == root {
		return true
	}
	sep := string(filepath.Separator)
	prefix := root + sep
	return len(abs) > len(prefix) && abs[:len(prefix)] == prefix
}
