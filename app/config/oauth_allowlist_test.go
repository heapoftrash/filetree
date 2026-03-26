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
	c := &Config{Users: UsersConfig{AdminEmails: []string{"  "}}}
	if OAuthLoginAllowlistConfigured(c) {
		t.Fatal("whitespace only should not count")
	}
	c.Users.AdminEmails = []string{"a@b.c"}
	if !OAuthLoginAllowlistConfigured(c) {
		t.Fatal("admin email should count")
	}
	c.Users.AdminEmails = nil
	c.Users.AllowedOAuthEmails = []string{"u@x.y"}
	if !OAuthLoginAllowlistConfigured(c) {
		t.Fatal("allowed_oauth_emails should count")
	}
	c.Users.AllowedOAuthEmails = nil
	c.Users.AllowAllOAuthUsers = true
	if !OAuthLoginAllowlistConfigured(c) {
		t.Fatal("allow_all_oauth_users should satisfy allowlist check")
	}
}
