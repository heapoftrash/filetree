//go:build embed

package uiembed

import "embed"

//go:embed all:dist
var Dist embed.FS
