# Authentication

The app supports **Google OAuth**, **GitHub OAuth**, and **local username/password**. All `/api/entries/*` routes require a valid JWT.

## Flow

- Unauthenticated users are redirected to `/login`.
- Sign in with Google, GitHub, or local username/password.
- After sign-in, the backend issues a JWT; the frontend stores it and uses it for API calls.

## Setup

1. Copy `config.example.yaml` or `config.example.json` to `config.yaml` / `config.json` and set `CONFIG_FILE=./config.yaml`.
2. Configure providers in `auth.providers` (Google, GitHub) and/or enable `auth.local_auth_enabled` for local users.
3. Set environment variables (or use config file):

```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export JWT_SECRET="a-random-secret-for-signing-tokens"
# For dev (frontend on different port):
export FRONTEND_URL="http://localhost:5173"
export OAUTH_REDIRECT_URL="http://localhost:8080/api/auth/google/callback"
```

## OAuth providers

### Google

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the Google+ API (or People API).
3. Create OAuth 2.0 credentials (Web application).
4. Add authorized redirect URI: `http://localhost:8080/api/auth/google/callback` (or your production URL).

### GitHub

1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Create a new OAuth App.
3. Set Authorization callback URL: `https://your-domain.com/api/auth/github/callback`.
