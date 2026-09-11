# Codex-first skills catalog

This repository is the tagged source of truth for a Vite+-enforced software
factory. It classifies all eight repository assets without mixing first-party
workflow code with vendored skills.

## Managed preset

`automaticpallet-viteplus-workflow` installs four first-party skills:

- `automaticpallet-viteplus-workflow`
- `code-structure`
- `evidence-driven-testing`
- `new-feature`

The preset combines detached `origin/preview` worktrees, Vite+ hooks and task
contracts, product-owned architecture boundaries, deterministic evidence, exact
SHA validation, Cloudflare preview gates, and human promotion to `main`.

Install a tagged commit through staging:

```sh
node bin/alexasomba-skills.mjs install \
  --root /path/to/repository \
  --tag v1.0.0 \
  --commit 0123456789abcdef0123456789abcdef01234567
```

Use `check` to detect drift and `update` with a new tag and commit only after the
current install verifies. The lock records every managed file. Installation does
not alter the consuming repository's `.agents/skills-lock.json` or automatically
overwrite its project-owned scripts and hooks; factory templates live inside the
preset for explicit adoption.

## Factory workflow

```text
isolate → build → prove → squash/push preview
→ validate the exact preview SHA on Cloudflare
→ preview-to-main PR → human merge
```

The supported project interface is:

```text
vp run agent:doctor
vp run agent:worktree:create <name>
vp staged
vp run agent:verify
vp run agent:land <name>
vp run agent:promotion:status
```

Only `preview` accepts local pushes. External uploads, PR edits, review triggers,
and thread resolution require an explicit user instruction. Evidence is local and
redacted by default.

## Upstream-locked vendor skills

The remaining four assets are retained for provenance and comparison, but are
not copied by the managed preset:

- `before-and-after` — PolyForm Shield 1.0.0; no global-install or public-upload default
- `greploop` — MIT; read/review-only unless external writes are explicitly requested
- `greploop-apps` — MIT local variant; same authorization boundary
- `unslop` — MIT; optional prose cleanup that never rewrites code or exact technical text

Their licenses remain in their source directories and their repository revisions
are recorded in `catalog.json`.

## Development

Run repository checks through Vite+:

```sh
vp check
vpr catalog:test
vpr evidence:test
```

The portable factory gate is `vpr factory:verify`. Evidence tests use `uv` for
an isolated pytest runtime and require a Linux host plus an FFmpeg build with the
capabilities documented by the skill; CI provisions that environment and runs
the suite separately.

New first-party skills need concise trigger-focused `SKILL.md` entrypoints and may
put detailed guidance in `references/`. Adding or replacing a vendor skill also
requires an immutable revision, its original license, and a catalog test update.
