import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const entityDir=join(root,"packs/behavior_pack/entities");
const spawnDir=join(root,"packs/behavior_pack/spawn_rules");
const entityFiles=readdirSync(entityDir).filter(name=>name.endsWith(".json")).sort();
const spawnFiles=readdirSync(spawnDir).filter(name=>name.endsWith(".json")).sort();

test("fauna with official natural habitat profiles have spawn rules while pets remain non-natural",()=>{
 const petEntityFiles=new Set(["cat.json","dog.json"]);
 const naturalEntityFiles=entityFiles.filter(file=>!petEntityFiles.has(file));
 assert.equal(naturalEntityFiles.length,57,"natural fauna entity count changed; update the coverage audit");
 assert.deepEqual(spawnFiles,naturalEntityFiles,"every naturally spawning fauna entity must have one rule and vice versa");
 for(const file of naturalEntityFiles){
  const entity=JSON.parse(readFileSync(join(entityDir,file),"utf8"))["minecraft:entity"];
  const rule=JSON.parse(readFileSync(join(spawnDir,file),"utf8"))["minecraft:spawn_rules"];
  assert.ok(entity.description.identifier,file+" has no entity identifier");
  assert.equal(rule.description.identifier,entity.description.identifier,file+" spawn rule targets the wrong entity");
  assert.ok(Array.isArray(rule.conditions)&&rule.conditions.length>0,file+" has no spawn conditions");
  assert.ok(rule.conditions.some(condition=>condition["minecraft:weight"]?.default>0),file+" has no positive spawn weight");
 }
 for(const file of petEntityFiles){
  assert.ok(entityFiles.includes(file),file+" pet entity must be registered");
  assert.equal(spawnFiles.includes(file),false,file+" is a pet and must not have a fabricated natural habitat rule");
  const entity=JSON.parse(readFileSync(join(entityDir,file),"utf8"))["minecraft:entity"];
  assert.equal(entity.description.is_spawnable,true,file+" must remain summonable/spawn-egg accessible");
 }
});

test("custom fauna natural spawn rules use animal population control",()=>{
 for(const file of spawnFiles){
  const rule=JSON.parse(readFileSync(join(spawnDir,file),"utf8"))["minecraft:spawn_rules"];
  assert.ok(["animal","water_animal"].includes(rule.description.population_control),file+" has an unsupported population control");
 }
});
