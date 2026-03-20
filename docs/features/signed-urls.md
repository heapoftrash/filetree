---
title: Signed URLs
icon: material/link-variant
---

# Signed URLs

Generate short-lived signed URLs for previews and downloads. Share access without exposing your JWT or creating long-lived public links.

## How it works

1. **Request a signed URL** — Call `POST /api/entries/signed-url` with `path` and `action` (`"preview"` or `"download"`). Requires a valid JWT.
2. **Response** — The API returns a full URL with `path`, `exp` (expiry timestamp), and `sig` (HMAC signature) as query parameters.
3. **Use the URL** — Anyone with the URL can preview or download the file until it expires. No JWT needed.

## Security

- **HMAC-SHA256** — The signature is computed over `action`, `path`, and `exp` using the JWT secret. Tampering invalidates the link.
- **Expiry** — Links expire after **5 minutes** by default. The backend rejects expired links.
- **Action binding** — A link signed for `preview` cannot be used for `download`, and vice versa.

## Example

```json
POST /api/entries/signed-url
{"path": "documents/report.pdf", "action": "preview"}

→ {"url": "/api/entries/preview?path=documents%2Freport.pdf&exp=1736940900&sig=..."}
```
