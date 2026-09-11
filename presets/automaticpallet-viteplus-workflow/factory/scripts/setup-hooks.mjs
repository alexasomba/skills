#!/usr/bin/env node
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const git = (args) => {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  return result.stdout.trim();
};

try {
  const root = git(["rev-parse", "--show-toplevel"]);
  const dispatcher = join(root, ".vite-hooks", "_");
  const wrapper = '#!/usr/bin/env sh\n. "$(dirname "$0")/h"\n';
  mkdirSync(dispatcher, { recursive: true });
  for (const hook of [
    "commit-msg",
    "post-checkout",
    "post-merge",
    "pre-commit",
    "pre-merge-commit",
    "pre-push",
    "pre-rebase",
  ]) {
    const target = join(dispatcher, hook);
    writeFileSync(target, wrapper);
    chmodSync(target, 0o755);
  }
  git(["config", "--local", "core.hooksPath", ".vite-hooks/_"]);
  console.log("Configured the local Vite+ hook dispatcher.");
} catch (error) {
  console.error(`hook setup: ${error.message}`);
  process.exit(1);
}
