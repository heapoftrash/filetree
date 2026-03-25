package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"net/url"
	"strconv"
	"time"
)

const signedURLExpiry = 5 * time.Minute

// SignURL creates a signed query string for path and action. Uses JWTSecret.
// action must be "preview" or "download" to bind the signature to a specific endpoint.
func SignURL(path, action string) (exp int64, sig string) {
	exp = time.Now().Add(signedURLExpiry).Unix()
	payload := "action=" + action + "&path=" + path + "&exp=" + strconv.FormatInt(exp, 10)
	mac := hmac.New(sha256.New, JWTSecret)
	mac.Write([]byte(payload))
	sig = base64.URLEncoding.EncodeToString(mac.Sum(nil))
	return exp, sig
}

// VerifySignedURL validates sig for path, exp, and action. Returns true if valid.
func VerifySignedURL(path, expStr, sig, action string) bool {
	exp, err := strconv.ParseInt(expStr, 10, 64)
	if err != nil || time.Now().Unix() > exp {
		return false
	}
	payload := "action=" + action + "&path=" + path + "&exp=" + expStr
	mac := hmac.New(sha256.New, JWTSecret)
	mac.Write([]byte(payload))
	expected := base64.URLEncoding.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(sig), []byte(expected))
}

// BuildSignedPreviewURL returns the full path with query for preview.
func BuildSignedPreviewURL(path string) string {
	exp, sig := SignURL(path, "preview")
	return "/api/entries/preview?path=" + url.QueryEscape(path) + "&exp=" + strconv.FormatInt(exp, 10) + "&sig=" + url.QueryEscape(sig)
}

// BuildSignedDownloadURL returns the full path with query for download.
func BuildSignedDownloadURL(path string) string {
	exp, sig := SignURL(path, "download")
	return "/api/entries/download?path=" + url.QueryEscape(path) + "&exp=" + strconv.FormatInt(exp, 10) + "&sig=" + url.QueryEscape(sig)
}
