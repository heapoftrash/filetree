package config

import "testing"

func TestOAuthProviderActive(t *testing.T) {
	c := &Config{}
	if OAuthProviderActive(c) {
		t.Fatal("expected false for nil providers")
	}
	c.Auth.Providers = map[string]ProviderConfig{
		"google": {Enabled: true, ClientID: "x"},
	}
	if !OAuthProviderActive(c) {
		t.Fatal("expected true when google enabled with client id")
	}
}

func TestOAuthLoginAllowlistConfigured(t *testing.T) {
	if OAuthLoginAllowlistConfigured(nil) {
		t.Fatal("nil config")
	}
	c := &Config{Users: UsersConfig{OauthAdminEmails: []string{"  "}}}
	if OAuthLoginAllowlistConfigured(c) {
		t.Fatal("whitespace only should not count")
	}
	c.Users.OauthAdminEmails = []string{"a@b.c"}
	if !OAuthLoginAllowlistConfigured(c) {
		t.Fatal("admin email should count")
	}
	c.Users.OauthAdminEmails = nil
	c.Users.OauthAllowedEmails = []string{"u@x.y"}
	if !OAuthLoginAllowlistConfigured(c) {
		t.Fatal("oauth_allowed_emails should count")
	}
	c.Users.OauthAllowedEmails = nil
	c.Users.OauthAllowAllUsers = true
	if !OAuthLoginAllowlistConfigured(c) {
		t.Fatal("oauth_allow_all_users should satisfy allowlist check")
	}
}

func TestUserIsAdmin(t *testing.T) {
	if UserIsAdmin(nil, "a@b.c") {
		t.Fatal("nil config")
	}
	c := &Config{Users: UsersConfig{OauthAdminEmails: []string{"Admin@x.com"}}}
	if !UserIsAdmin(c, "admin@x.com") {
		t.Fatal("oauth admin email")
	}
	if UserIsAdmin(c, "other@x.com") {
		t.Fatal("non-admin oauth email")
	}
	c.Users.OauthAdminEmails = nil
	c.Users.LocalUsers = []LocalUser{{Username: "alice", IsAdmin: true}}
	if !UserIsAdmin(c, "alice") {
		t.Fatal("local admin username")
	}
	if UserIsAdmin(c, "bob") {
		t.Fatal("non-admin local user")
	}
	c.Users.LocalUsers = []LocalUser{{Username: "alice", IsAdmin: false}}
	c.Users.DefaultAdmin = &DefaultAdminUser{Username: "bootstrap", Password: "hashed"}
	if !UserIsAdmin(c, "bootstrap") {
		t.Fatal("default admin when password set")
	}
	c.Users.DefaultAdmin.Password = ""
	if UserIsAdmin(c, "bootstrap") {
		t.Fatal("default admin without password should not grant admin")
	}
}
