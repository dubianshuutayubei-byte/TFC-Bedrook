import test from"node:test";import assert from"node:assert/strict";import{createFireState,addFuel,advanceFire,canProcessAtTemperature}from"../packs/behavior_pack/scripts/core/firepit-service.mjs";
test("fuel raises heat and burns down",()=>{let s=addFuel(createFireState(),{id:"oak",duration:100,temperatureC:700});s=advanceFire(s,40);assert.equal(s.burnTicks,60);assert.equal(s.temperatureC,56);assert.equal(s.lit,true);});
test("fire cools toward ambient after fuel expires",()=>{assert.equal(advanceFire({temperatureC:200},100).temperatureC,160);});
test("processing is gated by temperature",()=>{assert.equal(canProcessAtTemperature({temperatureC:650},600),true);assert.equal(canProcessAtTemperature({temperatureC:550},600),false);});

test("fuel expiry during a tick interval stops heating and then cools",()=>{
 const s=advanceFire({temperatureC:20,burnTicks:100,fuelTemperatureC:700,lit:true},120);
 assert.equal(s.burnTicks,0);
 assert.equal(s.temperatureC,102);
 assert.equal(s.lit,false);
});
