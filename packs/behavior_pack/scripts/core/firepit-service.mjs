const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
export const FIRE_DEFAULTS=Object.freeze({coolingPerSecond:8,heatingPerSecond:18,ambientTemperatureC:20});
export function createFireState(input={}){return{temperatureC:clamp(finite(input.temperatureC,FIRE_DEFAULTS.ambientTemperatureC),0,1600),burnTicks:Math.max(0,Math.floor(finite(input.burnTicks))),fuelTemperatureC:Math.max(0,finite(input.fuelTemperatureC)),fuelId:input.fuelId??null,lit:!!input.lit};}
export function addFuel(input,fuel){const s=createFireState(input);if(!fuel||!Number.isInteger(fuel.duration)||fuel.duration<=0||!Number.isFinite(fuel.temperatureC)||fuel.temperatureC<=0)throw new TypeError("Valid fuel profile required");return{...s,burnTicks:s.burnTicks+fuel.duration,fuelTemperatureC:Math.max(s.fuelTemperatureC,fuel.temperatureC),fuelId:fuel.id??s.fuelId,lit:true};}
export function advanceFire(input,elapsedTicks=20,{ticksPerSecond=20,heatingPerSecond=FIRE_DEFAULTS.heatingPerSecond,coolingPerSecond=FIRE_DEFAULTS.coolingPerSecond,ambientTemperatureC=FIRE_DEFAULTS.ambientTemperatureC}={}){
 const s=createFireState(input),ticks=Math.max(0,Math.floor(finite(elapsedTicks))),tps=Math.max(1,finite(ticksPerSecond,20));
 const burningTicks=Math.min(s.burnTicks,ticks),coolingTicks=ticks-burningTicks;
 if(burningTicks>0){const target=Math.max(ambientTemperatureC,s.fuelTemperatureC);s.temperatureC=Math.min(target,s.temperatureC+Math.max(0,heatingPerSecond)*(burningTicks/tps));s.burnTicks-=burningTicks;}
 if(coolingTicks>0){s.temperatureC=Math.max(ambientTemperatureC,s.temperatureC-Math.max(0,coolingPerSecond)*(coolingTicks/tps));}
 s.lit=s.burnTicks>0;
 if(s.burnTicks===0&&s.temperatureC<=ambientTemperatureC){s.fuelTemperatureC=0;s.fuelId=null;}
 return s;
}
export function canProcessAtTemperature(state,minimumC){return createFireState(state).temperatureC>=minimumC;}
