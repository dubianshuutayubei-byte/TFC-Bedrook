import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { sampleRockLayers, validateGeologyData } from "../packs/behavior_pack/scripts/core/geology-service.mjs";

const data = JSON.parse(await readFile(
  new URL("../packs/behavior_pack/data/geology-layers.json", import.meta.url),
  "utf8",
));

test("official TFC v3.2.26 geology graph passes structural validation", () => {
  assert.deepEqual(validateGeologyData(data), []);
  assert.equal(data.rocks.length, 20);
});

test("all four geological region classes produce a valid rock sequence", () => {
  for (const region of ["ocean_floor", "volcanic", "land", "uplift"]) {
    const sequence = sampleRockLayers(data, region, 123456, 4);
    assert.equal(sequence.length, 4);
    for (const layer of sequence) {
      assert.ok(data.rocks.includes(layer.rock));
      assert.equal(layer.blockId, `tfc:${layer.rock}`);
    }
  }
});

test("same region and seed produce the same succession", () => {
  assert.deepEqual(
    sampleRockLayers(data, "land", 8675309, 8),
    sampleRockLayers(data, "land", 8675309, 8),
  );
});

test("different region classes are valid even when their sequences overlap", () => {
  for (const region of Object.keys(data.regions)) {
    assert.doesNotThrow(() => sampleRockLayers(data, region, 42, 3));
  }
});

test("invalid region and depth are rejected", () => {
  assert.throws(() => sampleRockLayers(data, "river", 1, 3), RangeError);
  assert.throws(() => sampleRockLayers(data, "land", 1, 0), RangeError);
});

test("broken layer references are reported", () => {
  const broken = structuredClone(data);
  broken.layers[0].layers.granite = "missing_layer";
  assert.ok(validateGeologyData(broken).some(message => message.includes("missing_layer")));
});
