//go:build !embed

package web

import "embed"

// Dist is empty unless the binary is built with -tags embed and web/dist contains the Vite output.
var Dist embed.FS
