package uiembed

import (
	"io/fs"
)

// DistRoot returns an fs.FS rooted at the embedded dist/ tree when index.html is present.
func DistRoot() (fs.FS, bool) {
	sub, err := fs.Sub(Dist, "dist")
	if err != nil {
		return nil, false
	}
	if _, err := fs.Stat(sub, "index.html"); err != nil {
		return nil, false
	}
	return sub, true
}
