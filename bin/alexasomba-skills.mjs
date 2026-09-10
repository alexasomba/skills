#!/usr/bin/env node
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const source = dirname(dirname(fileURLToPath(import.meta.url)));
const preset = "automaticpallet-viteplus-workflow";
const args = process.argv.slice(2);
const command = args[0];
const value = (name) => args[args.indexOf(name) + 1];
const root = value("--root") || process.cwd();
const sourceDir = join(source, "presets", preset);
const targetDir = join(root, ".agents", "skills", preset);
const manifestTarget = join(root, ".agents", "workflow-manifest.json");
const lockPath = join(root, ".agents", "preset-lock.json");
const digest = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const files = ["SKILL.md", "workflow-manifest.json"];
const hashes = () => Object.fromEntries(files.map((file) => [file, digest(join(sourceDir, file))]));
const lock = () => ({ preset, tag: value("--tag") || "local", commit: value("--commit") || "unknown", installerVersion: "1.0.0-rc.1", hashes: hashes() });
function installed() { return existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, "utf8")) : null; }
function verify() {
  const current = installed();
  if (!current) throw new Error("Preset lock is missing; run install.");
  for (const [file, hash] of Object.entries(current.hashes)) if (!existsSync(join(targetDir, file)) || digest(join(targetDir, file)) !== hash) throw new Error(`Managed preset drift: ${file}`);
  if (!existsSync(manifestTarget) || digest(manifestTarget) !== current.hashes["workflow-manifest.json"]) throw new Error("Managed workflow manifest drift.");
  return current;
}
try {
  if (!["install", "check", "update"].includes(command)) throw new Error("Usage: alexasomba-skills <install|check|update> [--root PATH] [--tag TAG] [--commit SHA]");
  if (command === "check") { verify(); console.log("Preset lock and managed files are valid."); process.exit(0); }
  if (installed()) verify();
  if (existsSync(targetDir) && !installed()) throw new Error("Refusing to adopt unmanaged preset files.");
  const stage = `${targetDir}.staging`;
  rmSync(stage, { recursive: true, force: true }); mkdirSync(dirname(stage), { recursive: true }); cpSync(sourceDir, stage, { recursive: true });
  rmSync(targetDir, { recursive: true, force: true }); cpSync(stage, targetDir, { recursive: true }); rmSync(stage, { recursive: true, force: true });
  cpSync(join(sourceDir, "workflow-manifest.json"), manifestTarget);
  writeFileSync(lockPath, `${JSON.stringify(lock(), null, 2)}\n`);
  console.log(`${command === "update" ? "Updated" : "Installed"} ${preset}.`);
} catch (error) { console.error(`Preset error: ${error.message}`); process.exit(1); }
