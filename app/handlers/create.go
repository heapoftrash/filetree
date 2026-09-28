package handlers

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// multipartSlack is allowance for multipart framing beyond raw file bytes
// when rejecting oversized uploads via Content-Length.
const multipartSlack = 64 << 10 // 64 KiB

func (h *Handler) CreateOrUpload(c *gin.Context) {
	contentType := c.GetHeader("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		h.upload(c)
		return
	}
	h.createDir(c)
}

// UploadLimits returns the effective max upload size enforced by this handler.
func (h *Handler) UploadLimits(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"max_upload_bytes": h.maxUploadBytes})
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

func (h *Handler) uploadTooLarge(c *gin.Context) {
	c.JSON(http.StatusRequestEntityTooLarge, gin.H{
		"error":            "upload exceeds size limit",
		"max_upload_bytes": h.maxUploadBytes,
	})
}

func (h *Handler) upload(c *gin.Context) {
	if cl := c.Request.ContentLength; cl > 0 && cl > h.maxUploadBytes+multipartSlack {
		h.uploadTooLarge(c)
		return
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, h.maxUploadBytes)
	form, err := c.MultipartForm()
	if err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			h.uploadTooLarge(c)
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
