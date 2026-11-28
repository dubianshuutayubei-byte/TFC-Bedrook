import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const ui=readFileSync(join(root,"packs/behavior_pack/scripts/ui/main-menu.js"),"utf8");
test("player status temperature uses the local biome climate profile",()=>{
 assert.match(ui,/getBiomeClimateProfile\(biomeId\)/);
 assert.match(ui,/player\.dimension\.getBiome\(/);
 assert.match(ui,/elevationM: Math\.max\(0, player\.location\.y - 63\)/);
});
