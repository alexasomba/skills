# Preset adoption contract

The `factory/` directory contains reference implementations owned by this
preset. A consuming repository may copy or import them through a deliberate
sync task, but installation does not overwrite project-owned scripts or hooks.

The consuming repository must expose these Vite+ tasks:

- `agent:doctor`
- `agent:worktree:create`
- `agent:verify`
- `agent:land`
- `agent:promotion:status`

Project adapters supply build, check, test, deployment dry-run, Cloudflare target,
and package-layout details. Hook wrappers are generated locally by Vite+ config;
the tracked hook bodies remain reviewable project files.
