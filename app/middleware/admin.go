package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/heapoftrash/filetree/app/config"
)

// RequireAdmin returns a handler that aborts with 403 unless the authenticated identity is an
// admin according to the live *config.Config (same rules as AuthHandler.Me).
func RequireAdmin(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		emailVal, ok := c.Get("user_email")
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin required"})
			return
		}
		email, _ := emailVal.(string)
		if config.UserIsAdmin(cfg, email) {
			c.Next()
			return
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin required"})
	}
}
