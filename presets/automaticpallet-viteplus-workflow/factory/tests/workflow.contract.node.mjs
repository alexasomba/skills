import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("workflow manifest keeps the delivery invariants", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../../workflow-manifest.json", import.meta.url), "utf8"),
  );
  assert.equal(manifest.integrationBranch, "preview");
  assert.equal(manifest.productionBranch, "main");
  assert.equal(manifest.worktrees.mode, "detached");
  assert.equal(manifest.promotion.humanMergeRequired, true);
  assert.equal(manifest.externalWrites.requiresExplicitUserInstruction, true);
  assert.equal(manifest.verification.exactTestedShaRequired, true);
});

test("pre-push rejects non-preview destinations", () => {
  const hook = new URL("../hooks/pre-push", import.meta.url);
  const result = spawnSync("sh", [hook.pathname], {
    input: "refs/heads/main abc refs/heads/main def\n",
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Only preview/u);
});

test("pre-push runs the complete local gate for preview", () => {
  const hook = new URL("../hooks/pre-push", import.meta.url);
  const bin = mkdtempSync(join(tmpdir(), "skills-hooks-"));
  const executable = join(bin, "pnpm");
  writeFileSync(executable, '#!/bin/sh\n[ "$1" = exec ] || exit 1\nexit 0\n');
  chmodSync(executable, 0o755);
  const result = spawnSync("sh", [hook.pathname], {
    input: "refs/heads/preview abc refs/heads/preview def\n",
    encoding: "utf8",
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
  });
  assert.equal(result.status, 0, result.stderr);
});

test("pre-commit keeps worktree checkpoints on vp staged", () => {
  const hook = readFileSync(new URL("../hooks/pre-commit", import.meta.url), "utf8");
  assert.match(hook, /exec pnpm exec vp staged/u);
  assert.match(hook, /LTP_AUTOMATED_MERGE/u);
});
