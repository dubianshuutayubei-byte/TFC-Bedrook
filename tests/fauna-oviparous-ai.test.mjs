import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const entityDir=join(root,"packs/behavior_pack/entities");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");
const species=["chicken","duck","quail"];

test("all TFC oviparous birds seek nest boxes and have juvenile growth events",()=>{
 for(const speciesId of species){
  const entity=JSON.parse(readFileSync(join(entityDir,speciesId+".json"),"utf8"))["minecraft:entity"];
  const components=entity.components??{};
  const move=components["minecraft:behavior.move_to_block"];
  assert.ok(move,speciesId+" lacks nest seeking AI");
  assert.ok(move.target_blocks?.includes("tfc:nest_box"),speciesId+" does not seek the TFC nest box");
  assert.ok(entity.component_groups?.["tfc:juvenile"],speciesId+" lacks a juvenile component group");
  assert.ok(entity.events?.["tfc:spawn_baby"],speciesId+" lacks its hatch event");
  assert.ok(entity.events?.["tfc:grow_up"],speciesId+" lacks its maturity event");
 }
});

test("TFC oviparous runtime deposits eggs and hatches the matching custom species",()=>{
 assert.match(runtime,/function layAnimalEgg\(entity,state,profile,currentDay\)/);
 assert.match(runtime,/species:profile\.eggSpecies/);
 assert.match(runtime,/const entityType="tfc:"\+egg\.species/);
 assert.match(runtime,/baby\.triggerEvent\("tfc:spawn_baby"\)/);
 assert.match(runtime,/advanceNestBoxIncubation\(stored,elapsed\)/);
 assert.match(runtime,/getDynamicProperty\("tfc:hatched_egg_id"\)/);
 assert.match(runtime,/setDynamicProperty\("tfc:hatched_egg_id",egg\.id\)/);
});

test("TFC chicken client entity reuses the vanilla chicken render assets",()=>{
 const client=JSON.parse(readFileSync(join(root,"packs/resource_pack/entity/chicken.entity.json"),"utf8"))["minecraft:client_entity"];
 assert.equal(client.description.identifier,"tfc:chicken");
 assert.equal(client.description.geometry.default,"geometry.chicken.v1.12");
 assert.equal(client.description.textures.default,"textures/entity/chicken/chicken");
});
