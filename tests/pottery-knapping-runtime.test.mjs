import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const runtime = readFileSync(new URL("../packs/behavior_pack/scripts/gameplay-runtime.js", import.meta.url), "utf8");

test("clay vessel knapping exposes a recipe-specific 5x5 pattern", () => {
  assert.match(runtime, /recipe==="clay_vessel"\?\[0,4,20,24\]:\[0,12,24\]/);
  assert.match(runtime, /粘土容器（粘土玉×4）/);
});

test("clay vessel knapping consumes four clay balls and creates an unfired vessel", () => {
  assert.match(runtime, /count\(player,"minecraft:clay_ball"\)<4/);
  assert.match(runtime, /take\(player,"minecraft:clay_ball",4\)/);
  assert.match(runtime, /give\(player,"tfc:clay_vessel",1\)/);
  assert.match(runtime, /Pit Kilnで焼成してください/);
});

test("knapping progress preserves recipe choice and selected positions", () => {
  assert.match(runtime, /JSON\.stringify\(\{recipe,selected\}\)/);
  assert.match(runtime, /成形するものを変更/);
});
