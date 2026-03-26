package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/heapoftrash/filetree/app/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

const tokenExpiry = 24 * time.Hour

var (
	googleScopes = []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"}
	githubScopes = []string{"user:email"}
)

type AuthHandler struct {
	oauth2Configs map[string]*oauth2.Config // provider id -> config
	jwtSecret     []byte
	live          *config.LiveConfig // atomic snapshots; same store as ConfigHandler
}

// oauthCallbackURL derives the callback URL for a provider from the base oauth_redirect_url.
// e.g. https://example.com/api/auth/google/callback -> https://example.com/api/auth/github/callback
// Returns "" if baseRedirectURL is empty (OAuth must be explicitly configured).
func oauthCallbackURL(baseRedirectURL, provider string) string {
	if baseRedirectURL == "" {
		return ""
	}
	idx := strings.Index(baseRedirectURL, "/api/auth/")
	if idx == -1 {
		return baseRedirectURL
	}
	return baseRedirectURL[:idx] + "/api/auth/" + provider + "/callback"
}

func NewAuthHandler(live *config.LiveConfig) *AuthHandler {
	cfg := live.Snapshot()
	baseRedirectURL := strings.TrimSpace(cfg.Auth.OAuthRedirectURL)
	oauth2Configs := make(map[string]*oauth2.Config)
	if cfg.Auth.Providers != nil {
		if p, ok := cfg.Auth.Providers["google"]; ok && p.Enabled && p.ClientID != "" {
			redirectURL := strings.TrimSpace(p.CallbackURL)
			if redirectURL == "" {
				redirectURL = oauthCallbackURL(baseRedirectURL, "google")
			}
			if redirectURL == "" {
				// OAuth redirect URL not configured; skip this provider
			} else {
				oauth2Configs["google"] = &oauth2.Config{
					ClientID:     p.ClientID,
					ClientSecret: p.ClientSecret,
					RedirectURL:  redirectURL,
					Scopes:       googleScopes,
					Endpoint:     google.Endpoint,
				}
			}
		}
		if p, ok := cfg.Auth.Providers["github"]; ok && p.Enabled && p.ClientID != "" {
			redirectURL := strings.TrimSpace(p.CallbackURL)
			if redirectURL == "" {
				redirectURL = oauthCallbackURL(baseRedirectURL, "github")
			}
			if redirectURL != "" {
				oauth2Configs["github"] = &oauth2.Config{
					ClientID:     p.ClientID,
					ClientSecret: p.ClientSecret,
					RedirectURL:  redirectURL,
					Scopes:       githubScopes,
					Endpoint:     github.Endpoint,
				}
			}
		}
	}
	return &AuthHandler{
		oauth2Configs: oauth2Configs,
		jwtSecret:     []byte(cfg.Auth.JWTSecret),
		live:          live,
	}
}

func oauthEmailAllowSet(adminEmails, allowedOAuthEmails []string) map[string]struct{} {
	out := make(map[string]struct{})
	for _, list := range [][]string{adminEmails, allowedOAuthEmails} {
		for _, e := range list {
			e = strings.ToLower(strings.TrimSpace(e))
			if e != "" {
				out[e] = struct{}{}
			}
		}
	}
	return out
}

func buildOAuthProviders(cfg *config.Config) []LoginProviderInfo {
	out := make([]LoginProviderInfo, 0)
	if cfg.Auth.Providers == nil {
		return out
	}
	for _, schema := range config.AuthProviderSchemas {
		if p, ok := cfg.Auth.Providers[schema.ID]; ok && p.Enabled && p.ClientID != "" {
			out = append(out, LoginProviderInfo{ID: schema.ID, Label: schema.Label})
		}
	}
	return out
}

// LoginOptionsResponse is the public auth config for the login page.
type LoginOptionsResponse struct {
	LocalAuthEnabled bool                `json:"local_auth_enabled"`
	Providers        []LoginProviderInfo `json:"providers"`
}

type LoginProviderInfo struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

// LoginOptions returns enabled auth methods (public, no JWT).
func (h *AuthHandler) LoginOptions(c *gin.Context) {
	cfg := h.live.Snapshot()
	localUsers := cfg.Users.LocalUsers
	if localUsers == nil {
		localUsers = []config.LocalUser{}
	}
	hasLocalAuth := cfg.Auth.LocalAuthEnabled && (len(localUsers) > 0 || (cfg.Users.DefaultAdmin != nil && cfg.Users.DefaultAdmin.Password != ""))
	c.JSON(http.StatusOK, LoginOptionsResponse{
		LocalAuthEnabled: hasLocalAuth,
		Providers:        buildOAuthProviders(cfg),
	})
}

// LocalLoginRequest is the body for POST /api/auth/local.
type LocalLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LocalLogin authenticates a local user or default admin and returns JWT.
func (h *AuthHandler) LocalLogin(c *gin.Context) {
	cfg := h.live.Snapshot()
	localUsers := cfg.Users.LocalUsers
	if localUsers == nil {
		localUsers = []config.LocalUser{}
	}
	hasLocalAuth := cfg.Auth.LocalAuthEnabled && (len(localUsers) > 0 || (cfg.Users.DefaultAdmin != nil && cfg.Users.DefaultAdmin.Password != ""))
	if !hasLocalAuth {
		c.JSON(http.StatusBadRequest, gin.H{"error": "local auth not enabled"})
		return
	}
	var req LocalLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username and password required"})
		return
	}
	username := strings.TrimSpace(req.Username)
	password := req.Password
	if username == "" || password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username and password required"})
		return
	}
	var authUsername string
	// Check local_users first
	for i := range localUsers {
		if strings.EqualFold(localUsers[i].Username, username) {
			if err := bcrypt.CompareHashAndPassword([]byte(localUsers[i].Password), []byte(password)); err != nil {
				log.Printf("[auth] local user login failed: username=%q reason=invalid_credentials", localUsers[i].Username)
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
				return
			}
			authUsername = localUsers[i].Username
			break
		}
	}
	da := cfg.Users.DefaultAdmin
	if authUsername == "" && da != nil && da.Password != "" &&
		strings.EqualFold(da.Username, username) {
		if err := bcrypt.CompareHashAndPassword([]byte(da.Password), []byte(password)); err != nil {
			log.Printf("[auth] local user login failed: username=%q reason=invalid_credentials", da.Username)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
			return
		}
		authUsername = da.Username
	}
	if authUsername == "" {
		log.Printf("[auth] local user login failed: username=%q reason=unknown_user", username)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}
	log.Printf("[auth] local user logged in: username=%q", authUsername)
	claims := jwt.MapClaims{
		"sub":   authUsername,
		"email": authUsername,
		"name":  authUsername,
		"exp":   time.Now().Add(tokenExpiry).Unix(),
		"iat":   time.Now().Unix(),
	}
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := jwtToken.SignedString(h.jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create session"})
		return
	}
	redirect := c.Query("redirect")
	if redirect == "" {
		redirect = "/files"
	}
	if redirect[0] != '/' {
		redirect = "/" + redirect
	}
	c.JSON(http.StatusOK, gin.H{"token": tokenString, "redirect": redirect})
}

func (h *AuthHandler) OAuthLogin(provider string) gin.HandlerFunc {
	return func(c *gin.Context) {
		cfg := h.oauth2Configs[provider]
		if cfg == nil || cfg.ClientID == "" {
			c.Redirect(http.StatusFound, h.redirectTo("/login?error=config"))
			return
		}
		state := c.Query("state")
		if state == "" {
			state = "/files"
		}
		opts := []oauth2.AuthCodeOption{}
		if provider == "google" {
			opts = append(opts, oauth2.AccessTypeOffline, oauth2.SetAuthURLParam("prompt", "select_account"))
		}
		url := cfg.AuthCodeURL(state, opts...)
		c.Redirect(http.StatusFound, url)
	}
}

func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	h.OAuthLogin("google")(c)
}

func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	h.oauthCallback("google", c)
}

func (h *AuthHandler) GitHubLogin(c *gin.Context) {
	h.OAuthLogin("github")(c)
}

func (h *AuthHandler) GitHubCallback(c *gin.Context) {
	h.oauthCallback("github", c)
}

func (h *AuthHandler) oauthCallback(provider string, c *gin.Context) {
	cfg := h.oauth2Configs[provider]
	if cfg == nil || cfg.ClientID == "" {
		c.Redirect(http.StatusFound, h.redirectTo("/login?error=config"))
		return
	}

	code := c.Query("code")
	if code == "" {
		c.Redirect(http.StatusFound, h.redirectTo("/login?error=no_code"))
		return
	}

	ctx := context.Background()
	token, err := cfg.Exchange(ctx, code)
	if err != nil {
		c.Redirect(http.StatusFound, h.redirectTo("/login?error=exchange"))
		return
	}

	var email, name, picture string
	switch provider {
	case "google":
		email, name, picture, err = h.fetchGoogleUserInfo(ctx, cfg, token)
	case "github":
		email, name, picture, err = h.fetchGitHubUserInfo(ctx, cfg, token)
	default:
		c.Redirect(http.StatusFound, h.redirectTo("/login?error=provider"))
		return
	}
	if err != nil {
		c.Redirect(http.StatusFound, h.redirectTo("/login?error=userinfo"))
		return
	}

	appCfg := h.live.Snapshot()
	emailKey := strings.ToLower(strings.TrimSpace(email))
	if emailKey == "" {
		log.Printf("[auth] %s user login failed: email=%q name=%q reason=oauth_email_missing", provider, email, name)
		c.Redirect(http.StatusFound, h.redirectTo("/login?error=userinfo"))
		return
	}
	if !appCfg.Users.OauthAllowAllUsers {
		allow := oauthEmailAllowSet(appCfg.Users.OauthAdminEmails, appCfg.Users.OauthAllowedEmails)
		if len(allow) == 0 {
			log.Printf("[auth] %s user login failed: email=%q name=%q reason=oauth_no_allowlist_configured", provider, email, name)
			c.Redirect(http.StatusFound, h.redirectTo("/login?error=oauth_no_allowlist"))
			return
		}
		if _, ok := allow[emailKey]; !ok {
			log.Printf("[auth] %s user login failed: email=%q name=%q reason=oauth_email_not_allowed", provider, email, name)
			c.Redirect(http.StatusFound, h.redirectTo("/login?error=oauth_not_allowed"))
			return
		}
	}

	log.Printf("[auth] %s user logged in: email=%q name=%q", provider, email, name)

	claims := jwt.MapClaims{
		"sub":     email,
		"email":   email,
		"name":    name,
		"picture": picture,
		"exp":     time.Now().Add(tokenExpiry).Unix(),
		"iat":     time.Now().Unix(),
	}
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := jwtToken.SignedString(h.jwtSecret)
	if err != nil {
		c.Redirect(http.StatusFound, h.redirectTo("/login?error=token"))
		return
	}

	state := c.Query("state")
	if state == "" {
		state = "/files"
	}
	redirectPath := state
	if redirectPath[0] != '/' {
		redirectPath = "/" + redirectPath
	}
	c.Redirect(http.StatusFound, h.redirectTo(redirectPath+"#token="+tokenString))
}

func (h *AuthHandler) fetchGoogleUserInfo(ctx context.Context, cfg *oauth2.Config, token *oauth2.Token) (email, name, picture string, err error) {
	client := cfg.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return "", "", "", err
	}
	defer func() { _ = resp.Body.Close() }()

	var userInfo struct {
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return "", "", "", err
	}
	return userInfo.Email, userInfo.Name, userInfo.Picture, nil
}

func (h *AuthHandler) fetchGitHubUserInfo(ctx context.Context, cfg *oauth2.Config, token *oauth2.Token) (email, name, picture string, err error) {
	client := cfg.Client(ctx, token)

	// Fetch user profile
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		return "", "", "", err
	}
	defer func() { _ = resp.Body.Close() }()

	var user struct {
		Login  string `json:"login"`
		Name   string `json:"name"`
		Email  string `json:"email"`
		Avatar string `json:"avatar_url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return "", "", "", err
	}

	email = user.Email
	name = user.Name
	if name == "" {
		name = user.Login
	}
	picture = user.Avatar

	// GitHub may not return email in user response; fetch from /user/emails if needed
	if email == "" {
		email, err = h.fetchGitHubPrimaryEmail(ctx, client)
		if err != nil {
			return "", "", "", err
		}
	}
	if email == "" {
		email = user.Login + "@users.noreply.github.com"
	}
	return email, name, picture, nil
}

func (h *AuthHandler) fetchGitHubPrimaryEmail(_ context.Context, client *http.Client) (string, error) {
	resp, err := client.Get("https://api.github.com/user/emails")
	if err != nil {
		return "", err
	}
	defer func() { _ = resp.Body.Close() }()

	var emails []struct {
		Email    string `json:"email"`
		Primary  bool   `json:"primary"`
		Verified bool   `json:"verified"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&emails); err != nil {
		return "", err
	}
	for _, e := range emails {
		if e.Primary && e.Verified {
			return e.Email, nil
		}
	}
	for _, e := range emails {
		if e.Verified {
			return e.Email, nil
		}
	}
	return "", nil
}

func (h *AuthHandler) redirectTo(path string) string {
	base := h.live.Snapshot().Frontend.URL
	if base == "" || base == "/" {
		return path
	}
	if len(base) > 0 && base[len(base)-1] == '/' {
		base = base[:len(base)-1]
	}
	if len(path) > 0 && path[0] == '/' {
		return base + path
	}
	return base + "/" + path
}

// Me returns the current user (requires auth middleware).
func (h *AuthHandler) Me(c *gin.Context) {
	cfg := h.live.Snapshot()
	email, _ := c.Get("user_email")
	name, _ := c.Get("user_name")
	picture, _ := c.Get("user_picture")
	emailStr, _ := email.(string)
	isAdmin := config.UserIsAdmin(cfg, emailStr)
	c.JSON(http.StatusOK, gin.H{
		"email":    email,
		"name":     name,
		"picture":  picture,
		"is_admin": isAdmin,
	})
}
