import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>JSON.parse(readFileSync(join(root,p),"utf8"));
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("pumpkin and melon mature crops can spread up to two fruit blocks",()=>{
 assert.match(runtime,/function trySpreadFruit\(block,profile\)/);
 assert.match(runtime,/if\(existing>=2\|\|candidates\.length===0\|\|Math\.random\(\)>=0\.2\)return/);
 assert.match(runtime,/if\(age>=3\)\{if\(profile\.spreading\)trySpreadFruit\(block,profile\);return;\}/);
 assert.equal(read("packs/behavior_pack/data/crops.json").pumpkin.fruitBlock,"tfc:pumpkin_fruit");
 assert.equal(read("packs/behavior_pack/data/crops.json").melon.fruitBlock,"tfc:melon_fruit");
});

test("spreading fruit blocks are registered and return their food produce",()=>{
 for(const [block,item] of [["pumpkin_fruit","pumpkin"],["melon_fruit","melon"]]){
  const def=read("packs/behavior_pack/blocks/"+block+".json")["minecraft:block"];
  assert.equal(def.description.identifier,"tfc:"+block);
  assert.match(runtime,new RegExp('brokenId==="tfc:'+block+'"'));
  assert.match(runtime,new RegExp('new ItemStack\\("tfc:'+item+'",1\\)'));
 }
});
