package main

import (
	"log"
	"os"

	"filetree/backend/config"
	"filetree/backend/handlers"
	"filetree/backend/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load("")
	if err != nil {
		log.Fatalf("config: %v", err)
	}
	if _, err := config.BootstrapDefaultAdmin(cfg); err != nil {
		log.Fatalf("config bootstrap default admin: %v", err)
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

		// Admin-only config routes
		localAdminUsernames := make([]string, 0)
		for _, u := range cfg.Users.LocalUsers {
			if u.IsAdmin {
				localAdminUsernames = append(localAdminUsernames, u.Username)
			}
		}
		if cfg.Users.DefaultAdmin != nil && cfg.Users.DefaultAdmin.PasswordHash != "" {
			localAdminUsernames = append(localAdminUsernames, cfg.Users.DefaultAdmin.Username)
		}
		configGroup := api.Group("/config", middleware.Auth(), middleware.RequireAdmin(cfg.Users.AdminEmails, localAdminUsernames))
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

	// Serve frontend in production when built (try cwd and parent for frontend/dist)
	var frontendDir string
	for _, p := range []string{"./frontend/dist", "../frontend/dist"} {
		if _, err := os.Stat(p + "/index.html"); err == nil {
			frontendDir = p
			break
		}
	}
	if frontendDir != "" {
		r.Static("/assets", frontendDir+"/assets")
		if _, err := os.Stat(frontendDir + "/favicon.svg"); err == nil {
			r.StaticFile("/favicon.svg", frontendDir+"/favicon.svg")
		}
		if _, err := os.Stat(frontendDir + "/icon-light.svg"); err == nil {
			r.StaticFile("/icon-light.svg", frontendDir+"/icon-light.svg")
		}
		r.StaticFile("/", frontendDir+"/index.html")
		r.NoRoute(func(c *gin.Context) {
			c.File(frontendDir + "/index.html")
		})
	}

	log.Printf("filetree API listening on :8080 (ROOT_PATH=%s)", cfg.Server.RootPath)
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
