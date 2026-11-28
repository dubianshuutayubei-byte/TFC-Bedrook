const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const finiteOr=(v,f)=>Number.isFinite(Number(v))?Number(v):f;
export function createAnimalState(i={}){return{species:i.species??"unknown",sex:i.sex??"unknown",ageDays:Math.max(0,finiteOr(i.ageDays,0)),familiarity:clamp(finiteOr(i.familiarity,0),0,100),pregnancyDays:Math.max(0,finiteOr(i.pregnancyDays,0)),health:clamp(finiteOr(i.health,100),0,100),hunger:clamp(finiteOr(i.hunger,0),0,100),thirst:clamp(finiteOr(i.thirst,0),0,100),lastProductAt:Math.max(0,finiteOr(i.lastProductAt,0)),lastBreedAt:finiteOr(i.lastBreedAt,-1),lifeStage:i.lifeStage??"unknown",uses:Math.max(0,Math.floor(finiteOr(i.uses,0))),fertilized:Boolean(i.fertilized),lastFedDay:finiteOr(i.lastFedDay,-1),lastFamiliarityDecay:finiteOr(i.lastFamiliarityDecay,-1),oldDay:finiteOr(i.oldDay,-1),birthsRemaining:Math.max(0,Math.floor(finiteOr(i.birthsRemaining,0))),lastAgeUpdateAt:finiteOr(i.lastAgeUpdateAt,-1)};}
export function initializeAnimalLifeStage(input={}, {isBaby=false,adultAgeDays=null,maxUses=Infinity,currentDay=null}={}){const hasSavedAge=input.ageDays!==undefined&&input.ageDays!==null&&Number.isFinite(Number(input.ageDays));const state=createAnimalState(input);const maturity=Number(adultAgeDays);const hasMaturity=Number.isFinite(maturity)&&maturity>=0;if(!hasSavedAge){state.ageDays=isBaby?0:(hasMaturity?maturity:0);state.lifeStage=isBaby?"juvenile":"adult";}else if(input.lifeStage==="juvenile"){if(hasMaturity){if(state.ageDays>=maturity)state.lifeStage="adult";}else if(!isBaby)state.lifeStage="adult";}else if(input.lifeStage==="unknown"||input.lifeStage==null){state.lifeStage=isBaby?"juvenile":"adult";if(!isBaby&&state.ageDays===0&&hasMaturity)state.ageDays=maturity;}if(currentDay!==null&&currentDay!==undefined&&Number.isFinite(Number(currentDay))){if(state.lastAgeUpdateAt<0)state.lastAgeUpdateAt=Number(currentDay);if(state.lastBreedAt<0)state.lastBreedAt=Number(currentDay);}if(state.oldDay>=0&&currentDay!==null&&currentDay!==undefined&&Number(currentDay)>state.oldDay)state.lifeStage="old";return state;}
const FOREST_RANK={none:0,sparse:1,edge:2,normal:3,old_growth:4};
export function evaluateHabitat(p,e){
 const failures=[],missing=[];
 const check=(profileKey,environmentKey,condition,fail)=>{if(p[profileKey]===undefined||p[profileKey]===null)return;if(e[environmentKey]===undefined||e[environmentKey]===null){missing.push(environmentKey);return;}if(condition(e[environmentKey]))failures.push(fail);};
 check("minTemperatureC","temperatureC",v=>v<p.minTemperatureC,"temperature_low");
 check("maxTemperatureC","temperatureC",v=>v>p.maxTemperatureC,"temperature_high");
 check("minRainfall","rainfall",v=>v<p.minRainfall,"rainfall_low");
 check("maxRainfall","rainfall",v=>v>p.maxRainfall,"rainfall_high");
 check("belowSeaLevel","belowSeaLevel",v=>v<p.belowSeaLevel,"water_too_shallow");
 check("maxBrightness","brightness",v=>v>p.maxBrightness,"brightness_high");
 if(p.minForest!=null||p.maxForest!=null){
  if(e.forestType==null)missing.push("forestType");
  else{
   const rank=FOREST_RANK[e.forestType];
   if(rank===undefined)missing.push("forestType");
   else{
    if(p.minForest!=null&&rank<FOREST_RANK[p.minForest])failures.push("forest_below_minimum");
    if(p.maxForest!=null&&rank>FOREST_RANK[p.maxForest])failures.push("forest_above_maximum");
   }
  }
 }
 if(p.waterType&&p.waterType!==e.waterType)failures.push("waterType");
 if(p.terrain&&!p.terrain.includes(e.terrain))failures.push("terrain");
 return{suitable:failures.length===0&&missing.length===0,failures,missing};
}
export function canFeedAnimal(i,currentDay){const a=createAnimalState(i),day=Number(currentDay);return Number.isFinite(day)&&a.lastFedDay<day;}
export function feedAnimal(i,g=6,h=0,{currentDay=null,adultFamiliarityCap=100}={}){const a=createAnimalState(i);const cap=a.lifeStage==="juvenile"?100:clamp(finiteOr(adultFamiliarityCap,100),0,100);if(a.lifeStage==="juvenile"||a.familiarity<cap)a.familiarity=clamp(a.familiarity+Math.max(0,finiteOr(g,0)),0,cap);a.health=clamp(a.health+Math.max(0,finiteOr(h,0)),0,100);a.hunger=clamp(a.hunger-35,0,100);a.thirst=clamp(a.thirst-5,0,100);if(currentDay!==null&&currentDay!==undefined&&Number.isFinite(Number(currentDay))){a.lastFedDay=Number(currentDay);a.lastFamiliarityDecay=Number(currentDay);}return a;}
export function waterAnimal(i,n=30){const a=createAnimalState(i);a.thirst=clamp(a.thirst-Math.max(0,finiteOr(n,0)),0,100);return a;}
export function createAnimalOffspringState(parent,species,sex="unknown"){const p=createAnimalState(parent);const familiarity=p.familiarity<90?p.familiarity/2:p.familiarity*0.9;return createAnimalState({species,sex,ageDays:0,familiarity,health:100,hunger:0,thirst:0,lifeStage:"juvenile"});}
export function advanceAnimalAge(i,d){const a=createAnimalState(i);a.ageDays+=Math.max(0,finiteOr(d,0));return a;}
export function advanceAnimalNeeds(i,d,{hungerPerDay=8,thirstPerDay=12,healthLossPerDay=2,ageElapsedDays=null}={}){const a=createAnimalState(i),days=Math.max(0,finiteOr(d,0)),ageDays=ageElapsedDays===null?days:Math.max(0,finiteOr(ageElapsedDays,0));a.ageDays+=ageDays;a.hunger=clamp(a.hunger+days*hungerPerDay,0,100);a.thirst=clamp(a.thirst+days*thirstPerDay,0,100);const stress=Math.max(0,a.hunger-75)+Math.max(0,a.thirst-75);a.health=clamp(a.health-days*healthLossPerDay*(stress/50),0,100);return a;}
export function canBreed(x,y,p={}){const a=createAnimalState(x),b=createAnimalState(y),adult=finiteOr(p.adultAgeDays,0),f=finiteOr(p.requiredFamiliarity,30),cool=finiteOr(p.breedingCooldownDays,1),currentDay=finiteOr(p.currentDay,0),currentTime=finiteOr(p.currentTime,currentDay);return a.species===b.species&&a.lifeStage==="adult"&&b.lifeStage==="adult"&&((a.sex==="male"&&b.sex==="female")||(a.sex==="female"&&b.sex==="male"))&&a.ageDays>=adult&&b.ageDays>=adult&&a.health>0&&b.health>0&&a.hunger<70&&b.hunger<70&&a.thirst<70&&b.thirst<70&&a.familiarity>=f&&b.familiarity>=f&&a.lastFedDay>=currentDay&&b.lastFedDay>=currentDay&&!a.fertilized&&!b.fertilized&&a.pregnancyDays<=0&&b.pregnancyDays<=0&&a.lastBreedAt>=0&&b.lastBreedAt>=0&&currentTime-a.lastBreedAt>=cool&&currentTime-b.lastBreedAt>=cool;}
export function beginPregnancy(i,p,profile={}){const currentDay=finiteOr(profile.currentDay,0),currentTime=finiteOr(profile.currentTime,currentDay);if(!canBreed(i,p,{...profile,currentDay,currentTime}))return{started:false,animal:createAnimalState(i),reason:"breeding_requirements_not_met"};const a=createAnimalState(i);a.pregnancyDays=.001;a.fertilized=true;a.lastBreedAt=currentTime;a.lastFedDay=currentDay-1;return{started:true,animal:a};}
export function advancePregnancy(i,d,g){const a=createAnimalState(i);if(a.pregnancyDays<=0)return{animal:a,birthReady:false,progress:0};const duration=finiteOr(g,0);if(duration<=0)throw new RangeError("gestationDays must be positive");a.pregnancyDays+=Math.max(0,finiteOr(d,0));return{animal:a,birthReady:a.pregnancyDays>=duration,progress:clamp(a.pregnancyDays/duration,0,1)};}
export function canProduce(i,{requiredFamiliarity=0,cooldownDays=0,currentDay=0,minimumAgeDays=0,requiredSex,minimumHealth=0,maximumHunger=100,maximumThirst=100,maxUses=Infinity}={}){const a=createAnimalState(i);return a.lifeStage!=="old"&&!(a.oldDay>=0&&currentDay>a.oldDay)&&a.health>=minimumHealth&&a.ageDays>=minimumAgeDays&&a.familiarity>requiredFamiliarity&&(requiredSex===undefined||a.sex===requiredSex)&&a.hunger<=maximumHunger&&a.thirst<=maximumThirst&&currentDay>=a.lastProductAt&&currentDay-a.lastProductAt>=cooldownDays;}
export function recordProduct(i,d,{maxUses=Infinity,oldDayDelay=null}={}){const a=createAnimalState(i);a.lastProductAt=Math.max(a.lastProductAt,finiteOr(d,a.lastProductAt));a.uses+=1;if(Number.isFinite(maxUses)&&maxUses>0&&a.uses>maxUses&&a.oldDay<0&&oldDayDelay!==null)a.oldDay=finiteOr(d,0)+Math.max(1,finiteOr(oldDayDelay,1));return a;}

export function grazeAnimal(input,{hungerReduction=2,thirstReduction=0,currentDay=null}={}){const a=createAnimalState(input);a.hunger=clamp(a.hunger-Math.max(0,finiteOr(hungerReduction,0)),0,100);a.thirst=clamp(a.thirst-Math.max(0,finiteOr(thirstReduction,0)),0,100);if(currentDay!==null&&currentDay!==undefined&&Number.isFinite(Number(currentDay))){a.lastFedDay=Number(currentDay);a.lastFamiliarityDecay=Number(currentDay);}return a;}

export function syncAnimalHealth(input,currentHealth,effectiveMax){
  const animal=createAnimalState(input);
  const current=Number(currentHealth),maximum=Number(effectiveMax);
  if(!Number.isFinite(current)||!Number.isFinite(maximum)||maximum<=0)return animal;
  animal.health=clamp((current/maximum)*100,0,100);
  return animal;
}

/**
 * Mirrors the official TFC v3.2.26 fauna spawn-condition order.
 * The caller must supply sampled environment values; unavailable measurements
 * are reported as missing and never silently treated as suitable.
 */
export function evaluateFaunaSpawn(profile, environment, random = Math.random) {
  if (!profile || !environment) throw new TypeError("profile and environment are required");
  if (typeof random !== "function") throw new TypeError("random must be a function");
  const failures = [];
  const missing = [];
  const chance = profile.chance ?? 1;
  if (!Number.isInteger(chance) || chance < 1) throw new RangeError("profile.chance must be a positive integer");
  const roll = Number(random());
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw new RangeError("random must return a number in [0, 1)");
  if (roll >= 1 / chance) failures.push("chance");

  const placement = profile.placement ?? "on_ground";
  if (placement === "in_water" && environment.inWater !== true) failures.push("not_in_water");
  if (placement === "on_ground" && environment.onGround !== true) failures.push("not_on_ground");
  if (!["in_water", "on_ground", "no_restrictions"].includes(placement)) {
    throw new RangeError("unsupported fauna spawn placement: " + placement);
  }

  if (profile.distanceBelowSeaLevel != null && profile.distanceBelowSeaLevel >= 0) {
    if (environment.y == null || environment.seaLevel == null) missing.push("y", "seaLevel");
    else if (environment.y > environment.seaLevel - profile.distanceBelowSeaLevel) failures.push("too_high_above_depth_limit");
  }

  const climate = evaluateHabitat(profile, environment);
  failures.push(...climate.failures);
  missing.push(...climate.missing);

  // Match TFC ClimatePlacement's fuzzy probability roll after hard climate bounds pass.
  if (profile.fuzzy === true && failures.length === 0 && missing.length === 0) {
    const minTemp = profile.minTemperatureC ?? -Infinity;
    const maxTemp = profile.maxTemperatureC ?? Infinity;
    const minRainfall = profile.minRainfall ?? -Infinity;
    const maxRainfall = profile.maxRainfall ?? Infinity;
    const targetTemp = (minTemp + maxTemp) / 2;
    const targetRainfall = (minRainfall + maxRainfall) / 2;
    const normTempDelta = Math.abs(environment.temperatureC - targetTemp) / (maxTemp - minTemp);
    const normRainfallDelta = Math.abs(environment.rainfall - targetRainfall) / (maxRainfall - minRainfall);
    const fuzzyRoll = Number(random()) * Number(random());
    if (!(fuzzyRoll > Math.max(normTempDelta, normRainfallDelta))) failures.push("fuzzy_climate");
  }

  if (profile.solidGround === true) {
    if (environment.validSpawnGround == null) missing.push("validSpawnGround");
    else if (environment.validSpawnGround !== true) failures.push("invalid_spawn_ground");
  }

  if (profile.maxBrightness != null && profile.maxBrightness >= 0) {
    if (environment.brightness == null) missing.push("brightness");
    else if (environment.brightness > profile.maxBrightness) failures.push("brightness_high");
  }

  return {
    suitable: failures.length === 0 && missing.length === 0,
    failures: [...new Set(failures)],
    missing: [...new Set(missing)],
    chance,
    roll
  };
}

/** TFC default familiarity decay: 0.02 per day below the 0.30 threshold, after a one-day grace period. */
export function advanceAnimalFamiliarityDecay(input,currentDay,{decayLimit=30,decayPerDay=2}={}){
 const a=createAnimalState(input),day=Number(currentDay);
 if(!Number.isFinite(day))throw new TypeError("currentDay must be finite");
 if(a.lastFamiliarityDecay<0){a.lastFamiliarityDecay=day;return a;}
 if(a.familiarity>0&&a.familiarity<decayLimit&&a.lastFamiliarityDecay+1<day){
  a.familiarity=clamp(a.familiarity-Math.max(0,decayPerDay)*(day-a.lastFamiliarityDecay),0,100);
  a.lastFamiliarityDecay=day;
 }
 return a;
}
