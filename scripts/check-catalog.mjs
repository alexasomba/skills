import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const catalog = JSON.parse(readFileSync(join(root, "catalog.json"), "utf8"));
const entries = [...catalog.firstParty, ...catalog.thirdParty];
const names = entries.map((entry) => entry.name);
const expectedNames = [
  "automaticpallet-viteplus-workflow",
  "before-and-after",
  "code-structure",
  "evidence-driven-testing",
  "greploop",
  "greploop-apps",
  "new-feature",
  "unslop",
];

if (catalog.schemaVersion !== 2 || catalog.preset !== "automaticpallet-viteplus-workflow") {
  throw new Error("Unsupported catalog contract.");
}
if (
  entries.length !== 8 ||
  new Set(names).size !== 8 ||
  names.toSorted().join("\n") !== expectedNames.toSorted().join("\n")
) {
  throw new Error("The catalog must classify exactly eight unique assets.");
}
for (const skill of catalog.firstParty) {
  const skillFile = join(root, skill.source, "SKILL.md");
  if (!existsSync(skillFile)) throw new Error(`Missing first-party skill: ${skill.name}`);
  const frontmatter = readFileSync(skillFile, "utf8").match(/^---\n([\s\S]*?)\n---/u)?.[1] || "";
  if (!frontmatter.includes(`name: ${skill.name}`))
    throw new Error(`Skill name mismatch: ${skill.name}`);
  if (!skill.destination.startsWith(".agents/skills/"))
    throw new Error(`Unsafe skill destination: ${skill.destination}`);
}
for (const skill of catalog.thirdParty) {
  if (skill.managed !== false || !/^[0-9a-f]{40}$/u.test(skill.revision) || !skill.license) {
    throw new Error(`Invalid upstream lock: ${skill.name}`);
  }
  if (!existsSync(join(root, skill.name, "LICENSE")))
    throw new Error(`Missing vendor license: ${skill.name}`);
}
for (const file of catalog.managedFiles) {
  if (!existsSync(join(root, file.source)) || !file.destination.startsWith(".agents/")) {
    throw new Error(`Invalid managed file: ${file.destination}`);
  }
}
const visualSkill = readFileSync(join(root, "before-and-after", "SKILL.md"), "utf8");
for (const unsafeDefault of ["npm install -g", "gh pr edit", "IMAGE_ADAPTER=gist"]) {
  if (visualSkill.includes(unsafeDefault))
    throw new Error(`Unsafe screenshot default: ${unsafeDefault}`);
}
console.log("Catalog is valid: 4 managed first-party skills and 4 upstream-locked vendor skills.");
