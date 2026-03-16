package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// RequireAdmin returns a handler that aborts with 403 if user_email is not in adminEmails or localAdminUsernames.
func RequireAdmin(adminEmails []string, localAdminUsernames []string) gin.HandlerFunc {
	adminSet := make(map[string]bool)
	for _, e := range adminEmails {
		adminSet[strings.ToLower(strings.TrimSpace(e))] = true
	}
	for _, u := range localAdminUsernames {
		adminSet[strings.ToLower(strings.TrimSpace(u))] = true
	}
	return func(c *gin.Context) {
		emailVal, ok := c.Get("user_email")
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin required"})
			return
		}
		email, _ := emailVal.(string)
		if adminSet[strings.ToLower(email)] {
			c.Next()
			return
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin required"})
	}
}
