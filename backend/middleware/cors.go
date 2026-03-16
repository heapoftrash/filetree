package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

// CORS returns a handler that validates Origin against allowed origins.
// If origins contains "*", allows any origin. Otherwise echoes Origin only if it matches.
func CORS(allowedOrigins []string) gin.HandlerFunc {
	allowAll := false
	for _, o := range allowedOrigins {
		if o == "*" {
			allowAll = true
			break
		}
	}
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if allowAll {
			c.Header("Access-Control-Allow-Origin", "*")
		} else {
			if origin != "" {
				for _, allowed := range allowedOrigins {
					if strings.EqualFold(origin, allowed) {
						c.Header("Access-Control-Allow-Origin", origin)
						break
					}
				}
			}
			c.Header("Vary", "Origin")
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
