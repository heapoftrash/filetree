package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWTSecret is set by main.go from env
var JWTSecret []byte

// signedURLAllowedPaths are the only routes that accept signed URL auth.
// Prevents signed URLs from being used for list, preview/info, or other endpoints.
var signedURLAllowedPaths = map[string]string{
	"/api/entries/preview":  "preview",
	"/api/entries/download": "download",
}

// Auth validates the Bearer token (header or ?token= query for GET), or signed URL (path+exp+sig+action for GET on preview/download only), and sets user_email in context.
func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := ""
		if auth := c.GetHeader("Authorization"); auth != "" {
			parts := strings.SplitN(auth, " ", 2)
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}
		if tokenString == "" && c.Request.Method == "GET" {
			tokenString = c.Query("token")
		}
		// For GET on preview/download only: accept signed URL (path, exp, sig) bound to that action
		if tokenString == "" && c.Request.Method == "GET" {
			reqPath := c.Request.URL.Path
			if action, ok := signedURLAllowedPaths[reqPath]; ok {
				path := c.Query("path")
				expStr := c.Query("exp")
				sig := c.Query("sig")
				if path != "" && expStr != "" && sig != "" && VerifySignedURL(path, expStr, sig, action) {
					c.Set("signed_url", true)
					c.Set("user_email", "signed")
					c.Next()
					return
				}
			}
		}
		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing authorization"})
			return
		}
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			return JWTSecret, nil
		})
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		email, _ := claims["email"].(string)
		if email == "" {
			email, _ = claims["sub"].(string)
		}
		if email == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.Set("user_email", email)
		if name, ok := claims["name"].(string); ok {
			c.Set("user_name", name)
		}
		if pic, ok := claims["picture"].(string); ok {
			c.Set("user_picture", pic)
		}
		c.Next()
	}
}
