import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const item=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items/prospecting_tool.json"),"utf8"))["minecraft:item"];

test("prospecting tool registers block-use component and bounded scan",()=>{
 assert.equal(item.description.identifier,"tfc:prospecting_tool");
 assert.ok(item.components["tfc:prospect"]);
 assert.match(runtime,/registerCustomComponent\("tfc:prospect",\{onUseOn:/);
 assert.match(runtime,/prospect\(a\.source,a\.block\)/);
 assert.match(runtime,/for\(let dx=-radius;dx<=radius;dx\)for\(let dz=-radius;dz<=radius;dz\)for\(let dy=-2;dy<=2;dy\)/);
 assert.match(runtime,/summarizeOreSamples\(counts\)/);
});

test("prospecting scans only a curated set of vanilla ore block IDs",()=>{
 for(const id of ["minecraft:copper_ore","minecraft:iron_ore","minecraft:deepslate_iron_ore","minecraft:diamond_ore","minecraft:nether_quartz_ore"])assert.ok(runtime.includes(id));
});
