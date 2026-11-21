---
title: Authentication
icon: material/shield-account
hide:
  - toc
features:
  - title: Setup
    icon: material/cog
    description: Enable local users and OAuth in config — JWT is always required
    link: authentication/setup/
  - title: OAuth providers
    icon: material/login
    description: Create Google or GitHub OAuth apps and wire client IDs / callbacks
    link: authentication/oauth-providers/
  - title: Secure auth
    icon: material/shield-account
    description: How sessions, allowlists, and admin access work in the product
    link: features/secure-auth/
---

# Authentication

Filetree supports **local username/password**, **Google OAuth**, and **GitHub OAuth**. You can enable one or more providers; users pick at login.

There is **no unauthenticated mode** — protected API routes and the UI require a valid JWT. If no login methods are configured, the login page shows that nothing is available until you enable local auth and/or OAuth.

| Guide | What you’ll do |
|-------|----------------|
| [Setup](setup.md) | Config snippets for local users, OAuth, allowlists, and redirects |
| [OAuth providers](oauth-providers.md) | Create credentials in Google Cloud / GitHub |
| [Secure auth](../features/secure-auth.md) | JWT sessions, allowlists, and admin access |

Also see [Configuration](../configuration/) for the full `auth` / `users` schema.
