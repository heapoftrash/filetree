package main

import (
	"io/fs"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/heapoftrash/filetree/app/uiembed"
)

func mountFrontend(r *gin.Engine) {
	if mountEmbeddedFrontend(r) {
		return
	}
	mountDiskFrontend(r)
}

func mountEmbeddedFrontend(r *gin.Engine) bool {
	distFS, ok := uiembed.DistRoot()
	if !ok {
		return false
	}
	httpDist := http.FS(distFS)
	if assetsFS, err := fs.Sub(distFS, "assets"); err == nil {
		r.StaticFS("/assets", http.FS(assetsFS))
	}
	for _, name := range []string{"favicon.svg", "icon-light.svg"} {
		n := name
		if _, err := fs.Stat(distFS, n); err != nil {
			continue
		}
		r.GET("/"+n, func(c *gin.Context) {
			c.FileFromFS(n, httpDist)
		})
	}
	// Do not use StaticFileFS("/", ...): Gin returns 301 with Location: "./", which breaks clients.
	serveIndex := func(c *gin.Context) {
		c.FileFromFS("index.html", httpDist)
	}
	r.GET("/", serveIndex)
	r.HEAD("/", serveIndex)
	r.NoRoute(func(c *gin.Context) {
		c.FileFromFS("index.html", httpDist)
	})
	log.Println("Serving embedded frontend (built with -tags embed)")
	return true
}

func mountDiskFrontend(r *gin.Engine) {
	var frontendDir string
	for _, p := range []string{"./app/web/dist", "./app/uiembed/dist", "./web/dist", "./uiembed/dist"} {
		if _, err := os.Stat(p + "/index.html"); err == nil {
			frontendDir = p
			break
		}
	}
	if frontendDir == "" {
		return
	}
	r.Static("/assets", frontendDir+"/assets")
	if _, err := os.Stat(frontendDir + "/favicon.svg"); err == nil {
		r.StaticFile("/favicon.svg", frontendDir+"/favicon.svg")
	}
	if _, err := os.Stat(frontendDir + "/icon-light.svg"); err == nil {
		r.StaticFile("/icon-light.svg", frontendDir+"/icon-light.svg")
	}
	indexPath := frontendDir + "/index.html"
	serveIndex := func(c *gin.Context) {
		c.File(indexPath)
	}
	r.GET("/", serveIndex)
	r.HEAD("/", serveIndex)
	r.NoRoute(func(c *gin.Context) {
		c.File(indexPath)
	})
	log.Printf("Serving frontend from disk (%s)\n", frontendDir)
}
