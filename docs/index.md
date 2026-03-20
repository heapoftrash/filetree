---
template: home.html
icon: material/home
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
showcase_title: Built for simplicity. Minimalistic to configure. Rich in features.
showcase:
  - title: Social login
    description: Sign in with Google OAuth, GitHub OAuth, or use local username and password. JWT-based sessions keep you authenticated securely across requests.
    link: features/secure-auth/
    icon: material/login
  - title: Easy user management
    description: Add, edit, and manage users directly in the admin UI. No database required — users are stored in your YAML or JSON config file.
    link: features/simple-admin/
    icon: material/account-cog
  - title: Drag and drop
    description: Upload files by dragging them into the browser. Supports multiple file selection and works seamlessly with the folder tree view.
    link: features/browse-manage/
    icon: material/drag
  - title: Works on all devices
    description: Responsive web interface that runs on desktop, tablet, and mobile. Access your files from any browser, anywhere.
    link: features/browse-manage/
    icon: material/cellphone
  - title: Fast and lightweight
    description: Single binary, no database, minimal dependencies. Starts in milliseconds and uses little memory. Built with Go for performance.
    link: getting-started/installation/
    icon: material/lightning-bolt
  - title: Open Source
    description: MIT licensed. Host it yourself, modify it, contribute. No vendor lock-in — your files stay under your control.
    link: https://github.com/heapoftrash/filetree
    icon: material/github
demo:
  heading: More than just a file browser
  title: Simple and feature rich web interface
  description: "Browse, upload, preview, and manage files from your browser. <strong>Drag-and-drop</strong> uploads, <strong>rich previews</strong> for images and documents, and a <strong>responsive layout</strong> that works on desktop, tablet, and mobile."
  link: features/
---

<!-- ## Tech stack

- **Backend:** Go, Gin, JWT, OAuth2 (Google, GitHub)
- **Frontend:** React, TypeScript, Ant Design, Vite -->
