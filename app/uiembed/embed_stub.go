//go:build !embed

package uiembed

import "embed"

// Dist is empty unless the binary is built with -tags embed and uiembed/dist contains the Vite output (copied from app/web/dist).
var Dist embed.FS
