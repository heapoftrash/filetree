FROM node:20-alpine AS frontend
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
COPY --from=frontend /app/web/dist ./web/dist
RUN CGO_ENABLED=0 go build -tags embed -o filetree .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=backend /app/filetree .

EXPOSE 8080

ENV ROOT_PATH=/data
VOLUME /data

ENTRYPOINT ["./filetree"]
