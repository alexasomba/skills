import { defineConfig } from "vite-plus";

export default defineConfig({
  check: {
    fmt: true,
  },
  staged: {
    "*.{js,mjs,ts,json,md,yml,yaml}": "vp check --fix",
  },
  lint: {
    ignorePatterns: [
      "before-and-after/**",
      "greploop/**",
      "greploop-apps/**",
      "unslop/**",
      "**/.worktrees/**",
    ],
  },
  run: {
    tasks: {
      "agent:doctor": { command: "node scripts/agent-doctor.mjs", cache: false },
      "agent:worktree:create": {
        command:
          "node presets/automaticpallet-viteplus-workflow/factory/scripts/worktree.mjs create",
        cache: false,
      },
      "agent:verify": {
        command: "vp check && vpr factory:verify",
        cache: false,
      },
      "agent:land": {
        command: "node presets/automaticpallet-viteplus-workflow/factory/scripts/worktree.mjs land",
        cache: false,
      },
      "agent:promotion:status": {
        command:
          "node presets/automaticpallet-viteplus-workflow/factory/scripts/promotion-status.mjs",
        cache: false,
      },
      "catalog:check": { command: "node scripts/check-catalog.mjs" },
      "catalog:test": { command: "node --test tests/catalog.contract.node.mjs" },
      "workflow:test": {
        command:
          "node --test presets/automaticpallet-viteplus-workflow/factory/tests/workflow.contract.node.mjs",
      },
      "evidence:test": {
        command: "uv run --with pytest python -m pytest tests/ -q",
        cache: false,
      },
      "factory:verify": {
        command: "vp run catalog:check && vp run catalog:test && vp run workflow:test",
        cache: false,
      },
    },
  },
});
