import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const behaviorDir = join(root, "packs/behavior_pack/entities");
const clientDir = join(root, "packs/resource_pack/entity");
const modelDir = join(root, "packs/resource_pack/models/entity");
const runtimePath = join(root, "packs/behavior_pack/scripts/gameplay-runtime.js");

function jsonFiles(directory) {
  return readdirSync(directory).filter((name) => name.endsWith(".json"));
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sorted(values) {
  return [...values].sort();
}

test("every custom TFC fauna runtime profile has a behavior and client entity definition", () => {
  const runtime = readFileSync(runtimePath, "utf8");
  const start = runtime.indexOf("const ANIMAL_PROFILES={");
  const end = runtime.indexOf("\n};", start);
  assert.ok(start >= 0 && end > start, "ANIMAL_PROFILES declaration must exist");
  const profileSource = runtime.slice(start, end);
  const runtimeIds = [...profileSource.matchAll(/^\s*"(tfc:[^"]+)":\s*\{/gm)]
    .map((match) => match[1]);

  const behaviorIds = jsonFiles(behaviorDir).map((file) => {
    const entity = readJson(join(behaviorDir, file));
    assert.equal(entity["minecraft:entity"]?.description?.identifier, "tfc:" + file.replace(/\.json$/, ""));
    return entity["minecraft:entity"].description.identifier;
  });
  const clientIds = jsonFiles(clientDir).map((file) => {
    const entity = readJson(join(clientDir, file));
    const expected = "tfc:" + file.replace(/\.entity\.json$/, "");
    assert.equal(entity["minecraft:client_entity"]?.description?.identifier, expected);
    return entity["minecraft:client_entity"].description.identifier;
  });

  assert.deepEqual(sorted(runtimeIds), sorted(behaviorIds), "runtime custom species and BP entity definitions must match");
  assert.deepEqual(sorted(behaviorIds), sorted(clientIds), "BP and RP entity identifiers must match one-to-one");
});

test("every custom fauna client entity resolves to a model or an explicit vanilla geometry", () => {
  const modelIds = new Set();
  for (const file of jsonFiles(modelDir).filter((name) => name.endsWith(".geo.json"))) {
    const model = readJson(join(modelDir, file));
    for (const geometry of model["minecraft:geometry"] ?? []) {
      const id = geometry.description?.identifier;
      assert.ok(typeof id === "string" && id.length > 0, file + " geometry identifier");
      assert.equal(modelIds.has(id), false, "duplicate geometry identifier: " + id);
      modelIds.add(id);
    }
  }

  // The custom chicken deliberately reuses Bedrock's built-in chicken geometry and animation set.
  const vanillaGeometry = new Set(["geometry.chicken.v1.12"]);
  const usedModelIds = new Set();
  for (const file of jsonFiles(clientDir)) {
    const client = readJson(join(clientDir, file))["minecraft:client_entity"]?.description;
    assert.ok(client, file + " client entity description");
    const geometryId = client.geometry?.default;
    assert.ok(typeof geometryId === "string" && geometryId.length > 0, file + " geometry.default");
    assert.ok(modelIds.has(geometryId) || vanillaGeometry.has(geometryId),
      file + " references missing geometry " + geometryId);
    if (modelIds.has(geometryId)) usedModelIds.add(geometryId);
    assert.ok(typeof client.textures?.default === "string", file + " texture.default");
    assert.ok(Array.isArray(client.render_controllers) && client.render_controllers.length > 0,
      file + " must declare a render controller");
  }

  assert.deepEqual(sorted([...modelIds]), sorted([...usedModelIds]),
    "every custom geometry must be used by a client entity");
});
