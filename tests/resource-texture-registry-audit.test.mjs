import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));

test("every declared custom item icon resolves in the item texture atlas", () => {
  const atlas = readJson("packs/resource_pack/textures/item_texture.json").texture_data;
  const folder = join(root, "packs/behavior_pack/items");
  const missing = [];
  for (const file of readdirSync(folder).filter((name) => name.endsWith(".json"))) {
    const item = JSON.parse(readFileSync(join(folder, file), "utf8"))["minecraft:item"];
    const icon = item.components?.["minecraft:icon"];
    const keys = typeof icon === "string" ? [icon] : [icon?.texture, ...(icon?.textures ?? [])].filter((x) => typeof x === "string");
    if (keys.length === 0) missing.push(file + ": no icon key");
    for (const key of keys) if (!atlas[key]) missing.push(file + ": missing texture key " + key);
  }
  assert.deepEqual(missing, []);
});

test("every custom block material texture resolves in the terrain texture atlas", () => {
  const atlas = readJson("packs/resource_pack/textures/terrain_texture.json").texture_data;
  const folder = join(root, "packs/behavior_pack/blocks");
  const missing = [];
  for (const file of readdirSync(folder).filter((name) => name.endsWith(".json"))) {
    const block = JSON.parse(readFileSync(join(folder, file), "utf8"))["minecraft:block"];
    const instances = block.components?.["minecraft:material_instances"] ?? {};
    for (const [face, material] of Object.entries(instances)) {
      if (typeof material.texture === "string" && !atlas[material.texture]) {
        missing.push(file + " [" + face + "]: missing texture key " + material.texture);
      }
    }
  }
  assert.deepEqual(missing, []);
});
