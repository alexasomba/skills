---
name: automaticpallet-viteplus-workflow
description: Use in AutomaticPallet for any code or workflow task. It enforces detached origin/preview worktrees, Vite+ tasks, local evidence, and human-gated preview-to-main promotion.
---

# AutomaticPallet Codex workflow

Run `vp run agent:doctor` before substantial work. Check open work and dirty
checkouts for scope overlap, then create isolated work with
`vp run agent:worktree:create <name>`; never create a task branch. Worktrees do
not isolate ports, databases, credentials, or lockfiles, so identify shared
resources before changing them.

Use `vp staged` for fast checkpoints, targeted project tasks while iterating,
and `vp run agent:verify` for the full local contract. Record the exact tested
SHA and local, redacted evidence before landing. Land only through
`vp run agent:land <name>`, which squashes and may push only `preview`.

`main` is changed only by a human merge of the `preview` to `main` promotion PR.
Use `vp run agent:promotion:status` to inspect, never change, its CI and
Cloudflare evidence. Do not upload evidence, edit PRs, trigger reviews, or resolve
threads without an explicit user instruction. Database access belongs in the
product `data-ops` boundary. Treat exact commands, code, identifiers, and quoted
technical text as immutable during prose cleanup.

Read [references/lifecycle.md](references/lifecycle.md) for the factory loop,
[references/review-protocol.md](references/review-protocol.md) for bounded review
helpers, and [references/preset-contract.md](references/preset-contract.md) before
adopting or updating the factory templates.
