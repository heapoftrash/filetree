# Releases blog

The docs **Releases** page (`/blog/`) lists posts from `docs/blog/posts/`.

This file is for contributors (not part of the published site).

## Auto posts from GitHub Releases

1. Add the tag to [`docs/blog/announce.txt`](../blog/announce.txt) (one per line, e.g. `v1.0.1`).
2. On the next docs build, `docs/scripts/generate_release_posts.py` creates a post from the GitHub release body (sections cleaned up for reading).
3. Generated files include `generated: true` in frontmatter and are safe to overwrite.

Optional: put `<!-- docs-blog -->` in a release name/body, or set repo variable `DOCS_BLOG_TAGS`.

## Write a post yourself

Create a markdown file under `posts/`:

```text
docs/blog/posts/YYYY-MM-DD-my-slug.md
```

Minimal frontmatter:

```yaml
---
date: 2026-11-21T18:00:00Z   # include time — newest sort first
authors:
  - filetree
categories:
  - Releases
slug: my-slug
version: v1.0.1              # optional; shown on the card/hero
image: assets/images/release-thumb.svg
---

# Your title

One or two sentences for the card teaser.

<!-- more -->

Your full post here. Use normal markdown.

Optional GitHub button + section cards (same as generated posts):

<p class="ft-post-cta"><a class="md-button md-button--primary" href="https://github.com/heapoftrash/filetree/releases/tag/v1.0.1">View on GitHub</a></p>

<div class="ft-post-sections" markdown="1">

### What's new

- Something useful
- Another highlight

</div>
```

**Do not** set `generated: true` on hand-written posts — the generator will leave those files alone (including when the same tag is in `announce.txt`).

### Replace an auto-generated release post

1. Add the tag to `announce.txt` if you still want it “announced”.
2. Commit your own `YYYY-MM-DD-vX-Y-Z.md` **without** `generated: true`.
3. Docs CI keeps your file and skips regenerating that slug.

### Sort order

Posts are listed **newest first** by the `date` frontmatter. Same calendar day? Use a full datetime (`2026-11-20T19:32:06Z`) so the later release wins.

Authors live in [`docs/blog/.authors.yml`](../blog/.authors.yml).
