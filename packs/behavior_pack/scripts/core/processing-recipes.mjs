/**
 * Single runtime source of truth for station recipes.
 * The JSON companion file is metadata only; do not duplicate recipe data there.
 */
export const PROCESSING_RECIPES = Object.freeze({
  firepit: Object.freeze({
    id:"tfc:cooked_meat", station:"firepit", title:"焚き火",
    description:"生肉を加熱調理します。",
    inputs:Object.freeze({"tfc:raw_meat":1}),
    outputs:Object.freeze({"tfc:cooked_meat":1}),
    minimumTemperatureC:180, durationTicks:100
  }),
  pit_kiln: Object.freeze({
    id:"tfc:fired_vessel", station:"pit_kiln", title:"Pit Kiln",
    description:"粘土容器を焼成します。",
    inputs:Object.freeze({"tfc:clay_vessel":1}),
    outputs:Object.freeze({"tfc:fired_vessel":1}),
    minimumTemperatureC:550, durationTicks:600
  }),
  crucible: Object.freeze({
    id:"tfc:heated_copper_ingot", station:"crucible", title:"るつぼ",
    description:"銅鉱石を溶かし、焼成済み鋳型に流し込みます。",
    inputs:Object.freeze({"tfc:copper_ore":2,"tfc:fired_ingot_mold":1}),
    outputs:Object.freeze({"tfc:heated_copper_ingot":1,"tfc:fired_ingot_mold":1}),
    minimumTemperatureC:1085, durationTicks:200
  }),
  anvil: Object.freeze({
    id:"tfc:copper_sheet", station:"anvil", title:"金床",
    description:"加熱済み銅インゴットを成形します。",
    inputs:Object.freeze({"tfc:heated_copper_ingot":1}),
    outputs:Object.freeze({"tfc:copper_sheet":1}),
    minimumTemperatureC:0, durationTicks:60
  })
});
export function getStationRecipe(stationId){return PROCESSING_RECIPES[stationId]??null;}
export function validateProcessingRecipes(recipes=PROCESSING_RECIPES){
  const ids=new Set();
  for(const [station,recipe] of Object.entries(recipes)){
    if(recipe.station!==station||!recipe.id||ids.has(recipe.id))throw new Error("Invalid or duplicate station recipe: "+station);
    ids.add(recipe.id);
    for(const [id,n] of Object.entries(recipe.inputs))if(!id||!Number.isInteger(n)||n<1)throw new Error("Invalid input "+id);
    for(const [id,n] of Object.entries(recipe.outputs))if(!id||!Number.isInteger(n)||n<1)throw new Error("Invalid output "+id);
    if(!Number.isInteger(recipe.durationTicks)||recipe.durationTicks<1)throw new Error("Invalid duration "+station);
    if(!Number.isFinite(recipe.minimumTemperatureC)||recipe.minimumTemperatureC<0)throw new Error("Invalid temperature "+station);
  }
  return {count:ids.size};
}
