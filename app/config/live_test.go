package config

import (
	"sync"
	"testing"
)

func TestLiveConfigReplaceSnapshot(t *testing.T) {
	a := &Config{Users: UsersConfig{OauthAdminEmails: []string{"a@b.c"}}}
	l := NewLiveConfig(a)
	if s := l.Snapshot(); len(s.Users.OauthAdminEmails) != 1 {
		t.Fatalf("snapshot: %v", s.Users.OauthAdminEmails)
	}
	b := &Config{Users: UsersConfig{OauthAdminEmails: []string{"x@y.z"}}}
	l.Replace(b)
	if s := l.Snapshot(); len(s.Users.OauthAdminEmails) != 1 || s.Users.OauthAdminEmails[0] != "x@y.z" {
		t.Fatalf("after replace: %v", s.Users.OauthAdminEmails)
	}
}

func TestLiveConfigConcurrentReplace(t *testing.T) {
	l := NewLiveConfig(&Config{})
	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			c := &Config{Users: UsersConfig{OauthAdminEmails: []string{"u@x.y"}}}
			l.Replace(c)
			_ = l.Snapshot().Users.OauthAdminEmails
		}()
	}
	wg.Wait()
}
