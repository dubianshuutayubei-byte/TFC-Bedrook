import { ItemStack, system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { deserializePlayerState, serializePlayerState } from "./core/player-state-service.mjs";
import { consumeFood } from "./core/food-service.mjs";
import { readStackFreshness, advanceStackFreshness } from "./core/food-stack-service.mjs";
import { createFireState, addFuel, advanceFire, canProcessAtTemperature } from "./core/firepit-service.mjs";
import { createSoilState, advanceSoilHydration, evaluateCropGrowth, calculateCropYield, applyFertilizer, applyCropNutrientEffects, inferSoilTypeFromBlockId, inferSoilFertilityClassFromBiomeId, advanceCropGrowthProgress } from "./core/agriculture-service.mjs";
import { CROP_PROFILES } from "./core/crop-profiles.mjs";
import { createAnimalState, createAnimalOffspringState, initializeAnimalLifeStage, syncAnimalHealth, advanceAnimalNeeds, advanceAnimalFamiliarityDecay, canFeedAnimal, feedAnimal, waterAnimal, canBreed, beginPregnancy, advancePregnancy, grazeAnimal, canProduce, recordProduct, advanceAnimalLifecycle, createEggState, advanceEggIncubation, evaluatePredation } from "./core/fauna-service.mjs";
import { CUSTOM_FAUNA_PROFILES } from "./core/fauna-runtime-profiles.mjs";
import { getStationRecipes } from "./core/processing-recipes.mjs";
import { isStationJobDue, getPendingStationOutputs, markStationOutputDelivered, markStationJobRecoverable } from "./core/station-job-service.mjs";
import { normalizeDimensionId, normalizeWeather, getRainfallMm, inferBiomeRainfallMultiplierFromBiomeId } from "./core/environment-service.mjs";
import { calculateAmbientTemperatureC, getBiomeClimateProfile } from "./core/climate-service.mjs";
import { findMatchingAlloys } from "./core/metal-service.mjs";
import { classifyTemperature, coolItemTemperature } from "./core/heat-service.mjs";
import { summarizeOreSamples } from "./core/geology-service.mjs";

const STATE_KEY="tfc:player_state",PROGRESS_KEY="tfc:knapping_progress";
const TRACKED_FOOD_CONTAINERS_KEY="tfc:tracked_food_containers";
const trackedFoodContainers=new Map();
const FOOD_DECAY_PROFILES={"tfc:raw_meat":0.16,"tfc:cooked_meat":0.12,"tfc:salted_meat":0.025,"tfc:smoked_meat":0.03,"tfc:grain":0.025,"tfc:maize":0.025,"tfc:potato":0.1,"tfc:vegetable":0.1,"tfc:fruit":0.11,"tfc:milk_bottle":0.18,"tfc:dried_meat":0.04,"tfc:dried_fruit":0.03,"tfc:dried_vegetables":0.03,"tfc:bread":0.05,"tfc:barley":0.025,"tfc:oat":0.025,"tfc:rye":0.025,"tfc:beet":0.1,"tfc:cabbage":0.1,"tfc:carrot":0.1,"tfc:garlic":0.1,"tfc:onion":0.1,"tfc:squash":0.1,"tfc:lentils":0.08,"tfc:soybean":0.08,"tfc:peanuts":0.08,"tfc:rice":0.025,"tfc:cassava":0.1,"tfc:green_beans":0.1,"tfc:pumpkin":0.1,"tfc:melon":0.11,"tfc:tomato":0.1,"tfc:green_bell_pepper":0.1,"tfc:radish":0.1};
const ITEM_TEMPERATURE_KEY="tfc:temperature_c",ITEM_HEAT_TICK_KEY="tfc:heat_updated_tick";
const HEATED_METAL_PROFILES=Object.freeze({
 "tfc:heated_copper_ingot":{initialTemperatureC:1080,heatCapacity:2.857,forgingTemperatureC:648},
 "tfc:heated_tin_ingot":{initialTemperatureC:230,heatCapacity:7.143,forgingTemperatureC:138},
 "tfc:heated_bronze_ingot":{initialTemperatureC:950,heatCapacity:2.857,forgingTemperatureC:570}
});
function createOutputStack(id,amount=1){
 const stack=new ItemStack(id,amount),profile=HEATED_METAL_PROFILES[id];
 if(profile)stack.setDynamicProperties({[ITEM_TEMPERATURE_KEY]:profile.initialTemperatureC,[ITEM_HEAT_TICK_KEY]:system.currentTick});
 return stack;
}
function tickMetalHeat(player,nowTick){
 const container=inv(player);if(!container)return;
 for(let i=0;i<container.size;i++){
  const stack=container.getItem(i),profile=HEATED_METAL_PROFILES[stack?.typeId];if(!stack||!profile)continue;
  const rawTemperature=stack.getDynamicProperty(ITEM_TEMPERATURE_KEY),rawTick=stack.getDynamicProperty(ITEM_HEAT_TICK_KEY);
  const current=Number.isFinite(Number(rawTemperature))?Number(rawTemperature):20;
  const last=Number.isFinite(Number(rawTick))?Number(rawTick):nowTick;
  const elapsed=nowTick>=last?nowTick-last:0;
  const next=coolItemTemperature(current,profile,elapsed);
  if(next!==current||last!==nowTick||rawTemperature===undefined){stack.setDynamicProperties({[ITEM_TEMPERATURE_KEY]:next,[ITEM_HEAT_TICK_KEY]:nowTick});container.setItem(i,stack);}
 }
}
const ITEM_LABELS={"tfc:raw_meat":"生肉","tfc:cooked_meat":"焼いた肉","tfc:clay_vessel":"未焼成土器","tfc:fired_vessel":"焼成土器","tfc:unfired_ingot_mold":"未焼成鋳型","tfc:fired_ingot_mold":"焼成鋳型","tfc:copper_ore":"銅鉱石","tfc:heated_copper_ingot":"加熱銅インゴット","tfc:copper_ingot":"銅インゴット","tfc:tin_ore":"錫鉱石","tfc:heated_tin_ingot":"加熱錫インゴット","tfc:tin_ingot":"錫インゴット","tfc:heated_bronze_ingot":"加熱青銅インゴット","tfc:bronze_ingot":"青銅インゴット","tfc:fruit":"果物","tfc:vegetable":"野菜","tfc:dried_meat":"干し肉","tfc:dried_fruit":"干し果物","tfc:dried_vegetables":"干し野菜","tfc:salted_meat":"塩漬け肉","tfc:smoked_meat":"燻製肉","tfc:salt":"塩","tfc:brine_vessel":"塩水入り土器","tfc:unfired_crucible":"未焼成るつぼ","tfc:fired_crucible":"焼成済みるつぼ","tfc:tin_sheet":"錫板","tfc:smokehouse":"燻製設備","tfc:compost":"堆肥","minecraft:oak_leaves":"落ち葉","tfc:barley":"大麦","tfc:oat":"オーツ麦","tfc:rye":"ライ麦","tfc:beet":"ビーツ","tfc:cabbage":"キャベツ","tfc:carrot":"ニンジン","tfc:garlic":"ニンニク","tfc:onion":"タマネギ","tfc:squash":"カボチャ","tfc:lentils":"レンズ豆","tfc:soybean":"大豆","tfc:peanuts":"落花生","tfc:quern":"石臼","tfc:handstone":"上臼石","tfc:flour":"小麦粉","tfc:dough":"生地","tfc:bread":"パン"};
const WILD_SEED_DROPS=Object.freeze({
 "minecraft:seagrass":["tfc:rice_seed","tfc:papyrus_seed","tfc:sugarcane_seed"],
 "minecraft:dead_bush":["tfc:cassava_seed"],
 "minecraft:short_grass":["tfc:barley_seed","tfc:oat_seed","tfc:rye_seed","tfc:lentils_seed","tfc:soybean_seed","tfc:peanuts_seed","tfc:cassava_seed","tfc:alfalfa_seed","tfc:canola_seed","tfc:radish_seed","tfc:jute_seed"],
 "minecraft:tall_grass":["tfc:barley_seed","tfc:oat_seed","tfc:rye_seed","tfc:lentils_seed","tfc:soybean_seed","tfc:peanuts_seed","tfc:cassava_seed","tfc:alfalfa_seed","tfc:canola_seed","tfc:radish_seed","tfc:jute_seed"],
 "minecraft:fern":["tfc:beet_seed","tfc:cabbage_seed","tfc:carrot_seed","tfc:garlic_seed","tfc:onion_seed","tfc:squash_seed","tfc:green_beans_seed","tfc:pumpkin_seed","tfc:melon_seed","tfc:tomato_seed","tfc:red_bell_pepper_seed","tfc:yellow_bell_pepper_seed"],
 "minecraft:large_fern":["tfc:beet_seed","tfc:cabbage_seed","tfc:carrot_seed","tfc:garlic_seed","tfc:onion_seed","tfc:squash_seed","tfc:green_beans_seed","tfc:pumpkin_seed","tfc:melon_seed","tfc:tomato_seed","tfc:red_bell_pepper_seed","tfc:yellow_bell_pepper_seed"],
 "minecraft:tall_seagrass":["tfc:rice_seed","tfc:sugarcane_seed","tfc:papyrus_seed"]
});
const FERTILIZER_PROFILES=Object.freeze({
 "minecraft:bone_meal":{name:"骨粉",nutrients:{phosphorus:10}},
 "tfc:compost":{name:"堆肥",nutrients:{nitrogen:20,potassium:20}},
 "tfc:wood_ash":{name:"木灰",nutrients:{phosphorus:10,potassium:20}}
});
const WEATHER_BY_DIMENSION=new Map([["overworld","clear"]]);
const ANIMAL_PROFILES={
 "tfc:deer":{speciesId:"deer",displayName:"シカ",adultAgeDays:30,requiredFamiliarity:30,breedingCooldownDays:1,gestationDays:210,customBreeding:true,feedItems:["minecraft:wheat","minecraft:wheat_seeds"],grazeBlocks:["minecraft:grass_block","minecraft:tallgrass"],kind:"terrestrial",domestic:false},
 "minecraft:cow":{adultAgeDays:192,speciesId:"cow",displayName:"ウシ",gestationDays:58,childCount:2,maxUses:128,productCooldownDays:1,productFamiliarityMin:15,familiarityCap:35,requiredFamiliarity:30,customBreeding:false,dairy:true,feedItems:["minecraft:wheat"],grazeBlocks:["minecraft:grass_block"],kind:"terrestrial",domestic:true},
 "minecraft:sheep":{adultAgeDays:56,speciesId:"sheep",displayName:"ヒツジ",gestationDays:32,childCount:2,maxUses:60,productCooldownDays:7,productFamiliarityMin:15,familiarityCap:35,requiredFamiliarity:25,customBreeding:false,feedItems:["minecraft:wheat"],grazeBlocks:["minecraft:grass_block"],kind:"terrestrial",domestic:true},
 "minecraft:chicken":{adultAgeDays:24,speciesId:"chicken",displayName:"ニワトリ",maxUses:100,productCooldownDays:1.25,productFamiliarityMin:15,familiarityCap:35,hatchDays:8,requiredFamiliarity:20,customBreeding:false,feedItems:["minecraft:wheat_seeds","minecraft:beetroot_seeds","minecraft:melon_seeds","minecraft:pumpkin_seeds"],grazeBlocks:[],kind:"terrestrial",domestic:true},
 "minecraft:pig":{speciesId:"pig",displayName:"ブタ",adultAgeDays:80,gestationDays:19,childCount:10,maxUses:60,familiarityCap:35,requiredFamiliarity:20,customBreeding:false,feedItems:["minecraft:carrot","minecraft:potato","minecraft:beetroot"],grazeBlocks:[],kind:"terrestrial",domestic:true},
 "minecraft:goat":{speciesId:"goat",displayName:"ヤギ",adultAgeDays:96,gestationDays:32,childCount:2,maxUses:60,productCooldownDays:3,productFamiliarityMin:15,familiarityCap:35,requiredFamiliarity:25,customBreeding:false,dairy:true,feedItems:["minecraft:wheat"],grazeBlocks:["minecraft:grass_block"],kind:"terrestrial",domestic:true},
 "minecraft:horse":{speciesId:"horse",displayName:"ウマ",adultAgeDays:80,gestationDays:19,childCount:1,maxUses:60,familiarityCap:35,requiredFamiliarity:25,customBreeding:false,feedItems:["minecraft:wheat","minecraft:apple","minecraft:golden_carrot","minecraft:golden_apple"],grazeBlocks:["minecraft:grass_block"],kind:"terrestrial",domestic:true},
 "minecraft:donkey":{speciesId:"donkey",displayName:"ロバ",adultAgeDays:80,gestationDays:19,childCount:1,maxUses:60,familiarityCap:35,requiredFamiliarity:25,customBreeding:false,feedItems:["minecraft:wheat","minecraft:apple","minecraft:golden_carrot","minecraft:golden_apple"],grazeBlocks:["minecraft:grass_block"],kind:"terrestrial",domestic:true},
 "minecraft:mule":{speciesId:"mule",displayName:"ラバ",adultAgeDays:80,gestationDays:19,childCount:1,maxUses:60,familiarityCap:35,requiredFamiliarity:25,customBreeding:false,feedItems:["minecraft:wheat","minecraft:apple","minecraft:golden_carrot","minecraft:golden_apple"],grazeBlocks:["minecraft:grass_block"],kind:"terrestrial",domestic:true},
 "minecraft:rabbit":{speciesId:"rabbit",displayName:"ウサギ",adultAgeDays:80,gestationDays:19,childCount:6,maxUses:40,familiarityCap:35,requiredFamiliarity:15,customBreeding:false,feedItems:["minecraft:carrot","minecraft:golden_carrot","minecraft:dandelion"],grazeBlocks:[],kind:"terrestrial",domestic:false},
 "minecraft:wolf":{speciesId:"wolf",displayName:"オオカミ",adultAgeDays:null,requiredFamiliarity:20,customBreeding:false,feedItems:["minecraft:beef","minecraft:porkchop","minecraft:chicken","minecraft:mutton","minecraft:rabbit"],grazeBlocks:[],kind:"terrestrial",domestic:false},
 "minecraft:fox":{speciesId:"fox",displayName:"キツネ",adultAgeDays:null,requiredFamiliarity:10,customBreeding:false,feedItems:["minecraft:sweet_berries","minecraft:glow_berries"],grazeBlocks:[],kind:"terrestrial",domestic:false},
 "minecraft:polar_bear":{speciesId:"polar_bear",displayName:"ホッキョクグマ",adultAgeDays:null,requiredFamiliarity:0,customBreeding:false,feedItems:["minecraft:cod","minecraft:salmon"],grazeBlocks:[],kind:"terrestrial",domestic:false},
 "minecraft:panda":{speciesId:"panda",displayName:"パンダ",adultAgeDays:null,requiredFamiliarity:10,customBreeding:false,feedItems:["minecraft:bamboo"],grazeBlocks:[],kind:"terrestrial",domestic:false},
 "minecraft:ocelot":{speciesId:"ocelot",displayName:"ヤマネコ",adultAgeDays:null,requiredFamiliarity:10,customBreeding:false,feedItems:["minecraft:cod","minecraft:salmon"],grazeBlocks:[],kind:"terrestrial",domestic:false},
 "minecraft:dolphin":{speciesId:"dolphin",displayName:"イルカ",adultAgeDays:null,requiredFamiliarity:0,customBreeding:false,feedItems:["minecraft:cod","minecraft:salmon"],grazeBlocks:[],kind:"aquatic",domestic:false},
 "minecraft:cod":{speciesId:"cod",displayName:"タラ",adultAgeDays:null,requiredFamiliarity:0,customBreeding:false,feedItems:[],grazeBlocks:[],kind:"aquatic",domestic:false,hungerPerDay:0,thirstPerDay:0},
 "minecraft:salmon":{speciesId:"salmon",displayName:"サケ",adultAgeDays:null,requiredFamiliarity:0,customBreeding:false,feedItems:[],grazeBlocks:[],kind:"aquatic",domestic:false,hungerPerDay:0,thirstPerDay:0},
 "minecraft:tropicalfish":{speciesId:"tropical_fish",displayName:"熱帯魚",adultAgeDays:null,requiredFamiliarity:0,customBreeding:false,feedItems:[],grazeBlocks:[],kind:"aquatic",domestic:false,hungerPerDay:0,thirstPerDay:0},
 "minecraft:pufferfish":{speciesId:"pufferfish",displayName:"フグ",adultAgeDays:null,requiredFamiliarity:0,customBreeding:false,feedItems:[],grazeBlocks:[],kind:"aquatic",domestic:false,hungerPerDay:0,thirstPerDay:0},
 "minecraft:turtle":{speciesId:"turtle",displayName:"ウミガメ",adultAgeDays:null,requiredFamiliarity:0,customBreeding:false,feedItems:["minecraft:seagrass"],grazeBlocks:[],kind:"aquatic",domestic:false},
 "minecraft:frog":{speciesId:"frog",displayName:"カエル",adultAgeDays:null,requiredFamiliarity:0,customBreeding:false,feedItems:["minecraft:slime_ball"],grazeBlocks:[],kind:"amphibian",domestic:false},
 "minecraft:squid":{speciesId:"squid",displayName:"イカ",adultAgeDays:null,requiredFamiliarity:0,customBreeding:false,feedItems:[],grazeBlocks:[],kind:"aquatic",domestic:false,hungerPerDay:0,thirstPerDay:0},
 "tfc:alpaca":{"speciesId":"alpaca","displayName":"アルパカ","adultAgeDays":98,"requiredFamiliarity":30,"customBreeding":false,"feedItems":["minecraft:wheat"],"grazeBlocks":["minecraft:grass_block"],"kind":"terrestrial","domestic":true,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"livestock"},
 "tfc:black_bear":{"speciesId":"black_bear","displayName":"クロクマ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:beef","minecraft:porkchop","minecraft:sweet_berries"],"grazeBlocks":[],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"predator"},
 "tfc:bluegill":{"speciesId":"bluegill","displayName":"ブルーギル","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":[],"grazeBlocks":[],"kind":"aquatic","domestic":false,"hungerPerDay":0,"thirstPerDay":0,"healthLossPerDay":0,"archetype":"aquatic"},
 "tfc:boar":{"speciesId":"boar","displayName":"イノシシ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:carrot","minecraft:potato","minecraft:beetroot"],"grazeBlocks":["minecraft:grass_block"],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"wild"},
 "tfc:bongo":{"speciesId":"bongo","displayName":"ボンゴ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:wheat"],"grazeBlocks":["minecraft:grass_block"],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"wild"},
 "tfc:caribou":{"speciesId":"caribou","displayName":"カリブー","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:wheat"],"grazeBlocks":["minecraft:grass_block"],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"wild"},
 "tfc:cougar":{"speciesId":"cougar","displayName":"ピューマ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:beef","minecraft:porkchop","minecraft:mutton"],"grazeBlocks":[],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"predator"},
 "tfc:crappie":{"speciesId":"crappie","displayName":"クラッピー","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":[],"grazeBlocks":[],"kind":"aquatic","domestic":false,"hungerPerDay":0,"thirstPerDay":0,"healthLossPerDay":0,"archetype":"aquatic"},
 "tfc:crayfish":{"speciesId":"crayfish","displayName":"ザリガニ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:cod"],"grazeBlocks":[],"kind":"aquatic","domestic":false,"hungerPerDay":0,"thirstPerDay":0,"healthLossPerDay":0,"archetype":"aquatic"},
 "tfc:crocodile":{"speciesId":"crocodile","displayName":"ワニ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:cod","minecraft:salmon"],"grazeBlocks":[],"kind":"amphibian","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"predator"},
 "tfc:direwolf":{"speciesId":"direwolf","displayName":"ダイアウルフ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:beef","minecraft:porkchop","minecraft:chicken","minecraft:mutton"],"grazeBlocks":[],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"predator"},
 "tfc:duck":{"speciesId":"duck","displayName":"アヒル","adultAgeDays":32,"requiredFamiliarity":30,"customBreeding":false,"feedItems":["minecraft:wheat_seeds","minecraft:beetroot_seeds"],"grazeBlocks":[],"kind":"terrestrial","domestic":true,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"bird"},
 "tfc:gazelle":{"speciesId":"gazelle","displayName":"ガゼル","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:wheat"],"grazeBlocks":["minecraft:grass_block"],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"wild"},
 "tfc:grizzly_bear":{"speciesId":"grizzly_bear","displayName":"ハイイログマ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:beef","minecraft:porkchop","minecraft:sweet_berries"],"grazeBlocks":[],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"predator"},
 "tfc:grouse":{"speciesId":"grouse","displayName":"ライチョウ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:wheat_seeds"],"grazeBlocks":[],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"bird"},
 "tfc:horseshoe_crab":{"speciesId":"horseshoe_crab","displayName":"カブトガニ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:cod"],"grazeBlocks":[],"kind":"aquatic","domestic":false,"hungerPerDay":0,"thirstPerDay":0,"healthLossPerDay":0,"archetype":"aquatic"},
 "tfc:hyena":{"speciesId":"hyena","displayName":"ハイエナ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:beef","minecraft:porkchop","minecraft:mutton"],"grazeBlocks":[],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"predator"},
 "tfc:isopod":{"speciesId":"isopod","displayName":"ワラジムシ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":[],"grazeBlocks":[],"kind":"aquatic","domestic":false,"hungerPerDay":0,"thirstPerDay":0,"healthLossPerDay":0,"archetype":"aquatic"},
 "tfc:jellyfish":{"speciesId":"jellyfish","displayName":"クラゲ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":[],"grazeBlocks":[],"kind":"aquatic","domestic":false,"hungerPerDay":0,"thirstPerDay":0,"healthLossPerDay":0,"archetype":"aquatic"},
 "tfc:lake_trout":{"speciesId":"lake_trout","displayName":"レイクトラウト","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":[],"grazeBlocks":[],"kind":"aquatic","domestic":false,"hungerPerDay":0,"thirstPerDay":0,"healthLossPerDay":0,"archetype":"aquatic"},
 "tfc:largemouth_bass":{"speciesId":"largemouth_bass","displayName":"オオクチバス","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":[],"grazeBlocks":[],"kind":"aquatic","domestic":false,"hungerPerDay":0,"thirstPerDay":0,"healthLossPerDay":0,"archetype":"aquatic"},
 "tfc:lion":{"speciesId":"lion","displayName":"ライオン","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:beef","minecraft:porkchop","minecraft:mutton"],"grazeBlocks":[],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"predator"},
 "tfc:lobster":{"speciesId":"lobster","displayName":"ロブスター","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:cod"],"grazeBlocks":[],"kind":"aquatic","domestic":false,"hungerPerDay":0,"thirstPerDay":0,"healthLossPerDay":0,"archetype":"aquatic"},
 "tfc:manatee":{"speciesId":"manatee","displayName":"マナティー","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":[],"grazeBlocks":[],"kind":"aquatic","domestic":false,"hungerPerDay":0,"thirstPerDay":0,"healthLossPerDay":0,"archetype":"aquatic"},
 "tfc:moose":{"speciesId":"moose","displayName":"ヘラジカ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:wheat"],"grazeBlocks":["minecraft:grass_block"],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"wild"},
 "tfc:musk_ox":{"speciesId":"musk_ox","displayName":"ジャコウウシ","adultAgeDays":168,"requiredFamiliarity":30,"customBreeding":false,"feedItems":["minecraft:wheat"],"grazeBlocks":["minecraft:grass_block"],"kind":"terrestrial","domestic":true,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"livestock"},
 "tfc:octopoteuthis":{"speciesId":"octopoteuthis","displayName":"オクトポテウティス","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:cod"],"grazeBlocks":[],"kind":"aquatic","domestic":false,"hungerPerDay":0,"thirstPerDay":0,"healthLossPerDay":0,"archetype":"aquatic"},
 "tfc:orca":{"speciesId":"orca","displayName":"シャチ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:cod","minecraft:salmon"],"grazeBlocks":[],"kind":"aquatic","domestic":false,"hungerPerDay":0,"thirstPerDay":0,"healthLossPerDay":0,"archetype":"aquatic"},
 "tfc:panther":{"speciesId":"panther","displayName":"クロヒョウ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:beef","minecraft:porkchop","minecraft:mutton"],"grazeBlocks":[],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"predator"},
 "tfc:peafowl":{"speciesId":"peafowl","displayName":"クジャク","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:wheat_seeds"],"grazeBlocks":[],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"bird"},
 "tfc:penguin":{"speciesId":"penguin","displayName":"ペンギン","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:cod","minecraft:salmon"],"grazeBlocks":[],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"wild"},
 "tfc:pheasant":{"speciesId":"pheasant","displayName":"キジ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:wheat_seeds"],"grazeBlocks":[],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"bird"},
 "tfc:quail":{"speciesId":"quail","displayName":"ウズラ","adultAgeDays":22,"requiredFamiliarity":30,"customBreeding":false,"feedItems":["minecraft:wheat_seeds"],"grazeBlocks":[],"kind":"terrestrial","domestic":true,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"bird"},
 "tfc:rainbow_trout":{"speciesId":"rainbow_trout","displayName":"ニジマス","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":[],"grazeBlocks":[],"kind":"aquatic","domestic":false,"hungerPerDay":0,"thirstPerDay":0,"healthLossPerDay":0,"archetype":"aquatic"},
 "tfc:sabertooth":{"speciesId":"sabertooth","displayName":"サーベルタイガー","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:beef","minecraft:porkchop","minecraft:mutton"],"grazeBlocks":[],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"predator"},
 "tfc:smallmouth_bass":{"speciesId":"smallmouth_bass","displayName":"コクチバス","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":[],"grazeBlocks":[],"kind":"aquatic","domestic":false,"hungerPerDay":0,"thirstPerDay":0,"healthLossPerDay":0,"archetype":"aquatic"},
 "tfc:tiger":{"speciesId":"tiger","displayName":"トラ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:beef","minecraft:porkchop","minecraft:mutton"],"grazeBlocks":[],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"predator"},
 "tfc:turkey":{"speciesId":"turkey","displayName":"シチメンチョウ","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:wheat_seeds"],"grazeBlocks":[],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"bird"},
 "tfc:wildebeest":{"speciesId":"wildebeest","displayName":"ヌー","adultAgeDays":null,"requiredFamiliarity":0,"customBreeding":false,"feedItems":["minecraft:wheat"],"grazeBlocks":["minecraft:grass_block"],"kind":"terrestrial","domestic":false,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"wild"},
 "tfc:yak":{"speciesId":"yak","displayName":"ヤク","adultAgeDays":180,"requiredFamiliarity":30,"customBreeding":false,"feedItems":["minecraft:wheat"],"grazeBlocks":["minecraft:grass_block"],"kind":"terrestrial","domestic":true,"hungerPerDay":8,"thirstPerDay":12,"healthLossPerDay":0,"archetype":"livestock"}
};
Object.assign(ANIMAL_PROFILES,CUSTOM_FAUNA_PROFILES,{
 "minecraft:wolf":{predatorDiet:["deer","rabbit","sheep","pig","duck","quail","boar","caribou","gazelle","musk_ox","moose","wildebeest"],predationDamage:5},
 "minecraft:fox":{predatorDiet:["chicken","rabbit","duck","quail","grouse","pheasant"],predationDamage:3},
 "minecraft:polar_bear":{predatorDiet:["cod","salmon","bluegill","lake_trout","rainbow_trout","orca","manatee"],predationDamage:8},
 "minecraft:ocelot":{predatorDiet:["chicken","rabbit","quail","grouse","pheasant","bluegill"],predationDamage:3}
});
const inv=p=>p.getComponent("minecraft:inventory")?.container;
function count(p,id){const c=inv(p);if(!c)return 0;let n=0;for(let i=0;i<c.size;i++){const s=c.getItem(i);if(s?.typeId===id)n+=s.amount;}return n;}
function take(p,id,n){const c=inv(p);if(!c||count(p,id)<n)return false;for(let i=0;i<c.size&&n>0;i++){const s=c.getItem(i);if(!s||s.typeId!==id)continue;const k=Math.min(n,s.amount);if(k===s.amount)c.setItem(i,undefined);else{s.amount-=k;c.setItem(i,s);}n-=k;}return n===0;}
function give(p,id,n=1){const c=inv(p);if(!c)return false;const rest=c.addItem(createOutputStack(id,n));if(rest)p.dimension.spawnItem(rest,p.location);return true;}

function fillWaterVessel(player,block){
 if(!player||!block)return;
 if(block.typeId!=="minecraft:water"&&block.typeId!=="minecraft:flowing_water"){player.sendMessage("§c水源に向けて土器を使ってください。");return;}
 if(!take(player,"tfc:fired_vessel",1)){player.sendMessage("§c空の焼成土器が必要です。");return;}
 let oceanWater=false;
 try{const biomeId=String(block.dimension.getBiome(block.location).id);oceanWater=/(?:^|:)(?:deep_)?(?:cold_|lukewarm_|warm_|frozen_)?ocean$/.test(biomeId);}catch{}
 if(oceanWater){give(player,"tfc:brine_vessel",1);player.sendMessage("§b海水を土器に汲みました。焚き火で煮詰めると塩を回収できます。");}
 else{give(player,"tfc:water_vessel",1);player.sendMessage("§b淡水を土器に汲みました。飲むと水分が回復します。");}
}
function drinkWaterVessel(player){
 if(!player||player.typeId!=="minecraft:player")return;
 const state=deserializePlayerState(String(player.getDynamicProperty(STATE_KEY)??""));
 const result=consumeFood(state,{freshness:100,hydration:35,nutrition:{}});
 if(!result.consumed)return;
 if(!take(player,"tfc:water_vessel",1)){player.sendMessage("§c水入り土器を手に持ってください。");return;}
 player.setDynamicProperty(STATE_KEY,serializePlayerState(result.playerState));
 give(player,"tfc:fired_vessel",1);
 player.sendMessage("§b水を飲みました。水分 +35。空の土器が戻りました。");
}
function mixDough(player){
 if(!player||player.typeId!=="minecraft:player")return;
 const held=inv(player)?.getItem(player.selectedSlotIndex);
 if(held?.typeId!=="tfc:flour"){player.sendMessage("§e小麦粉を手に持って使ってください。");return;}
 if(count(player,"tfc:water_vessel")<1){player.sendMessage("§c水入り土器が必要です。");return;}
 if(!take(player,"tfc:flour",1)){player.sendMessage("§c小麦粉を取り出せませんでした。");return;}
 if(!take(player,"tfc:water_vessel",1)){give(player,"tfc:flour",1);player.sendMessage("§c水入り土器を取り出せませんでした。小麦粉を返却しました。");return;}
 give(player,"tfc:dough",1);give(player,"tfc:fired_vessel",1);
 player.sendMessage("§a小麦粉と水を混ぜて生地を作りました。空の土器が戻りました。");
}
function food(event,params){const p=event?.source;if(!p||p.typeId!=="minecraft:player")return;const s=deserializePlayerState(String(p.getDynamicProperty(STATE_KEY)??""));const itemId=String(params.itemId??"");const freshness=readStackFreshness(event.itemStack?.getLore?.()??[])?.freshness??100;const nutrition=params.category?{[params.category]:Number(params.nutrition??0)}:{};const result=consumeFood(s,{freshness,hydration:Number(params.hydration??0),nutrition});if(!result.consumed){p.sendMessage("§cこの食品は腐敗していて食べられません。");return;}p.setDynamicProperty(STATE_KEY,serializePlayerState(result.playerState));p.sendMessage("§a"+(itemId||"食品")+"の栄養・水分を反映しました。");}
function tickFoodContainerFreshness(container,dimension,location,nowTick,{sealed=false}={}){
 if(!container)return;
 const temperatureC=temperatureAt(dimension,location);
 for(let slot=0;slot<container.size;slot++){
  const stack=container.getItem(slot);if(!stack)continue;
  const baseDecayPerHour=FOOD_DECAY_PROFILES[stack.typeId];if(baseDecayPerHour===undefined)continue;
  let lore=[];try{lore=stack.getLore();}catch{}
  const result=advanceStackFreshness(lore,nowTick,{temperatureC,baseDecayPerHour:baseDecayPerHour*(sealed?0.5:1)});
  if(result.food.spoiled){container.setItem(slot,new ItemStack("tfc:spoiled_food",stack.amount));continue;}
  try{stack.setLore(result.lore);container.setItem(slot,stack);}catch(error){console.warn("[TFC-Bedrook] food stack freshness update:",error);}
 }
}
function saveTrackedFoodContainers(){
 const entries=[...trackedFoodContainers.entries()].map(([key,value])=>({key,dimensionId:value.dimensionId,location:value.location}));
 try{world.setDynamicProperty(TRACKED_FOOD_CONTAINERS_KEY,JSON.stringify(entries));}catch(error){console.warn("[TFC-Bedrook] tracked food container save failed:",error);}
}
function loadTrackedFoodContainers(){
 try{
  const raw=world.getDynamicProperty(TRACKED_FOOD_CONTAINERS_KEY);
  if(typeof raw!=="string")return;
  const entries=JSON.parse(raw);
  if(!Array.isArray(entries))return;
  for(const entry of entries.slice(-128)){
   if(!entry?.key||!entry?.dimensionId||!entry?.location)continue;
   trackedFoodContainers.set(entry.key,{dimensionId:entry.dimensionId,location:entry.location});
  }
 }catch(error){console.warn("[TFC-Bedrook] tracked food container load failed:",error);}
}
function getBlockInventoryContainer(block){
 try{const component=block.getComponent("minecraft:inventory");if(component?.container)return component.container;}catch{}
 try{const component=block.getComponent("inventory");if(component?.container)return component.container;}catch{}
 return undefined;
}
function foodContainerSummary(container){
 if(!container)return "容器の内容を読み取れませんでした。";
 const lines=[];
 for(let slot=0;slot<container.size;slot++){
  const stack=container.getItem(slot);if(!stack)continue;
  const name=ITEM_LABELS[stack.typeId]??stack.typeId.replace(/^tfc:/,"").replaceAll("_"," ");
  if(stack.typeId==="tfc:spoiled_food"){lines.push("§c"+name+" ×"+stack.amount+"（腐敗）");continue;}
  if(FOOD_DECAY_PROFILES[stack.typeId]===undefined)continue;
  let lore=[];try{lore=stack.getLore();}catch{}
  const freshness=readStackFreshness(lore).freshness;
  const status=freshness>=75?"新鮮":freshness>=40?"劣化中":freshness>0?"腐敗間近":"腐敗";
  const color=freshness>=75?"§a":freshness>=40?"§e":"§c";
  lines.push(color+name+" ×"+stack.amount+"（鮮度 "+Math.round(freshness)+"% / "+status+"）");
 }
 return lines.length?lines.join("\n"):"食品は入っていません。";
}
function trackFoodContainer(block){
 try{
  const container=getBlockInventoryContainer(block);
  if(!container)return;
  const location={x:Math.floor(block.location.x),y:Math.floor(block.location.y),z:Math.floor(block.location.z)};
  const dimensionId=normalizeDimensionId(block.dimension.id),key=dimensionId+":"+location.x+","+location.y+","+location.z;
  if(trackedFoodContainers.has(key))return;
  trackedFoodContainers.set(key,{dimensionId,location});
  while(trackedFoodContainers.size>128)trackedFoodContainers.delete(trackedFoodContainers.keys().next().value);
  saveTrackedFoodContainers();
 }catch{}
}
function tickTrackedFoodContainers(nowTick){
 let changed=false;
 for(const [key,entry] of trackedFoodContainers){
  try{
   const dimension=world.getDimension(entry.dimensionId),block=dimension.getBlock(entry.location);
   if(!block){continue;}
   const container=getBlockInventoryContainer(block);
   if(!container){trackedFoodContainers.delete(key);changed=true;continue;}
   tickFoodContainerFreshness(container,dimension,entry.location,nowTick,{sealed:readWorldState(posKey(block,"container_sealed"),false)===true});
  }catch{}
 }
 if(changed)saveTrackedFoodContainers();
}
function tickFoodFreshness(player,nowTick){
 const container=inv(player);if(!container)return;
 tickFoodContainerFreshness(container,player.dimension,player.location,nowTick);
}
function posKey(block,kind){const l=block.location;return "tfc:"+kind+":"+block.dimension.id+":"+Math.floor(l.x)+","+Math.floor(l.y)+","+Math.floor(l.z);}
function readWorldState(key,fallback){try{const raw=world.getDynamicProperty(key);return typeof raw==="string"?JSON.parse(raw):fallback;}catch{return fallback;}}
function writeWorldState(key,value){try{world.setDynamicProperty(key,JSON.stringify(value));return true;}catch(error){console.warn("[TFC-Bedrook] world state save:",error);return false;}}

const PROSPECTING_ORES=Object.freeze({
 "minecraft:coal_ore":"石炭","minecraft:deepslate_coal_ore":"石炭",
 "minecraft:copper_ore":"銅","minecraft:deepslate_copper_ore":"銅",
 "minecraft:iron_ore":"鉄","minecraft:deepslate_iron_ore":"鉄",
 "minecraft:gold_ore":"金","minecraft:deepslate_gold_ore":"金",
 "minecraft:redstone_ore":"レッドストーン","minecraft:deepslate_redstone_ore":"レッドストーン",
 "minecraft:lapis_ore":"ラピスラズリ","minecraft:deepslate_lapis_ore":"ラピスラズリ",
 "minecraft:diamond_ore":"ダイヤモンド","minecraft:deepslate_diamond_ore":"ダイヤモンド",
 "minecraft:emerald_ore":"エメラルド","minecraft:deepslate_emerald_ore":"エメラルド",
 "minecraft:nether_quartz_ore":"ネザークォーツ","minecraft:nether_gold_ore":"ネザー金"
});
const PROSPECTING_ABUNDANCE={trace:"痕跡",small:"少量",large:"豊富",very_large:"非常に豊富"};
function prospect(player,centerBlock){
 if(!player||!centerBlock)return;
 const center=centerBlock.location,counts={},radius=4;
 let samples=0,hostRock=centerBlock.typeId;
 for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++)for(let dy=-2;dy<=2;dy++){
  try{
   const block=centerBlock.dimension.getBlock({x:Math.floor(center.x)+dx,y:Math.floor(center.y)+dy,z:Math.floor(center.z)+dz});
   if(!block)continue;samples++;
   const ore=PROSPECTING_ORES[block.typeId];if(ore)counts[ore]=(counts[ore]??0)+1;
  }catch{}
 }
 const summary=summarizeOreSamples(counts);
 const lines=summary.slice(0,5).map(entry=>entry.ore+": "+entry.count+"ブロック（"+PROSPECTING_ABUNDANCE[entry.abundance]+"）");
 const body="基準岩石: "+hostRock+"\n調査範囲: 水平"+radius+"ブロック / 上下2ブロック\n調査ブロック数: "+samples+"\n\n"+(lines.length?lines.join("\n"):"鉱石は検出されませんでした。")+"\n\nこれは周辺ブロックの簡易調査結果です。鉱脈の正確な形状・深度分布は地形/鉱脈生成の接続後に拡張します。";
 const form=new ActionFormData().title("地質調査結果").body(body).button("閉じる");
 void form.show(player).catch(()=>player.sendMessage("§6地質調査結果§r\n"+body));
}

const FUELS={
"minecraft:coal":{id:"coal",duration:2200,temperatureC:1415},
"minecraft:charcoal":{id:"charcoal",duration:1800,temperatureC:1350},
"minecraft:stick":{id:"stick",duration:600,temperatureC:900},
"minecraft:oak_log":{id:"oak_log",duration:2250,temperatureC:728},
"minecraft:spruce_log":{id:"spruce_log",duration:1500,temperatureC:608},
"minecraft:birch_log":{id:"birch_log",duration:1750,temperatureC:652},
"minecraft:jungle_log":{id:"jungle_log",duration:1500,temperatureC:700},
"minecraft:acacia_log":{id:"acacia_log",duration:1000,temperatureC:650},
"minecraft:dark_oak_log":{id:"dark_oak_log",duration:1750,temperatureC:700}
};

function stationJobKey(block){return posKey(block,"station_job");}
function completeStationJob(key,dimension,location){
 let job=readWorldState(key,null);if(!isStationJobDue(job))return false;
 try{
  for(const [id,n] of getPendingStationOutputs(job)){
   dimension.spawnItem(createOutputStack(id,n),location);
   job=markStationOutputDelivered(job,id);
   writeWorldState(key,job);
  }
  writeWorldState(key,null);
  const player=world.getAllPlayers().find(p=>p.id===job.playerId);
  if(player)player.sendMessage("§a加工完了。完成品を設備の場所に搬出しました。");
  return true;
 }catch(error){
  writeWorldState(key,markStationJobRecoverable(job));
  console.warn("[TFC-Bedrook] output retained for recovery:",error);return false;
 }
}
function recoverPlayerStationJobs(player){
 if(!player)return;
 let ids=[];try{ids=world.getDynamicPropertyIds();}catch{return;}
 for(const key of ids){if(!key.startsWith("tfc:station_job:"))continue;const job=readWorldState(key,null);if(!job||job.playerId!==player.id)continue;
  let dimension;try{dimension=world.getDimension(job.dimensionId);}catch{continue;}
  const location=job.location;if(!location)continue;
  const remaining=Math.max(0,job.endsAt-Date.now());
  if(remaining===0)completeStationJob(key,dimension,location);else scheduleStationJob(key,dimension,location,remaining/50);
 }
}
function scheduleStationJob(key,dimension,location,delayTicks){
 system.runTimeout(()=>{try{completeStationJob(key,dimension,location);}catch(error){console.warn("[TFC-Bedrook] station job completion:",error);}},Math.max(1,Math.ceil(delayTicks)));
}
async function processQuernManually(player,block,recipe){
 const held=inv(player)?.getItem(player.selectedSlotIndex);
 if(held?.typeId!=="tfc:handstone"){player.sendMessage("§e上臼石を手に持って石臼を操作してください。");return;}
 const missing=Object.entries(recipe.inputs).filter(([itemId,amount])=>count(player,itemId)<amount);
 if(missing.length){player.sendMessage("§c材料不足: "+missing.map(([id,n])=>(ITEM_LABELS[id]??id)+" ×"+n).join("、"));return;}
 for(let turn=0;turn<3;turn++){
  const form=new ActionFormData().title("石臼").body("穀物を挽いています。\n手動回転: "+(turn+1)+" / 3\n上臼石を回してください。").button("上臼を回す").button("中止");
  let response;try{response=await form.show(player);}catch{player.sendMessage("§e石臼UIを開けませんでした。材料は消費されていません。");return;}
  if(!response||response.canceled||response.selection!==0){player.sendMessage("§e粉挽きを中止しました。材料は消費されていません。");return;}
  const current=inv(player)?.getItem(player.selectedSlotIndex);
  if(current?.typeId!=="tfc:handstone"||block.typeId!=="tfc:quern"){player.sendMessage("§c石臼か上臼石が手元からなくなりました。");return;}
 }
 const removed=[];
 for(const [itemId,amount] of Object.entries(recipe.inputs)){
  if(!take(player,itemId,amount)){
   for(const [restoreId,restoreAmount] of removed)give(player,restoreId,restoreAmount);
   player.sendMessage("§c材料を取り出せませんでした。取り出し済みの材料は返却しました。");return;
  }
  removed.push([itemId,amount]);
 }
 for(const [itemId,amount] of Object.entries(recipe.outputs))give(player,itemId,amount);
 player.sendMessage("§a粉挽き完了: "+recipe.title);
}

async function shapePottery(player){
 const choices=[
  {name:"土器",amount:4,id:"tfc:clay_vessel"},
  {name:"インゴット鋳型",amount:8,id:"tfc:unfired_ingot_mold"},
  {name:"るつぼ",amount:8,id:"tfc:unfired_crucible"}
 ];
 const form=new ActionFormData().title("粘土成形").body("粘土玉を使って未焼成の陶器を成形します。\n\n土器: 4個\nインゴット鋳型: 8個\nるつぼ: 8個\n\n成形後はPit Kilnで焼成してください。");
 for(const choice of choices)form.button(choice.name+"を成形（粘土玉×"+choice.amount+"）");
 form.button("閉じる");
 let response;try{response=await form.show(player);}catch{return;}
 if(response.canceled||response.selection>=choices.length)return;
 const choice=choices[response.selection];
 if(count(player,"minecraft:clay_ball")<choice.amount){player.sendMessage("§c粘土玉が不足しています。必要数: "+choice.amount);return;}
 if(!take(player,"minecraft:clay_ball",choice.amount)){player.sendMessage("§c粘土玉を取り出せませんでした。");return;}
 give(player,choice.id,1);player.sendMessage("§a"+choice.name+"を成形しました。Pit Kilnで焼成できます。");
}
async function crucibleStation(player,block,state){
 const key=posKey(block,"crucible_charge"),recipes=getStationRecipes("crucible");
 const copperRecipe=recipes.find(recipe=>recipe.outputs["tfc:heated_copper_ingot"]);
 const tinRecipe=recipes.find(recipe=>recipe.outputs["tfc:heated_tin_ingot"]);
 const bronzeRecipe=recipes.find(recipe=>recipe.alloyId==="bronze");
 if(!copperRecipe||!tinRecipe||!bronzeRecipe){player.sendMessage("§cるつぼの加工レシピが登録されていません。");return;}
 const metalIds=Object.keys(bronzeRecipe.metalInputs??{});
 if(metalIds.length!==2){player.sendMessage("§cるつぼの合金レシピは2種類の金属成分を必要とします。");return;}
 const firstMetal=metalIds[0],secondMetal=metalIds[1];
 const firstItemId="tfc:"+firstMetal+"_ingot",secondItemId="tfc:"+secondMetal+"_ingot";
 const saved=readWorldState(key,{[firstMetal]:0,[secondMetal]:0});
 const firstAmount=Math.max(0,Math.floor(Number(saved[firstMetal])||0)),secondAmount=Math.max(0,Math.floor(Number(saved[secondMetal])||0));
 const total=firstAmount+secondAmount;
 const valid=findMatchingAlloys({[firstMetal]:firstAmount,[secondMetal]:secondAmount},{recipes:[{id:bronzeRecipe.alloyId,components:bronzeRecipe.alloyComponents}]}).includes(bronzeRecipe.alloyId);
 const firstRange=bronzeRecipe.alloyComponents[firstMetal],secondRange=bronzeRecipe.alloyComponents[secondMetal];
 const copperOreAmount=Object.entries(copperRecipe.inputs).find(([id])=>id.endsWith("_ore"))?.[1]??0,tinOreAmount=Object.entries(tinRecipe.inputs).find(([id])=>id.endsWith("_ore"))?.[1]??0;
 const body="§7るつぼ温度: "+Math.floor(state.temperatureC)+"°C\n§7燃料残り: "+Math.ceil(state.burnTicks/20)+"秒\n\n投入済み合金材料\n"+(ITEM_LABELS[firstItemId]??firstItemId)+": "+firstAmount+" / "+(ITEM_LABELS[secondItemId]??secondItemId)+": "+secondAmount+"\n配合: "+(total?Math.round(firstAmount/total*100)+"% / "+Math.round(secondAmount/total*100)+"%":"未投入")+"\n青銅判定: "+(valid?"§a配合範囲内":"§e未成立")+"\n必要配合: "+(ITEM_LABELS[firstItemId]??firstMetal)+" "+Math.round(firstRange[0]*100)+"〜"+Math.round(firstRange[1]*100)+"% / "+(ITEM_LABELS[secondItemId]??secondMetal)+" "+Math.round(secondRange[0]*100)+"〜"+Math.round(secondRange[1]*100)+"%\n\n鉱石鋳造・合金配合は登録済み加工レシピを参照します。";
 const form=new ActionFormData().title("Crucible｜投入・配合・鋳造").body(body)
 .button("銅鉱石×"+copperOreAmount+"を溶融・鋳造")
 .button("錫鉱石×"+tinOreAmount+"を溶融・鋳造")
 .button((ITEM_LABELS[firstItemId]??firstItemId)+"を1個投入（合金用）")
 .button((ITEM_LABELS[secondItemId]??secondItemId)+"を1個投入（合金用）")
 .button("配合を確認して青銅を鋳造")
 .button("投入金属を取り出す")
 .button("閉じる");
 let response;try{response=await form.show(player);}catch{player.sendMessage("§cるつぼUIを開けませんでした。");return;}
 if(response.canceled||response.selection===6)return;
 if(response.selection===0||response.selection===1){
  const recipe=response.selection===0?copperRecipe:tinRecipe;
  const oreId=Object.keys(recipe.inputs).find(id=>id.endsWith("_ore"));
  const outputId=Object.keys(recipe.outputs).find(id=>id.startsWith("tfc:heated_"));
  const moldId=Object.keys(recipe.inputs).find(id=>id.endsWith("_ingot_mold"));
  const oreAmount=recipe.inputs[oreId]??0,moldAmount=moldId?recipe.inputs[moldId]:0;
  const name=response.selection===0?"銅":"錫";
  if(!oreId||!outputId||!canProcessAtTemperature(state,recipe.minimumTemperatureC)){player.sendMessage("§c"+name+"の鋳造には"+recipe.minimumTemperatureC+"°C以上が必要です。");return;}
  if(count(player,oreId)<oreAmount||(moldId&&count(player,moldId)<moldAmount)){player.sendMessage("§c"+name+"鉱石×"+oreAmount+"と焼成済み鋳型×"+moldAmount+"が必要です。");return;}
  if(!take(player,oreId,oreAmount)){player.sendMessage("§c鉱石を取り出せませんでした。");return;}
  if(moldId&&moldAmount&&!take(player,moldId,moldAmount)){give(player,oreId,oreAmount);player.sendMessage("§c鋳型を取り出せませんでした。鉱石を返却しました。");return;}
  for(const [id,amount] of Object.entries(recipe.outputs))give(player,id,amount);
  player.sendMessage("§a"+name+"を溶融・鋳造しました。加熱インゴットと鋳型を回収してください。");return;
 }
 if(response.selection===2||response.selection===3){
  const metalId=response.selection===2?firstMetal:secondMetal,itemId=response.selection===2?firstItemId:secondItemId;
  if(!take(player,itemId,1)){player.sendMessage("§c"+(ITEM_LABELS[itemId]??itemId)+"がありません。");return;}
  const next={...saved,[metalId]:(response.selection===2?firstAmount:secondAmount)+1};
  if(!writeWorldState(key,next)){give(player,itemId,1);player.sendMessage("§c投入状態を保存できませんでした。材料を返却しました。");return;}
  player.sendMessage("§a"+(ITEM_LABELS[itemId]??itemId)+"をるつぼへ投入しました。");return;
 }
 if(response.selection===5){
  if(total===0){player.sendMessage("§eるつぼは空です。");return;}
  if(!writeWorldState(key,{[firstMetal]:0,[secondMetal]:0})){player.sendMessage("§cるつぼの状態を保存できませんでした。金属はるつぼ内に保持されています。");return;}
  give(player,firstItemId,firstAmount);give(player,secondItemId,secondAmount);player.sendMessage("§a投入金属をインベントリへ戻しました。");return;
 }
 if(!valid){player.sendMessage("§c青銅の配合範囲外です。必要配合: "+Math.round(firstRange[0]*100)+"〜"+Math.round(firstRange[1]*100)+"% / "+Math.round(secondRange[0]*100)+"〜"+Math.round(secondRange[1]*100)+"%。");return;}
 if(!canProcessAtTemperature(state,bronzeRecipe.minimumTemperatureC)){player.sendMessage("§c青銅の溶融には"+bronzeRecipe.minimumTemperatureC+"°C以上が必要です。");return;}
 const moldId=Object.keys(bronzeRecipe.inputs).find(id=>id.endsWith("_ingot_mold")),moldAmount=moldId?bronzeRecipe.inputs[moldId]:0;
 if(!moldId||!moldAmount||!take(player,moldId,moldAmount)){player.sendMessage("§c焼成済みインゴット鋳型が必要です。");return;}
 if(!writeWorldState(key,{[firstMetal]:0,[secondMetal]:0})){give(player,moldId,moldAmount);player.sendMessage("§c配合状態を更新できませんでした。鋳型を返却しました。");return;}
 for(const [id,amount] of Object.entries(bronzeRecipe.outputs))give(player,id,amount);
 player.sendMessage("§a青銅を鋳造しました。加熱済みインゴットと鋳型を回収してください。");
}
function hasActiveSmokeSource(block){
 const l=block.location,offsets=[[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];
 for(const [dx,dy,dz] of offsets){
  try{
   const source=block.dimension.getBlock({x:l.x+dx,y:l.y+dy,z:l.z+dz});
   if(source?.typeId!=="tfc:firepit")continue;
   const fire=createFireState(readWorldState(posKey(source,"fire"),{}));
   if(fire.burnTicks>0&&fire.temperatureC>=80)return true;
  }catch{}
 }
 return false;
}
async function station(player,id,block){
 const recipes=getStationRecipes(id);if(!recipes.length)return;
 const key=stationJobKey(block),existing=readWorldState(key,null);
 if(existing&&["running","ready_to_claim","delivering"].includes(existing.status)){
  const remaining=Math.max(0,existing.endsAt-Date.now());
  if(remaining<=0){const completed=completeStationJob(key,block.dimension,block.location);player.sendMessage(completed?"§a保存されていた加工が完了しました。完成品は設備の場所に出ました。":"§e加工時間は終了していますが、完成品をまだ搬出できません。後で再試行します。");return;}
  scheduleStationJob(key,block.dimension,block.location,remaining/50);
  const progress=Math.floor(100*(1-remaining/Math.max(1,existing.endsAt-existing.startedAt)));
  const form=new ActionFormData().title("設備状態").body("§e加工中: "+existing.recipeId+"\n進捗: "+progress+"%\n残り: "+Math.ceil(remaining/1000)+"秒\n\n開始後に退出しても処理結果は保存されます。").button("閉じる");
  try{await form.show(player);}catch{}return;
 }
 const state=createFireState(readWorldState(posKey(block,"fire"),{}));
 const held=inv(player)?.getItem(player.selectedSlotIndex),fuel=(id==="anvil"||id==="drying_rack"||id==="composter"||id==="quern"||id==="smokehouse")?null:(held?FUELS[held.typeId]:null);
 if(fuel){if(!take(player,held.typeId,1)){player.sendMessage("§c燃料を取り出せません。");return;}writeWorldState(posKey(block,"fire"),addFuel(state,fuel));player.sendMessage("§a燃料投入: "+Math.round(fuel.duration/20)+"秒分");return;}
 if(id==="crucible"){await crucibleStation(player,block,state);return;}
 const tempLabels={unheated:"未加熱",warming:"暖まり中",hot:"熱い",very_hot:"非常に熱い",faint_red:"かすかな赤熱",dark_red:"暗赤色",bright_red:"明るい赤熱",orange:"橙熱",yellow:"黄色熱",yellow_white:"黄白色",white:"白熱",brilliant_white:"強白熱"};
 const body=recipes.map((r,i)=>{const inputs=Object.entries(r.inputs).map(([itemId,amount])=>(count(player,itemId)>=amount?"§a":"§c")+(ITEM_LABELS[itemId]??itemId)+" ×"+amount+"§r").join("、");const outputs=Object.entries(r.outputs).map(([itemId,amount])=>(ITEM_LABELS[itemId]??itemId)+" ×"+amount).join("、");return(i+1)+". "+r.title+"\n   "+(id==="quern"?"手動回転 3回":id==="drying_rack"||id==="composter"?"所要時間 "+Math.ceil(r.durationTicks/20)+"秒":id==="smokehouse"?"焚き火の煙 / "+Math.ceil(r.durationTicks/20)+"秒":"必要温度 "+r.minimumTemperatureC+"°C / "+Math.ceil(r.durationTicks/20)+"秒")+"\n   材料: "+inputs+"\n   完成品: "+outputs;}).join("\n\n");
 const heldTemperature=Number(held?.getDynamicProperty(ITEM_TEMPERATURE_KEY)??0);const status=id==="smokehouse"?"\n\n隣接する焚き火を燃焼させ、80°C以上の煙を維持してください。":id==="quern"?"\n\n上臼石を材料と一緒に投入し、手動回転で穀物を挽きます。燃料・熱源は不要です。":id==="drying_rack"?"\n\n常温・時間式乾燥です。燃料は必要ありません。":id==="composter"?"\n\n常温で約10日間発酵させます。緑の素材と茶色の素材が必要です。":id==="anvil"?"\n\n手持ち金属温度: "+Math.floor(heldTemperature)+"°C（"+tempLabels[classifyTemperature(heldTemperature)]+"）\n鍛造温度に達した加熱インゴットが必要です。":"\n\n現在温度: "+Math.floor(state.temperatureC)+"°C（"+tempLabels[classifyTemperature(state.temperatureC)]+"）\n燃料残り: "+Math.ceil(state.burnTicks/20)+"秒";
 const form=new ActionFormData().title(id==="smokehouse"?"燻製設備":id==="anvil"?"金床":id==="drying_rack"?"乾燥棚":id==="composter"?"コンポスター":id==="quern"?"石臼":"加工設備").body(body+status);
 for(const recipe of recipes)form.button(recipe.title);
 if(id==="anvil")form.button("水で冷却");
 form.button("閉じる");
 let response;try{response=await form.show(player);}catch{player.sendMessage("§c設備UIを開けませんでした。");return;}
 if(response.canceled)return;
 if(id==="anvil"&&response.selection===recipes.length){
  const heldNow=inv(player)?.getItem(player.selectedSlotIndex);let water=false;
  for(let x=-2;x<=2&&!water;x++)for(let z=-2;z<=2&&!water;z++)for(const y of [0,1]){try{const b=block.dimension.getBlock({x:block.location.x+x,y:block.location.y+y,z:block.location.z+z});if(b&&(b.typeId==="minecraft:water"||b.typeId==="minecraft:flowing_water")){water=true;break;}}catch{}}
  if(!water){player.sendMessage("§c近くに水が必要です。");return;}
  const coolingMap={"tfc:heated_copper_ingot":"tfc:copper_ingot","tfc:heated_tin_ingot":"tfc:tin_ingot","tfc:heated_bronze_ingot":"tfc:bronze_ingot"};const output=coolingMap[heldNow?.typeId];if(!output||!take(player,heldNow.typeId,1)){player.sendMessage("§c加熱済みの銅・錫・青銅インゴットを手に持ってください。");return;}
  give(player,output,1);player.sendMessage("§b金属インゴットを水で冷却しました。");return;
 }
 if(response.selection>=recipes.length)return;
 const recipe=recipes[response.selection];
 if(id==="smokehouse"&&!hasActiveSmokeSource(block)){player.sendMessage("§c燻製設備の隣に、燃焼中で80°C以上の焚き火が必要です。");return;}
 if(id==="quern"){await processQuernManually(player,block,recipe);return;}
 if(id==="anvil"){const requiredId=Object.keys(recipe.inputs)[0],heldNow=inv(player)?.getItem(player.selectedSlotIndex),profile=HEATED_METAL_PROFILES[requiredId],temperature=Number(heldNow?.getDynamicProperty(ITEM_TEMPERATURE_KEY)??0);if(!profile||heldNow?.typeId!==requiredId||temperature<profile.forgingTemperatureC){player.sendMessage("§c手持ちの加熱インゴットが鍛造温度に達していません。必要温度: "+(profile?.forgingTemperatureC??0)+"°C");return;}}
 if(recipe.alloyId){const matches=findMatchingAlloys(recipe.metalInputs,{recipes:[{id:recipe.alloyId,components:recipe.alloyComponents}]});if(!matches.includes(recipe.alloyId)){player.sendMessage("§c合金の配合比が範囲外です。");return;}}
 if(!["anvil","drying_rack","composter","quern","smokehouse"].includes(id)&&!canProcessAtTemperature(state,recipe.minimumTemperatureC)){player.sendMessage("§c温度不足です。");return;}
 for(const [itemId,amount] of Object.entries(recipe.inputs)){if(count(player,itemId)<amount){player.sendMessage("§c材料不足: "+itemId+" ×"+amount);return;}}
 const consumedInputs={};
 for(const [itemId,amount] of Object.entries(recipe.inputs)){if(!take(player,itemId,amount)){for(const [rollbackId,rollbackAmount] of Object.entries(consumedInputs))give(player,rollbackId,rollbackAmount);player.sendMessage("§c材料の取り出しに失敗したため、投入済み材料を返却しました。");return;}consumedInputs[itemId]=amount;}
 const now=Date.now(),job={status:"running",recipeId:recipe.id,outputs:recipe.outputs,playerId:player.id,startedAt:now,endsAt:now+recipe.durationTicks*50,dimensionId:block.dimension.id,location:{x:block.location.x,y:block.location.y,z:block.location.z}};
 if(!writeWorldState(key,job)){for(const [rollbackId,rollbackAmount] of Object.entries(consumedInputs))give(player,rollbackId,rollbackAmount);player.sendMessage("§c加工状態を保存できなかったため、材料を返却しました。");return;}
 player.sendMessage("§e加工を開始しました。途中退出後もジョブを保存します。");
 scheduleStationJob(key,block.dimension,block.location,recipe.durationTicks);
}
async function knap(player){
 let selected=[];try{selected=JSON.parse(String(player.getDynamicProperty(PROGRESS_KEY)??"[]"));}catch{selected=[];}
 if(!Array.isArray(selected))selected=[];
 // 5x5 is the standard TFC knapping work area. Discard stale positions outside the grid.
 selected=[...new Set(selected.filter(v=>Number.isInteger(v)&&v>=0&&v<25))];
 const grid=Array.from({length:5},(_,row)=>Array.from({length:5},(_,col)=>{const n=row*5+col;return selected.includes(n)?"[●]":"[ ]";}).join(" ")).join("\n");
 const form=new ActionFormData().title("石器成形").body("5×5の打撃位置を選択してください。\n"+grid+"\n\n選択済み: "+selected.length+"/3\n同じ位置を再選択すると解除できます。");
 for(let i=0;i<25;i++)form.button((selected.includes(i)?"§a● ":"§7○ ")+"位置 "+(i+1));
 let response;try{response=await form.show(player);}catch{return;}if(response.canceled||response.selection===undefined)return;
 const index=response.selection;if(selected.includes(index))selected=selected.filter(v=>v!==index);else if(selected.length<3)selected.push(index);
 if(selected.length<3){player.setDynamicProperty(PROGRESS_KEY,JSON.stringify(selected));player.sendMessage("§e打撃位置を記録しました。");return;}
 // Temporary prototype pattern; recipe-specific TFC knapping patterns remain a separate implementation task.
 const correct=[0,12,24].every(v=>selected.includes(v));player.setDynamicProperty(PROGRESS_KEY,"[]");
 if(!correct){player.sendMessage("§c形が合いません。");return;}
 if(take(player,"tfc:flint",1)){give(player,"tfc:stone_shard",2);player.sendMessage("§a石片を2個作成しました。");}else player.sendMessage("§c火打石がありません。");
}
function soilKey(block){return posKey(block,"soil");}
function readSoil(block){const saved=readWorldState(soilKey(block),{});let substrate;try{substrate=block.below()?.typeId;}catch{}return createSoilState({...saved,soilType:saved.soilType??inferSoilTypeFromBlockId(substrate)});}
function soilTick(block){const soil=readSoil(block);let nearbyWater=false;for(let x=-2;x<=2&&!nearbyWater;x++)for(let z=-2;z<=2;z++){try{const b=block.dimension.getBlock({x:block.location.x+x,y:block.location.y,z:block.location.z+z});if(b&&b.typeId==="minecraft:water"){nearbyWater=true;break;}}catch{}}const weather=WEATHER_BY_DIMENSION.get(normalizeDimensionId(block.dimension.id))??"clear";const rainfallMm=getRainfallMm(weather,0.8,soil.rainfallMultiplier);const next=advanceSoilHydration(soil,1/60,{rainfallMm,evaporationPerHour:nearbyWater?0.02:0.15,shadeFactor:0.7});if(nearbyWater)next.hydration=Math.min(100,next.hydration+0.5);writeWorldState(soilKey(block),next);}

function hasFreshWaterAdjacent(block){
 const l=block.location;
 for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)if(dx||dz){
  for(const dy of [0,-1,1]){
   try{const b=block.dimension.getBlock({x:l.x+dx,y:l.y+dy,z:l.z+dz});if(b&&(b.typeId==="minecraft:water"||b.typeId==="minecraft:flowing_water"))return true;}catch{}
  }
 }
 return false;
}
function hasCropSupport(block){
 const l=block.location;
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])for(const dy of [0,1]){
  try{if(block.dimension.getBlock({x:l.x+dx,y:l.y+dy,z:l.z+dz})?.typeId==="tfc:trellis")return true;}catch{}
 }
 return false;
}
async function farmlandInteract(player,block){if(!player||!block)return;const held=inv(player)?.getItem(player.selectedSlotIndex);const soil=readSoil(block);
const seedProfile=Object.values(CROP_PROFILES).find(profile=>profile.seed===held?.typeId);
if(seedProfile){const cropType=Object.keys(CROP_PROFILES).find(key=>CROP_PROFILES[key]===seedProfile);const top=block.above();if(!top?.isAir||(seedProfile.twoBlock&&!top.above()?.isAir)){player.sendMessage(seedProfile.twoBlock?"§cこの作物には2ブロック分の空間が必要です。":"§c耕作土の上に空間が必要です。");return;}if(seedProfile.requiresWater&&!hasFreshWaterAdjacent(block)){player.sendMessage("§cこの作物には近くの淡水が必要です。");return;}if(seedProfile.supportRequired&&!hasCropSupport(block)){player.sendMessage("§cこの作物には隣接する支柱（TFCトレリス）が必要です。");return;}if(take(player,seedProfile.seed,1)){writeWorldState(soilKey(block),soil);top.setType("tfc:crop");top.setPermutation(top.permutation.withState("tfc:crop_type",cropType).withState("tfc:part","lower"));writeWorldState(posKey(top,"crop_progress"),0);writeWorldState(posKey(top,"crop_quality"),1);writeWorldState(posKey(top,"crop_spread_parent"),null);writeWorldState(posKey(top,"crop_spread_used"),false);player.sendMessage("§a"+(({"tfc:grain":"小麦","tfc:maize":"トウモロコシ","tfc:potato":"ジャガイモ","tfc:barley":"大麦","tfc:oat":"オーツ麦","tfc:rye":"ライ麦","tfc:beet":"ビーツ","tfc:cabbage":"キャベツ","tfc:carrot":"ニンジン","tfc:garlic":"ニンニク","tfc:onion":"タマネギ","tfc:squash":"カボチャ","tfc:lentils":"レンズ豆","tfc:soybean":"大豆","tfc:peanuts":"落花生","tfc:rice":"米","tfc:cassava":"キャッサバ","tfc:green_beans":"インゲン","tfc:pumpkin":"カボチャ","tfc:melon":"メロン","tfc:tomato":"トマト","tfc:red_bell_pepper":"赤パプリカ","tfc:yellow_bell_pepper":"黄パプリカ","tfc:alfalfa":"アルファルファ","tfc:canola":"カノーラ","tfc:radish":"ラディッシュ","tfc:sugarcane":"サトウキビ","tfc:jute":"ジュート","tfc:papyrus":"パピルス"}[cropType]??"作物"))+"を植えました。");}return;}
const fertilizer=FERTILIZER_PROFILES[held?.typeId];if(fertilizer){if(take(player,held.typeId,1)){writeWorldState(soilKey(block),applyFertilizer(soil,fertilizer.nutrients));player.sendMessage("§a"+fertilizer.name+"を混ぜました。"+Object.entries(fertilizer.nutrients).map(([name,value])=>name+" +"+value).join(" / ")+"（土壌肥沃度補正後）");}return;}
const soilNames={loam:"壌土",silt:"シルト",clay:"粘土質"};const fertilityNames={entisol:"エンティソル",andisol:"アンドソル",fluvisol:"フルビソル",alfisol:"アルフィソル",mollisol:"モリソル",podzol:"ポドゾル",aridisol:"アリディソル",oxisol:"オキシソル"};const form=new ActionFormData().title("土壌状態").body("基質: "+(soilNames[soil.soilType]??soil.soilType)+"\n土壌肥沃度: "+(fertilityNames[soil.fertilityClass]??soil.fertilityClass)+"（肥料効果 ×"+({entisol:1,andisol:1.1,fluvisol:1.1,alfisol:1.1,mollisol:1.2,podzol:0.9,aridisol:0.9,oxisol:0.8}[soil.fertilityClass]??1).toFixed(1)+"）\n推定気温: "+temperatureAt(block.dimension,block.location).toFixed(1)+"°C\n水分: "+Math.floor(soil.hydration)+"%\n窒素: "+Math.floor(soil.nitrogen)+"\nリン: "+Math.floor(soil.phosphorus)+"\nカリウム: "+Math.floor(soil.potassium)+"\n\n骨粉・堆肥・木灰を持って操作すると、土壌肥沃度に応じた肥料効果が得られます。").button("閉じる");try{await form.show(player);}catch{}
}
function currentTemperatureC(elevationM=0,biomeId="minecraft:plains"){const profile=getBiomeClimateProfile(biomeId);return calculateAmbientTemperatureC({...profile,dayOfYear:((world.getDay()%96)+96)%96,timeOfDay:world.getTimeOfDay(),elevationM:Math.max(0,elevationM),diurnalAmplitudeC:3});}
function temperatureAt(dimension,location){let biomeId="minecraft:plains";try{biomeId=dimension.getBiome({x:Math.floor(location.x),y:Math.floor(location.y),z:Math.floor(location.z)}).id;}catch{}return currentTemperatureC(location.y-63,biomeId);}
function trySpreadFruit(block,profile){
 const fruitBlock=profile.fruitBlock;if(!fruitBlock)return;
 const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
 let existing=0;const candidates=[];
 for(const [dx,dz] of dirs){
  const location={x:block.location.x+dx,y:block.location.y,z:block.location.z+dz};
  const target=block.dimension.getBlock(location);
  if(target?.typeId===fruitBlock){existing++;continue;}
  const below=target?.below();
  const soilIds=["tfc:farmland","minecraft:farmland","minecraft:dirt","minecraft:grass_block","minecraft:coarse_dirt"];
  if(target?.isAir&&soilIds.includes(below?.typeId))candidates.push(target);
 }
 if(existing>=2||candidates.length===0||Math.random()>=0.2)return;
 candidates[Math.floor(Math.random()*candidates.length)].setType(fruitBlock);
}
function cropTick(block){
 if(block.permutation.getState("tfc:part")==="upper")return;
 const age=block.permutation.getState("tfc:age");
 if(typeof age!=="number")return;
 const cropType=block.permutation.getState("tfc:crop_type")??"wheat";
 const profile=CROP_PROFILES[cropType]??CROP_PROFILES.wheat;
 if(age>=3){if(profile.spreading)trySpreadFruit(block,profile);return;}
 if(profile.requiresWater&&!hasFreshWaterAdjacent(block.below()))return;
 if(profile.supportRequired&&!hasCropSupport(block.below()))return;
 if(profile.twoBlock&&age===1&&!block.above()?.isAir)return;
 let soil;try{soil=readSoil(block.below());}catch{return;}
 const evaluation=evaluateCropGrowth(profile,{temperatureC:temperatureAt(block.dimension,block.location)},soil);
 if(!evaluation.suitable)return;
 const qualityKey=posKey(block,"crop_quality");
 const previousQuality=Number(readWorldState(qualityKey,1));
 writeWorldState(qualityKey,Math.min(previousQuality,evaluation.nutrientFactor));
 const progressKey=posKey(block,"crop_progress");
 const growth=advanceCropGrowthProgress(Number(readWorldState(progressKey,0)),evaluation.growthMultiplier);
 soil.hydration=Math.max(0,soil.hydration-2*evaluation.growthMultiplier);
 soil=applyCropNutrientEffects(soil,profile.nutrientEffects,evaluation.growthMultiplier);
 writeWorldState(soilKey(block.below()),soil);
 writeWorldState(progressKey,growth.progress);
 if(growth.stageAdvanced){
  const nextAge=age+1;
  block.setPermutation(block.permutation.withState("tfc:age",nextAge));
  if(profile.twoBlock&&nextAge===2){
   const upper=block.above();
   if(upper?.isAir){upper.setType("tfc:crop");upper.setPermutation(upper.permutation.withState("tfc:crop_type",cropType).withState("tfc:part","upper").withState("tfc:age",2));}
  }
  if(profile.spreading&&nextAge===3)trySpreadFruit(block,profile);
 }
}
function fireTick(block){const key=posKey(block,"fire");const state=advanceFire(readWorldState(key,{}),20);writeWorldState(key,state);}
function currentAnimalDay(){return world.getDay()+world.getTimeOfDay()/24000;}
function animalState(entity){const profile=ANIMAL_PROFILES[entity.typeId];try{const raw=entity.getDynamicProperty("tfc:animal_state");const base=typeof raw==="string"?JSON.parse(raw):{};const isBaby=entity.hasComponent("minecraft:is_baby");return initializeAnimalLifeStage({...base,species:profile?.speciesId??base.species??entity.typeId.replace(":","_")},{isBaby,adultAgeDays:profile?.adultAgeDays??null,maxUses:profile?.maxUses??Infinity,currentDay:currentAnimalDay()});}catch{return initializeAnimalLifeStage({species:profile?.speciesId??entity.typeId.replace(":","_")},{isBaby:false,adultAgeDays:profile?.adultAgeDays??null,maxUses:profile?.maxUses??Infinity,currentDay:currentAnimalDay()});}}
function saveAnimal(entity,state){try{entity.setDynamicProperty("tfc:animal_state",JSON.stringify(state));}catch(error){console.warn("[TFC-Bedrook] animal state save:",error);}}
function consumeDroppedAnimalFood(entity,profile,state){
 if(!profile.feedItems?.length||state.hunger<25)return state;
 try{
  const items=entity.dimension.getEntities({type:"minecraft:item",location:entity.location,maxDistance:1.5});
  for(const dropped of items){
   const stack=dropped.getComponent("minecraft:item")?.itemStack;
   if(!stack||stack.amount<1||!profile.feedItems.includes(stack.typeId))continue;
   if(stack.amount>1){
    try{entity.dimension.spawnItem(new ItemStack(stack.typeId,stack.amount-1),dropped.location);}catch(error){console.warn("[TFC-Bedrook] animal feed remainder restore failed:",error);continue;}
   }
   dropped.kill();
   return grazeAnimal(state,{hungerReduction:35,thirstReduction:3,currentDay:world.getDay()});
  }
 }catch(error){console.warn("[TFC-Bedrook] animal food pickup failed:",error);}
 return state;
}
function tickPredation(entity,profile,state,currentDay){
 if(!profile.predatorDiet?.length||state.hunger<55||state.dead)return state;
 if(state.lastHuntAt>=0&&currentDay-state.lastHuntAt<0.15)return state;
 try{
  for(const prey of entity.dimension.getEntities({location:entity.location,maxDistance:2.2})){
   if(prey.id===entity.id)continue;
   const preyProfile=ANIMAL_PROFILES[prey.typeId];if(!preyProfile)continue;
   const preyState=animalState(prey);
   const herd=Math.max(0,entity.dimension.getEntities({type:prey.typeId,location:prey.location,maxDistance:5}).length-1);
   const result=evaluatePredation(state,preyState,{predatorDiet:profile.predatorDiet,preySpecies:preyProfile.speciesId??preyState.species,herdDefense:Math.min(0.6,herd*0.12)});
   if(!result.eligible||Math.random()>result.successChance)continue;
   const hp=prey.getComponent("minecraft:health");if(!hp)continue;
   hp.setCurrentValue(Math.max(0,hp.currentValue-(profile.predationDamage??5)));
   state.hunger=Math.max(0,state.hunger-28);state.lastHuntAt=currentDay;break;
  }
 }catch(error){console.warn("[TFC-Bedrook] fauna predation failed:",error);}
 return state;
}
function animalTick(entity){
 const profile=ANIMAL_PROFILES[entity.typeId];if(!profile)return;
 let state=animalState(entity);
  try{const health=entity.getComponent("minecraft:health");if(health)state=syncAnimalHealth(state,health.currentValue,health.effectiveMax);}catch{}
  const currentDay=currentAnimalDay(),lastAgeUpdateAt=state.lastAgeUpdateAt>=0?state.lastAgeUpdateAt:currentDay,elapsedAgeDays=Math.max(0,currentDay-lastAgeUpdateAt);
 state.lastAgeUpdateAt=currentDay;
 state=advanceAnimalNeeds(state,0.05,{hungerPerDay:profile.hungerPerDay??8,thirstPerDay:profile.thirstPerDay??(profile.kind==="aquatic"?0:12),healthLossPerDay:profile.healthLossPerDay??2,ageElapsedDays:elapsedAgeDays});
 state=advanceAnimalFamiliarityDecay(state,currentDay,{decayLimit:30,decayPerDay:2});
 if(profile.maxUses>0&&state.uses>profile.maxUses&&state.oldDay<0)state.oldDay=currentDay+1+Math.floor(Math.random()*5);
 if(state.oldDay>=0&&currentDay>state.oldDay&&!state.dead)state.lifeStage="old";
 state=advanceAnimalLifecycle(state,currentDay,{adultAgeDays:profile.adultAgeDays??null,elapsedDays:elapsedAgeDays,oldAgeHealthLossPerDay:profile.oldAgeHealthLossPerDay??0.15});
 if(state.dead){saveAnimal(entity,state);try{const hp=entity.getComponent("minecraft:health");if(hp)hp.setCurrentValue(0);}catch{}return;}
 state=consumeDroppedAnimalFood(entity,profile,state);
 state=tickPredation(entity,profile,state,currentDay);
 if(profile.eggProduct&&state.sex==="female"&&currentDay>state.eggFertilizedUntil){try{const mates=entity.dimension.getEntities({type:entity.typeId,location:entity.location,maxDistance:6});if(mates.some(m=>m.id!==entity.id&&animalState(m).sex==="male")){state.eggFertilized=true;state.eggFertilizedUntil=currentDay+4;}}catch{}}
 try{
  const base={x:Math.floor(entity.location.x),y:Math.floor(entity.location.y),z:Math.floor(entity.location.z)};
  let waterNearby=false;const forageCandidates=[];
  for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++){
   for(const y of [base.y,base.y-1]){
    const b=entity.dimension.getBlock({x:base.x+x,y,z:base.z+z});if(!b)continue;
    if(b.typeId==="minecraft:water"||b.typeId==="minecraft:flowing_water")waterNearby=true;
    if(profile.grazeBlocks.includes(b.typeId))forageCandidates.push(b);
   }
  }
  if(waterNearby)state=waterAnimal(state,1.5);
  // Grazing is a real resource interaction: only hungry animals consume one nearby forage block.
  if(state.hunger>=25&&forageCandidates.length){
   const forage=forageCandidates[Math.floor(Math.random()*forageCandidates.length)];
   try{
    if(forage.typeId==="minecraft:grass_block")forage.setType("minecraft:dirt");
    else if(forage.typeId==="minecraft:tallgrass"||forage.typeId==="minecraft:short_grass"||forage.typeId==="minecraft:tall_grass")forage.setType("minecraft:air");
    state=grazeAnimal(state,{hungerReduction:15,currentDay:world.getDay()});
   }catch(error){console.warn("[TFC-Bedrook] animal grazing failed:",error);}
  }
 }catch{}
 try{const hp=entity.getComponent("minecraft:health");if(hp)hp.setCurrentValue(Math.max(0,hp.effectiveMax*state.health/100));}catch{}
 if(profile.customBreeding&&state.pregnancyDays>0){const result=advancePregnancy(state,elapsedAgeDays,profile.gestationDays);state=result.animal;if(result.birthReady){if(state.birthsRemaining===0){state.birthsRemaining=Math.max(1,Math.floor(profile.childCount??1));saveAnimal(entity,state);}while(state.birthsRemaining>0){try{const offset=Math.max(0,Math.floor(profile.childCount??1))-state.birthsRemaining;const baby=entity.dimension.spawnEntity(entity.typeId+"<tfc:spawn_baby>",{x:entity.location.x+1+(offset%2)*0.8,y:entity.location.y,z:entity.location.z+Math.floor(offset/2)*0.8});state.birthsRemaining-=1;saveAnimal(entity,state);saveAnimal(baby,createAnimalOffspringState(state,profile.speciesId,Math.random()<0.5?"male":"female"));}catch(error){console.warn("[TFC-Bedrook] animal birth deferred:",error);break;}}if(state.birthsRemaining===0){state.pregnancyDays=0;state.fertilized=false;}}}\n if(entity.typeId==="tfc:deer"&&state.lifeStage==="juvenile"&&state.ageDays>=profile.adultAgeDays){try{entity.triggerEvent("tfc:grow_up");state.lifeStage="adult";}catch(error){console.warn("[TFC-Bedrook] deer growth event failed:",error);}}
 if(state.sex==="unknown")state.sex=Math.random()<0.5?"male":"female";
 const breedingDay=world.getDay(),breedingTime=currentAnimalDay();
 if(profile.customBreeding&&state.sex==="female"&&state.ageDays>=profile.adultAgeDays&&state.familiarity>=profile.requiredFamiliarity&&state.lastFedDay>=breedingDay&&state.pregnancyDays<=0&&!state.fertilized){
  try{const nearby=entity.dimension.getEntities({type:entity.typeId,location:entity.location,maxDistance:6});for(const partner of nearby){if(partner.id===entity.id)continue;const other=animalState(partner),breedingProfile={...profile,currentDay:breedingDay,currentTime:breedingTime};if(canBreed(state,other,breedingProfile)){const started=beginPregnancy(state,other,breedingProfile);if(started.started){state=started.animal;other.lastBreedAt=breedingTime;other.lastFedDay=breedingDay-1;other.uses=(other.uses??0)+5;if(profile.maxUses>0&&other.uses>profile.maxUses&&other.oldDay<0)other.oldDay=breedingTime+1+Math.floor(Math.random()*5);saveAnimal(partner,other);break;}}}}catch{}
 }
 saveAnimal(entity,state);
}
function eggNestTemperature(block){
 let biome="plains";try{biome=block.dimension.getBiome(block.location).id;}catch{}
 const climate=getBiomeClimateProfile(biome),day=world.getDay()%96;
 let temperature=calculateAmbientTemperatureC({meanAnnualTempC:climate.meanAnnualTempC,seasonalAmplitudeC:climate.seasonalAmplitudeC,dayOfYear:day,timeOfDay:world.getTimeOfDay(),elevationM:block.location.y});
 try{for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){const b=block.dimension.getBlock({x:block.location.x+x,y:block.location.y+y,z:block.location.z+z});if(["tfc:firepit","minecraft:campfire","minecraft:soul_campfire","minecraft:fire"].includes(b?.typeId))temperature+=18;}}catch{}
 return temperature;
}
function eggNestInteract(player,block){
 if(!player||!block)return;
 const key=posKey(block,"egg_nest"),stored=readWorldState(key,{egg:null});
 const stack=inv(player)?.getItem(player.selectedSlotIndex),valid=["tfc:chicken_egg","tfc:duck_egg","tfc:quail_egg"];
 if(!stack||!valid.includes(stack.typeId)){player.sendMessage(stored?.egg?("§e孵化進捗: "+Math.floor(stored.egg.incubationDays/stored.egg.requiredDays*100)+"% / 生存率: "+Math.floor(stored.egg.viability)+"%"):"§eニワトリ・アヒル・ウズラの卵を手に持って巣を操作してください。");return;}
 if(stored?.egg){player.sendMessage("§eこの巣にはすでに卵があります。");return;}
 const species=stack.typeId.split(":")[1].replace("_egg","");if(!take(player,stack.typeId,1))return;
 const fertilized=Boolean(stack.getDynamicProperty("tfc:egg_fertilized"));
 writeWorldState(key,{egg:createEggState({species,fertilized,requiredDays:8,temperatureC:eggNestTemperature(block)}),lastDay:currentAnimalDay()});
 player.sendMessage(fertilized?"§a有精卵を巣に置きました。火の近くで温めてください。":"§e無精卵を巣に置きました。孵化しません。");
}
function eggNestTick(block){
 const key=posKey(block,"egg_nest"),stored=readWorldState(key,{egg:null});if(!stored?.egg)return;
 const day=currentAnimalDay(),elapsed=Math.max(0,day-(stored.lastDay??day));
 const egg=createEggState({...stored.egg,temperatureC:eggNestTemperature(block)});
 const result=advanceEggIncubation(egg,elapsed,{minimumTemperatureC:32,maximumTemperatureC:40,viabilityLossPerDay:8});
 if(result.ready){
  try{
   const type=egg.species==="chicken"?"minecraft:chicken":"tfc:"+egg.species;
   const child=block.dimension.spawnEntity(type,{x:block.location.x+0.5,y:block.location.y+1,z:block.location.z+0.5});
   try{child.triggerEvent(type.startsWith("tfc:")?"tfc:spawn_baby":"minecraft:entity_born");}catch{}
   saveAnimal(child,createAnimalOffspringState({familiarity:0},egg.species,Math.random()<0.5?"male":"female"));
   writeWorldState(key,{egg:null,lastDay:day});
  }catch(error){console.warn("[TFC-Bedrook] egg hatching deferred:",error);writeWorldState(key,{egg:result.egg,lastDay:day});}
 }else writeWorldState(key,{egg:result.egg,lastDay:day});
}
function damageSelectedTool(player){
 const container=inv(player),slot=player.selectedSlotIndex,stack=container?.getItem(slot);
 if(stack?.typeId!=="minecraft:shears")return false;
 try{
  const durability=stack.getComponent("minecraft:durability");
  if(!durability)return false;
  durability.damage+=1;
  container.setItem(slot,durability.damage>=durability.maxDurability?undefined:stack);
  return true;
 }catch(error){console.warn("[TFC-Bedrook] tool durability update failed:",error);return false;}
}
function shearAnimal(player,entity){
 if(!player||!entity)return;
 const profile=ANIMAL_PROFILES[entity.typeId];if(!profile||(!profile.wooly&&entity.typeId!=="minecraft:sheep"))return;
 const state=animalState(entity),currentDay=currentAnimalDay(),minimumFamiliarity=profile.productFamiliarityMin??16,cooldown=profile.productCooldownDays??7;
 if(state.lifeStage==="old"||state.uses>=(profile.maxUses??Infinity)){player.sendMessage("§eこのヒツジは生涯の羊毛産出上限に達しています。");return;}
 if(state.ageDays<(profile.adultAgeDays??0)){player.sendMessage("§eこのヒツジはまだ成熟していません。");return;}
 if(state.familiarity<=minimumFamiliarity){player.sendMessage("§e羊毛を採取するには、なつき度を"+(minimumFamiliarity+1)+"以上にしてください。");return;}
 const remaining=cooldown-(currentDay-state.lastProductAt);
 if(state.uses>0&&remaining>0){player.sendMessage("§e羊毛が再生するまであと"+remaining.toFixed(1)+"日です。");return;}
 if(!canProduce(state,{requiredFamiliarity:minimumFamiliarity,cooldownDays:cooldown,currentDay,minimumAgeDays:profile.adultAgeDays??0,minimumHealth:0,maximumHunger:100,maximumThirst:100,maxUses:profile.maxUses??Infinity})){player.sendMessage("§e今は羊毛を採取できません。");return;}
 if(!damageSelectedTool(player)){player.sendMessage("§cハサミを使用できません。");return;}
 const amount=state.familiarity>99?2:1;
 give(player,"tfc:wool",amount);
 saveAnimal(entity,recordProduct(state,currentDay,{maxUses:profile.maxUses??Infinity,oldDayDelay:1+Math.floor(Math.random()*5)}));
 player.sendMessage("§a羊毛を"+amount+"個採取しました。");
}
async function animalInteract(player,entity){
 if(!player||!entity)return;
 const profile=ANIMAL_PROFILES[entity.typeId];if(!profile)return;
 let state=animalState(entity);
 if(state.sex==="unknown"){state.sex=Math.random()<0.5?"male":"female";saveAnimal(entity,state);}
 const held=inv(player)?.getItem(player.selectedSlotIndex);
 if(profile.eggProduct&&player.isSneaking&&!held){
  const day=currentAnimalDay(),minimum=profile.productFamiliarityMin??15,cooldown=profile.productCooldownDays??1.25;
  if(state.sex!=="female"||state.ageDays<(profile.adultAgeDays??0)||state.lifeStage==="old"||state.uses>=(profile.maxUses??Infinity)){player.sendMessage("§eこの鳥は卵を産める状態ではありません。");return;}
  if(state.familiarity<=minimum||state.health<40||state.hunger>60||state.thirst>60||(state.uses>0&&day-state.lastProductAt<cooldown)){player.sendMessage("§e成熟度・なつき度・健康状態・産卵間隔を確認してください。");return;}
  const egg=new ItemStack("tfc:"+profile.speciesId+"_egg",1);
  try{egg.setDynamicProperties({"tfc:egg_fertilized":Boolean(state.eggFertilized&&day<=state.eggFertilizedUntil)});}catch{}
  const rest=inv(player)?.addItem(egg);if(rest)player.dimension.spawnItem(rest,player.location);
  state=recordProduct(state,day,{maxUses:profile.maxUses??Infinity,oldDayDelay:1+Math.floor(Math.random()*5)});
  state.eggFertilized=false;saveAnimal(entity,state);player.sendMessage("§a卵を採取しました。巣に置いて温めると孵化します。");return;
 }
 if(!held){
  const names=Object.fromEntries(Object.entries(ANIMAL_PROFILES).map(([id,p])=>[id,p.displayName]));
  const products=profile.dairy?(entity.typeId==="minecraft:goat"?"\n産出: 山羊乳（メスの成体・健康/空腹/渇き条件を満たすと空き瓶で採取、1日間隔）":"\n産出: 牛乳（メスの成体・健康/空腹/渇き条件を満たすと空き瓶で採取、1日間隔）"):entity.typeId==="minecraft:sheep"?"\n産出: 羊毛（TFC式のハサミ操作、7日間隔）\n再生待ち: "+(state.uses>0?Math.max(0,profile.productCooldownDays-(currentAnimalDay()-state.lastProductAt)).toFixed(1)+"日":"なし"):entity.typeId==="minecraft:chicken"?"\n産出: 卵（バニラの産卵AI）":"";
  const usesInfo=profile.productCooldownDays!=null?"\n産出回数: "+state.uses+"/"+profile.maxUses+(state.lifeStage==="old"?"（老齢）":state.oldDay>=0?"（老齢化予定: "+state.oldDay+"日）":""):"";\n  const status="性別: "+(state.sex==="female"?"メス":"オス")+"\n年齢: "+state.ageDays.toFixed(1)+"日 / 成熟目安: "+(profile.adultAgeDays==null?"未設定":profile.adultAgeDays+"日")+"\n空腹: "+Math.floor(state.hunger)+" / 100\n渇き: "+Math.floor(state.thirst)+" / 100\n健康: "+Math.floor(state.health)+" / 100\nなつき度: "+Math.floor(state.familiarity)+" / 100"+usesInfo+(state.pregnancyDays>0?"\n妊娠: "+Math.floor(state.pregnancyDays)+"日":"")+products;
  const feedHint=profile.feedItems.length?"給餌可能: "+profile.feedItems.map(id=>ITEM_LABELS[id]??id).join(" / ")+"\n餌を手に持ってもう一度操作してください。":"この種への手動給餌は未対応です。";
  const form=new ActionFormData().title((names[entity.typeId]??entity.typeId)+"の状態").body(status+"\n\n"+feedHint).button("閉じる");
  try{await form.show(player);}catch(error){player.sendMessage("§e状態を表示できませんでした。");}
  return;
 }
 if(profile.dairy&&held.typeId==="minecraft:glass_bottle"){
  if(state.sex!=="female"){player.sendMessage("§e乳を生産できるのはメスの乳畜だけです。");return;}
  if(entity.hasComponent("minecraft:is_baby")||(profile.adultAgeDays!=null&&state.ageDays<profile.adultAgeDays)){player.sendMessage("§eこの動物はまだ成長中です。");return;}
  const currentDay=currentAnimalDay(),minimumFamiliarity=profile.productFamiliarityMin??0,cooldown=profile.productCooldownDays??1;
  if(state.lifeStage==="old"||state.uses>=(profile.maxUses??Infinity)){player.sendMessage("§eこの乳畜は生涯の乳産出上限に達しています。");return;}
  if(state.familiarity<=minimumFamiliarity){player.sendMessage("§e乳を採取するには、なつき度を"+(minimumFamiliarity+1)+"以上にしてください。");return;}
  const remaining=cooldown-(currentDay-state.lastProductAt);
  if(state.uses>0&&remaining>0){player.sendMessage("§e次回の乳採取まであと"+remaining.toFixed(1)+"日です。");return;}
  if(state.health<40||state.hunger>60||state.thirst>60){player.sendMessage("§e乳畜の健康・空腹・渇きを回復させてください。");return;}
  if(!canProduce(state,{requiredFamiliarity:minimumFamiliarity,cooldownDays:cooldown,currentDay,requiredSex:"female",minimumAgeDays:profile.adultAgeDays,minimumHealth:40,maximumHunger:60,maximumThirst:60,maxUses:profile.maxUses??Infinity})){player.sendMessage("§e今は乳を採取できません。");return;}
  if(!take(player,"minecraft:glass_bottle",1)){player.sendMessage("§c空き瓶を取り出せません。");return;}
  give(player,"tfc:milk_bottle",1);
  saveAnimal(entity,recordProduct(state,currentDay,{maxUses:profile.maxUses??Infinity,oldDayDelay:1+Math.floor(Math.random()*5)}));
  player.sendMessage("§a乳を採取しました。");
  return;
 }
 if(held.typeId==="tfc:water_vessel"){
  if(profile.kind==="aquatic"){player.sendMessage("§e水生動物に土器の水を与える必要はありません。");return;}
  if(state.thirst<=0){player.sendMessage("§eこの動物は今、水を必要としていません。");return;}
  if(!take(player,"tfc:water_vessel",1)){player.sendMessage("§c水入り土器を取り出せませんでした。");return;}
  give(player,"tfc:fired_vessel",1);
  state=waterAnimal(state,40);saveAnimal(entity,state);
  player.sendMessage("§b水を与えました。渇き: "+Math.floor(state.thirst)+"/100");
  return;
 }
 if(!profile.feedItems.includes(held.typeId))return;
 const currentDay=world.getDay(),firstFeedToday=canFeedAnimal(state,currentDay);
 // Native Bedrock livestock consumes feed before the after-event callback; custom deer is handled entirely here.
 if(!entity.typeId.startsWith("minecraft:")&&!firstFeedToday){player.sendMessage("§eこの動物には今日はもう餌を与えています。");return;}
 if(!entity.typeId.startsWith("minecraft:")&&!take(player,held.typeId,1))return;
 let healPercent=0;try{const hp=entity.getComponent("minecraft:health");if(hp&&hp.effectiveMax>0)healPercent=100/hp.effectiveMax;}catch{}
 state=feedAnimal(state,firstFeedToday?6:0,healPercent,{currentDay,adultFamiliarityCap:profile.familiarityCap??100});saveAnimal(entity,state);
 player.sendMessage("§a餌を与えました。なつき度: "+Math.floor(state.familiarity));
}

export function initializeGameplay(){
 loadTrackedFoodContainers();world.afterEvents.weatherChange.subscribe(event=>{const key=normalizeDimensionId(event.dimension?.id);if(key)WEATHER_BY_DIMENSION.set(key,normalizeWeather(event.newWeather));});
 world.afterEvents.playerBreakBlock.subscribe(event=>{
 const brokenId=event.brokenBlockPermutation?.type?.id,player=event.player;if(!player)return;
 try{
  if(brokenId==="tfc:firepit")player.dimension.spawnItem(new ItemStack("tfc:wood_ash",1),event.block.location);
  if(brokenId==="tfc:pumpkin_fruit")player.dimension.spawnItem(new ItemStack("tfc:pumpkin",1),event.block.location);
  if(brokenId==="tfc:melon_fruit")player.dimension.spawnItem(new ItemStack("tfc:melon",1),event.block.location);
  if(brokenId==="tfc:crop"){
   const cropType=event.brokenBlockPermutation?.getState("tfc:crop_type"),profile=CROP_PROFILES[cropType];
   if(profile?.twoBlock){const part=event.brokenBlockPermutation.getState("tfc:part")??"lower";const otherLocation={x:event.block.location.x,y:event.block.location.y+(part==="upper"?-1:1),z:event.block.location.z};const other=player.dimension.getBlock(otherLocation);if(other?.typeId==="tfc:crop"&&other.permutation.getState("tfc:crop_type")===cropType)other.setType("minecraft:air");}
  }
  const seeds=WILD_SEED_DROPS[brokenId];
  if(seeds&&Math.random()<0.12){const seed=seeds[Math.floor(Math.random()*seeds.length)];player.dimension.spawnItem(new ItemStack(seed,1),event.block.location);player.sendMessage("§a野生の種を見つけました: "+seed);}
 }catch(error){console.warn("[TFC-Bedrook] block-break drops failed:",error);}
});system.beforeEvents.startup.subscribe(event=>{
event.itemComponentRegistry.registerCustomComponent("tfc:open_knapping",{onUse:a=>{if(a.source?.typeId==="minecraft:player")void knap(a.source);}});
event.itemComponentRegistry.registerCustomComponent("tfc:prospect",{onUseOn:a=>{if(a.source?.typeId==="minecraft:player")prospect(a.source,a.block);}});
event.itemComponentRegistry.registerCustomComponent("tfc:clay_seal",{onUseOn:a=>{const player=a.source,block=a.block;if(player?.typeId!=="minecraft:player"||!block)return;const container=getBlockInventoryContainer(block);if(!container){player.sendMessage("§cこのブロックは食品を保存できる容器ではありません。");return;}const key=posKey(block,"container_sealed"),sealed=readWorldState(key,false)===true;tickFoodContainerFreshness(container,block.dimension,block.location,system.currentTick,{sealed});if(!writeWorldState(key,!sealed)){player.sendMessage("§c封印状態を保存できませんでした。");return;}trackFoodContainer(block);const nextSealed=!sealed;const title=nextSealed?"食品容器を封印しました":"食品容器を開封しました";const body=(nextSealed?"封印中は食品の腐敗速度が通常の50%になります。":"開封中は通常速度で腐敗します。")+"\n\n"+foodContainerSummary(container);const form=new ActionFormData().title(title).body(body).button("閉じる");void form.show(player).catch(()=>player.sendMessage(title+"\n"+body));}});
event.itemComponentRegistry.registerCustomComponent("tfc:consume_food",{onConsume:(a,p)=>food(a,p.params??{})}});
event.itemComponentRegistry.registerCustomComponent("tfc:fill_water_vessel",{onUseOn:a=>{if(a.source?.typeId==="minecraft:player")fillWaterVessel(a.source,a.block);}});
event.itemComponentRegistry.registerCustomComponent("tfc:drink_water",{onUse:a=>{if(a.source?.typeId==="minecraft:player")drinkWaterVessel(a.source);}});
event.itemComponentRegistry.registerCustomComponent("tfc:mix_dough",{onUse:a=>{if(a.source?.typeId==="minecraft:player")mixDough(a.source);}});
event.blockComponentRegistry.registerCustomComponent("tfc:station_ui",{onPlayerInteract:a=>{if(a.player)void station(a.player,a.block.typeId.split(":")[1],a.block);}});event.blockComponentRegistry.registerCustomComponent("tfc:heated_station_tick",{onTick:a=>fireTick(a.block)});
event.blockComponentRegistry.registerCustomComponent("tfc:egg_nest",{onPlayerInteract:a=>eggNestInteract(a.player,a.block),onTick:a=>eggNestTick(a.block)});
event.blockComponentRegistry.registerCustomComponent("tfc:farmland_interaction",{onPlayerInteract:a=>void farmlandInteract(a.player,a.block),onTick:a=>soilTick(a.block)});
event.blockComponentRegistry.registerCustomComponent("tfc:crop_growth",{onTick:a=>cropTick(a.block),onPlayerInteract:a=>{const p=a.player,clicked=a.block;if(!p||!clicked)return;const b=clicked.permutation.getState("tfc:part")==="upper"?clicked.below():clicked;if(!b||b.typeId!=="tfc:crop")return;if(b.permutation.getState("tfc:part")==="upper")return;const cropType=b.permutation.getState("tfc:crop_type")??"wheat";const profile=CROP_PROFILES[cropType]??CROP_PROFILES.wheat;const age=b.permutation.getState("tfc:age");const quality=Number(readWorldState(posKey(b,"crop_quality"),1));if(profile.pickable){if(typeof age!=="number"||age<2){p.sendMessage("§e収穫できる状態まで成長していません。");return;}const yieldCount=calculateCropYield(1,quality);give(p,profile.harvest,yieldCount);b.setPermutation(b.permutation.withState("tfc:age",1));writeWorldState(posKey(b,"crop_progress"),0);writeWorldState(posKey(b,"crop_quality"),1);p.sendMessage("§a実を収穫しました。株は残り、再び成長します。");return;}if(profile.spreading){p.sendMessage("§e実は周囲の果実ブロックに実っています。果実ブロックを壊して収穫してください。");return;}if(age!==3){p.sendMessage("§e成長中: "+Math.floor(Number(readWorldState(posKey(b,"crop_progress"),0)))+"%");return;}const yieldCount=calculateCropYield(cropType==="potato"?2:3,quality);give(p,profile.harvest,yieldCount);give(p,profile.seed,1);if(profile.twoBlock){const upper=b.above();if(upper?.typeId==="tfc:crop"&&upper.permutation.getState("tfc:part")==="upper")upper.setType("minecraft:air");}b.setPermutation(b.permutation.withState("tfc:age",0));writeWorldState(posKey(b,"crop_progress"),0);writeWorldState(posKey(b,"crop_quality"),1);if(profile.spreading)writeWorldState(posKey(b,"crop_spread_used"),false);p.sendMessage("§a収穫しました。収穫量補正: "+Math.floor(quality*100)+"% / "+yieldCount+"個");}});
system.runInterval(()=>{for(const dimensionId of ["overworld","nether","the_end"]){try{const dimension=world.getDimension(dimensionId);for(const type of Object.keys(ANIMAL_PROFILES))for(const entity of dimension.getEntities({type}))animalTick(entity);}catch(error){}}},1200);
system.runInterval(()=>{for(const player of world.getAllPlayers()){try{tickFoodFreshness(player,system.currentTick);}catch(error){console.warn("[TFC-Bedrook] food freshness tick failed:",error);}}},1200);
system.runInterval(()=>{try{tickTrackedFoodContainers(system.currentTick);}catch(error){console.warn("[TFC-Bedrook] tracked food container tick failed:",error);}},1200);
system.runInterval(()=>{for(const player of world.getAllPlayers()){try{tickMetalHeat(player,system.currentTick);}catch(error){console.warn("[TFC-Bedrook] metal heat tick failed:",error);}}},20);
});
world.afterEvents.itemUse.subscribe(event=>{
 const player=event.source,stack=event.itemStack;
 if(player?.typeId==="minecraft:player"&&player.isSneaking&&stack?.typeId==="minecraft:clay_ball")void shapePottery(player);
});
world.beforeEvents.playerInteractWithEntity.subscribe(event=>{
 const target=event.target;
 if((target?.typeId!=="minecraft:sheep"&&!ANIMAL_PROFILES[target?.typeId]?.wooly)||event.itemStack?.typeId!=="minecraft:shears")return;
 event.cancel=true;
 const player=event.player,slot=player.selectedSlotIndex;
 system.run(()=>{if(player.selectedSlotIndex===slot)shearAnimal(player,target);});
});
world.afterEvents.playerInteractWithEntity.subscribe(event=>{if(ANIMAL_PROFILES[event.target?.typeId])animalInteract(event.player,event.target);});




world.afterEvents.playerInteractWithBlock.subscribe(event=>{
 if(!event.isFirstEvent)return;
 trackFoodContainer(event.block);
 const held=event.beforeItemStack??event.itemStack;
 const sealKey=posKey(event.block,"container_sealed");
 if(readWorldState(sealKey,false)===true&&held?.typeId!=="tfc:clay_seal"){const container=getBlockInventoryContainer(event.block);tickFoodContainerFreshness(container,event.block.dimension,event.block.location,system.currentTick,{sealed:true});writeWorldState(sealKey,false);event.player?.sendMessage("§e容器を開いたため封印が解除されました。");}
 if(!held?.typeId?.endsWith("_hoe"))return;
 const block=event.block;
 if(!["minecraft:dirt","minecraft:grass_block","minecraft:coarse_dirt","minecraft:rooted_dirt","minecraft:farmland"].includes(block.typeId))return;
 try{const originalSoilType=inferSoilTypeFromBlockId(block.typeId);const biomeId=block.dimension.getBiome(block.location).id;const fertilityClass=inferSoilFertilityClassFromBiomeId(biomeId);const rainfallMultiplier=inferBiomeRainfallMultiplierFromBiomeId(biomeId);block.setType("tfc:farmland");const soil=createSoilState({...readSoil(block),soilType:originalSoilType,fertilityClass,rainfallMultiplier});writeWorldState(soilKey(block),soil);event.player.sendMessage("§a耕作土を作りました。土質: "+({loam:"壌土",silt:"シルト",clay:"粘土質"}[soil.soilType]??soil.soilType)+"。種を持って操作すると植えられます。");}catch(error){console.warn("[TFC-Bedrook] farmland conversion failed:",error);}
});world.afterEvents.playerSpawn.subscribe(event=>{if(event.player)recoverPlayerStationJobs(event.player);});
}
