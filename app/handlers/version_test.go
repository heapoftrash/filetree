package handlers

import "testing"

func TestSemverNewer(t *testing.T) {
	tests := []struct {
		latest, current string
		want            bool
	}{
		{"0.0.5-beta", "0.0.4-beta.2", true},
		{"0.0.4-beta.2", "0.0.4-beta.2", false},
		{"0.0.3", "0.0.4-beta", false},
		{"v0.0.5", "0.0.4", true},
		{"bad", "0.0.1", false},
		{"0.0.1", "bad", false},
	}
	for _, tt := range tests {
		if got := semverNewer(tt.latest, tt.current); got != tt.want {
			t.Errorf("semverNewer(%q, %q) = %v, want %v", tt.latest, tt.current, got, tt.want)
		}
	}
}

func TestCanonicalSemverComparable(t *testing.T) {
	tests := []struct {
		in       string
		wantNone bool // true if not valid semver for comparison
	}{
		{"dev", true},
		{"", true},
		{"not-a-version", true},
		{"0.0.5", false},
		{"v0.1.0", false},
	}
	for _, tt := range tests {
		got := canonicalSemver(tt.in)
		none := got == ""
		if none != tt.wantNone {
			t.Errorf("canonicalSemver(%q) empty=%v, want empty=%v", tt.in, none, tt.wantNone)
		}
	}
}
