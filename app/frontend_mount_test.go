package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
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

func TestAttachDistRoutes_AssetsAvailable(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dist := fstest.MapFS{
		"index.html":    &fstest.MapFile{Data: []byte(`<!doctype html><script type="module" src="/assets/main-abc.js"></script>`)},
		"assets/main-abc.js": &fstest.MapFile{Data: []byte("export default function () {}")},
		"favicon.svg":   &fstest.MapFile{Data: []byte("<svg xmlns='http://www.w3.org/2000/svg'/>")},
		"icon-light.svg": &fstest.MapFile{Data: []byte("<svg xmlns='http://www.w3.org/2000/svg' id='light'/>")},
	}
	r := gin.New()
	attachDistRoutes(r, dist)

	t.Run("GET asset", func(t *testing.T) {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/assets/main-abc.js", nil)
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("status: %d body=%q", w.Code, w.Body.String())
		}
		if !strings.Contains(w.Body.String(), "export default") {
			t.Fatalf("unexpected body: %q", w.Body.String())
		}
	})

	t.Run("GET favicon", func(t *testing.T) {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/favicon.svg", nil))
		if w.Code != http.StatusOK {
			t.Fatalf("status: %d", w.Code)
		}
		if !strings.Contains(w.Body.String(), "<svg") {
			t.Fatalf("expected svg: %q", w.Body.String())
		}
	})

	t.Run("GET icon-light", func(t *testing.T) {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/icon-light.svg", nil))
		if w.Code != http.StatusOK {
			t.Fatalf("status: %d", w.Code)
		}
		if !strings.Contains(w.Body.String(), "id='light'") {
			t.Fatalf("expected icon: %q", w.Body.String())
		}
	})
}

func TestAttachDistRoutes_SPAFallbackServesIndex(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dist := fstest.MapFS{
		"index.html":         &fstest.MapFile{Data: []byte("<!doctype html><div id=root></div>")},
		"assets/chunk.js":    &fstest.MapFile{Data: []byte("// chunk")},
	}
	r := gin.New()
	attachDistRoutes(r, dist)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/files/some/path", nil))
	if w.Code != http.StatusOK {
		t.Fatalf("status: %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), `id=root`) {
		t.Fatalf("expected index shell, got: %q", w.Body.String())
	}
}

func TestAttachDistRoutes_NoAssetsDirStillServesIndex(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dist := fstest.MapFS{
		"index.html": &fstest.MapFile{Data: []byte("<html>minimal</html>")},
	}
	r := gin.New()
	attachDistRoutes(r, dist)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/", nil))
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), "minimal") {
		t.Fatalf("GET /: %d body=%q", w.Code, w.Body.String())
	}

	// No assets/: StaticFS is not registered; unmatched /assets/* falls through to NoRoute (SPA shell).
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, httptest.NewRequest(http.MethodGet, "/assets/missing.js", nil))
	if w2.Code != http.StatusOK || !strings.Contains(w2.Body.String(), "minimal") {
		t.Fatalf("GET /assets/missing.js: %d body=%q", w2.Code, w2.Body.String())
	}
}
