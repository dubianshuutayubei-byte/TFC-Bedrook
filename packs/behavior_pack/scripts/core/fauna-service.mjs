const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const finiteOr=(v,f)=>Number.isFinite(Number(v))?Number(v):f;
export function createAnimalState(i={}){return{species:i.species??"unknown",sex:i.sex??"unknown",ageDays:Math.max(0,finiteOr(i.ageDays,0)),familiarity:clamp(finiteOr(i.familiarity,0),0,100),pregnancyDays:Math.max(0,finiteOr(i.pregnancyDays,0)),health:clamp(finiteOr(i.health,100),0,100),hunger:clamp(finiteOr(i.hunger,0),0,100),thirst:clamp(finiteOr(i.thirst,0),0,100),lastProductAt:Math.max(0,finiteOr(i.lastProductAt,0)),lastBreedAt:Math.max(0,finiteOr(i.lastBreedAt,0))};}
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
export function feedAnimal(i,g=5,h=0){const a=createAnimalState(i);a.familiarity=clamp(a.familiarity+Math.max(0,finiteOr(g,0)),0,100);a.health=clamp(a.health+Math.max(0,finiteOr(h,0)),0,100);a.hunger=clamp(a.hunger-35,0,100);a.thirst=clamp(a.thirst-5,0,100);return a;}
export function waterAnimal(i,n=30){const a=createAnimalState(i);a.thirst=clamp(a.thirst-Math.max(0,finiteOr(n,0)),0,100);return a;}
export function advanceAnimalAge(i,d){const a=createAnimalState(i);a.ageDays+=Math.max(0,finiteOr(d,0));return a;}
export function advanceAnimalNeeds(i,d,{hungerPerDay=8,thirstPerDay=12,healthLossPerDay=2}={}){const a=createAnimalState(i),days=Math.max(0,finiteOr(d,0));a.ageDays+=days;a.hunger=clamp(a.hunger+days*hungerPerDay,0,100);a.thirst=clamp(a.thirst+days*thirstPerDay,0,100);const stress=Math.max(0,a.hunger-75)+Math.max(0,a.thirst-75);a.health=clamp(a.health-days*healthLossPerDay*(stress/50),0,100);return a;}
export function canBreed(x,y,p){const a=createAnimalState(x),b=createAnimalState(y),adult=finiteOr(p.adultAgeDays,0),f=finiteOr(p.requiredFamiliarity,0),cool=finiteOr(p.breedingCooldownDays,0);return a.species===b.species&&((a.sex==="male"&&b.sex==="female")||(a.sex==="female"&&b.sex==="male"))&&a.ageDays>=adult&&b.ageDays>=adult&&a.health>0&&b.health>0&&a.hunger<70&&b.hunger<70&&a.thirst<70&&b.thirst<70&&a.familiarity>=f&&b.familiarity>=f&&a.pregnancyDays===0&&b.pregnancyDays===0&&a.ageDays-a.lastBreedAt>=cool&&b.ageDays-b.lastBreedAt>=cool;}
export function beginPregnancy(i,p,profile){if(!canBreed(i,p,profile))return{started:false,animal:createAnimalState(i),reason:"breeding_requirements_not_met"};const a=createAnimalState(i);a.pregnancyDays=.001;a.lastBreedAt=a.ageDays;return{started:true,animal:a};}
export function advancePregnancy(i,d,g){const a=createAnimalState(i);if(a.pregnancyDays<=0)return{animal:a,birthReady:false,progress:0};const duration=finiteOr(g,0);if(duration<=0)throw new RangeError("gestationDays must be positive");a.pregnancyDays+=Math.max(0,finiteOr(d,0));return{animal:a,birthReady:a.pregnancyDays>=duration,progress:clamp(a.pregnancyDays/duration,0,1)};}
export function canProduce(i,{requiredFamiliarity=0,cooldownDays=0,currentDay=0,minimumAgeDays=0,requiredSex,minimumHealth=0,maximumHunger=100,maximumThirst=100}={}){const a=createAnimalState(i);return a.health>=minimumHealth&&a.ageDays>=minimumAgeDays&&a.familiarity>=requiredFamiliarity&&(requiredSex===undefined||a.sex===requiredSex)&&a.hunger<=maximumHunger&&a.thirst<=maximumThirst&&currentDay>=a.lastProductAt&&currentDay-a.lastProductAt>=cooldownDays;}
export function recordProduct(i,d){const a=createAnimalState(i);a.lastProductAt=Math.max(a.lastProductAt,finiteOr(d,a.lastProductAt));return a;}

export function grazeAnimal(input,{hungerReduction=2,thirstReduction=0}={}){const a=createAnimalState(input);a.hunger=clamp(a.hunger-Math.max(0,finiteOr(hungerReduction,0)),0,100);a.thirst=clamp(a.thirst-Math.max(0,finiteOr(thirstReduction,0)),0,100);return a;}

export function syncAnimalHealth(input,currentHealth,effectiveMax){
  const animal=createAnimalState(input);
  const current=Number(currentHealth),maximum=Number(effectiveMax);
  if(!Number.isFinite(current)||!Number.isFinite(maximum)||maximum<=0)return animal;
  animal.health=clamp((current/maximum)*100,0,100);
  return animal;
}
