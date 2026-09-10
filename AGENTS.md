# Codex-first workflow

This catalog's mandatory workflow is the preset manifest. For a Vite+ project,
use its project tasks, never raw package-manager or Git commands:

1. `vp run agent:doctor`
2. `vp run agent:worktree:create <name>` from `origin/preview` in a detached worktree
3. `vp staged` while iterating and `vp run agent:verify` before landing
4. `vp run agent:land <name>` to squash and push `preview`
5. inspect `vp run agent:promotion:status`; a human merges `preview` to `main`.

No agent creates task branches, pushes outside `preview`, merges production, or
performs external writes (uploads, PR edits, review triggers, thread resolution)
without an explicit user instruction. Evidence is local and redacted by default.
The PolyForm `before-and-after` vendor directory is not a managed preset.
Third-party entries remain upstream locks, not rehosted copies.
