import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const bin = fileURLToPath(new URL("../bin/alexasomba-skills.mjs", import.meta.url));
const run = (command, root) =>
  spawnSync(
    process.execPath,
    [bin, command, "--root", root, "--tag", "v-test", "--commit", "abc1234"],
    { encoding: "utf8" },
  );

test("installs the complete first-party catalog and preserves third-party locks", () => {
  const root = mkdtempSync(join(tmpdir(), "skills-catalog-"));
  mkdirSync(join(root, ".agents"), { recursive: true });
  const thirdPartyLock = join(root, ".agents", "skills-lock.json");
  writeFileSync(thirdPartyLock, '{"kept":true}\n');
  assert.equal(run("install", root).status, 0);
  assert.equal(run("check", root).status, 0);
  const lock = JSON.parse(readFileSync(join(root, ".agents", "preset-lock.json"), "utf8"));
  assert.equal(lock.schemaVersion, 2);
  assert.equal(lock.commit, "abc1234");
  assert.ok(Object.keys(lock.files).length > 10);
  for (const skill of [
    "automaticpallet-viteplus-workflow",
    "code-structure",
    "evidence-driven-testing",
    "new-feature",
  ]) {
    assert.ok(existsSync(join(root, ".agents", "skills", skill, "SKILL.md")));
  }
  assert.ok(
    existsSync(
      join(
        root,
        ".agents",
        "skills",
        "automaticpallet-viteplus-workflow",
        "factory",
        "scripts",
        "worktree.mjs",
      ),
    ),
  );
  assert.equal(readFileSync(thirdPartyLock, "utf8"), '{"kept":true}\n');
});

test("check and update refuse local drift", () => {
  const root = mkdtempSync(join(tmpdir(), "skills-catalog-"));
  assert.equal(run("install", root).status, 0);
  const path = join(root, ".agents", "skills", "code-structure", "SKILL.md");
  writeFileSync(path, `${readFileSync(path, "utf8")}drift`);
  assert.notEqual(run("check", root).status, 0);
  assert.notEqual(run("update", root).status, 0);
});

test("a verified install updates cleanly", () => {
  const root = mkdtempSync(join(tmpdir(), "skills-catalog-"));
  assert.equal(run("install", root).status, 0);
  const result = spawnSync(
    process.execPath,
    [bin, "update", "--root", root, "--tag", "v-next", "--commit", "def5678"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0);
  const lock = JSON.parse(readFileSync(join(root, ".agents", "preset-lock.json"), "utf8"));
  assert.equal(lock.tag, "v-next");
  assert.equal(lock.commit, "def5678");
});

test("update removes files no longer owned by the catalog", () => {
  const root = mkdtempSync(join(tmpdir(), "skills-catalog-"));
  assert.equal(run("install", root).status, 0);
  const obsolete = join(root, ".agents", "skills", "obsolete.txt");
  writeFileSync(obsolete, "old managed file\n");
  const lockPath = join(root, ".agents", "preset-lock.json");
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  lock.files[".agents/skills/obsolete.txt"] = createHash("sha256")
    .update(readFileSync(obsolete))
    .digest("hex");
  writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  const result = spawnSync(
    process.execPath,
    [bin, "update", "--root", root, "--tag", "v-next", "--commit", "def5678"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0);
  assert.equal(existsSync(obsolete), false);
});

test("install refuses unmanaged targets and incomplete provenance", () => {
  const root = mkdtempSync(join(tmpdir(), "skills-catalog-"));
  const unmanaged = join(root, ".agents", "skills", "code-structure", "SKILL.md");
  mkdirSync(join(unmanaged, ".."), { recursive: true });
  writeFileSync(unmanaged, "unmanaged\n");
  assert.notEqual(run("install", root).status, 0);
  const cleanRoot = mkdtempSync(join(tmpdir(), "skills-catalog-"));
  const missingCommit = spawnSync(
    process.execPath,
    [bin, "install", "--root", cleanRoot, "--tag", "v-test"],
    { encoding: "utf8" },
  );
  assert.notEqual(missingCommit.status, 0);
});
