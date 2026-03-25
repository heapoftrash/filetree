package handlers

import "testing"

func TestOAuthEmailAllowSet(t *testing.T) {
	m := oauthEmailAllowSet([]string{"  A@x.com ", "b@y.com"}, []string{"B@y.com", ""})
	if len(m) != 2 {
		t.Fatalf("expected 2 unique keys, got %d: %v", len(m), m)
	}
	if _, ok := m["a@x.com"]; !ok {
		t.Fatal("missing a@x.com")
	}
	if _, ok := m["b@y.com"]; !ok {
		t.Fatal("missing b@y.com")
	}
}

func TestOAuthEmailAllowSet_emptyLists(t *testing.T) {
	m := oauthEmailAllowSet(nil, nil)
	if len(m) != 0 {
		t.Fatalf("expected empty set, got %v", m)
	}
}
