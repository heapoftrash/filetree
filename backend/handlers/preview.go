package handlers

import (
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

const maxPreviewTextSize = 512 * 1024 // 512KB

func (h *Handler) PreviewInfo(c *gin.Context) {
	rel := c.Query("path")
	abs, ok := h.safePath(rel)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path"})
		return
	}
	info, err := os.Stat(abs)
	if err != nil || info.IsDir() {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	name := filepath.Base(abs)
	mime := getContentType(name)
	category := getPreviewCategory(name)
	previewable := mime != "" || category == "text" || category == "markdown" || category == "json" || category == "csv" || category == "html"
	c.JSON(http.StatusOK, gin.H{
		"category":    category,
		"mimeType":    mime,
		"previewable": previewable,
	})
}

func (h *Handler) Preview(c *gin.Context) {
	rel := c.Query("path")
	abs, ok := h.safePath(rel)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path"})
		return
	}
	contentType := getContentType(filepath.Base(abs))
	if contentType != "" {
		f, err := os.Open(abs) // #nosec G304 -- abs validated via safePath
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		defer func() { _ = f.Close() }()
		c.Header("Content-Disposition", "inline")
		c.Header("Content-Type", contentType)
		c.Status(http.StatusOK)
		if _, err := io.Copy(c.Writer, f); err != nil {
			log.Printf("preview stream error for %s: %v", abs, err)
		}
		return
	}
	// Try as text
	body, err := ReadFileContent(abs, maxPreviewTextSize)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	if !IsTextFile(body) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "preview not available for this file type"})
		return
	}
	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.Header("Content-Disposition", "inline")
	c.Data(http.StatusOK, "text/plain; charset=utf-8", body)
}

func getContentType(name string) string {
	ext := strings.ToLower(filepath.Ext(name))
	switch ext {
	// Images
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	case ".svg":
		return "image/svg+xml"
	case ".bmp":
		return "image/bmp"
	case ".ico":
		return "image/x-icon"
	case ".tiff", ".tif":
		return "image/tiff"
	case ".avif":
		return "image/avif"
	// Documents
	case ".pdf":
		return "application/pdf"
	// Video
	case ".mp4":
		return "video/mp4"
	case ".webm":
		return "video/webm"
	case ".ogg", ".ogv":
		return "video/ogg"
	case ".mov":
		return "video/quicktime"
	// Audio
	case ".mp3":
		return "audio/mpeg"
	case ".wav":
		return "audio/wav"
	case ".m4a":
		return "audio/mp4"
	case ".flac":
		return "audio/flac"
	default:
		return ""
	}
}

// PreviewCategory is returned by the info endpoint for frontend routing.
func getPreviewCategory(name string) string {
	ext := strings.ToLower(filepath.Ext(name))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico", ".tiff", ".tif", ".avif":
		return "image"
	case ".pdf":
		return "pdf"
	case ".mp4", ".webm", ".ogg", ".ogv", ".mov":
		return "video"
	case ".mp3", ".wav", ".m4a", ".flac":
		return "audio"
	case ".md", ".markdown":
		return "markdown"
	case ".json":
		return "json"
	case ".csv":
		return "csv"
	case ".html", ".htm":
		return "html"
	default:
		return "text"
	}
}
