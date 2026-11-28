import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PROCESSING_RECIPES } from "../packs/behavior_pack/scripts/core/processing-recipes.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const itemIds=new Set(readdirSync(join(root,"packs/behavior_pack/items"))
 .filter(name=>name.endsWith(".json"))
 .map(name=>JSON.parse(readFileSync(join(root,"packs/behavior_pack/items",name),"utf8"))["minecraft:item"].description.identifier));

test("every processing recipe input and output has a registered item definition",()=>{
 const missing=[];
 for(const [station,recipes] of Object.entries(PROCESSING_RECIPES)){
  for(const recipe of recipes){
   for(const id of [...Object.keys(recipe.inputs),...Object.keys(recipe.outputs)]){
    if(id.startsWith("tfc:")&&!itemIds.has(id))missing.push(station+"/"+recipe.id+": "+id);
   }
  }
 }
 assert.deepEqual(missing,[]);
});

test("crafting recipe JSON inputs and outputs reference registered TFC items",()=>{
 const recipeDir=join(root,"packs/behavior_pack/recipes");
 const missing=[];
 const recipeIds=new Set();
 for(const file of readdirSync(recipeDir).filter(name=>name.endsWith(".json"))){
  const data=JSON.parse(readFileSync(join(recipeDir,file),"utf8"));
  const recipe=Object.values(data).find(value=>value&&typeof value==="object"&&value.description?.identifier&&value.result);
  if(!recipe)continue;
  const recipeId=recipe.description.identifier;
  if(recipeIds.has(recipeId))missing.push("duplicate recipe "+recipeId);
  recipeIds.add(recipeId);
  const inputs=[];
  for(const entry of Object.values(recipe.key??{}))if(entry?.item)inputs.push(entry.item);
  for(const entry of recipe.ingredients??[])if(entry?.item)inputs.push(entry.item);
  for(const id of [...inputs,recipe.result.item].filter(Boolean)){
   if(id.startsWith("tfc:")&&!itemIds.has(id))missing.push(file+": "+id);
  }
 }
 assert.deepEqual(missing,[]);
});

test("every food profile maps to a registered food item",()=>{
 const database=JSON.parse(readFileSync(join(root,"packs/behavior_pack/data/food-profiles.json"),"utf8"));
 const fileIds={milk:"milk_bottle"};
 const missing=database.foods.map(food=>"tfc:"+(fileIds[food.id]??food.id)).filter(id=>!itemIds.has(id));
 assert.deepEqual(missing,[]);
});

test("every processing recipe station has a matching interactive block",()=>{
 const stations=Object.keys(PROCESSING_RECIPES);
 const missing=[];
 for(const station of stations){
  const path=join(root,"packs/behavior_pack/blocks",station+".json");
  let block;
  try{block=JSON.parse(readFileSync(path,"utf8"))["minecraft:block"];}catch{missing.push(station+": missing block definition");continue;}
  const components=block.components??{};
  if(block.description?.identifier!=="tfc:"+station)missing.push(station+": block identifier mismatch");
  if(components["tfc:station_ui"]?.station!==station)missing.push(station+": station UI is not connected");
  if(["firepit","pit_kiln","crucible"].includes(station)&&!components["tfc:heated_station_tick"])missing.push(station+": heated station tick is missing");
 }
 assert.deepEqual(missing,[]);
});
