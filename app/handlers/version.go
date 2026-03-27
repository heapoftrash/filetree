package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/heapoftrash/filetree/app/version"
	"golang.org/x/mod/semver"
)

const githubAPICacheTTL = 30 * time.Minute

// VersionHandler serves GET /api/version and checks GitHub for a newer release.
type VersionHandler struct {
	client *http.Client
	mu     sync.Mutex
	cache  struct {
		at         time.Time
		tagName    string
		htmlURL    string
		kind       string // "release" or "tag"
		populated  bool // true after any completed fetch (success or empty)
	}
}

// NewVersionHandler constructs a handler with a reasonable HTTP timeout.
func NewVersionHandler() *VersionHandler {
	return &VersionHandler{
		client: &http.Client{Timeout: 15 * time.Second},
	}
}

// VersionResponse is JSON for GET /api/version.
type VersionResponse struct {
	Version         string `json:"version"`
	Commit          string `json:"commit"`
	Comparable      bool   `json:"comparable"` // running version parses as semver; if false, do not treat !update_available as "up to date"
	UpdateAvailable bool   `json:"update_available"`
	LatestVersion   string `json:"latest_version,omitempty"`
	ReleaseURL      string `json:"release_url,omitempty"`
	ReleaseURLKind  string `json:"release_url_kind,omitempty"` // "release" or "tag"
}

// Get returns the running version and whether a newer GitHub release exists.
func (h *VersionHandler) Get(c *gin.Context) {
	out := VersionResponse{
		Version:    version.Version,
		Commit:     version.Commit,
		Comparable: canonicalSemver(version.Version) != "",
	}

	tag, relURL, kind, ok := h.latestGitHubRelease(c.Request.Context())
	if !ok || tag == "" {
		c.JSON(http.StatusOK, out)
		return
	}

	latest := strings.TrimPrefix(strings.TrimSpace(tag), "v")
	out.LatestVersion = latest
	out.ReleaseURL = relURL
	out.ReleaseURLKind = kind

	if semverNewer(latest, version.Version) {
		out.UpdateAvailable = true
	}

	c.JSON(http.StatusOK, out)
}

func semverNewer(latest, current string) bool {
	lv := canonicalSemver(latest)
	cv := canonicalSemver(current)
	if lv == "" || cv == "" {
		return false
	}
	return semver.Compare(lv, cv) > 0
}

func canonicalSemver(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "v")
	if s == "" {
		return ""
	}
	v := "v" + s
	if !semver.IsValid(v) {
		return ""
	}
	return semver.Canonical(v)
}

func (h *VersionHandler) latestGitHubRelease(ctx context.Context) (tagName, htmlURL, kind string, ok bool) {
	h.mu.Lock()
	if h.cache.populated && time.Since(h.cache.at) < githubAPICacheTTL {
		t, u, k := h.cache.tagName, h.cache.htmlURL, h.cache.kind
		h.mu.Unlock()
		return t, u, k, t != ""
	}
	h.mu.Unlock()

	tag, u, k, err := fetchLatestReleaseTag(ctx, h.client, version.GitHubOwner, version.GitHubRepo)

	h.mu.Lock()
	defer h.mu.Unlock()
	h.cache.at = time.Now()
	h.cache.populated = true
	if err != nil {
		h.cache.tagName, h.cache.htmlURL, h.cache.kind = "", "", ""
		return "", "", "", false
	}
	h.cache.tagName, h.cache.htmlURL, h.cache.kind = tag, u, k
	return tag, u, k, tag != ""
}

func fetchLatestReleaseTag(ctx context.Context, client *http.Client, owner, repo string) (tag, htmlURL, kind string, err error) {
	// Prefer the documented "latest" endpoint (non-draft, non-prerelease only).
	u := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", owner, repo)
	tag, htmlURL, status, err := doReleaseGET(ctx, client, u)
	if err != nil {
		return "", "", "", err
	}
	if status == http.StatusOK && tag != "" {
		return tag, htmlURL, "release", nil
	}
	// Prerelease-only repos: /releases/latest returns 404 — use newest release in the list.
	if status != http.StatusNotFound {
		if tag != "" {
			return tag, htmlURL, "release", nil
		}
		return "", "", "", fmt.Errorf("github releases/latest: status %d", status)
	}

	u = fmt.Sprintf("https://api.github.com/repos/%s/%s/releases?per_page=1", owner, repo)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return "", "", "", err
	}
	setGitHubHeaders(req)
	resp, err := client.Do(req)
	if err != nil {
		return "", "", "", err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	if err != nil {
		return "", "", "", err
	}
	if resp.StatusCode != http.StatusOK {
		return "", "", "", fmt.Errorf("github releases list: status %d", resp.StatusCode)
	}
	var arr []struct {
		TagName string `json:"tag_name"`
		HTMLURL string `json:"html_url"`
	}
	if err := json.Unmarshal(body, &arr); err != nil {
		return "", "", "", err
	}
	if len(arr) == 0 {
		return fetchLatestTagFromTagsAPI(ctx, client, owner, repo)
	}
	return arr[0].TagName, arr[0].HTMLURL, "release", nil
}

// fetchLatestTagFromTagsAPI is used when the repo has no GitHub Release objects (tag-only workflow).
func fetchLatestTagFromTagsAPI(ctx context.Context, client *http.Client, owner, repo string) (tag, htmlURL, kind string, err error) {
	u := fmt.Sprintf("https://api.github.com/repos/%s/%s/tags?per_page=1", owner, repo)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return "", "", "", err
	}
	setGitHubHeaders(req)
	resp, err := client.Do(req)
	if err != nil {
		return "", "", "", err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	if err != nil {
		return "", "", "", err
	}
	if resp.StatusCode != http.StatusOK {
		return "", "", "", fmt.Errorf("github tags: status %d", resp.StatusCode)
	}
	var arr []struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal(body, &arr); err != nil {
		return "", "", "", err
	}
	if len(arr) == 0 {
		return "", "", "", nil
	}
	tagName := strings.TrimSpace(arr[0].Name)
	if tagName == "" {
		return "", "", "", nil
	}
	// GitHub browse URL for a tag (same path as release pages when notes exist).
	html := fmt.Sprintf("https://github.com/%s/%s/releases/tag/%s", owner, repo, url.PathEscape(tagName))
	return tagName, html, "tag", nil
}

type releaseLatestJSON struct {
	TagName string `json:"tag_name"`
	HTMLURL string `json:"html_url"`
}

func doReleaseGET(ctx context.Context, client *http.Client, u string) (tag, htmlURL string, status int, err error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return "", "", 0, err
	}
	setGitHubHeaders(req)
	resp, err := client.Do(req)
	if err != nil {
		return "", "", 0, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	if err != nil {
		return "", "", resp.StatusCode, err
	}
	if resp.StatusCode != http.StatusOK {
		return "", "", resp.StatusCode, nil
	}
	var rel releaseLatestJSON
	if err := json.Unmarshal(body, &rel); err != nil {
		return "", "", resp.StatusCode, err
	}
	return rel.TagName, rel.HTMLURL, resp.StatusCode, nil
}

func setGitHubHeaders(req *http.Request) {
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", "filetree/"+version.Version)
}
