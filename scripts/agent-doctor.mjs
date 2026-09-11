#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const failures = [];
for (const file of [
  "catalog.json",
  "vite.config.ts",
  ".vite-hooks/pre-commit",
  ".vite-hooks/pre-push",
  "presets/automaticpallet-viteplus-workflow/workflow-manifest.json",
  "presets/automaticpallet-viteplus-workflow/factory/scripts/worktree.mjs",
]) {
  if (!existsSync(file)) failures.push(`missing ${file}`);
}
try {
  const catalog = JSON.parse(readFileSync("catalog.json", "utf8"));
  if (
    catalog.schemaVersion !== 2 ||
    catalog.firstParty?.length !== 4 ||
    catalog.thirdParty?.length !== 4
  ) {
    failures.push("catalog does not classify all eight assets");
  }
} catch {
  failures.push("catalog is unreadable");
}
for (const command of ["git", "node", "uv"]) {
  if (spawnSync(command, ["--version"], { encoding: "utf8" }).status !== 0)
    failures.push(`missing ${command}`);
}
if (spawnSync("pnpm", ["exec", "vp", "--version"], { encoding: "utf8" }).status !== 0)
  failures.push("missing Vite+ (vp)");
if (!existsSync("node_modules/.bin/vpr")) failures.push("missing Vite+ task runner (vpr)");
const hooksPath = spawnSync("git", ["config", "--local", "--get", "core.hooksPath"], {
  encoding: "utf8",
}).stdout.trim();
if (hooksPath !== ".vite-hooks/_")
  failures.push("Vite+ hook dispatcher is not configured; run vp config --hooks --no-agent");
if (failures.length) {
  console.error(`agent:doctor failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("agent:doctor passed: catalog, Vite+, factory templates, and hooks are ready.");
