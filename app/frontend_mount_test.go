package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"

	"github.com/gin-gonic/gin"
)

func TestServeIndexHTMLNoRedirect(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dist := fstest.MapFS{
		"index.html": &fstest.MapFile{Data: []byte("<!doctype html><title>x</title>")},
	}
	for _, method := range []string{http.MethodGet, http.MethodHead} {
		t.Run(method, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(method, "http://example.com/", nil)
			serveIndexHTML(c, dist)
			if w.Code != http.StatusOK {
				t.Fatalf("status: %d", w.Code)
			}
			if loc := w.Header().Get("Location"); loc != "" {
				t.Fatalf("unexpected redirect Location %q (FileServer index.html bug)", loc)
			}
			if method == http.MethodGet && w.Body.Len() == 0 {
				t.Fatal("expected body for GET")
			}
		})
	}
}
