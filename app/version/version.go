// Package version holds build-time metadata (set via -ldflags).
package version

// Version is the application semver (no leading "v"), e.g. 0.0.5.
var Version = "dev"

// Commit is a short git revision or "unknown".
var Commit = "unknown"

// GitHubOwner and GitHubRepo identify the project for release lookups.
const (
	GitHubOwner = "heapoftrash"
	GitHubRepo  = "filetree"
)
