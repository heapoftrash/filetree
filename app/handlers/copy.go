package handlers

import (
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func (h *Handler) Copy(c *gin.Context) {
	var body struct {
		From      string `json:"from"`
		To        string `json:"to"`
		Overwrite bool   `json:"overwrite"`
		NewName   string `json:"newName"`
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
	if err := copyRecursive(fromAbs, dest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func copyRecursive(src, dest string) error {
	info, err := os.Stat(src)
	if err != nil {
		return err
	}
	if info.IsDir() {
		if err := os.MkdirAll(dest, info.Mode()); err != nil {
			return err
		}
		entries, err := os.ReadDir(src)
		if err != nil {
			return err
		}
		for _, e := range entries {
			if err := copyRecursive(filepath.Join(src, e.Name()), filepath.Join(dest, e.Name())); err != nil {
				return err
			}
		}
		return nil
	}
	return copyFile(src, dest)
}

func copyFile(src, dest string) error {
	in, err := os.Open(src) // #nosec G304 -- src/dest validated via safePath before copyRecursive
	if err != nil {
		return err
	}
	defer func() { _ = in.Close() }()
	out, err := os.Create(dest) // #nosec G304 -- dest validated via safePath before copyRecursive
	if err != nil {
		return err
	}
	defer func() { _ = out.Close() }()
	_, err = io.Copy(out, in)
	if err != nil {
		return err
	}
	info, _ := os.Stat(src)
	return os.Chmod(dest, info.Mode())
}
