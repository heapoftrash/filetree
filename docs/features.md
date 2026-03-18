---
title: Features
features:
  - title: Browse & manage
    icon: material/folder
    # image: assets/images/browse-manage.svg
    description: List, create folders, rename, move, copy, delete (with trash). Drag-and-drop uploads.
  - title: Rich previews
    icon: material/file-document-outline
    description: Images, video, audio, PDF, Markdown, JSON, CSV, HTML, text — preview in the browser.
  - title: Secure auth
    icon: material/shield-account
    description: Google OAuth, GitHub OAuth, or local username/password. JWT-based sessions.
  - title: Signed URLs
    icon: material/link-variant
    description: Short-lived signed URLs for previews and downloads. Time-limited access.
  - title: Simple admin
    icon: material/cog
    description: No database. YAML or JSON config file. Simple admin UI to manage auth and settings.
---

# Features

Filetree provides a focused set of features for self-hosted file management. No database, no cloud lock-in — just a single binary and a config file.

---

## Browse & manage

<figure markdown="span">
  ![Image title](https://dummyimage.com/600x400/){ width="300" }
  <figcaption>Image caption</figcaption>
</figure>

Browse your files in a familiar folder layout. Create folders, rename, move, copy, and delete files. Deleted items go to a trash folder so you can recover them before permanent removal.

**Highlights:**

- Folder tree sidebar for quick navigation
- List and grid views
- Drag-and-drop to move or copy files between folders

---

## Rich previews

Preview files directly in the browser without downloading. Supported formats include images (JPEG, PNG, GIF, WebP, SVG), video and audio, PDFs, Markdown, JSON, CSV, HTML, and plain text.

**Highlights:**

- In-browser preview for common formats
- No extra plugins or apps required
- Signed URLs for secure, time-limited preview links

---

## Secure auth

Sign in with Google OAuth, GitHub OAuth, or local username/password. Sessions use JWT tokens. You can enable one or more providers and manage local users in the admin UI.

**Highlights:**

- Google and GitHub OAuth
- Local users with bcrypt-hashed passwords
- JWT-based sessions; configurable token expiry

---

## Signed URLs

Generate short-lived signed URLs for previews and downloads. Links expire after a set time, so you can share access without long-lived or public links.

**Highlights:**

- Time-limited access (configurable expiry)
- HMAC-signed URLs to prevent tampering
- Suitable for preview links and secure downloads

---

## Simple admin

No database — configuration is stored in a single YAML or JSON file. The admin UI lets you toggle auth providers, add or remove local users, and adjust settings without editing config manually.

**Highlights:**

- YAML or JSON config file
- Admin UI for auth and user management
- No database setup or migrations
