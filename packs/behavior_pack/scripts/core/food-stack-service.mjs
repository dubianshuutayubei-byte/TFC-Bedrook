import { advanceFoodDecay, ticksToHours } from "./food-service.mjs";

const MARKER_PREFIX="§0TFCFRESH:";
const VISIBLE_PREFIX="鮮度: ";

export function readStackFreshness(lore=[]){
 const marker=(Array.isArray(lore)?lore:[]).find(line=>typeof line==="string"&&line.startsWith(MARKER_PREFIX));
 if(!marker)return{freshness:100,lastTick:undefined};
 const match=marker.slice(MARKER_PREFIX.length).match(/^(\d+(?:\.\d+)?):(\d+)$/);
 if(!match)return{freshness:100,lastTick:undefined};
 return{freshness:Math.min(100,Math.max(0,Number(match[1]))),lastTick:Math.max(0,Number(match[2]))};
}

export function writeStackFreshness(lore=[],freshness=100,lastTick=0){
 const base=(Array.isArray(lore)?lore:[]).filter(line=>typeof line==="string"&&!line.startsWith(MARKER_PREFIX)&&!line.startsWith(VISIBLE_PREFIX));
 return [...base, VISIBLE_PREFIX+Math.round(Math.min(100,Math.max(0,Number(freshness)||0)))+"%", MARKER_PREFIX+Math.min(100,Math.max(0,Number(freshness)||0))+":"+Math.max(0,Math.floor(Number(lastTick)||0))];
}

export function advanceStackFreshness(lore,nowTick,environment={}){
 const previous=readStackFreshness(lore);
 const tick=Math.max(0,Math.floor(Number(nowTick)||0));
 const elapsedTicks=previous.lastTick===undefined?0:Math.max(0,tick-previous.lastTick);
 const food=advanceFoodDecay({id:"stack_food",freshness:previous.freshness},ticksToHours(elapsedTicks),environment);
 return{food,lore:writeStackFreshness(lore,food.freshness,tick),elapsedTicks};
}
