package config

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"strconv"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gopkg.in/yaml.v3"
)

// Source indicates where a config value came from.
type Source int

const (
	SourceDefault Source = iota
	SourceConfig
	SourceEnv
)

func (s Source) String() string {
	switch s {
	case SourceDefault:
		return "default"
	case SourceConfig:
		return "config file"
	case SourceEnv:
		return "environment"
	default:
		return "unknown"
	}
}

// Config holds all application configuration.
type Config struct {
	Server     ServerConfig   `yaml:"server" json:"server"`
	Auth       AuthConfig     `yaml:"auth" json:"auth"`
	Frontend   FrontendConfig `yaml:"frontend" json:"frontend"`
	Users      UsersConfig    `yaml:"users" json:"users"`
	ConfigPath string         `yaml:"-" json:"-"` // path we loaded from, for write-back
}

type ServerConfig struct {
	RootPath       string `yaml:"root_path" json:"root_path"`
	Debug          bool   `yaml:"debug" json:"debug"`                       // when false, Gin runs in release mode (no debug logs)
	MaxUploadBytes int64  `yaml:"max_upload_bytes" json:"max_upload_bytes"` // max multipart upload size; 0 = default 100MB
}

type AuthConfig struct {
	JWTSecret        string                    `yaml:"jwt_secret" json:"jwt_secret"`
	OAuthRedirectURL string                    `yaml:"oauth_redirect_url" json:"oauth_redirect_url"`
	LocalAuthEnabled bool                      `yaml:"local_auth_enabled" json:"local_auth_enabled"` // username/password auth
	Providers        map[string]ProviderConfig `yaml:"providers" json:"providers"`
}

type ProviderConfig struct {
	Enabled      bool   `yaml:"enabled" json:"enabled"`
	ClientID     string `yaml:"client_id" json:"client_id"`
	ClientSecret string `yaml:"client_secret" json:"client_secret"`
	CallbackURL  string `yaml:"callback_url" json:"callback_url"` // optional; if empty, derived from oauth_redirect_url
}

type FrontendConfig struct {
	URL         string   `yaml:"url" json:"url"`
	CORSOrigins []string `yaml:"cors_origins" json:"cors_origins"` // allowed origins for CORS; if empty, derived from URL
}

type UsersConfig struct {
	AdminEmails         []string          `yaml:"admin_emails" json:"admin_emails"`
	AllowedOAuthEmails  []string          `yaml:"allowed_oauth_emails" json:"allowed_oauth_emails"` // non-admin OAuth users allowed to sign in (union with admin_emails)
	LocalUsers          []LocalUser       `yaml:"local_users" json:"local_users"`
	DefaultAdmin        *DefaultAdminUser `yaml:"default_admin" json:"default_admin"`
}

type LocalUser struct {
	Username string `yaml:"username" json:"username"`
	Password string `yaml:"password,omitempty" json:"password,omitempty"` // plaintext or bcrypt; hashed on first run if plaintext
	IsAdmin  bool   `yaml:"is_admin" json:"is_admin"`
}

type DefaultAdminUser struct {
	Username string `yaml:"username" json:"username"`
	Password string `yaml:"password,omitempty" json:"password,omitempty"` // plaintext or bcrypt; hashed on first run if plaintext
}

// isBcryptHash returns true if s looks like a bcrypt hash ($2a$, $2b$, $2y$).
func isBcryptHash(s string) bool {
	return len(s) >= 60 && (strings.HasPrefix(s, "$2a$") || strings.HasPrefix(s, "$2b$") || strings.HasPrefix(s, "$2y$"))
}

// sources tracks where each config key got its value.
type sources map[string]Source

func (s sources) set(key string, src Source) {
	s[key] = src
}

// Load reads config from file (if path or CONFIG_FILE is set), then applies env overrides, then defaults.
func Load(configPath string) (*Config, error) {
	c := &Config{}
	src := make(sources)

	if configPath == "" {
		configPath = os.Getenv("CONFIG_FILE")
	}
	configPath = strings.TrimSpace(configPath)

	// 1. Load from file
	if configPath != "" {
		data, err := os.ReadFile(configPath) // #nosec G304 G703 -- config path is operator-provided at startup
		if err != nil {
			return nil, fmt.Errorf("read config file %s: %w", configPath, err)
		}
		lower := strings.ToLower(configPath)
		if strings.HasSuffix(lower, ".json") {
			if err := json.Unmarshal(data, c); err != nil {
				return nil, fmt.Errorf("parse config JSON: %w", err)
			}
		} else {
			if err := yaml.Unmarshal(data, c); err != nil {
				return nil, fmt.Errorf("parse config YAML: %w", err)
			}
		}
		// Mark all loaded fields as from config (we'll override below for env)
		if c.Server.RootPath != "" {
			src.set("server.root_path", SourceConfig)
		}
		if configPath != "" {
			src.set("server.debug", SourceConfig)
		}
		if c.Server.MaxUploadBytes > 0 {
			src.set("server.max_upload_bytes", SourceConfig)
		}
		if c.Auth.JWTSecret != "" {
			src.set("auth.jwt_secret", SourceConfig)
		}
		if c.Auth.OAuthRedirectURL != "" {
			src.set("auth.oauth_redirect_url", SourceConfig)
		}
		if c.Frontend.URL != "" {
			src.set("frontend.url", SourceConfig)
		}
		if len(c.Frontend.CORSOrigins) > 0 {
			src.set("frontend.cors_origins", SourceConfig)
		}
		if len(c.Users.AdminEmails) > 0 {
			src.set("users.admin_emails", SourceConfig)
		}
		if len(c.Users.AllowedOAuthEmails) > 0 {
			src.set("users.allowed_oauth_emails", SourceConfig)
		}
		if c.Auth.Providers != nil {
			if p, ok := c.Auth.Providers["google"]; ok && p.ClientID != "" {
				src.set("auth.providers.google.client_id", SourceConfig)
			}
		}
	}

	// 2. Env overrides
	if v := os.Getenv("ROOT_PATH"); v != "" {
		c.Server.RootPath = v
		src.set("server.root_path", SourceEnv)
	}
	if v := os.Getenv("GIN_MODE"); v != "" {
		c.Server.Debug = (v == "debug")
		src.set("server.debug", SourceEnv)
	}
	if v := os.Getenv("UPLOAD_SIZE_LIMIT"); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil && n > 0 {
			c.Server.MaxUploadBytes = n
			src.set("server.max_upload_bytes", SourceEnv)
		}
	}
	if v := os.Getenv("JWT_SECRET"); v != "" {
		c.Auth.JWTSecret = v
		src.set("auth.jwt_secret", SourceEnv)
	}
	if v := os.Getenv("GOOGLE_CLIENT_ID"); v != "" {
		if c.Auth.Providers == nil {
			c.Auth.Providers = make(map[string]ProviderConfig)
		}
		p := c.Auth.Providers["google"]
		p.Enabled = true
		p.ClientID = v
		c.Auth.Providers["google"] = p
		src.set("auth.providers.google.client_id", SourceEnv)
	}
	if v := os.Getenv("GOOGLE_CLIENT_SECRET"); v != "" {
		if c.Auth.Providers == nil {
			c.Auth.Providers = make(map[string]ProviderConfig)
		}
		p := c.Auth.Providers["google"]
		p.ClientSecret = v
		c.Auth.Providers["google"] = p
		src.set("auth.providers.google.client_secret", SourceEnv)
	}
	if v := os.Getenv("GITHUB_CLIENT_ID"); v != "" {
		if c.Auth.Providers == nil {
			c.Auth.Providers = make(map[string]ProviderConfig)
		}
		p := c.Auth.Providers["github"]
		p.Enabled = true
		p.ClientID = v
		c.Auth.Providers["github"] = p
		src.set("auth.providers.github.client_id", SourceEnv)
	}
	if v := os.Getenv("GITHUB_CLIENT_SECRET"); v != "" {
		if c.Auth.Providers == nil {
			c.Auth.Providers = make(map[string]ProviderConfig)
		}
		p := c.Auth.Providers["github"]
		p.ClientSecret = v
		c.Auth.Providers["github"] = p
		src.set("auth.providers.github.client_secret", SourceEnv)
	}
	if v := os.Getenv("OAUTH_REDIRECT_URL"); v != "" {
		c.Auth.OAuthRedirectURL = v
		src.set("auth.oauth_redirect_url", SourceEnv)
	}
	if v := os.Getenv("FRONTEND_URL"); v != "" {
		c.Frontend.URL = v
		src.set("frontend.url", SourceEnv)
	}
	if v := os.Getenv("CORS_ORIGINS"); v != "" {
		c.Frontend.CORSOrigins = strings.Split(v, ",")
		for i, o := range c.Frontend.CORSOrigins {
			c.Frontend.CORSOrigins[i] = strings.TrimSpace(o)
		}
		src.set("frontend.cors_origins", SourceEnv)
	}
	if v := os.Getenv("ADMIN_EMAILS"); v != "" {
		parts := strings.Split(v, ",")
		for i, p := range parts {
			parts[i] = strings.TrimSpace(p)
		}
		c.Users.AdminEmails = parts
		src.set("users.admin_emails", SourceEnv)
	}
	if v := os.Getenv("ALLOWED_OAUTH_EMAILS"); v != "" {
		parts := strings.Split(v, ",")
		for i, p := range parts {
			parts[i] = strings.TrimSpace(p)
		}
		c.Users.AllowedOAuthEmails = parts
		src.set("users.allowed_oauth_emails", SourceEnv)
	}

	// 3. Defaults
	if c.Server.RootPath == "" {
		c.Server.RootPath = "./data"
		src.set("server.root_path", SourceDefault)
	}
	if c.Auth.JWTSecret == "" {
		c.Auth.JWTSecret = "filetree-dev-secret-change-in-production"
		src.set("auth.jwt_secret", SourceDefault)
	}
	// oauth_redirect_url has no default; must be set for OAuth (e.g. OAUTH_REDIRECT_URL or config file)
	if c.Frontend.URL == "" {
		c.Frontend.URL = "/"
		src.set("frontend.url", SourceDefault)
	}
	if src["server.root_path"] == 0 {
		src.set("server.root_path", SourceDefault)
	}
	if src["auth.jwt_secret"] == 0 {
		src.set("auth.jwt_secret", SourceDefault)
	}
	if src["frontend.url"] == 0 {
		src.set("frontend.url", SourceDefault)
	}
	if src["users.admin_emails"] == 0 {
		src.set("users.admin_emails", SourceDefault)
	}
	if src["users.allowed_oauth_emails"] == 0 {
		src.set("users.allowed_oauth_emails", SourceDefault)
	}
	if src["server.debug"] == 0 {
		c.Server.Debug = false
		src.set("server.debug", SourceDefault)
	}
	if src["server.max_upload_bytes"] == 0 {
		c.Server.MaxUploadBytes = 100 * 1024 * 1024 // 100MB default
		src.set("server.max_upload_bytes", SourceDefault)
	}
	// Derive CORS origins from Frontend.URL if not explicitly set
	if len(c.Frontend.CORSOrigins) == 0 {
		c.Frontend.CORSOrigins = deriveCORSOrigins(c.Frontend.URL)
		src.set("frontend.cors_origins", SourceDefault)
	}

	c.ConfigPath = configPath

	// 4. Ensure providers map and defaults
	if c.Auth.Providers == nil {
		c.Auth.Providers = make(map[string]ProviderConfig)
	}
	if _, ok := c.Auth.Providers["github"]; !ok {
		c.Auth.Providers["github"] = ProviderConfig{Enabled: false}
	}
	delete(c.Auth.Providers, "local") // local belongs under auth.local_auth_enabled

	// 5. Log at startup
	logConfigSources(log.Default(), c, src, configPath)

	return c, nil
}

// BootstrapUsers hashes plaintext passwords for default_admin and local_users, then writes the config.
// If password looks like plaintext (not bcrypt), it is hashed and replaced in-place. Call after Load.
func BootstrapUsers(c *Config) error {
	if c.ConfigPath == "" {
		return nil
	}
	modified := false

	// Default admin
	if c.Users.DefaultAdmin != nil {
		da := c.Users.DefaultAdmin
		if da.Username != "" && da.Password != "" && !isBcryptHash(da.Password) {
			hash, err := bcrypt.GenerateFromPassword([]byte(da.Password), bcrypt.DefaultCost)
			if err != nil {
				return fmt.Errorf("hash default admin password: %w", err)
			}
			da.Password = string(hash)
			modified = true
			log.Printf("[config] bootstrapped default admin %q (password hashed)", da.Username)
		}
	}

	// Local users
	for i := range c.Users.LocalUsers {
		u := &c.Users.LocalUsers[i]
		if u.Password == "" || isBcryptHash(u.Password) {
			continue
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("hash password for local user %q: %w", u.Username, err)
		}
		u.Password = string(hash)
		modified = true
		log.Printf("[config] bootstrapped local user %q (password hashed)", u.Username)
	}

	if !modified {
		return nil
	}
	data, err := marshalConfigForPath(c)
	if err != nil {
		return err
	}
	if err := os.WriteFile(c.ConfigPath, data, 0600); err != nil {
		return fmt.Errorf("write config after bootstrap: %w", err)
	}
	return nil
}

func marshalConfigForPath(c *Config) ([]byte, error) {
	if strings.HasSuffix(strings.ToLower(c.ConfigPath), ".json") {
		return json.MarshalIndent(c, "", "  ")
	}
	return yaml.Marshal(c)
}

// deriveCORSOrigins returns allowed CORS origins from Frontend.URL.
// If URL is a full URL (http/https), returns its origin; otherwise returns ["*"] for dev.
func deriveCORSOrigins(frontendURL string) []string {
	frontendURL = strings.TrimSpace(frontendURL)
	if frontendURL == "" || frontendURL == "/" {
		return []string{"*"}
	}
	u, err := url.Parse(frontendURL)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return []string{"*"}
	}
	origin := u.Scheme + "://" + u.Host
	return []string{origin}
}

func maskSecret(key, value string) string {
	secretKeys := []string{"secret", "password", "client_secret", "jwt_secret"}
	keyLower := strings.ToLower(key)
	for _, sk := range secretKeys {
		if strings.Contains(keyLower, sk) {
			if value != "" {
				return "***"
			}
			return "(empty)"
		}
	}
	return value
}

func logConfigSources(logger *log.Logger, c *Config, src sources, configPath string) {
	if configPath != "" {
		logger.Printf("Loading config from %s", configPath)
	} else {
		logger.Println("No config file specified (CONFIG_FILE not set), using env vars and defaults")
	}
	logger.Println("Configuration loaded:")

	googleClientID := ""
	if p, ok := c.Auth.Providers["google"]; ok {
		googleClientID = p.ClientID
	}
	items := []struct {
		key   string
		value string
		s     Source
	}{
		{"server.root_path", c.Server.RootPath, src["server.root_path"]},
		{"server.debug", fmt.Sprintf("%v", c.Server.Debug), src["server.debug"]},
		{"server.max_upload_bytes", fmt.Sprintf("%d", c.Server.MaxUploadBytes), src["server.max_upload_bytes"]},
		{"auth.jwt_secret", maskSecret("jwt_secret", c.Auth.JWTSecret), src["auth.jwt_secret"]},
		{"auth.providers.google.client_id", maskSecret("client_id", googleClientID), src["auth.providers.google.client_id"]},
		{"auth.oauth_redirect_url", c.Auth.OAuthRedirectURL, src["auth.oauth_redirect_url"]},
		{"frontend.url", c.Frontend.URL, src["frontend.url"]},
		{"frontend.cors_origins", fmt.Sprintf("%v", c.Frontend.CORSOrigins), src["frontend.cors_origins"]},
		{"users.admin_emails", fmt.Sprintf("%v", c.Users.AdminEmails), src["users.admin_emails"]},
		{"users.allowed_oauth_emails", fmt.Sprintf("%v", c.Users.AllowedOAuthEmails), src["users.allowed_oauth_emails"]},
	}

	for _, item := range items {
		logger.Printf("  %s: %s (from %s)", item.key, item.value, item.s)
	}
}

// OAuthProviderActive reports whether Google or GitHub is enabled with a client ID.
func OAuthProviderActive(c *Config) bool {
	if c == nil || c.Auth.Providers == nil {
		return false
	}
	for _, id := range []string{"google", "github"} {
		p, ok := c.Auth.Providers[id]
		if ok && p.Enabled && strings.TrimSpace(p.ClientID) != "" {
			return true
		}
	}
	return false
}

// OAuthLoginAllowlistConfigured returns true if admin_emails or allowed_oauth_emails contains a non-empty email.
func OAuthLoginAllowlistConfigured(c *Config) bool {
	if c == nil {
		return false
	}
	for _, e := range c.Users.AdminEmails {
		if strings.TrimSpace(e) != "" {
			return true
		}
	}
	for _, e := range c.Users.AllowedOAuthEmails {
		if strings.TrimSpace(e) != "" {
			return true
		}
	}
	return false
}
