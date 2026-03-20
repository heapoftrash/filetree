FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.25-alpine AS backend
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -o filetree .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=backend /app/filetree .
COPY --from=frontend /app/frontend/dist ./frontend/dist

EXPOSE 8080

ENV ROOT_PATH=/data
VOLUME /data

ENTRYPOINT ["./filetree"]
