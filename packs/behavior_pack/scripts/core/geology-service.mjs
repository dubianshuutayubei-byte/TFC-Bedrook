/**
 * TFC-Bedrook geology profile resolver.
 *
 * The layer graph and region roots are data-driven. Sampling uses a deterministic
 * Bedrock-side PRNG and is intentionally not bit-identical to TFC Java's
 * XoroshiroRandomSource. This resolves rock succession only; it does not create
 * terrain, assign layer thickness, or generate ore veins.
 */

function finite(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return value;
}

function makeRandom(seed) {
  let state = (Math.trunc(finite(seed, "seed")) >>> 0) || 0x6d2b79f5;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function pick(values, random) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new RangeError("cannot choose from an empty layer");
  }
  return values[Math.floor(random() * values.length)];
}

export function validateGeologyData(data) {
  const errors = [];
  if (!data || data.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!Array.isArray(data?.rocks) || data.rocks.length === 0) errors.push("rocks must be a non-empty array");
  if (!Array.isArray(data?.bottom) || data.bottom.length === 0) errors.push("bottom must be a non-empty array");
  if (!Array.isArray(data?.layers)) errors.push("layers must be an array");
  if (!data?.regions || typeof data.regions !== "object") errors.push("regions must be an object");
  if (errors.length) return errors;

  const rockSet = new Set(data.rocks);
  if (rockSet.size !== data.rocks.length) errors.push("duplicate rock IDs");
  for (const id of data.bottom) {
    if (!rockSet.has(id)) errors.push(`unknown bottom rock: ${id}`);
  }

  const layerMap = new Map();
  for (const layer of data.layers) {
    if (!layer?.id || !layer.layers || typeof layer.layers !== "object") {
      errors.push("each layer requires id and layers");
      continue;
    }
    if (layerMap.has(layer.id) || layer.id === "bottom") errors.push(`duplicate/reserved layer ID: ${layer.id}`);
    layerMap.set(layer.id, layer.layers);
  }

  for (const [layerId, entries] of [["bottom", Object.fromEntries(data.bottom.map(id => [id, "bottom"]))], ...layerMap]) {
    for (const [rockId, nextId] of Object.entries(entries)) {
      if (!rockSet.has(rockId)) errors.push(`unknown rock ${rockId} in layer ${layerId}`);
      if (typeof nextId !== "string" || (nextId !== "bottom" && !layerMap.has(nextId))) {
        errors.push(`unknown next layer ${nextId} from ${layerId}/${rockId}`);
      }
    }
  }

  for (const [region, roots] of Object.entries(data.regions)) {
    if (!Array.isArray(roots) || roots.length === 0) errors.push(`region ${region} must have root layers`);
    else for (const root of roots) {
      if (!layerMap.has(root)) errors.push(`unknown root layer ${root} in region ${region}`);
    }
  }
  return errors;
}

/**
 * Sample a deterministic rock succession for one geological column.
 * regionType: ocean_floor | volcanic | land | uplift
 * count: number of successive rock layers to sample (not block thickness).
 */
export function sampleRockLayers(data, regionType, seed, count = 3) {
  const errors = validateGeologyData(data);
  if (errors.length) throw new Error(`invalid geology data: ${errors.join("; ")}`);
  if (!Object.hasOwn(data.regions, regionType)) {
    throw new RangeError(`unknown geology region: ${regionType}`);
  }
  if (!Number.isInteger(count) || count < 1 || count > 64) {
    throw new RangeError("count must be an integer from 1 to 64");
  }

  const random = makeRandom(seed);
  const layerMap = new Map(data.layers.map(layer => [layer.id, layer.layers]));
  const sequence = [];
  let candidates = data.regions[regionType].flatMap(id =>
    Object.entries(layerMap.get(id)).map(([rock, next]) => ({ rock, next, sourceLayer: id }))
  );

  for (let depth = 0; depth < count; depth++) {
    const selected = pick(candidates, random);
    sequence.push({
      depth,
      rock: selected.rock,
      blockId: `${data.blockNamespace ?? "tfc"}:${selected.rock}`,
      sourceLayer: selected.sourceLayer,
    });
    const nextEntries = selected.next === "bottom"
      ? data.bottom.map(rock => [rock, "bottom"])
      : Object.entries(layerMap.get(selected.next));
    candidates = nextEntries.map(([rock, next]) => ({
      rock,
      next,
      sourceLayer: selected.next,
    }));
  }
  return sequence;
}
