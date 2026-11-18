#!/usr/bin/env node
/** Point HomeSurfMapGate at the live or stub section so a hidden-map build does not bundle tile URLs. */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const flags = JSON.parse(fs.readFileSync(path.join(ROOT, "content/public-visibility.json"), "utf8"));
const dest = path.join(ROOT, "src/components/HomeSurfMapGate.ts");
const src = flags.publicSurfMapVisible
  ? `export { HomeSurfMapSection } from "./HomeSurfMapOn";\n`
  : `export { HomeSurfMapSection } from "./HomeSurfMapOff";\n`;
fs.writeFileSync(dest, src);
