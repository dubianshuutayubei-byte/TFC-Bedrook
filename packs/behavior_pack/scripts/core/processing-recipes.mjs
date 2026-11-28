/** Canonical runtime station recipe registry. */
export const PROCESSING_RECIPES = Object.freeze({
 firepit:Object.freeze([
  Object.freeze({id:"tfc:cooked_meat",station:"firepit",title:"肉を焼く",description:"生肉を加熱調理します。",inputs:Object.freeze({"tfc:raw_meat":1}),outputs:Object.freeze({"tfc:cooked_meat":1}),minimumTemperatureC:180,durationTicks:100})
 ]),
 pit_kiln:Object.freeze([
  Object.freeze({id:"tfc:fired_vessel",station:"pit_kiln",title:"土器を焼く",description:"粘土容器を焼成します。",inputs:Object.freeze({"tfc:clay_vessel":1}),outputs:Object.freeze({"tfc:fired_vessel":1}),minimumTemperatureC:550,durationTicks:600}),
  Object.freeze({id:"tfc:fired_ingot_mold",station:"pit_kiln",title:"鋳型を焼く",description:"成形した粘土製インゴット鋳型を焼成します。",inputs:Object.freeze({"tfc:unfired_ingot_mold":1}),outputs:Object.freeze({"tfc:fired_ingot_mold":1}),minimumTemperatureC:550,durationTicks:600})
 ]),
 crucible:Object.freeze([
  Object.freeze({id:"tfc:heated_copper_ingot",station:"crucible",title:"銅を溶かして鋳造",description:"銅鉱石を溶かし、焼成済み鋳型に流し込みます。鋳型は返却されます。",inputs:Object.freeze({"tfc:copper_ore":2,"tfc:fired_ingot_mold":1}),outputs:Object.freeze({"tfc:heated_copper_ingot":1,"tfc:fired_ingot_mold":1}),minimumTemperatureC:1085,durationTicks:200}),
  Object.freeze({id:"tfc:heated_tin_ingot",station:"crucible",title:"錫を溶かして鋳造",description:"錫鉱石を溶かして錫インゴットを鋳造します。",inputs:Object.freeze({"tfc:tin_ore":2,"tfc:fired_ingot_mold":1}),outputs:Object.freeze({"tfc:heated_tin_ingot":1,"tfc:fired_ingot_mold":1}),minimumTemperatureC:232,durationTicks:200}),
  Object.freeze({id:"tfc:heated_bronze_ingot",station:"crucible",title:"青銅を合金鋳造",description:"銅9・錫1の割合で青銅を作ります。",inputs:Object.freeze({"tfc:copper_ingot":9,"tfc:tin_ingot":1,"tfc:fired_ingot_mold":1}),outputs:Object.freeze({"tfc:heated_bronze_ingot":1,"tfc:fired_ingot_mold":1}),minimumTemperatureC:950,durationTicks:300,alloyId:"bronze",metalInputs:Object.freeze({copper:9,tin:1}),alloyComponents:Object.freeze({copper:Object.freeze([0.88,0.92]),tin:Object.freeze([0.08,0.12])})})
 ]),
 anvil:Object.freeze([
  Object.freeze({id:"tfc:copper_sheet",station:"anvil",title:"銅板を成形",description:"加熱済み銅インゴットを成形します。",inputs:Object.freeze({"tfc:heated_copper_ingot":1}),outputs:Object.freeze({"tfc:copper_sheet":1}),minimumTemperatureC:0,durationTicks:60}),
  Object.freeze({id:"tfc:bronze_sheet",station:"anvil",title:"青銅板を成形",description:"加熱済み青銅インゴットを成形します。",inputs:Object.freeze({"tfc:heated_bronze_ingot":1}),outputs:Object.freeze({"tfc:bronze_sheet":1}),minimumTemperatureC:0,durationTicks:60})
 ])
});
export function getStationRecipes(stationId){return PROCESSING_RECIPES[stationId]??[];}
export function validateProcessingRecipes(recipes=PROCESSING_RECIPES){
 const ids=new Set();let count=0;
 for(const [station,list] of Object.entries(recipes))for(const recipe of list){
  count++;if(recipe.station!==station||!recipe.id||ids.has(recipe.id))throw new Error("Invalid or duplicate station recipe: "+station);ids.add(recipe.id);
  for(const [id,n] of Object.entries(recipe.inputs))if(!id||!Number.isInteger(n)||n<1)throw new Error("Invalid input "+id);
  for(const [id,n] of Object.entries(recipe.outputs))if(!id||!Number.isInteger(n)||n<1)throw new Error("Invalid output "+id);
  if(!Number.isInteger(recipe.durationTicks)||recipe.durationTicks<1||!Number.isFinite(recipe.minimumTemperatureC)||recipe.minimumTemperatureC<0)throw new Error("Invalid recipe parameters "+station);
 }
 return {count};
}
