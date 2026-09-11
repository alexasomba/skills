#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const [command, name, ...args] = process.argv.slice(2);
const validName =
  /^(feat|fix|chore|docs|refactor|test|style|ci|perf)-[a-z0-9]+(?:-[a-z0-9]+)*_[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function fail(message) {
  throw new Error(message);
}

function git(gitArgs, cwd, inherit = false, environment = process.env) {
  const result = spawnSync("git", gitArgs, {
    cwd,
    env: environment,
    encoding: "utf8",
    stdio: inherit ? "inherit" : "pipe",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (result.status !== 0)
    fail(result.stderr || result.stdout || `git ${gitArgs.join(" ")} failed`);
  return inherit ? "" : result.stdout.trim();
}

function succeeds(gitArgs, cwd) {
  return spawnSync("git", gitArgs, { cwd, stdio: "ignore" }).status === 0;
}

const root = git(["rev-parse", "--show-toplevel"]);
const pathFor = (value) => {
  if (!validName.test(value || "")) fail("Invalid worktree name; use <type>-<topic>_<purpose>.");
  return resolve(root, ".worktrees", value);
};

function previewRoot() {
  const branch = git(["branch", "--show-current"], root);
  if (branch !== "preview")
    fail(`Run from the primary preview checkout, not ${branch || "detached HEAD"}.`);
  if (git(["status", "--porcelain"], root)) fail("Primary preview checkout is dirty.");
}

function fetchPreview() {
  git(["fetch", "origin", "preview"], root, true);
  return git(["rev-parse", "origin/preview"], root);
}

function syncPreview(environment = process.env) {
  const remote = fetchPreview();
  const local = git(["rev-parse", "HEAD"], root);
  if (local === remote) return remote;
  if (!succeeds(["merge-base", "--is-ancestor", local, remote], root)) {
    fail("Local preview contains unpushed commits; push it before synchronizing.");
  }
  git(["merge", "--ff-only", "origin/preview"], root, true, environment);
  return remote;
}

function runVitePlus(commandArgs, cwd) {
  const result = spawnSync("pnpm", ["exec", "vp", ...commandArgs], { cwd, stdio: "inherit" });
  if (result.status !== 0) fail(`vp ${commandArgs.join(" ")} failed`);
}

try {
  if (command === "create") {
    previewRoot();
    const target = pathFor(name);
    if (existsSync(target)) fail(`Worktree already exists: ${target}`);
    fetchPreview();
    git(["worktree", "add", "--detach", target, "origin/preview"], root, true);
    if (existsSync(resolve(target, "package.json"))) runVitePlus(["install"], target);
    console.log(`Created detached worktree ${target}`);
  } else if (command === "sync") {
    previewRoot();
    syncPreview({ ...process.env, LTP_AUTOMATED_MERGE: "1" });
  } else if (command === "land") {
    previewRoot();
    const target = pathFor(name);
    const messageIndex = args.indexOf("--message");
    const message = messageIndex === -1 ? undefined : args[messageIndex + 1];
    if (!message) fail("land requires --message '<type>: <summary>'.");
    if (!existsSync(target)) fail(`Worktree does not exist: ${target}`);
    if (git(["status", "--porcelain"], target)) fail(`Worktree ${name} has uncommitted changes.`);
    const environment = { ...process.env, LTP_AUTOMATED_MERGE: "1" };
    const remote = syncPreview(environment);
    const head = git(["rev-parse", "HEAD"], target);
    if (!succeeds(["merge-base", "--is-ancestor", "HEAD", head], root)) {
      fail(`${name} does not contain the current preview; recreate it before landing.`);
    }
    git(["merge", "--squash", head], root, true, environment);
    if (existsSync(resolve(root, "package.json"))) runVitePlus(["install"], root);
    runVitePlus(["run", "agent:verify"], root);
    git(["commit", "-m", message], root, true, environment);
    const landed = git(["rev-parse", "HEAD"], root);
    const push = spawnSync(
      "git",
      [
        "push",
        "origin",
        "HEAD:refs/heads/preview",
        `--force-with-lease=refs/heads/preview:${remote}`,
      ],
      { cwd: root, stdio: "inherit" },
    );
    if (push.status !== 0) {
      git(["reset", "--hard", remote], root, true, environment);
      fail("origin/preview advanced; the local squash was rolled back.");
    }
    git(["worktree", "remove", "--force", target], root, true);
    git(["worktree", "prune"], root, true);
    console.log(`Landed ${landed} on origin/preview.`);
  } else if (command === "remove") {
    previewRoot();
    git(
      ["worktree", "remove", ...(args.includes("--force") ? ["--force"] : []), pathFor(name)],
      root,
      true,
    );
    git(["worktree", "prune"], root, true);
  } else {
    fail("Usage: worktree.mjs <create|sync|land|remove> [name] [--message MESSAGE] [--force]");
  }
} catch (error) {
  console.error(`worktree: ${error.message}`);
  process.exit(1);
}
