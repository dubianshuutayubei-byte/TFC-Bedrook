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
  const ids=[...readIdentifiers("packs/behavior_pack/items","minecraft:item"),...readIdentifiers("packs/behavior_pack/blocks","minecraft:block")];
  assert.equal(new Set(ids).size,ids.length,"duplicate item/block identifier detected");
});
test("catalog registeredIdentifiers all exist in item or block files",()=>{
  const actual=new Set([...readIdentifiers("packs/behavior_pack/items","minecraft:item"),...readIdentifiers("packs/behavior_pack/blocks","minecraft:block")]);
  const catalog=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/item-catalog.json"),"utf8"));
  const missing=(catalog.registeredIdentifiers??[]).filter(id=>!actual.has(id));
  assert.deepEqual(missing,[],"catalog claims identifiers that are not registered");
  assert.equal(new Set(catalog.registeredIdentifiers??[]).size,(catalog.registeredIdentifiers??[]).length,"catalog contains duplicate registered identifiers");
});
