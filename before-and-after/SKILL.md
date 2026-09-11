---
name: before-and-after
description: Captures before/after screenshots of web pages or elements for visual comparison. Use when user says "take before and after", "screenshot comparison", "visual diff", "PR screenshots", "compare old and new", or needs to document UI changes. Accepts two URLs (file://, http://, https://) or two image paths.
allowed-tools:
  - Bash(npx @vercel/before-and-after *)
  - Bash(before-and-after *)
  - Bash(which before-and-after)
  - Bash(curl -s -o /dev/null -w *)
  - Bash(gh pr view *)
  - Bash(vercel inspect *)
  - Bash(vercel whoami)
  - Bash(which vercel)
  - Bash(which gh)
---

# Before-After Screenshot Skill

> **Package:** `@vercel/before-and-after`
> Never use `before-and-after` (wrong package).

## Catalog safety override

Capture to local files by default. Do not install a global package, upload media,
edit a PR, or expose a public URL unless the user explicitly requests that exact
external write. Prefer the consuming repository's pinned project command; use
`npx` only when the user accepts its ephemeral download. These rules override
the upstream execution order and examples below.

## Agent Behavior Rules

**DO NOT:**
- Switch git branches, stash changes, start dev servers, or assume what "before" is
- Use `--full` unless user explicitly asks for full page / full scroll capture

**DO:**
- Use `--markdown` only when the user explicitly requests its external upload
- Use `--mobile` / `--tablet` if user mentions phone, mobile, tablet, responsive, etc.
- Assume current state is **After**
- If user provides only one URL or says "PR screenshots" without URLs, **ASK**: "What URL should I use for the 'before' state? (production URL, preview deployment, or another local port)"

## Execution Order (MUST follow)

1. **Pre-flight** — use the repository's pinned command or an already installed
   `before-and-after`; never install it globally
2. **Protection check** — if `.vercel.app` URL: `curl -s -o /dev/null -w "%{http_code}" "<url>"` (401/403 = protected)
3. **Capture** — `before-and-after "<before-url>" "<after-url>"`
4. **Review locally** — inspect both captures and retain them as redacted local artifacts
5. **External delivery** — only when explicitly instructed, upload to the named
   destination and verify the result

**Never skip steps 1-2.**

## Quick Reference

```bash
# Basic usage
before-and-after <before-url> <after-url>

# With selector
before-and-after url1 url2 ".hero-section"

# Different selectors for each
before-and-after url1 url2 ".old-card" ".new-card"

# Viewports
before-and-after url1 url2 --mobile    # 375x812
before-and-after url1 url2 --tablet    # 768x1024
before-and-after url1 url2 --full      # full scroll

# From existing images into a local output directory
before-and-after before.png after.png --output .artifacts/visual-diff

# Via npx (use full package name!)
npx @vercel/before-and-after url1 url2
```

| Flag | Description |
|------|-------------|
| `-m, --mobile` | Mobile viewport (375x812) |
| `-t, --tablet` | Tablet viewport (768x1024) |
| `--size <WxH>` | Custom viewport |
| `-f, --full` | Full scrollable page |
| `-s, --selector` | CSS selector to capture |
| `-o, --output` | Output directory (default: ~/Downloads) |
| `--markdown` | External upload plus markdown; explicit user instruction required |
| `--upload-url <url>` | External endpoint; explicit user instruction required |

## Vercel Deployment Protection

If `.vercel.app` URL returns 401/403:

1. Check Vercel CLI: `which vercel && vercel whoami`
2. If available: `vercel inspect <url>` to get bypass token
3. If not: Tell user to provide bypass token, take manual screenshots, or disable protection

## PR integration

Return local file paths and a comparison summary. Editing a PR or uploading the
images is a separate external write and requires explicit user instruction.

## Error Reference

| Error | Fix |
|-------|-----|
| `command not found` | Use the repository's pinned tool; do not install globally |
| `could not determine executable` | Use `npx @vercel/before-and-after` (full name) |
| 401/403 on .vercel.app | See Vercel protection section |
| Element not found | Verify selector exists on page |
