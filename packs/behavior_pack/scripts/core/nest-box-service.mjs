const finiteOr=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;

export function createNestBoxState(input={}){
  const eggs=Array.isArray(input.eggs)?input.eggs.map((egg,index)=>({
    id:String(egg.id??`egg-${index+1}`),
    species:String(egg.species??"chicken"),
    laidAtDay:Math.max(0,finiteOr(egg.laidAtDay,0)),
    incubationDays:Math.max(0,finiteOr(egg.incubationDays,0)),
    hatchDays:Math.max(0.001,finiteOr(egg.hatchDays,8)),
    fertilized:Boolean(egg.fertilized),
    hatchReady:Boolean(egg.hatchReady)
  })): [];
  return {eggs};
}

/** Add one egg to a nest box. Fertilization is decided when the egg is laid. */
export function addNestBoxEgg(input,{id,species="chicken",laidAtDay=0,fertilized=false,hatchDays=8}={}){
  const state=createNestBoxState(input);
  const eggId=String(id??`egg-${Math.floor(Math.max(0,finiteOr(laidAtDay,0))*1000)}-${state.eggs.length+1}`);
  if(state.eggs.some(egg=>egg.id===eggId))return {state,added:false,reason:"duplicate_egg_id"};
  const duration=finiteOr(hatchDays,8);
  if(duration<=0)return {state,added:false,reason:"invalid_hatch_duration"};
  state.eggs.push({id:eggId,species:String(species),laidAtDay:Math.max(0,finiteOr(laidAtDay,0)),incubationDays:0,hatchDays:duration,fertilized:Boolean(fertilized),hatchReady:false});
  return {state,added:true};
}

/** Progress only fertilized eggs; unfertilized eggs remain collectible food. */
export function advanceNestBoxIncubation(input,elapsedDays){
  const state=createNestBoxState(input),elapsed=Math.max(0,finiteOr(elapsedDays,0));
  for(const egg of state.eggs){
    if(!egg.fertilized||egg.hatchReady)continue;
    egg.incubationDays=Math.min(egg.hatchDays,egg.incubationDays+elapsed);
    egg.hatchReady=egg.incubationDays>=egg.hatchDays;
  }
  return state;
}

/** Remove and return hatch-ready eggs so the caller can spawn the corresponding juvenile entities. */
export function takeHatchReadyEggs(input){
  const state=createNestBoxState(input),hatched=state.eggs.filter(egg=>egg.fertilized&&egg.hatchReady);
  state.eggs=state.eggs.filter(egg=>!egg.fertilized||!egg.hatchReady);
  return {state,hatched};
}

/** Remove one non-hatching egg for food collection. */
export function takeNestBoxEgg(input,eggId){
  const state=createNestBoxState(input),index=state.eggs.findIndex(egg=>egg.id===eggId);
  if(index<0)return {state,egg:null};
  const [egg]=state.eggs.splice(index,1);
  return {state,egg};
}
