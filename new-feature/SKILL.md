---
name: new-feature
description: Start a Codex task in a project-owned detached worktree from origin/preview. Use before writing code in a Vite+ project.
---

# Start work

Run `vp run agent:doctor`, then `vp run agent:worktree:create <name>` from the
primary checkout. The worktree is detached at `origin/preview`; do not create or
push a task branch. Use project tasks for installs, checks, and landing. Shared
ports and databases are still shared. Preserve other worktrees and report overlap.
