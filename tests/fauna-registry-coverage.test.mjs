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

test("all custom fauna entities have exactly one matching natural spawn rule",()=>{
 assert.equal(entityFiles.length,41,"custom fauna entity count changed; update the coverage audit");
 assert.deepEqual(spawnFiles,entityFiles,"every custom fauna entity must have a matching spawn rule and vice versa");
 for(const file of entityFiles){
  const entity=JSON.parse(readFileSync(join(entityDir,file),"utf8"))["minecraft:entity"];
  const rule=JSON.parse(readFileSync(join(spawnDir,file),"utf8"))["minecraft:spawn_rules"];
  assert.ok(entity.description.identifier,file+" has no entity identifier");
  assert.equal(rule.description.identifier,entity.description.identifier,file+" spawn rule targets the wrong entity");
  assert.ok(Array.isArray(rule.conditions)&&rule.conditions.length>0,file+" has no spawn conditions");
  assert.ok(rule.conditions.some(condition=>condition["minecraft:weight"]?.default>0),file+" has no positive spawn weight");
 }
});

test("custom fauna natural spawn rules use animal population control",()=>{
 for(const file of spawnFiles){
  const rule=JSON.parse(readFileSync(join(spawnDir,file),"utf8"))["minecraft:spawn_rules"];
  assert.equal(rule.description.population_control,"animal",file+" must use animal population control");
 }
});
