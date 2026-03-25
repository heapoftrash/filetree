FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/ ./
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN if [ ! -f dist/index.html ]; then npm ci && npm run build; fi

FROM golang:1.25-alpine AS backend
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
COPY --from=frontend /app/frontend/dist ./web/dist
RUN CGO_ENABLED=0 go build -tags embed -o filetree .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=backend /app/filetree .

EXPOSE 8080

ENV ROOT_PATH=/data
VOLUME /data

ENTRYPOINT ["./filetree"]
