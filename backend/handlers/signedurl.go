package handlers

import (
	"net/http"

	"github.com/heapoftrash/filetree/backend/middleware"

	"github.com/gin-gonic/gin"
)

type signedURLRequest struct {
	Path   string `json:"path"`
	Action string `json:"action"` // "preview" or "download"
}

// SignedURL returns a short-lived signed URL for preview or download.
func (h *Handler) SignedURL(c *gin.Context) {
	var req signedURLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	if req.Action != "preview" && req.Action != "download" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action must be preview or download"})
		return
	}
	if _, ok := h.safePath(req.Path); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path"})
		return
	}
	var url string
	if req.Action == "preview" {
		url = middleware.BuildSignedPreviewURL(req.Path)
	} else {
		url = middleware.BuildSignedDownloadURL(req.Path)
	}
	c.JSON(http.StatusOK, gin.H{"url": url})
}
