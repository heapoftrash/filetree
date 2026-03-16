package handlers

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func (h *Handler) Move(c *gin.Context) {
	var body struct {
		From      string `json:"from"`
		To        string `json:"to"`
		Overwrite bool   `json:"overwrite"`
		NewName   string `json:"newName"` // for "keep both" - use this name instead
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.From == "" || body.To == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "from and to required"})
		return
	}
	fromAbs, ok := h.safePath(body.From)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid from path"})
		return
	}
	toDirAbs, ok := h.safePath(body.To)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid to path"})
		return
	}
	info, err := os.Stat(toDirAbs)
	if err != nil || !info.IsDir() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "to must be an existing directory"})
		return
	}
	name := filepath.Base(fromAbs)
	if body.NewName != "" {
		name = filepath.Clean(body.NewName)
		if name == "" || name == "." || name == ".." {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid newName"})
			return
		}
	}
	dest := filepath.Join(toDirAbs, name)
	if dest == fromAbs {
		c.JSON(http.StatusOK, gin.H{"ok": true})
		return
	}
	if _, err := os.Stat(dest); err == nil {
		if !body.Overwrite && body.NewName == "" {
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
	if err := os.Rename(fromAbs, dest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
