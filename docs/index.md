---
template: home.html
title: Self-hosted web file manager
hide: [navigation]
hero:
  title: Self-hosted web file manager
  subtitle: Browse, upload, preview, and manage files from your browser.
  intro: "<strong>Filetree</strong> is a minimalistic, self-hosted file manager — browse, upload, preview, and manage files from your browser. No cloud lock-in, no database. Simple YAML or JSON config, single binary deployment."
  install_button: Getting Started
  features_button: Features
  config_button: Configuration
features:
  - title: Browse & manage
    image: assets/images/browse-manage.svg
    description: List, create folders, rename, move, copy, delete (with trash). Drag-and-drop uploads.
  - title: Rich previews
    image: assets/images/rich-preview.svg
    description: Images, video, audio, PDF, Markdown, JSON, CSV, HTML, text — preview in the browser.
  - title: Secure auth
    image: assets/images/secure-auth.svg
    description: Google OAuth, GitHub OAuth, or local username/password. JWT-based sessions.
  - title: Signed URLs
    image: assets/images/signed-url.svg
    description: Short-lived signed URLs for previews and downloads. Time-limited access, no long-lived links.
  - title: Simple admin
    image: assets/images/simple-admin.svg
    description: No database. YAML or JSON config file. Simple admin UI to manage auth providers and settings.
showcase:
  - title: Social login
    description: Google OAuth, GitHub OAuth, or local auth.
    link: features/#secure-auth
    image: assets/images/social-login.png
    icon: material/login
  - title: Easy user management
    description: Add, edit, and manage users in the admin UI.
    link: features/#simple-admin
    image: assets/images/user-management.png
    icon: material/account-cog
  - title: Drag and drop
    description: Upload files by dragging them into the browser.
    link: features/#browse-manage
    image: assets/images/drag-drop.png
    icon: material/drag

  - title: Drag and drop
    description: Upload files by dragging them into the browser.
    link: features/#browse-manage
    image: assets/images/drag-drop.png
    icon: material/drag
---

<!-- ## Tech stack

- **Backend:** Go, Gin, JWT, OAuth2 (Google, GitHub)
- **Frontend:** React, TypeScript, Ant Design, Vite -->
