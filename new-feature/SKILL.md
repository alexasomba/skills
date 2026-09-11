---
name: new-feature
description: Start a Codex task in a project-owned detached worktree from origin/preview. Use before writing code in a Vite+ project.
---

# Start work

1. Run `vp run agent:doctor` from the primary `preview` checkout.
2. Inspect active work and uncommitted changes. Compare intended files with open
   pull-request diffs when local metadata or authenticated read access is
   available. Stop for direction on material overlap.
3. Choose a unique `<type>-<topic>_<purpose>` name and run
   `vp run agent:worktree:create <name>`.
4. Confirm the new worktree is detached at `origin/preview`, install through the
   project Vite+ task, and verify the required runtime.
5. Identify shared ports, databases, credentials, and dependency lockfiles.

Never create or push a task branch. Never reuse, force-remove, or edit another
task's worktree. A responding port is not proof that it belongs to this worktree;
verify the owning process. Regenerate conflicted lockfiles through Vite+ rather
than hand-merging them. Finish with `vp run agent:verify` and land only through
`vp run agent:land <name>`.
