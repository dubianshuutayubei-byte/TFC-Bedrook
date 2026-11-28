import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CROP_PROFILES } from "../packs/behavior_pack/scripts/core/crop-profiles.mjs";
import { PROCESSING_RECIPES } from "../packs/behavior_pack/scripts/core/processing-recipes.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const itemDir=join(root,"packs/behavior_pack/items");
const itemIds=new Set(readdirSync(itemDir).filter(name=>name.endsWith(".json")).map(name=>JSON.parse(readFileSync(join(itemDir,name),"utf8"))["minecraft:item"].description.identifier));
const foodDb=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/food-profiles.json"),"utf8"));
const foodAliases={milk_bottle:"milk"};
const foodIds=new Set(foodDb.foods.map(food=>"tfc:"+food.id));
const edibleIds=new Set(readdirSync(itemDir).filter(name=>name.endsWith(".json")).map(name=>JSON.parse(readFileSync(join(itemDir,name),"utf8"))["minecraft:item"]).filter(item=>item.components?.["tfc:consume_food"]).map(item=>item.description.identifier));

test("all canonical crop profiles have registered seed and harvest items and valid climate ranges",()=>{
 assert.equal(Object.keys(CROP_PROFILES).length,29);
 for(const [id,p] of Object.entries(CROP_PROFILES)){
  assert.ok(itemIds.has(p.seed),id+" seed item is missing: "+p.seed);
  assert.ok(itemIds.has(p.harvest),id+" harvest item is missing: "+p.harvest);
  assert.ok(Number.isFinite(p.minTemperatureC)&&Number.isFinite(p.maxTemperatureC)&&p.minTemperatureC<=p.maxTemperatureC,id+" temperature range");
  assert.ok(Number.isFinite(p.minHydration)&&Number.isFinite(p.maxHydration)&&p.minHydration>=0&&p.maxHydration<=100&&p.minHydration<=p.maxHydration,id+" hydration range");
  for(const nutrient of ["nitrogen","phosphorus","potassium"]){
   const effect=p.nutrientEffects?.[nutrient]??0;
   assert.ok(Number.isFinite(effect),id+" nutrient effect "+nutrient);
  }
 }
});

test("every edible crop harvest item has a matching canonical freshness and nutrition profile",()=>{
 const missing=[...edibleIds].filter(id=>id.startsWith("tfc:")&&!foodIds.has("tfc:"+(foodAliases[id.slice(4)]??id.slice(4))));
 assert.deepEqual(missing,[]);
});

test("drying, salting and smoking station outputs are registered as preserved food",()=>{
 const routes=[
  ...PROCESSING_RECIPES.drying_rack,
  ...PROCESSING_RECIPES.smokehouse
 ].filter(recipe=>recipe.outputs && Object.keys(recipe.outputs).some(id=>foodIds.has(id)));
 assert.ok(routes.length>=5);
 for(const recipe of routes){
  for(const id of Object.keys(recipe.outputs)){
   if(!foodIds.has(id))continue;
   const profile=foodDb.foods.find(food=>"tfc:"+food.id===id);
   assert.ok(profile,recipe.id+" output profile");
   assert.ok(["dried","salted","smoked"].includes(profile.preservation),recipe.id+" must produce a preservation profile");
  }
 }
});
