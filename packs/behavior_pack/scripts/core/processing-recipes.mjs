/** Canonical runtime station recipe registry. */
export const PROCESSING_RECIPES = Object.freeze({
 firepit:Object.freeze([
  Object.freeze({id:"tfc:cooked_meat",station:"firepit",title:"肉を焼く",description:"生肉を加熱調理します。",inputs:Object.freeze({"tfc:raw_meat":1}),outputs:Object.freeze({"tfc:cooked_meat":1}),minimumTemperatureC:180,durationTicks:100}),
  Object.freeze({id:"tfc:bread",station:"firepit",title:"パンを焼く",description:"水と混ぜた穀物粉の生地を焼きます。",inputs:Object.freeze({"tfc:dough":1}),outputs:Object.freeze({"tfc:bread":1}),minimumTemperatureC:180,durationTicks:300}),
  Object.freeze({id:"tfc:salt_from_brine",station:"firepit",title:"海水から塩を採る",description:"海水入り土器を加熱して水分を蒸発させ、塩と空の土器を回収します。",inputs:Object.freeze({"tfc:brine_vessel":1}),outputs:Object.freeze({"tfc:salt":1,"tfc:fired_vessel":1}),minimumTemperatureC:100,durationTicks:1200})
 ]),
 quern:Object.freeze([
  Object.freeze({id:"tfc:flour_from_grain",station:"quern",title:"穀物を挽く",description:"穀物を粉にします。上臼石は加工後に戻ります。",inputs:Object.freeze({"tfc:grain":1,"tfc:handstone":1}),outputs:Object.freeze({"tfc:flour":1,"tfc:handstone":1}),minimumTemperatureC:0,durationTicks:200}),
  Object.freeze({id:"tfc:flour_from_maize",station:"quern",title:"トウモロコシを挽く",description:"トウモロコシを粉にします。上臼石は加工後に戻ります。",inputs:Object.freeze({"tfc:maize":1,"tfc:handstone":1}),outputs:Object.freeze({"tfc:flour":1,"tfc:handstone":1}),minimumTemperatureC:0,durationTicks:200}),
  Object.freeze({id:"tfc:flour_from_barley",station:"quern",title:"大麦を挽く",description:"大麦を粉にします。上臼石は加工後に戻ります。",inputs:Object.freeze({"tfc:barley":1,"tfc:handstone":1}),outputs:Object.freeze({"tfc:flour":1,"tfc:handstone":1}),minimumTemperatureC:0,durationTicks:200}),
  Object.freeze({id:"tfc:flour_from_oat",station:"quern",title:"オーツ麦を挽く",description:"オーツ麦を粉にします。上臼石は加工後に戻ります。",inputs:Object.freeze({"tfc:oat":1,"tfc:handstone":1}),outputs:Object.freeze({"tfc:flour":1,"tfc:handstone":1}),minimumTemperatureC:0,durationTicks:200}),
  Object.freeze({id:"tfc:flour_from_rye",station:"quern",title:"ライ麦を挽く",description:"ライ麦を粉にします。上臼石は加工後に戻ります。",inputs:Object.freeze({"tfc:rye":1,"tfc:handstone":1}),outputs:Object.freeze({"tfc:flour":1,"tfc:handstone":1}),minimumTemperatureC:0,durationTicks:200})
 ]),
 pit_kiln:Object.freeze([
  Object.freeze({id:"tfc:fired_vessel",station:"pit_kiln",title:"土器を焼く",description:"粘土容器を焼成します。",inputs:Object.freeze({"tfc:clay_vessel":1}),outputs:Object.freeze({"tfc:fired_vessel":1}),minimumTemperatureC:550,durationTicks:600}),
  Object.freeze({id:"tfc:fired_ingot_mold",station:"pit_kiln",title:"鋳型を焼く",description:"成形した粘土製インゴット鋳型を焼成します。",inputs:Object.freeze({"tfc:unfired_ingot_mold":1}),outputs:Object.freeze({"tfc:fired_ingot_mold":1}),minimumTemperatureC:550,durationTicks:600}),
  Object.freeze({id:"tfc:fired_crucible",station:"pit_kiln",title:"るつぼを焼く",description:"成形した粘土製るつぼを焼成します。",inputs:Object.freeze({"tfc:unfired_crucible":1}),outputs:Object.freeze({"tfc:fired_crucible":1}),minimumTemperatureC:600,durationTicks:900})
 ]),
 crucible:Object.freeze([
  Object.freeze({id:"tfc:heated_copper_ingot",station:"crucible",title:"銅を溶かして鋳造",description:"銅鉱石を溶かし、焼成済み鋳型に流し込みます。鋳型は返却されます。",inputs:Object.freeze({"tfc:copper_ore":2,"tfc:fired_ingot_mold":1}),outputs:Object.freeze({"tfc:heated_copper_ingot":1,"tfc:fired_ingot_mold":1}),minimumTemperatureC:1080,durationTicks:200}),
  Object.freeze({id:"tfc:heated_tin_ingot",station:"crucible",title:"錫を溶かして鋳造",description:"錫鉱石を溶かして錫インゴットを鋳造します。",inputs:Object.freeze({"tfc:tin_ore":2,"tfc:fired_ingot_mold":1}),outputs:Object.freeze({"tfc:heated_tin_ingot":1,"tfc:fired_ingot_mold":1}),minimumTemperatureC:230,durationTicks:200}),
  Object.freeze({id:"tfc:heated_bronze_ingot",station:"crucible",title:"青銅を合金鋳造",description:"銅9・錫1の割合で青銅を作ります。",inputs:Object.freeze({"tfc:copper_ingot":9,"tfc:tin_ingot":1,"tfc:fired_ingot_mold":1}),outputs:Object.freeze({"tfc:heated_bronze_ingot":1,"tfc:fired_ingot_mold":1}),minimumTemperatureC:950,durationTicks:300,alloyId:"bronze",metalInputs:Object.freeze({copper:9,tin:1}),alloyComponents:Object.freeze({copper:Object.freeze([0.88,0.92]),tin:Object.freeze([0.08,0.12])})})
 ]),
 drying_rack:Object.freeze([
  Object.freeze({id:"tfc:dried_meat",station:"drying_rack",title:"肉を乾燥",description:"生肉を時間をかけて乾燥保存します。",inputs:Object.freeze({"tfc:raw_meat":1}),outputs:Object.freeze({"tfc:dried_meat":1}),minimumTemperatureC:0,durationTicks:24000}),
  Object.freeze({id:"tfc:dried_fruit",station:"drying_rack",title:"果物を乾燥",description:"果物の水分を減らして保存性を高めます。",inputs:Object.freeze({"tfc:fruit":1}),outputs:Object.freeze({"tfc:dried_fruit":1}),minimumTemperatureC:0,durationTicks:18000}),
  Object.freeze({id:"tfc:dried_vegetables",station:"drying_rack",title:"野菜を乾燥",description:"野菜の水分を減らして保存性を高めます。",inputs:Object.freeze({"tfc:vegetable":1}),outputs:Object.freeze({"tfc:dried_vegetables":1}),minimumTemperatureC:0,durationTicks:18000}),
  ...["beet","cabbage","carrot","garlic","onion","squash","potato","lentils","soybean","peanuts","cassava","green_beans","pumpkin","tomato","green_bell_pepper","radish"].map(item=>Object.freeze({id:"tfc:dried_"+item,station:"drying_rack",title:item+"を乾燥",description:"個別の作物を乾燥させて保存性を高めます。",inputs:Object.freeze({["tfc:"+item]:1}),outputs:Object.freeze({"tfc:dried_vegetables":1}),minimumTemperatureC:0,durationTicks:18000})),
  ...["melon"].map(item=>Object.freeze({id:"tfc:dried_"+item,station:"drying_rack",title:item+"を乾燥",description:"果実を乾燥させて保存性を高めます。",inputs:Object.freeze({["tfc:"+item]:1}),outputs:Object.freeze({"tfc:dried_fruit":1}),minimumTemperatureC:0,durationTicks:18000})),
  Object.freeze({id:"tfc:salted_meat",station:"drying_rack",title:"肉を塩漬け保存",description:"塩をすり込んだ肉を時間をかけて塩漬けにします。",inputs:Object.freeze({"tfc:raw_meat":1,"tfc:salt":1}),outputs:Object.freeze({"tfc:salted_meat":1}),minimumTemperatureC:0,durationTicks:12000})
 ]),

 smokehouse:Object.freeze([
  Object.freeze({id:"tfc:smoked_meat",station:"smokehouse",title:"肉を燻製",description:"隣接する焚き火の煙と落ち葉で肉を燻製保存します。",inputs:Object.freeze({"tfc:raw_meat":1,"minecraft:oak_leaves":2}),outputs:Object.freeze({"tfc:smoked_meat":1}),minimumTemperatureC:20,durationTicks:18000})
 ]),
 composter:Object.freeze([
  Object.freeze({id:"tfc:compost_from_vegetables",station:"composter",title:"野菜から堆肥を作る",description:"緑の素材と茶色の素材を長時間発酵させます。",inputs:Object.freeze({"tfc:vegetable":4,"minecraft:oak_leaves":16}),outputs:Object.freeze({"tfc:compost":1}),minimumTemperatureC:0,durationTicks:240000}),
  Object.freeze({id:"tfc:compost_from_fruit",station:"composter",title:"果物から堆肥を作る",description:"果物と落ち葉を長時間発酵させます。",inputs:Object.freeze({"tfc:fruit":4,"minecraft:oak_leaves":16}),outputs:Object.freeze({"tfc:compost":1}),minimumTemperatureC:0,durationTicks:240000})
 ]),
 anvil:Object.freeze([
  Object.freeze({id:"tfc:copper_sheet",station:"anvil",title:"銅板を成形",description:"鍛造温度以上の加熱済み銅インゴットを成形します。",inputs:Object.freeze({"tfc:heated_copper_ingot":1}),outputs:Object.freeze({"tfc:copper_sheet":1}),minimumTemperatureC:648,durationTicks:60}),
  Object.freeze({id:"tfc:bronze_sheet",station:"anvil",title:"青銅板を成形",description:"鍛造温度以上の加熱済み青銅インゴットを成形します。",inputs:Object.freeze({"tfc:heated_bronze_ingot":1}),outputs:Object.freeze({"tfc:bronze_sheet":1}),minimumTemperatureC:570,durationTicks:60}),
  Object.freeze({id:"tfc:tin_sheet",station:"anvil",title:"錫板を成形",description:"鍛造温度以上の加熱済み錫インゴットを成形します。",inputs:Object.freeze({"tfc:heated_tin_ingot":1}),outputs:Object.freeze({"tfc:tin_sheet":1}),minimumTemperatureC:138,durationTicks:60})
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
