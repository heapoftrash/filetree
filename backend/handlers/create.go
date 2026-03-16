package handlers

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

func (h *Handler) CreateOrUpload(c *gin.Context) {
	contentType := c.GetHeader("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		h.upload(c)
		return
	}
	h.createDir(c)
}

func (h *Handler) createDir(c *gin.Context) {
	var body struct {
		Path string `json:"path"`
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path and name required"})
		return
	}
	abs, ok := h.safePath(body.Path)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path"})
		return
	}
	newPath := filepath.Join(abs, filepath.Clean(body.Name))
	if !pathUnderRoot(newPath, h.root) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path"})
		return
	}
	if err := os.MkdirAll(newPath, 0750); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	relPath, err := filepath.Rel(h.root, newPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid path"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"path": filepath.ToSlash(relPath)})
}

func (h *Handler) upload(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, h.maxUploadBytes)
	form, err := c.MultipartForm()
	if err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "upload exceeds size limit"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "multipart required"})
		return
	}
	rel := ""
	if v := form.Value["path"]; len(v) > 0 {
		rel = v[0]
	}
	abs, ok := h.safePath(rel)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path"})
		return
	}
	files := form.File["files"]
	if len(files) == 0 {
		files = form.File["file"]
	}
	for _, fh := range files {
		dst := filepath.Join(abs, filepath.Base(fh.Filename))
		if err := c.SaveUploadedFile(fh, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	c.JSON(http.StatusCreated, gin.H{"uploaded": len(files)})
}