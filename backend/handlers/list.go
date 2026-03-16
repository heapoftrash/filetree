package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

type entry struct {
	Name     string    `json:"name"`
	Path     string    `json:"path"`
	IsDir    bool      `json:"isDir"`
	Size     int64     `json:"size,omitempty"`
	Modified time.Time `json:"modified"`
}

func (h *Handler) List(c *gin.Context) {
	rel := c.Query("path")
	abs, ok := h.safePath(rel)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path"})
		return
	}
	info, err := os.Stat(abs)
	if err != nil {
		if os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if !info.IsDir() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "not a directory"})
		return
	}
	entries, err := os.ReadDir(abs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	root := filepath.Clean(h.root)
	out := make([]entry, 0, len(entries))
	for _, e := range entries {
		full := filepath.Join(abs, e.Name())
		info, err := e.Info()
		if err != nil {
			continue
		}
		relPath, relErr := filepath.Rel(root, full)
		if relErr != nil {
			continue
		}
		if relPath == "" {
			relPath = "."
		}
		out = append(out, entry{
			Name:     e.Name(),
			Path:     filepath.ToSlash(relPath),
			IsDir:    e.IsDir(),
			Size:     info.Size(),
			Modified: info.ModTime(),
		})
	}
	c.JSON(http.StatusOK, gin.H{"entries": out})
}
