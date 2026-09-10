import { readFileSync, existsSync } from "node:fs";
const root = new URL("..", import.meta.url);
const catalog = JSON.parse(readFileSync(new URL("catalog.json", root)));
if (catalog.preset !== "automaticpallet-viteplus-workflow" || catalog.thirdParty["before-and-after"].managed) throw new Error("Catalog safety contract is invalid.");
for (const file of ["SKILL.md", "workflow-manifest.json"]) if (!existsSync(new URL(`presets/${catalog.preset}/${file}`, root))) throw new Error(`Missing preset ${file}`);
console.log("Catalog is valid.");
