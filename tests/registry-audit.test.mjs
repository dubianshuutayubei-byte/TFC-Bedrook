import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
function readIdentifiers(folder,kind){
  return readdirSync(join(root,folder)).filter(name=>name.endsWith(".json")).map(name=>{
    const data=JSON.parse(readFileSync(join(root,folder,name),"utf8"));
    const identifier=data[kind]?.description?.identifier;
    assert.ok(identifier,folder+"/"+name+" has no "+kind+" identifier");
    return identifier;
  });
}
test("registered item and block identifiers are unique",()=>{
  const itemIds=readIdentifiers("packs/behavior_pack/items","minecraft:item");
  const blockIds=readIdentifiers("packs/behavior_pack/blocks","minecraft:block");
  assert.equal(new Set(itemIds).size,itemIds.length,"duplicate item identifier detected");
  assert.equal(new Set(blockIds).size,blockIds.length,"duplicate block identifier detected");
});
test("catalog registeredIdentifiers all exist in item or block files",()=>{
  const actual=new Set([...readIdentifiers("packs/behavior_pack/items","minecraft:item"),...readIdentifiers("packs/behavior_pack/blocks","minecraft:block")]);
  const catalog=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/item-catalog.json"),"utf8"));
  const missing=(catalog.registeredIdentifiers??[]).filter(id=>id.startsWith("tfc:")&&!actual.has(id));
  assert.deepEqual(missing,[],"catalog claims identifiers that are not registered");
  assert.equal(new Set(catalog.registeredIdentifiers??[]).size,(catalog.registeredIdentifiers??[]).length,"catalog contains duplicate registered identifiers");
});

test("item block placers resolve to registered block definitions and catalog counts match",()=>{
 const items=readIdentifiers("packs/behavior_pack/items","minecraft:item");
 const blocks=readIdentifiers("packs/behavior_pack/blocks","minecraft:block");
 const blockSet=new Set(blocks);
 const bad=[];
 for(const file of readdirSync(join(root,"packs/behavior_pack/items")).filter(name=>name.endsWith(".json"))){
  const item=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items",file),"utf8"))["minecraft:item"];
  const placed=item.components?.["minecraft:block_placer"]?.block;
  if(placed&&!blockSet.has(placed))bad.push(file+" -> "+placed);
 }
 assert.deepEqual(bad,[]);
 const catalog=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/item-catalog.json"),"utf8"));
 assert.equal(catalog.audit.registeredItemCount,items.length);
 assert.equal(catalog.audit.registeredBlockCount,blocks.length);
});

test("TFC wool item is registered and has an item texture mapping",()=>{
 const wool=JSON.parse(readFileSync(join(root,"packs/behavior_pack/items/wool.json"),"utf8"));
 const textures=JSON.parse(readFileSync(join(root,"packs/resource_pack/textures/item_texture.json"),"utf8"));
 assert.equal(wool["minecraft:item"].description.identifier,"tfc:wool");
 assert.equal(wool["minecraft:item"].components["minecraft:icon"],"tfc_wool");
 assert.ok(textures.texture_data.tfc_wool);
});
