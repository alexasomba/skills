#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const git = (args) => spawnSync("git", args, { encoding: "utf8" });
const gh = (args) => spawnSync("gh", args, { encoding: "utf8" });
const remote = git(["remote", "get-url", "origin"]);
if (remote.status !== 0) {
  console.error("promotion status unavailable: origin is missing");
  process.exit(2);
}
const repository = remote.stdout
  .trim()
  .replace(/.*github.com[:/]/u, "")
  .replace(/\.git$/u, "");
const shaResult = git(["rev-parse", "origin/preview"]);
if (shaResult.status !== 0) {
  console.error("promotion status unavailable: origin/preview is missing");
  process.exit(2);
}
const sha = shaResult.stdout.trim();
const checks = gh([
  "api",
  `repos/${repository}/commits/${sha}/check-runs`,
  "--jq",
  ".check_runs[] | {name,status,conclusion,details_url}",
]);
if (checks.status !== 0) {
  console.error("promotion status unavailable: authenticate gh for read access");
  process.exit(2);
}
console.log(JSON.stringify({ sha, promotion: "preview -> main", humanMergeRequired: true }));
process.stdout.write(checks.stdout);
