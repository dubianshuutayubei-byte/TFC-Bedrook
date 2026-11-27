/**
 * Metal and alloy validation for TFC-Bedrook.
 * Ratios are fractions of total input mass/units, not fixed recipes.
 * The source ranges are imported from TFC 3.2.26; Bedrock heat units are not
 * inferred from the source Specific Heat Capacity values.
 */
function finite(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}

export function validateMetalDatabase(database) {
  if (!database || !Array.isArray(database.metals)) throw new TypeError("database.metals is required");
  const ids = new Set();
  for (const metal of database.metals) {
    if (!metal.id || ids.has(metal.id)) throw new Error(`missing or duplicate metal id: ${metal.id}`);
    ids.add(metal.id);
    if (!Number.isInteger(metal.tier) || metal.tier < 0) throw new RangeError(`invalid tier: ${metal.id}`);
    if (finite(metal.meltTemperatureC, metal.id) < 0) throw new RangeError(`invalid melt temperature: ${metal.id}`);
    if (finite(metal.specificHeatCapacity, metal.id) <= 0) throw new RangeError(`invalid heat capacity: ${metal.id}`);
  }
  return { metalCount: ids.size };
}

export function validateAlloyDatabase(database, metalIds) {
  if (!database || !Array.isArray(database.recipes)) throw new TypeError("database.recipes is required");
  const recipeIds = new Set();
  for (const recipe of database.recipes) {
    if (!recipe.id || recipeIds.has(recipe.id)) throw new Error(`missing or duplicate alloy id: ${recipe.id}`);
    recipeIds.add(recipe.id);
    if (!metalIds.has(recipe.id)) throw new Error(`unknown alloy output: ${recipe.id}`);
    const entries = Object.entries(recipe.components ?? {});
    if (entries.length < 2) throw new Error(`alloy needs at least two components: ${recipe.id}`);
    for (const [component, range] of entries) {
      if (!metalIds.has(component)) throw new Error(`unknown component ${component} in ${recipe.id}`);
      if (!Array.isArray(range) || range.length !== 2) throw new Error(`invalid range for ${component}`);
      const min = finite(range[0], `${recipe.id}.${component}.min`);
      const max = finite(range[1], `${recipe.id}.${component}.max`);
      if (min < 0 || max > 1 || min > max) throw new RangeError(`invalid fraction range for ${recipe.id}.${component}`);
    }
  }
  return { alloyCount: recipeIds.size };
}

/**
 * Inputs: { metalId: positive amount }. A recipe matches only when every
 * declared component is within its inclusive range and no undeclared metal
 * is present. Returns all matches rather than silently selecting one.
 */
export function findMatchingAlloys(inputs, alloyDatabase) {
  if (!inputs || typeof inputs !== "object" || Array.isArray(inputs)) throw new TypeError("inputs must be an object");
  let total = 0;
  for (const [id, amount] of Object.entries(inputs)) {
    const n = finite(amount, `inputs.${id}`);
    if (n < 0) throw new RangeError(`inputs.${id} cannot be negative`);
    total += n;
  }
  if (total <= 0) return [];
  const active = Object.entries(inputs).filter(([, amount]) => amount > 0);
  return alloyDatabase.recipes.filter(recipe => {
    const components = recipe.components;
    if (active.some(([id]) => !Object.hasOwn(components, id))) return false;
    return Object.entries(components).every(([id, [min, max]]) => {
      const fraction = (inputs[id] ?? 0) / total;
      return fraction >= min - 1e-9 && fraction <= max + 1e-9;
    });
  }).map(recipe => recipe.id);
}

export function getMetalTier(metalDatabase, metalId) {
  const metal = metalDatabase.metals.find(entry => entry.id === metalId);
  return metal ? metal.tier : null;
}
