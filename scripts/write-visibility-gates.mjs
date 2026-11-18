#!/usr/bin/env node
/** Point home gates at the live or stub section so a hidden build does not bundle map tiles or film URLs. */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const flags = JSON.parse(fs.readFileSync(path.join(ROOT, "content/public-visibility.json"), "utf8"));
const write = (file, body) => fs.writeFileSync(path.join(ROOT, file), body);
write(
  "src/components/HomeSurfMapGate.ts",
  flags.publicSurfMapVisible
    ? `export { HomeSurfMapSection } from "./HomeSurfMapOn";\n`
    : `export { HomeSurfMapSection } from "./HomeSurfMapOff";\n`,
);
write(
  "src/components/HomeFilmGate.ts",
  flags.publicFilmVisible
    ? `export { HomeFilmSection } from "./HomeFilmOn";\n`
    : `export { HomeFilmSection } from "./HomeFilmOff";\n`,
);
