import test from "node:test";
import assert from "node:assert/strict";
import { createNestBoxState, addNestBoxEgg, advanceNestBoxIncubation, takeHatchReadyEggs, takeNestBoxEgg } from "../packs/behavior_pack/scripts/core/nest-box-service.mjs";

test("nest box stores an egg with its fertility and species",()=>{
  const added=addNestBoxEgg({}, {id:"hen-egg-1",species:"chicken",laidAtDay:12,fertilized:true,hatchDays:8});
  assert.equal(added.added,true);
  assert.deepEqual(added.state.eggs[0],{id:"hen-egg-1",species:"chicken",laidAtDay:12,incubationDays:0,hatchDays:8,fertilized:true,hatchReady:false});
});

test("only fertilized eggs hatch after the configured incubation duration",()=>{
  let state=createNestBoxState({eggs:[
    {id:"fertilized",species:"chicken",fertilized:true,hatchDays:8},
    {id:"unfertilized",species:"chicken",fertilized:false,hatchDays:8}
  ]});
  state=advanceNestBoxIncubation(state,7.5);
  assert.equal(state.eggs[0].hatchReady,false);
  state=advanceNestBoxIncubation(state,0.5);
  const result=takeHatchReadyEggs(state);
  assert.deepEqual(result.hatched.map(egg=>egg.id),["fertilized"]);
  assert.deepEqual(result.state.eggs.map(egg=>egg.id),["unfertilized"]);
});

test("incubation never moves backwards and ready eggs are not advanced again",()=>{
  let state=addNestBoxEgg({}, {id:"egg",fertilized:true,hatchDays:8}).state;
  state=advanceNestBoxIncubation(state,9);
  state=advanceNestBoxIncubation(state,-4);
  assert.equal(state.eggs[0].incubationDays,8);
  assert.equal(state.eggs[0].hatchReady,true);
});

test("duplicate egg identifiers and invalid hatch durations are rejected",()=>{
  const first=addNestBoxEgg({}, {id:"same",fertilized:true});
  assert.equal(addNestBoxEgg(first.state,{id:"same",fertilized:true}).reason,"duplicate_egg_id");
  assert.equal(addNestBoxEgg({}, {id:"bad",hatchDays:0}).reason,"invalid_hatch_duration");
});

test("unfertilized eggs can be collected without changing other eggs",()=>{
  const state=createNestBoxState({eggs:[
    {id:"food",fertilized:false},
    {id:"future",fertilized:true}
  ]});
  const result=takeNestBoxEgg(state,"food");
  assert.equal(result.egg.id,"food");
  assert.deepEqual(result.state.eggs.map(egg=>egg.id),["future"]);
});
