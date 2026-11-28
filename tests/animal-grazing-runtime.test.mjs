import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { grazeAnimal } from "../packs/behavior_pack/scripts/core/fauna-service.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("grazing reduces hunger without producing negative needs",()=>{
  const animal={species:"minecraft_cow",hunger:40,thirst:12};
  const next=grazeAnimal(animal,{hungerReduction:15});
  assert.equal(next.hunger,25);
  assert.equal(next.thirst,12);
  assert.equal(animal.hunger,40);
});

test("grazing clamps hunger at zero",()=>{
  const next=grazeAnimal({hunger:4},{hungerReduction:15});
  assert.equal(next.hunger,0);
});

test("runtime grazing consumes one nearby forage block only when hungry",()=>{
  assert.match(runtime,/if\(state\.hunger>=25&&forageCandidates\.length\)/);
  assert.match(runtime,/forage\.setType\("minecraft:dirt"\)/);
  assert.match(runtime,/forage\.setType\("minecraft:air"\)/);
  assert.match(runtime,/grazeAnimal\(state,\{hungerReduction:15\}\)/);
});
