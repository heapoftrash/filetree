package handlers

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return f(r)
}

func jsonOKResponse(body string) *http.Response {
	return &http.Response{
		StatusCode: http.StatusOK,
		Body:       io.NopCloser(strings.NewReader(body)),
		Header:     make(http.Header),
	}
}

func TestLatestGitHubReleaseCancelDoesNotPoisonCache(t *testing.T) {
	tr := roundTripFunc(func(r *http.Request) (*http.Response, error) {
		return nil, context.Canceled
	})
	h := &VersionHandler{client: &http.Client{Transport: tr}}
	_, _, _, ok := h.latestGitHubRelease(context.Background())
	if ok {
		t.Fatal("expected no release after cancel")
	}
	h.mu.Lock()
	pop := h.cache.populated
	h.mu.Unlock()
	if pop {
		t.Fatal("failed fetch must not mark cache populated")
	}
}

func TestLatestGitHubReleaseRetryAfterCancel(t *testing.T) {
	const body = `{"tag_name":"v1.0.0","html_url":"https://github.com/o/r/releases/tag/v1.0.0"}`
	var n int
	tr := roundTripFunc(func(r *http.Request) (*http.Response, error) {
		n++
		if n == 1 {
			return nil, context.Canceled
		}
		return jsonOKResponse(body), nil
	})
	h := &VersionHandler{client: &http.Client{Transport: tr}}
	_, _, _, ok := h.latestGitHubRelease(context.Background())
	if ok || n != 1 {
		t.Fatalf("first call: ok=%v, n=%d", ok, n)
	}
	tag, _, _, ok2 := h.latestGitHubRelease(context.Background())
	if !ok2 || tag != "v1.0.0" || n != 2 {
		t.Fatalf("second call: ok=%v tag=%q n=%d", ok2, tag, n)
	}
}

func TestLatestGitHubReleaseErrorReturnsStaleWhenPresent(t *testing.T) {
	h := &VersionHandler{
		client: &http.Client{
			Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
				return nil, context.Canceled
			}),
		},
	}
	h.mu.Lock()
	h.cache.populated = true
	h.cache.at = time.Now()
	h.cache.tagName = "1.0.0"
	h.cache.htmlURL = "https://github.com/o/r/releases/tag/v1.0.0"
	h.cache.kind = "release"
	h.mu.Unlock()

	tag, u, k, ok := h.latestGitHubRelease(context.Background())
	if !ok || tag != "1.0.0" || u == "" || k != "release" {
		t.Fatalf("want stale cache, got ok=%v tag=%q url=%q kind=%q", ok, tag, u, k)
	}
}
