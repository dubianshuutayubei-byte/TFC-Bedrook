import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const data=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/official-animal-lifecycle.json"),"utf8"));
test("official TFC animal lifecycle config preserves exact adulthood, gestation and uses",()=>{
 const byId=Object.fromEntries(data.species.map(x=>[x.id,x]));
 assert.equal(byId.cow.adulthoodDays,192);
 assert.equal(byId.cow.gestationDays,58);
 assert.equal(byId.cow.maxUses,128);
 assert.equal(byId.goat.adulthoodDays,96);
 assert.equal(byId.goat.product.cooldownDays,3);
 assert.equal(byId.sheep.adulthoodDays,56);
 assert.equal(byId.sheep.product.cooldownDays,4);
 assert.equal(byId.rabbit.adulthoodDays,30);
 assert.equal(byId.pig.childCountMin,1);
 assert.equal(byId.pig.childCountMax,10);
 assert.match(data.source,/TFC 1\.21\.x/);
 assert.equal(byId.chicken.adulthoodDays,24);
 assert.equal(byId.chicken.product.hatchDays,8);
 assert.equal(byId.horse.gestationDays,19);
});
test("official animal product cooldowns preserve source tick values and day conversion",()=>{
 for(const animal of data.species.filter(x=>x.product)){
  assert.equal(animal.product.cooldownDays,animal.product.cooldownTicks/24000);
  assert.equal(animal.product.minimumFamiliarity,0.15);
 }
});
