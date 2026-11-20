#!/usr/bin/env python3
"""Generate MkDocs Material blog posts from GitHub Releases (opt-in only).

A release gets a blog post only if it opts in via one of:
  - tag listed in docs/blog/announce.txt  (preferred with Release Please)
  - tag listed in DOCS_BLOG_TAGS (comma-separated env/repo variable)
  - body or name contains <!-- docs-blog -->  (manual releases)

Drafts are never published. Everything else without an opt-in is skipped.

Env:
  GITHUB_REPOSITORY  owner/repo (default: heapoftrash/filetree)
  GITHUB_TOKEN       optional; raises API rate limits
  DOCS_BLOG_TAGS     optional comma-separated tags to include
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BLOG_MARKER = "<!-- docs-blog -->"
REPO = os.environ.get("GITHUB_REPOSITORY", "heapoftrash/filetree")
TOKEN = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN") or ""
BLOG_TAGS = {
    t.strip()
    for t in os.environ.get("DOCS_BLOG_TAGS", "").split(",")
    if t.strip()
}

ROOT = Path(__file__).resolve().parents[2]
POSTS_DIR = ROOT / "docs" / "blog" / "posts"
ANNOUNCE_FILE = ROOT / "docs" / "blog" / "announce.txt"


def load_announce_tags() -> set[str]:
    tags: set[str] = set()
    if not ANNOUNCE_FILE.is_file():
        return tags
    for line in ANNOUNCE_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        tags.add(line)
    return tags


def fetch_releases() -> list[dict]:
    releases: list[dict] = []
    page = 1
    while True:
        url = (
            f"https://api.github.com/repos/{REPO}/releases"
            f"?per_page=100&page={page}"
        )
        req = urllib.request.Request(
            url,
            headers={
                "Accept": "application/vnd.github+json",
                "User-Agent": "filetree-docs-release-posts",
                **({"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}),
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                batch = json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")
            print(f"error: GitHub API {e.code}: {body}", file=sys.stderr)
            sys.exit(1)
        if not batch:
            break
        releases.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return releases


def opt_in_reason(rel: dict, announce: set[str]) -> str | None:
    """Return why this release is included, or None if it should not get a post."""
    tag = rel.get("tag_name") or ""
    name = rel.get("name") or ""
    body = rel.get("body") or ""
    if rel.get("draft"):
        return None
    if tag in announce:
        return "announce.txt"
    if tag in BLOG_TAGS:
        return f"DOCS_BLOG_TAGS ({tag})"
    blob = f"{name}\n{body}"
    if BLOG_MARKER in blob:
        return BLOG_MARKER
    return None


def skip_reason(rel: dict) -> str:
    if rel.get("draft"):
        return "draft"
    return "no opt-in (add tag to docs/blog/announce.txt)"


def slugify_tag(tag: str) -> str:
    s = tag.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "release"


def post_date(rel: dict) -> str:
    raw = rel.get("published_at") or rel.get("created_at")
    if not raw:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return raw[:10]


def _teaser(body: str, max_chars: int = 160) -> str:
    """One short plain line for the blog index; full notes stay after <!-- more -->."""
    lines: list[str] = []
    for raw in body.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or line.startswith("<!--"):
            continue
        line = re.sub(r"^[\*\-\+]\s+", "", line)
        line = re.sub(r"\*\*([^*]+)\*\*", r"\1", line)
        line = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", line)
        lines.append(line)
    text = " ".join(lines).strip()
    if not text:
        return "Release notes available on the full post."
    if len(text) > max_chars:
        cut = text[: max_chars - 1].rsplit(" ", 1)[0]
        return cut + "…"
    return text


def write_post(rel: dict) -> Path:
    tag = rel["tag_name"]
    title = (rel.get("name") or tag).strip() or tag
    date = post_date(rel)
    slug = slugify_tag(tag)
    body = (rel.get("body") or "").strip()
    html_url = rel.get("html_url") or f"https://github.com/{REPO}/releases/tag/{tag}"

    body = body.replace(BLOG_MARKER, "").strip()
    if not body:
        body = "_No release notes._"

    teaser = _teaser(body)
    front = "\n".join(
        [
            "---",
            f"date: {date}",
            "authors:",
            "  - filetree",
            "categories:",
            "  - Releases",
            f"slug: {slug}",
            f"version: {tag}",
            "image: assets/images/release-thumb.svg",
            "---",
            "",
            f"# {title}",
            "",
            teaser,
            "",
            "<!-- more -->",
            "",
            f"[View on GitHub]({html_url})",
            "",
            body,
            "",
        ]
    )

    path = POSTS_DIR / f"{date}-{slug}.md"
    path.write_text(front, encoding="utf-8")
    return path


def main() -> None:
    POSTS_DIR.mkdir(parents=True, exist_ok=True)
    for old in POSTS_DIR.glob("*.md"):
        old.unlink()

    announce = load_announce_tags()
    if announce:
        print(f"announce.txt tags: {', '.join(sorted(announce))}")
    else:
        print("announce.txt: (empty)")

    releases = fetch_releases()
    written = 0
    skipped = 0
    for rel in releases:
        tag = rel.get("tag_name", "?")
        why = opt_in_reason(rel, announce)
        if not why:
            print(f"skip {tag}: {skip_reason(rel)}")
            skipped += 1
            continue
        path = write_post(rel)
        print(f"write {path.relative_to(ROOT)} ({why})")
        written += 1

    print(f"done: {written} posts, {skipped} skipped")


if __name__ == "__main__":
    main()
