import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CROP_PROFILES } from "../packs/behavior_pack/scripts/core/crop-profiles.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
test("crops.json is the canonical source mirrored by the Bedrock runtime module",()=>{
 const data=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/crops.json"),"utf8"));
 assert.deepEqual(CROP_PROFILES,data);
 assert.equal(Object.keys(CROP_PROFILES).length,29);
});
