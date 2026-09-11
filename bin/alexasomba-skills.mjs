#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const catalogRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const catalog = JSON.parse(readFileSync(join(catalogRoot, "catalog.json"), "utf8"));
const installerVersion = "2.0.0-rc.1";
const args = process.argv.slice(2);
const command = args[0];
const option = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const targetRoot = resolve(option("--root") || process.cwd());
const lockPath = join(targetRoot, ".agents", "preset-lock.json");

function safeTarget(destination) {
  const target = resolve(targetRoot, destination);
  if (target !== targetRoot && !target.startsWith(`${targetRoot}${sep}`)) {
    throw new Error(`Unsafe catalog destination: ${destination}`);
  }
  return target;
}

function walk(sourceRoot, relativePath = "") {
  const current = join(sourceRoot, relativePath);
  if (lstatSync(current).isSymbolicLink())
    throw new Error(`Managed sources cannot be symlinks: ${current}`);
  if (!lstatSync(current).isDirectory()) return [relativePath];
  return readdirSync(current, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => walk(sourceRoot, join(relativePath, entry.name)));
}

function managedSources() {
  const entries = [];
  for (const skill of catalog.firstParty) {
    const sourceRoot = join(catalogRoot, skill.source);
    for (const file of walk(sourceRoot)) {
      entries.push({ source: join(sourceRoot, file), destination: join(skill.destination, file) });
    }
  }
  for (const file of catalog.managedFiles) {
    entries.push({ source: join(catalogRoot, file.source), destination: file.destination });
  }
  return entries.sort((left, right) => left.destination.localeCompare(right.destination));
}

const digest = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const readLock = () => (existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, "utf8")) : null);

function verify() {
  const lock = readLock();
  if (!lock) throw new Error("Preset lock is missing; run install.");
  if (lock.schemaVersion !== 2 || lock.preset !== catalog.preset || !lock.files) {
    throw new Error("Preset lock format is unsupported; reinstall from a clean target.");
  }
  for (const [destination, expected] of Object.entries(lock.files)) {
    const target = safeTarget(destination);
    if (!existsSync(target) || digest(target) !== expected) {
      throw new Error(`Managed preset drift: ${destination}`);
    }
  }
  return lock;
}

function provenance() {
  const tag = option("--tag");
  const commit = option("--commit");
  if (!tag || !commit || !/^[0-9a-f]{7,40}$/i.test(commit)) {
    throw new Error("install/update require --tag and a 7-40 character hexadecimal --commit.");
  }
  return { tag, commit };
}

function installOrUpdate(previous) {
  const sourceEntries = managedSources();
  const nextDestinations = new Set(sourceEntries.map((entry) => entry.destination));
  const previousDestinations = new Set(Object.keys(previous?.files || {}));

  for (const entry of sourceEntries) {
    const target = safeTarget(entry.destination);
    if (existsSync(target) && !previousDestinations.has(entry.destination)) {
      throw new Error(`Refusing to overwrite unmanaged file: ${entry.destination}`);
    }
  }

  const transactionRoot = join(targetRoot, ".agents", `.preset-transaction-${process.pid}`);
  const stageRoot = join(transactionRoot, "stage");
  const backupRoot = join(transactionRoot, "backup");
  rmSync(transactionRoot, { recursive: true, force: true });

  try {
    for (const entry of sourceEntries) {
      const staged = join(stageRoot, entry.destination);
      mkdirSync(dirname(staged), { recursive: true });
      copyFileSync(entry.source, staged);
    }
    for (const destination of previousDestinations) {
      const backup = join(backupRoot, destination);
      mkdirSync(dirname(backup), { recursive: true });
      copyFileSync(safeTarget(destination), backup);
    }

    const files = {};
    for (const entry of sourceEntries) {
      const target = safeTarget(entry.destination);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(join(stageRoot, entry.destination), target);
      files[entry.destination] = digest(target);
    }

    for (const destination of previousDestinations) {
      if (!nextDestinations.has(destination)) rmSync(safeTarget(destination), { force: true });
    }

    const lock = {
      schemaVersion: 2,
      preset: catalog.preset,
      ...provenance(),
      installerVersion,
      files,
    };
    const stagedLock = join(transactionRoot, "preset-lock.json");
    writeFileSync(stagedLock, `${JSON.stringify(lock, null, 2)}\n`);
    mkdirSync(dirname(lockPath), { recursive: true });
    renameSync(stagedLock, lockPath);
  } catch (error) {
    for (const destination of new Set([...nextDestinations, ...previousDestinations])) {
      const target = safeTarget(destination);
      const backup = join(backupRoot, destination);
      if (existsSync(backup)) {
        mkdirSync(dirname(target), { recursive: true });
        copyFileSync(backup, target);
      } else if (!previousDestinations.has(destination)) {
        rmSync(target, { force: true });
      }
    }
    throw error;
  } finally {
    rmSync(transactionRoot, { recursive: true, force: true });
  }
}

try {
  if (!["install", "check", "update"].includes(command)) {
    throw new Error(
      "Usage: alexasomba-skills <install|check|update> [--root PATH] [--tag TAG] [--commit SHA]",
    );
  }
  if (command === "check") {
    verify();
    console.log("Preset lock and managed files are valid.");
    process.exit(0);
  }
  const previous = readLock();
  if (command === "install" && previous)
    throw new Error("Preset is already installed; use update.");
  if (command === "update" && !previous) throw new Error("Preset is not installed; use install.");
  if (previous) verify();
  provenance();
  installOrUpdate(previous);
  console.log(`${command === "update" ? "Updated" : "Installed"} ${catalog.preset}.`);
} catch (error) {
  console.error(`Preset error: ${error.message}`);
  process.exit(1);
}
