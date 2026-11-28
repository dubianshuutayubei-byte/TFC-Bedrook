import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const readJson=p=>JSON.parse(readFileSync(join(root,p),"utf8"));
const readLang=p=>readFileSync(join(root,p),"utf8");
test("all registered item icons and names have resource-pack entries",()=>{
 const atlas=readJson("packs/resource_pack/textures/item_texture.json").texture_data;
 const lang=readLang("packs/resource_pack/texts/ja_JP.lang");
 const files=readdirSync(join(root,"packs/behavior_pack/items")).filter(x=>x.endsWith(".json"));
 const gaps=[];
 for(const file of files){const item=readJson("packs/behavior_pack/items/"+file)["minecraft:item"];const id=item.description.identifier;const icon=item.components?.["minecraft:icon"];const key=typeof icon==="string"?icon:icon?.texture;if(key&&!atlas[key])gaps.push(file+": missing item atlas "+key);if(!lang.includes("item."+id+".name="))gaps.push(file+": missing Japanese item name");}
 assert.deepEqual(gaps,[]);
});
test("all registered block textures and names have resource-pack entries",()=>{
 const atlas=readJson("packs/resource_pack/textures/terrain_texture.json").texture_data;
 const lang=readLang("packs/resource_pack/texts/ja_JP.lang");
 const files=readdirSync(join(root,"packs/behavior_pack/blocks")).filter(x=>x.endsWith(".json"));
 const gaps=[];
 for(const file of files){const block=readJson("packs/behavior_pack/blocks/"+file)["minecraft:block"];const id=block.description.identifier;for(const material of Object.values(block.components?.["minecraft:material_instances"]??{}))if(material.texture&&!atlas[material.texture])gaps.push(file+": missing terrain atlas "+material.texture);if(!lang.includes("tile."+id+".name="))gaps.push(file+": missing Japanese block name");}
 assert.deepEqual(gaps,[]);
});
