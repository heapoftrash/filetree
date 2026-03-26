---
title: Authentication
icon: material/shield-account
features:
  - title: Local users
    icon: fontawesome/regular/user
    description: Local username and password. Use `password` (plaintext or bcrypt; plaintext hashed on first run).
  - title: Social Authentication
    icon: material/login
    description: Use <strong>Google</strong> or <strong>Github</strong> as OAuth providers.

---

# :material-account-check-outline: Authentication

Filetree supports **Google OAuth**, **GitHub OAuth**, and **local username/password**. Protected routes require a valid JWT.

## :fontawesome-regular-user: Local users

Local auth uses username and password stored in the config file. No OAuth or external provider is required. Filetree stores the password in a bcrypt hash format. On success, a JWT is issued and the frontend stores it for subsequent requests.

Both `default_admin` and `local_users` use a single `password` field. Use plaintext (e.g. `changeme`) — on first startup, Filetree hashes it and replaces it in-place. You can also provide a bcrypt hash (e.g. from `htpasswd -nbB user pass`).

=== "YAML"
    ``` yaml title="config.yaml"
    auth:
      jwt_secret: your-secret-here
      local_auth_enabled: true
      oauth_redirect_url: ""

    users:
      default_admin:
        username: admin
        password: changeme
      local_users:
        - username: heapoftrash
          password: changeme
          is_admin: false
    ```

=== "JSON"
    ```json title="config.json"
    {
      "auth": {
        "jwt_secret": "your-secret-here",
        "local_auth_enabled": true,
        "oauth_redirect_url": ""
      },
      "users": {
        "default_admin": {
          "username": "admin",
          "password": "changeme"
        },
        "local_users": [
          {
            "username": "heapoftrash",
            "password": "changeme",
            "is_admin": false
          }
        ]
      }
    }
    ```

## :material-google: Google OAuth

Setup Google as OAuth provider

=== "YAML"
    ```yaml title="config.yaml"
    auth:
      jwt_secret: your-secret-here
      oauth_redirect_url: https://your-domain.com/api/auth/google/callback
      providers:
        google:
          enabled: true
          client_id: xxx.apps.googleusercontent.com
          client_secret: xxx

    users:
      admin_emails: [admin@example.com]
    ```

=== "JSON"
    ```json title="config.json"
    {
      "auth": {
        "jwt_secret": "your-secret-here",
        "oauth_redirect_url": "https://your-domain.com/api/auth/google/callback",
        "providers": {
          "google": {
            "enabled": true,
            "client_id": "xxx.apps.googleusercontent.com",
            "client_secret": "xxx"
          }
        }
      },
      "users": {
        "admin_emails": [
          "admin@example.com"
        ]
      }
    }
    ```

## :simple-github: GitHub OAuth

Setup Google as OAuth provider

=== "YAML"
    ```yaml title="config.yaml"
    auth:
      jwt_secret: your-secret-here
      oauth_redirect_url: https://your-domain.com/api/auth/github/callback
      providers:
        github:
          enabled: true
          client_id: xxx
          client_secret: xxx

    users:
      admin_emails: [admin@example.com]
    ```
=== "JSON"
    ```json title="config.json"
    {
      "auth": {
        "jwt_secret": "your-secret-here",
        "oauth_redirect_url": "https://your-domain.com/api/auth/github/callback",
        "providers": {
          "github": {
            "enabled": true,
            "client_id": "xxx",
            "client_secret": "xxx"
          }
        }
      },
      "users": {
        "admin_emails": [
          "admin@example.com"
        ]
      }
    }
    ```
## Config snippet

An example config of all authentication methods

=== "YAML"
    ```yaml title="config.yaml"
    auth:
      jwt_secret: your-secret-here
      oauth_redirect_url: https://your-domain.com/api/auth/google/callback
      local_auth_enabled: true
      providers:
        google:
          enabled: true
          client_id: xxx.apps.googleusercontent.com
          client_secret: xxx
        github:
          enabled: true
          client_id: xxx
          client_secret: xxx

    users:
      admin_emails: [admin@example.com]
      local_users:
        - username: bob
          password: changeme          # plaintext hashed on first run, or use bcrypt hash
          is_admin: false
      default_admin:
        username: admin
        password: changeme
    ```
=== "JSON"
    ```json title="config.json"
    {
      "auth": {
        "jwt_secret": "your-secret-here",
        "oauth_redirect_url": "https://your-domain.com/api/auth/google/callback",
        "local_auth_enabled": true,
        "providers": {
          "google": {
            "enabled": true,
            "client_id": "xxx.apps.googleusercontent.com",
            "client_secret": "xxx"
          },
          "github": {
            "enabled": true,
            "client_id": "xxx",
            "client_secret": "xxx"
          }
        }
      },
      "users": {
        "admin_emails": [
          "admin@example.com"
        ],
        "local_users": [
          {
            "username": "bob",
            "password": "changeme",
            "is_admin": false
          }
        ],
        "default_admin": {
          "username": "admin",
          "password": "changeme"
        }
      }
    }
    ```

!!! note "Password bootstrap"
    `default_admin` and `local_users` use a single `password` field. Plaintext is hashed on first startup and replaced in-place. You can also provide a bcrypt hash directly.

!!! note "OAuth admins"
    `admin_emails` applies **only to OAuth users** (Google/GitHub). For local users, set `is_admin: true` per user in `local_users`.

!!! note "OAuth allowlist"
    `allowed_oauth_emails` lists non-admin OAuth users who may sign in. The allowlist is `admin_emails` ∪ `allowed_oauth_emails`. If OAuth is enabled and both are empty, OAuth sign-in is blocked unless `allow_all_oauth_users` is true (open sign-in; trusted environments only).


!!! note "OAuth redirect URL"
    - `oauth_redirect_url` must contain `https://your-domain.com/api/auth/` Filetree replace the path with `https://your-domain.com/api/auth/{provider}/callback`.
    
    - `callback_url` can also be set explicitely for a Oauth provider

    | Config | Purpose |
    |--------|---------|
    | `auth.oauth_redirect_url` | Base callback URL; used to derive provider-specific URLs when provider `callback_url` is not set |
    | `auth.providers.google.callback_url` | Optional; full callback URL for Google. If empty, derived from `oauth_redirect_url` |
    | `auth.providers.github.callback_url` | Optional; full callback URL for GitHub. If empty, derived from `oauth_redirect_url` |

    === "Single base callback URL :material-information:{ .info } <small> recommended </small>"
        ```yaml title="config.yaml"
        auth:
        oauth_redirect_url: https://myapp.com/api/auth/google/callback
        providers:
          google:
            enabled: true
            client_id: xxx
            client_secret: xxx
          github:
            enabled: true
            client_id: xxx
            client_secret: xxx
        ```

    === "Provider Specific callback URL"
        ```yaml title="config.yaml"
        auth:
        providers:
          google:
            enabled: true
            client_id: xxx
            client_secret: xxx
            callback_url: https://myapp.com/api/auth/google/callback
          github:
            enabled: true
            client_id: xxx
            client_secret: xxx
            callback_url: https://myapp.com/auth/github/callback
        ```
