# Build JS on the builder host arch only so npm does not run under QEMU (e.g. arm/v7).
FROM --platform=$BUILDPLATFORM node:20-alpine AS frontend
WORKDIR /app/web
COPY app/web/package.json app/web/package-lock.json ./
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm ci
COPY app/web/ ./
RUN npm run build

FROM golang:1.25-alpine AS backend
WORKDIR /app
COPY app/go.mod app/go.sum ./
RUN go mod download
COPY app/ ./
COPY --from=frontend /app/web/dist ./uiembed/dist
COPY version.txt /tmp/version.txt
# Same short hash as Makefile / CI: git rev-parse --short HEAD (not full SHA)
ARG GIT_COMMIT=unknown
RUN VERSION=$(tr -d '\n' </tmp/version.txt) && \
  CGO_ENABLED=0 go build -tags embed -trimpath \
  -ldflags="-s -w -X github.com/heapoftrash/filetree/app/version.Version=${VERSION} -X github.com/heapoftrash/filetree/app/version.Commit=${GIT_COMMIT}" \
  -o filetree .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=backend /app/filetree .

EXPOSE 8080

ENV ROOT_PATH=/data
VOLUME /data

ENTRYPOINT ["./filetree"]
