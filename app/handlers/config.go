package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/heapoftrash/filetree/app/config"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/yaml.v3"
)

// ConfigHandler serves config API (admin only).
type ConfigHandler struct {
	cfg *config.Config
}

// NewConfigHandler returns a ConfigHandler.
func NewConfigHandler(cfg *config.Config) *ConfigHandler {
	return &ConfigHandler{cfg: cfg}
}

// ConfigSection is a section in the config schema.
type ConfigSection struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

// ConfigFieldSchema is a field in the config schema for UI rendering.
type ConfigFieldSchema struct {
	Key         string `json:"key"`
	Section     string `json:"section"`
	Kind        string `json:"kind"`
	Label       string `json:"label"`
	Editable    bool   `json:"editable"`
	Secret      bool   `json:"secret,omitempty"`
	DisplayHint string `json:"display_hint,omitempty"`
	Placeholder string `json:"placeholder,omitempty"`
	Extra       string `json:"extra,omitempty"`
}

// ProviderSchemaResponse is the schema for one provider.
type ProviderSchemaResponse struct {
	ID     string              `json:"id"`
	Label  string              `json:"label"`
	Fields []ConfigFieldSchema `json:"fields"`
}

// ProviderSectionResponse is a section that contains providers.
type ProviderSectionResponse struct {
	ID        string                   `json:"id"`
	Label     string                   `json:"label"`
	Providers []ProviderSchemaResponse `json:"providers"`
}

// ConfigSchemaResponse is the schema part of the config API response.
type ConfigSchemaResponse struct {
	Sections         []ConfigSection           `json:"sections"`
	Fields           []ConfigFieldSchema       `json:"fields"`
	ProviderSections []ProviderSectionResponse `json:"provider_sections,omitempty"`
}

// ConfigValuesResponse is the values part, keyed by section.
type ConfigValuesResponse map[string]map[string]interface{}

// ConfigAPIResponse is the full GET /api/config response.
type ConfigAPIResponse struct {
	Schema ConfigSchemaResponse `json:"schema"`
	Values ConfigValuesResponse `json:"values"`
}

// GetConfig returns schema + current values (admin only).
func (h *ConfigHandler) GetConfig(c *gin.Context) {
	cfg := h.cfg

	// Build schema from registry
	sections := []ConfigSection{
		{ID: "server", Label: "Server"},
		{ID: "auth", Label: "Auth"},
		{ID: "users", Label: "Users"},
	}
	fields := make([]ConfigFieldSchema, 0, len(config.ConfigFields))
	for _, f := range config.ConfigFields {
		fields = append(fields, ConfigFieldSchema{
			Key:         f.Key,
			Section:     f.Section,
			Kind:        string(f.Kind),
			Label:       f.Label,
			Editable:    f.Editable,
			Secret:      f.Secret,
			DisplayHint: f.DisplayHint,
			Placeholder: f.Placeholder,
			Extra:       f.Extra,
		})
	}

	// Build provider sections
	providerSections := []ProviderSectionResponse{{
		ID:    "auth_providers",
		Label: "Auth providers",
		Providers: func() []ProviderSchemaResponse {
			out := make([]ProviderSchemaResponse, 0, len(config.AuthProviderSchemas))
			for _, p := range config.AuthProviderSchemas {
				providerFields := make([]ConfigFieldSchema, 0, len(p.Fields))
				for _, f := range p.Fields {
					providerFields = append(providerFields, ConfigFieldSchema{
						Key:         f.Key,
						Section:     p.ID,
						Kind:        string(f.Kind),
						Label:       f.Label,
						Editable:    f.Editable,
						Secret:      f.Secret,
						DisplayHint: f.DisplayHint,
						Placeholder: f.Placeholder,
						Extra:       f.Extra,
					})
				}
				out = append(out, ProviderSchemaResponse{ID: p.ID, Label: p.Label, Fields: providerFields})
			}
			return out
		}(),
	}}

	// Build auth_providers values
	authProviders := make(map[string]interface{})
	for id, p := range cfg.Auth.Providers {
		authProviders[id] = map[string]interface{}{
			"enabled":           p.Enabled,
			"client_id":         p.ClientID,
			"client_secret_set": p.ClientSecret != "",
			"callback_url":      p.CallbackURL,
		}
	}

	// Build local_users for UI (password not exposed)
	localUsersUI := make([]map[string]interface{}, 0, len(cfg.Users.LocalUsers))
	for _, u := range cfg.Users.LocalUsers {
		localUsersUI = append(localUsersUI, map[string]interface{}{
			"username":     u.Username,
			"is_admin":     u.IsAdmin,
			"password_set": u.Password != "",
		})
	}

	localAuthEnabled := cfg.Auth.LocalAuthEnabled

	defaultAdminUsername := ""
	defaultAdminPasswordSet := false
	if cfg.Users.DefaultAdmin != nil {
		defaultAdminUsername = cfg.Users.DefaultAdmin.Username
		defaultAdminPasswordSet = cfg.Users.DefaultAdmin.Password != ""
	}

	values := ConfigValuesResponse{
		"server": {
			"root_path":        cfg.Server.RootPath,
			"debug":            cfg.Server.Debug,
			"max_upload_bytes": cfg.Server.MaxUploadBytes,
			"frontend_url":     cfg.Frontend.URL,
			"cors_origins":     cfg.Frontend.CORSOrigins,
		},
		"auth": {
			"oauth_redirect_url": cfg.Auth.OAuthRedirectURL,
			"jwt_secret_set":     cfg.Auth.JWTSecret != "",
			"local_auth_enabled": localAuthEnabled,
		},
		"auth_providers": authProviders,
		"users": {
			"oauth_admin_emails":     cfg.Users.OauthAdminEmails,
			"oauth_allowed_emails":   cfg.Users.OauthAllowedEmails,
			"oauth_allow_all_users":  cfg.Users.OauthAllowAllUsers,
			"local_users":            localUsersUI,
			"default_admin_username": defaultAdminUsername,
			"default_admin_password": defaultAdminPasswordSet, // true = Set, false = Not set
		},
	}

	c.JSON(http.StatusOK, ConfigAPIResponse{
		Schema: ConfigSchemaResponse{
			Sections:         sections,
			Fields:           fields,
			ProviderSections: providerSections,
		},
		Values: values,
	})
}

// ConfigUpdateRequest is the body for PATCH /api/config. Values keyed by section.
type ConfigUpdateRequest map[string]interface{}

// UpdateConfig updates config file (admin only). Server restart required for most changes.
func (h *ConfigHandler) UpdateConfig(c *gin.Context) {
	if h.cfg.ConfigPath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "config file not configured (CONFIG_FILE not set)"})
		return
	}

	var req ConfigUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cfg := *h.cfg
	// Deep copy Providers map to avoid mutating live config before file write succeeds,
	// and to prevent concurrent map read/write if GetConfig runs during UpdateConfig.
	cfg.Auth.Providers = make(map[string]config.ProviderConfig)
	for k, v := range h.cfg.Auth.Providers {
		cfg.Auth.Providers[k] = v
	}

	// Apply updates from request
	if s, ok := req["server"].(map[string]interface{}); ok {
		if v, ok := s["root_path"].(string); ok {
			cfg.Server.RootPath = strings.TrimSpace(v)
		}
		if v, ok := s["debug"].(bool); ok {
			cfg.Server.Debug = v
		}
		if v, ok := s["max_upload_bytes"]; ok {
			if n, err := toInt64(v); err == nil && n > 0 {
				cfg.Server.MaxUploadBytes = n
			}
		}
		if v, ok := s["frontend_url"].(string); ok {
			cfg.Frontend.URL = strings.TrimSpace(v)
		}
		if v, ok := s["cors_origins"]; ok {
			if arr, ok := toStringSlice(v); ok {
				cfg.Frontend.CORSOrigins = arr
			}
		}
	}
	if s, ok := req["auth"].(map[string]interface{}); ok {
		if v, ok := s["oauth_redirect_url"].(string); ok {
			cfg.Auth.OAuthRedirectURL = strings.TrimSpace(v)
		}
		if v, ok := s["local_auth_enabled"].(bool); ok {
			cfg.Auth.LocalAuthEnabled = v
		}
	}
	if s, ok := req["auth_providers"].(map[string]interface{}); ok {
		for providerID, pv := range s {
			if providerID == "local" {
				continue // local auth is under auth.local_auth_enabled, not providers
			}
			pmap, ok := pv.(map[string]interface{})
			if !ok {
				continue
			}
			p := cfg.Auth.Providers[providerID]
			if v, ok := pmap["enabled"].(bool); ok {
				p.Enabled = v
			}
			if v, ok := pmap["client_id"].(string); ok {
				p.ClientID = strings.TrimSpace(v)
			}
			if v, ok := pmap["client_secret"].(string); ok {
				v = strings.TrimSpace(v)
				// Only set when: new value is non-empty AND current secret is empty (cannot edit once saved)
				if v != "" && p.ClientSecret == "" {
					p.ClientSecret = v
				}
			}
			if v, ok := pmap["callback_url"].(string); ok {
				p.CallbackURL = strings.TrimSpace(v)
			}
			cfg.Auth.Providers[providerID] = p
		}
	}
	if s, ok := req["users"].(map[string]interface{}); ok {
		if v, ok := s["oauth_admin_emails"]; ok {
			if arr, ok := toStringSlice(v); ok {
				emails := make([]string, 0, len(arr))
				for _, e := range arr {
					es := strings.TrimSpace(e)
					if es != "" {
						emails = append(emails, es)
					}
				}
				cfg.Users.OauthAdminEmails = emails
			}
		}
		if v, ok := s["oauth_allowed_emails"]; ok {
			if arr, ok := toStringSlice(v); ok {
				emails := make([]string, 0, len(arr))
				for _, e := range arr {
					es := strings.TrimSpace(e)
					if es != "" {
						emails = append(emails, es)
					}
				}
				cfg.Users.OauthAllowedEmails = emails
			}
		}
		if v, ok := s["oauth_allow_all_users"].(bool); ok {
			cfg.Users.OauthAllowAllUsers = v
		}
		if v, ok := s["local_users"]; ok {
			if arr, ok := toLocalUsers(v, cfg.Users.LocalUsers); ok {
				cfg.Users.LocalUsers = arr
			}
		}
		if v, ok := s["default_admin_username"].(string); ok {
			v = strings.TrimSpace(v)
			if v != "" {
				prev := cfg.Users.DefaultAdmin
				da := &config.DefaultAdminUser{Username: v}
				if prev != nil {
					da.Password = prev.Password
				}
				cfg.Users.DefaultAdmin = da
			} else {
				cfg.Users.DefaultAdmin = nil
			}
		}
		if v, ok := s["default_admin_password"].(string); ok {
			v = strings.TrimSpace(v)
			if v != "" && cfg.Users.DefaultAdmin != nil {
				hash, err := bcrypt.GenerateFromPassword([]byte(v), bcrypt.DefaultCost)
				if err != nil {
					// Keep existing credentials on hash failure
				} else {
					cfg.Users.DefaultAdmin = &config.DefaultAdminUser{
						Username: cfg.Users.DefaultAdmin.Username,
						Password: string(hash),
					}
				}
			}
		}
	}

	// Write to file
	data, err := marshalConfig(&cfg, h.cfg.ConfigPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to serialize config: " + err.Error()})
		return
	}
	if err := os.WriteFile(h.cfg.ConfigPath, data, 0600); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to write config: " + err.Error()})
		return
	}

	// Update in-memory config
	*h.cfg = cfg

	c.JSON(http.StatusOK, gin.H{"ok": true, "message": "Config saved. Server restart required for some changes."})
}

func toInt64(v interface{}) (int64, error) {
	switch x := v.(type) {
	case float64:
		return int64(x), nil
	case int:
		return int64(x), nil
	case int64:
		return x, nil
	case string:
		return strconv.ParseInt(x, 10, 64)
	default:
		return 0, strconv.ErrSyntax
	}
}

func toStringSlice(v interface{}) ([]string, bool) {
	arr, ok := v.([]interface{})
	if !ok {
		return nil, false
	}
	out := make([]string, 0, len(arr))
	for _, a := range arr {
		if s, ok := a.(string); ok {
			out = append(out, s)
		}
	}
	return out, true
}

func toLocalUsers(v interface{}, existing []config.LocalUser) ([]config.LocalUser, bool) {
	arr, ok := v.([]interface{})
	if !ok {
		return nil, false
	}
	existingByUser := make(map[string]string) // username -> stored password (hash)
	for _, u := range existing {
		existingByUser[u.Username] = u.Password
	}
	out := make([]config.LocalUser, 0, len(arr))
	for _, a := range arr {
		m, ok := a.(map[string]interface{})
		if !ok {
			continue
		}
		username, _ := m["username"].(string)
		username = strings.TrimSpace(username)
		if username == "" {
			continue
		}
		isAdmin := false
		if b, ok := m["is_admin"].(bool); ok {
			isAdmin = b
		}
		password, hasPassword := m["password"].(string)
		password = strings.TrimSpace(password)
		hash := existingByUser[username]
		if hasPassword && password != "" {
			h, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
			if err != nil {
				continue
			}
			hash = string(h)
		} else if hash == "" {
			// Username may have been renamed; use original_username to preserve hash
			if orig, ok := m["original_username"].(string); ok {
				orig = strings.TrimSpace(orig)
				if orig != "" {
					hash = existingByUser[orig]
				}
			}
		}
		out = append(out, config.LocalUser{Username: username, Password: hash, IsAdmin: isAdmin})
	}
	return out, true
}

func marshalConfig(c *config.Config, path string) ([]byte, error) {
	if strings.HasSuffix(strings.ToLower(path), ".json") {
		return json.MarshalIndent(c, "", "  ")
	}
	return yaml.Marshal(c)
}
