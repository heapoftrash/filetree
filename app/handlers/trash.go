package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const trashPrefix = ".trash"

func (h *Handler) Delete(c *gin.Context) {
	permanent := c.Query("permanent") == "true"
	rel := c.Query("path")
	abs, ok := h.safePath(rel)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path"})
		return
	}
	if abs == h.root {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot delete root"})
		return
	}
	// If already in trash, permanently delete (avoid nested trash)
	relSlash := filepath.ToSlash(filepath.Clean(rel))
	if strings.HasPrefix(relSlash, trashPrefix+"/") || relSlash == trashPrefix {
		if err := os.RemoveAll(abs); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true, "permanent": true})
		return
	}
	if permanent {
		if err := os.RemoveAll(abs); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true, "permanent": true})
		return
	}
	// Move to trash
	trashDir := filepath.Join(h.root, trashPrefix)
	if err := os.MkdirAll(trashDir, 0750); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ts := strconv.FormatInt(time.Now().Unix(), 10)
	trashSub := filepath.Join(trashDir, ts)
	if err := os.MkdirAll(trashSub, 0750); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	dest := filepath.Join(trashSub, rel)
	if rel == "" || rel == "." {
		dest = filepath.Join(trashSub, filepath.Base(abs))
	}
	destDir := filepath.Dir(dest)
	if err := os.MkdirAll(destDir, 0750); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if err := os.Rename(abs, dest); err != nil {
		if err := copyThenRemove(abs, dest); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	trashPath := filepath.ToSlash(filepath.Join(trashPrefix, ts, rel))
	if rel == "" || rel == "." {
		trashPath = filepath.ToSlash(filepath.Join(trashPrefix, ts, filepath.Base(abs)))
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "trashPath": trashPath})
}

func (h *Handler) Restore(c *gin.Context) {
	var body struct {
		Path string `json:"path"` // path in trash, e.g. ".trash/1736940645/foo/bar.txt"
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Path == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path required"})
		return
	}
	trashPath := filepath.Clean(body.Path)
	if !strings.HasPrefix(trashPath, trashPrefix) {
		trashPath = filepath.Join(trashPrefix, trashPath)
	}
	abs, ok := h.safePath(trashPath)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path"})
		return
	}
	_, err := os.Stat(abs)
	if err != nil {
		if os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found in trash"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// Extract original path: .trash/TIMESTAMP/rest
	rest := strings.TrimPrefix(trashPath, trashPrefix+"/")
	parts := strings.SplitN(rest, "/", 2)
	if len(parts) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid trash path"})
		return
	}
	originalRel := parts[1]
	destAbs, ok := h.safePath(originalRel)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid restore path"})
		return
	}
	if err := os.MkdirAll(filepath.Dir(destAbs), 0750); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if err := os.Rename(abs, destAbs); err != nil {
		if err := copyThenRemove(abs, destAbs); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	h.removeEmptyTrashParents(abs)
	c.JSON(http.StatusOK, gin.H{"ok": true, "path": originalRel})
}

// removeEmptyTrashParents deletes empty directories from filepath.Dir(abs) upward,
// stopping before the `.trash` root (never removes `.trash` itself).
func (h *Handler) removeEmptyTrashParents(abs string) {
	trashRootAbs, ok := h.safePath(trashPrefix)
	if !ok {
		return
	}
	for d := filepath.Dir(abs); pathUnderRoot(d, trashRootAbs) && d != trashRootAbs; d = filepath.Dir(d) {
		if err := os.Remove(d); err != nil {
			break
		}
	}
}

func copyThenRemove(src, dest string) error {
	if err := copyRecursive(src, dest); err != nil {
		return err
	}
	return os.RemoveAll(src)
}
