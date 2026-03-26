package main

import (
	"log"
	"os"

	"github.com/heapoftrash/filetree/app/config"
	"github.com/heapoftrash/filetree/app/handlers"
	"github.com/heapoftrash/filetree/app/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load("")
	if err != nil {
		log.Fatalf("config: %v", err)
	}
	if err := config.BootstrapUsers(cfg); err != nil {
		log.Fatalf("config bootstrap: %v", err)
	}

	if config.OAuthProviderActive(cfg) && !config.OAuthLoginAllowlistConfigured(cfg) {
		log.Println("[config] OAuth provider(s) are enabled but users.oauth_admin_emails and users.oauth_allowed_emails are empty — OAuth sign-in will be denied until at least one email is listed (or set users.oauth_allow_all_users).")
	}
	if config.OAuthProviderActive(cfg) && cfg.Users.OauthAllowAllUsers {
		log.Println("[config] users.oauth_allow_all_users is enabled — any OAuth user with a verified email may sign in; oauth_admin_emails still controls admin access only.")
	}

	if err := os.MkdirAll(cfg.Server.RootPath, 0750); err != nil {
		log.Fatalf("mkdir root: %v", err)
	}

	middleware.JWTSecret = []byte(cfg.Auth.JWTSecret)

	h, err := handlers.New(cfg.Server.RootPath, cfg.Server.MaxUploadBytes)
	if err != nil {
		log.Fatalf("handlers: invalid root path: %v", err)
	}
	authH := handlers.NewAuthHandler(cfg)
	configH := handlers.NewConfigHandler(cfg)
	if !cfg.Server.Debug {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()
	r.Use(middleware.CORS(cfg.Frontend.CORSOrigins))

	api := r.Group("/api")
	{
		// Public auth routes (no JWT required)
		api.GET("/auth/login-options", authH.LoginOptions)
		api.POST("/auth/local", authH.LocalLogin)
		api.GET("/auth/google", authH.GoogleLogin)
		api.GET("/auth/google/callback", authH.GoogleCallback)
		api.GET("/auth/github", authH.GitHubLogin)
		api.GET("/auth/github/callback", authH.GitHubCallback)

		// Protected auth route
		api.GET("/auth/me", middleware.Auth(), authH.Me)

		// Admin-only config routes (RequireAdmin reads live cfg on each request)
		configGroup := api.Group("/config", middleware.Auth(), middleware.RequireAdmin(cfg))
		configGroup.GET("", configH.GetConfig)
		configGroup.PATCH("", configH.UpdateConfig)

		// Protected file routes
		entries := api.Group("/entries", middleware.Auth())
		{
			entries.POST("/signed-url", h.SignedURL)
			entries.GET("/download", h.Download)
			entries.GET("/preview", h.Preview)
			entries.GET("/preview/info", h.PreviewInfo)
			entries.POST("/move", h.Move)
			entries.POST("/copy", h.Copy)
			entries.POST("/zip", h.DownloadZip)
			entries.GET("", h.List)
			entries.POST("", h.CreateOrUpload)
			entries.PATCH("", h.Rename)
			entries.DELETE("", h.Delete)
			entries.POST("/restore", h.Restore)
		}
	}

	// Embedded UI (-tags embed + app/uiembed/dist at compile time) or disk under ./app/web/dist, ./app/uiembed/dist, etc.
	mountFrontend(r)

	log.Printf("filetree API listening on :8080 (ROOT_PATH=%s)", cfg.Server.RootPath)
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
