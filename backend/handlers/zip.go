package handlers

import (
	"archive/zip"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func (h *Handler) DownloadZip(c *gin.Context) {
	var body struct {
		Paths []string `json:"paths"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || len(body.Paths) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "paths array required"})
		return
	}
	c.Header("Content-Type", "application/zip")
	c.Header("Content-Disposition", "attachment; filename=\"download.zip\"")
	c.Header("Transfer-Encoding", "chunked")
	c.Status(http.StatusOK)
	zw := zip.NewWriter(c.Writer)
	defer zw.Close()

	seen := make(map[string]bool)
	for _, rel := range body.Paths {
		abs, ok := h.safePath(rel)
		if !ok {
			continue
		}
		info, err := os.Stat(abs)
		if err != nil {
			continue
		}
		zipName := filepath.ToSlash(rel)
		if zipName == "" || zipName == "." {
			continue
		}
		if info.IsDir() {
			addDirToZip(zw, abs, zipName+"/", seen)
		} else {
			addFileToZip(zw, abs, zipName, seen)
		}
	}
}

func addFileToZip(zw *zip.Writer, absPath, zipName string, seen map[string]bool) {
	if seen[zipName] {
		return
	}
	seen[zipName] = true
	f, err := os.Open(absPath) // #nosec G304 -- absPath validated via safePath before call
	if err != nil {
		return
	}
	defer f.Close()
	info, _ := f.Stat()
	wh, _ := zip.FileInfoHeader(info)
	wh.Name = zipName
	wh.Method = zip.Deflate
	w, err := zw.CreateHeader(wh)
	if err != nil {
		return
	}
	_, _ = io.Copy(w, f)
}

func addDirToZip(zw *zip.Writer, dirPath, zipPrefix string, seen map[string]bool) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return
	}
	for _, e := range entries {
		full := filepath.Join(dirPath, e.Name())
		name := zipPrefix + e.Name()
		if e.IsDir() {
			addDirToZip(zw, full, name+"/", seen)
		} else {
			addFileToZip(zw, full, name, seen)
		}
	}
}

// ReadFileContent reads up to maxBytes from the file at absPath.
func ReadFileContent(absPath string, maxBytes int64) ([]byte, error) {
	f, err := os.Open(absPath) // #nosec G304 -- absPath validated via safePath before call
	if err != nil {
		return nil, err
	}
	defer f.Close()
	if maxBytes <= 0 {
		maxBytes = 512 * 1024 // 512KB default
	}
	return io.ReadAll(io.LimitReader(f, maxBytes))
}

// IsTextFile checks if content looks like text (for preview).
func IsTextFile(content []byte) bool {
	if len(content) == 0 {
		return true
	}
	for i, b := range content {
		if i >= 512 {
			break
		}
		if b == 0 {
			return false
		}
		if b < 32 && b != '\t' && b != '\n' && b != '\r' {
			return false
		}
	}
	return true
}
