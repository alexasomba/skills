#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const failures = [];
for (const file of [
  ".agents/preset-lock.json",
  ".agents/workflow-manifest.json",
  ".vite-hooks/pre-push",
]) {
  if (!existsSync(resolve(root, file))) failures.push(`missing ${file}`);
}
try {
  const manifest = JSON.parse(
    readFileSync(resolve(root, ".agents/workflow-manifest.json"), "utf8"),
  );
  if (
    manifest.integrationBranch !== "preview" ||
    manifest.productionBranch !== "main" ||
    manifest.worktrees?.mode !== "detached"
  )
    failures.push("invalid workflow manifest");
} catch {
  failures.push("unreadable workflow manifest");
}
for (const command of ["git", "node"]) {
  if (spawnSync(command, ["--version"], { encoding: "utf8" }).status !== 0)
    failures.push(`missing ${command}`);
}
if (spawnSync("pnpm", ["exec", "vp", "--version"], { encoding: "utf8" }).status !== 0)
  failures.push("missing Vite+ (vp)");
if (!existsSync(resolve(root, "node_modules", ".bin", "vpr")))
  failures.push("missing Vite+ task runner (vpr)");
if (failures.length) {
  console.error(`agent:doctor failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("agent:doctor passed");
