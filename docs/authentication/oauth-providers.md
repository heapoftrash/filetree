---
title: OAuth providers
icon: material/login
---

# OAuth providers

=== "Google"

    :fontawesome-brands-google:

    1. Go to [Google Cloud Console](https://console.cloud.google.com/)
    2. Create a project (or select an existing one)
    3. Enable the **Google+ API** or **People API** (for user profile)
    4. Go to **APIs & Services → Credentials** and create **OAuth 2.0 Client ID**
    5. Choose **Web application**
    6. Add **Authorized redirect URI**: `http://localhost:8080/api/auth/google/callback` (dev) or `https://your-domain.com/api/auth/google/callback` (production)
    7. Copy **Client ID** and **Client secret** into config or env vars

=== "GitHub"

    :fontawesome-brands-github:

    1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
    2. Click **New OAuth App**
    3. Set **Application name** and **Homepage URL**
    4. Set **Authorization callback URL**: `https://your-domain.com/api/auth/github/callback` (must use HTTPS in production)
    5. Copy **Client ID** and generate **Client secret** into config or env vars

## Callback URLs

The backend derives callback URLs from `oauth_redirect_url`:

- Google: `{oauth_redirect_url}` (use the Google callback path)
- GitHub: Replace `/google/` with `/github/` in the path

So if `oauth_redirect_url` is `https://example.com/api/auth/google/callback`, the GitHub callback is `https://example.com/api/auth/github/callback`.
