package handlers

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func (h *Handler) Rename(c *gin.Context) {
	var body struct {
		Path      string `json:"path"`
		NewName   string `json:"newName"`
		Overwrite bool   `json:"overwrite"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.NewName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path and newName required"})
		return
	}
	abs, ok := h.safePath(body.Path)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path"})
		return
	}
	newName := filepath.Clean(body.NewName)
	if newName == "" || newName == "." || newName == ".." {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid newName"})
		return
	}
	dir := filepath.Dir(abs)
	dest := filepath.Join(dir, newName)
	if !pathUnderRoot(dest, h.root) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path"})
		return
	}
	if dest != abs {
		if _, err := os.Stat(dest); err == nil && !body.Overwrite {
			c.JSON(http.StatusConflict, gin.H{
				"error":    "file or folder already exists",
				"conflict": true,
				"path":     dest,
			})
			return
		}
		if body.Overwrite {
			_ = os.RemoveAll(dest)
		}
	}
	if err := os.Rename(abs, dest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"path": dest})
}
