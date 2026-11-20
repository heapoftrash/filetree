package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestUploadLimits(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	h, err := New(dir, 2097152)
	if err != nil {
		t.Fatal(err)
	}
	r := gin.New()
	r.GET("/upload-limits", h.UploadLimits)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/upload-limits", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("status %d", w.Code)
	}
	var body struct {
		MaxUploadBytes int64 `json:"max_upload_bytes"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.MaxUploadBytes != 2097152 {
		t.Fatalf("got %d", body.MaxUploadBytes)
	}
}

func TestUpload_ContentLengthTooLarge(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	const maxBytes int64 = 1024
	h, err := New(dir, maxBytes)
	if err != nil {
		t.Fatal(err)
	}
	r := gin.New()
	r.POST("/", h.CreateOrUpload)

	// Oversized Content-Length with multipart Content-Type; body need not match.
	body := strings.NewReader("x")
	req := httptest.NewRequest(http.MethodPost, "/", body)
	req.Header.Set("Content-Type", "multipart/form-data; boundary=----x")
	req.ContentLength = maxBytes + multipartSlack + 1

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("status %d body %s", w.Code, w.Body.String())
	}
	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if resp["error"] != "upload exceeds size limit" {
		t.Fatalf("error: %v", resp["error"])
	}
	if got, ok := resp["max_upload_bytes"].(float64); !ok || int64(got) != maxBytes {
		t.Fatalf("max_upload_bytes: %v", resp["max_upload_bytes"])
	}
	// Ensure nothing was written under root
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 0 {
		t.Fatalf("expected empty root, got %v", entries)
	}
}

func TestUpload_UnderLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	h, err := New(dir, 1<<20)
	if err != nil {
		t.Fatal(err)
	}
	r := gin.New()
	r.POST("/", h.CreateOrUpload)

	boundary := "----testboundary"
	var b strings.Builder
	b.WriteString("--" + boundary + "\r\n")
	b.WriteString(`Content-Disposition: form-data; name="path"` + "\r\n\r\n")
	b.WriteString(".\r\n")
	b.WriteString("--" + boundary + "\r\n")
	b.WriteString(`Content-Disposition: form-data; name="files"; filename="hi.txt"` + "\r\n")
	b.WriteString("Content-Type: text/plain\r\n\r\n")
	b.WriteString("hello\r\n")
	b.WriteString("--" + boundary + "--\r\n")
	payload := b.String()

	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(payload))
	req.Header.Set("Content-Type", "multipart/form-data; boundary="+boundary)
	req.ContentLength = int64(len(payload))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("status %d body %s", w.Code, w.Body.String())
	}
	if _, err := os.Stat(filepath.Join(dir, "hi.txt")); err != nil {
		t.Fatal(err)
	}
}
