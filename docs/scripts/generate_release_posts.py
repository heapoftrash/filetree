#!/usr/bin/env python3
"""Generate MkDocs Material blog posts from GitHub Releases (opt-in only).

A release gets a blog post only if it opts in via one of:
  - tag listed in docs/blog/announce.txt  (preferred with Release Please)
  - tag listed in DOCS_BLOG_TAGS (comma-separated env/repo variable)
  - body or name contains <!-- docs-blog -->  (manual releases)

Drafts are never published. Everything else without an opt-in is skipped.

Hand-written posts under docs/blog/posts/ (no `generated: true`) are never
deleted or overwritten — see docs/scripts/blog-posts.md.

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

# Release Please section headings → blog-friendly titles
SECTION_TITLES = {
    "Features": "What's new",
    "Bug Fixes": "Fixes",
    "Performance Improvements": "Faster & smoother",
    "Miscellaneous Chores": "Under the hood",
    "Documentation": "Docs",
    "Refactoring": "Cleanup",
    "Code Refactoring": "Cleanup",
    "Reverts": "Reverts",
    "Styles": "UI polish",
    "Tests": "Tests",
    "Build System": "Build",
    "Continuous Integration": "CI",
    "Dependencies": "Dependencies",
}

COMPARE_HEADING = re.compile(
    r"^##\s+\[[^\]]+\]\([^)]+\)\s*(?:\([^)]*\))?\s*$"
)
SECTION_HEADING = re.compile(r"^###\s+(.+?)\s*$")
LIST_ITEM = re.compile(r"^(\s*[\*\-\+]\s+)(.+)$")
MD_LINK = re.compile(r"\[([^\]]+)\]\([^)]+\)")
COMMIT_LINK = re.compile(
    r"\s*\(\[[0-9a-f]{7,40}\]\(https://github\.com/[^)]+/commit/[^)]+\)\)",
    re.I,
)
CLOSES_TAIL = re.compile(r",?\s*closes\s+.*$", re.I)


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


def post_datetime(rel: dict) -> str:
    """Full ISO timestamp so same-day releases sort newest-first in Material blog."""
    raw = rel.get("published_at") or rel.get("created_at")
    if not raw:
        return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if raw.endswith("+00:00"):
        return raw[:-6] + "Z"
    return raw


def post_date_prefix(rel: dict) -> str:
    """Filename prefix (YYYY-MM-DD) — Material also reads time from frontmatter date."""
    return post_datetime(rel)[:10]


def is_generated_post(path: Path) -> bool:
    """True when frontmatter has `generated: true` (safe to overwrite/delete)."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return False
    if not text.startswith("---"):
        return False
    end = text.find("\n---", 3)
    if end < 0:
        return False
    return bool(re.search(r"^generated:\s*true\s*$", text[3:end], re.M))


def find_post_for_slug(slug: str) -> Path | None:
    matches = sorted(POSTS_DIR.glob(f"*-{slug}.md"))
    return matches[0] if matches else None


def _plain(text: str) -> str:
    text = MD_LINK.sub(r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    return re.sub(r"\s+", " ", text).strip()


def _clean_item(text: str) -> str:
    """Drop commit SHAs / closes tails; keep description + first issue/PR link."""
    text = COMMIT_LINK.sub("", text)
    text = CLOSES_TAIL.sub("", text)
    # Keep only the first (#N) link — Release Please often lists issue + PR
    kept_issue = False
    parts: list[str] = []
    last = 0
    for m in MD_LINK.finditer(text):
        parts.append(text[last : m.start()])
        label = m.group(1)
        if label.startswith("#"):
            if kept_issue:
                parts.append("")
            else:
                kept_issue = True
                parts.append(m.group(0))
        else:
            parts.append(m.group(0))
        last = m.end()
    parts.append(text[last:])
    text = "".join(parts)
    text = re.sub(r"\(\s*\)", "", text)
    text = re.sub(r"\s{2,}", " ", text)
    text = re.sub(r"\s+([,;.])", r"\1", text)
    return text.strip(" ,;")


def _section_title(raw: str) -> str:
    return SECTION_TITLES.get(raw.strip(), raw.strip())


def _format_body(body: str) -> tuple[str, list[str]]:
    """Turn Release Please notes into blog sections; return (markdown, highlight lines)."""
    body = body.replace(BLOG_MARKER, "").strip()
    if not body:
        return ("_No release notes yet — check GitHub for details._", [])

    sections: list[tuple[str, list[str]]] = []
    current: str | None = None
    items: list[str] = []
    prose: list[str] = []

    def flush() -> None:
        nonlocal current, items
        if current is not None and items:
            sections.append((current, items))
        current = None
        items = []

    for raw in body.splitlines():
        line = raw.rstrip()
        if not line.strip():
            continue
        if COMPARE_HEADING.match(line.strip()):
            flush()
            continue
        sec = SECTION_HEADING.match(line.strip())
        if sec:
            flush()
            current = _section_title(sec.group(1))
            continue
        li = LIST_ITEM.match(line)
        if li and current is not None:
            cleaned = _clean_item(li.group(2))
            if cleaned:
                items.append(cleaned)
            continue
        if current is None and not line.strip().startswith("#"):
            prose.append(_plain(line))
        elif current is not None:
            # Non-list content under a section — treat as item
            cleaned = _clean_item(line.strip().lstrip("#").strip())
            if cleaned:
                items.append(cleaned)

    flush()

    highlights: list[str] = []
    for _title, sec_items in sections:
        for item in sec_items:
            highlights.append(_plain(item))
            if len(highlights) >= 4:
                break
        if len(highlights) >= 4:
            break
    if not highlights and prose:
        highlights = prose[:2]

    blocks: list[str] = []
    if prose and not sections:
        blocks.append("\n\n".join(prose))

    for title, sec_items in sections:
        blocks.append(f'### {title}\n')
        for item in sec_items:
            blocks.append(f"- {item}")
        blocks.append("")

    if not blocks:
        blocks.append("_No release notes yet — check GitHub for details._")

    return ("\n".join(blocks).strip(), highlights)


def _teaser(highlights: list[str], fallback_body: str, max_chars: int = 160) -> str:
    """One short plain line for the blog index."""
    if highlights:
        text = " · ".join(highlights)
    else:
        text = _teaser_from_raw(fallback_body)
    if not text:
        return "Highlights from this Filetree release."
    if len(text) > max_chars:
        cut = text[: max_chars - 1].rsplit(" ", 1)[0]
        return cut + "…"
    return text


def _teaser_from_raw(body: str) -> str:
    lines: list[str] = []
    for raw in body.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or line.startswith("<!--"):
            continue
        line = re.sub(r"^[\*\-\+]\s+", "", line)
        lines.append(_plain(line))
    return " ".join(lines).strip()


def _humanize_highlight(text: str) -> str:
    """Turn 'web: foo (#124)' into a sentence-friendly 'Foo'."""
    text = re.sub(r"\s*\(#\d+\)\s*", " ", text)
    text = re.sub(r"\s+", " ", text).strip(" .")
    m = re.match(r"^[a-z0-9_-]+:\s*(.+)$", text, re.I)
    if m:
        text = m.group(1).strip()
    if not text:
        return ""
    return text[0].upper() + text[1:]


def _intro(tag: str, highlights: list[str]) -> str:
    if highlights:
        lead = _humanize_highlight(highlights[0])
        if lead:
            return (
                f"**{tag}** is out. {lead}"
                + ("." if not lead.endswith((".", "!", "?")) else "")
            )
    return f"**{tag}** is out — here’s what shipped in this release."


def write_post(rel: dict) -> Path:
    tag = rel["tag_name"]
    title = (rel.get("name") or tag).strip() or tag
    when = post_datetime(rel)
    day = post_date_prefix(rel)
    slug = slugify_tag(tag)
    raw_body = (rel.get("body") or "").strip()
    html_url = rel.get("html_url") or f"https://github.com/{REPO}/releases/tag/{tag}"

    formatted, highlights = _format_body(raw_body)
    teaser = _teaser(highlights, raw_body)
    intro = _intro(tag, highlights)

    front = "\n".join(
        [
            "---",
            f"date: {when}",
            "authors:",
            "  - filetree",
            "categories:",
            "  - Releases",
            f"slug: {slug}",
            f"version: {tag}",
            "image: assets/images/release-thumb.svg",
            "generated: true",
            "---",
            "",
            f"# {title}",
            "",
            teaser,
            "",
            "<!-- more -->",
            "",
            intro,
            "",
            f'<p class="ft-post-cta"><a class="md-button md-button--primary" href="{html_url}">View on GitHub</a></p>',
            "",
            '<div class="ft-post-sections" markdown="1">',
            "",
            formatted,
            "",
            "</div>",
            "",
        ]
    )

    path = POSTS_DIR / f"{day}-{slug}.md"
    path.write_text(front, encoding="utf-8")
    return path


def main() -> None:
    POSTS_DIR.mkdir(parents=True, exist_ok=True)
    # Only remove prior *generated* posts; hand-written markdown is kept.
    for old in POSTS_DIR.glob("*.md"):
        if is_generated_post(old):
            old.unlink()

    announce = load_announce_tags()
    if announce:
        print(f"announce.txt tags: {', '.join(sorted(announce))}")
    else:
        print("announce.txt: (empty)")

    releases = fetch_releases()
    written = 0
    skipped = 0
    kept = 0
    for rel in releases:
        tag = rel.get("tag_name", "?")
        why = opt_in_reason(rel, announce)
        if not why:
            print(f"skip {tag}: {skip_reason(rel)}")
            skipped += 1
            continue
        slug = slugify_tag(tag)
        existing = find_post_for_slug(slug)
        if existing is not None and not is_generated_post(existing):
            print(f"keep {existing.relative_to(ROOT)} (hand-written, skip generate)")
            kept += 1
            continue
        path = write_post(rel)
        print(f"write {path.relative_to(ROOT)} ({why})")
        written += 1

    print(f"done: {written} generated, {kept} hand-written kept, {skipped} skipped")


if __name__ == "__main__":
    main()
