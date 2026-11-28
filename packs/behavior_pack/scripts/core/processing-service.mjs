export function validateRecipeDatabase(database) {
  if (!database || !Array.isArray(database.recipes)) throw new TypeError("recipes array is required");
  const ids = new Set();
  for (const recipe of database.recipes) {
    if (!recipe.id || ids.has(recipe.id)) throw new Error(`missing or duplicate recipe id: ${recipe.id}`);
    ids.add(recipe.id);
    if (!recipe.method || !recipe.stage) throw new Error(`recipe requires method and stage: ${recipe.id}`);
    for (const [id, amount] of Object.entries(recipe.inputs ?? {})) {
      if (!id || !Number.isFinite(amount) || amount <= 0) throw new Error(`invalid input in ${recipe.id}: ${id}`);
    }
    for (const [id, amount] of Object.entries(recipe.outputs ?? {})) {
      if (!id || !Number.isFinite(amount) || amount <= 0) throw new Error(`invalid output in ${recipe.id}: ${id}`);
    }
    if (recipe.durationSeconds != null && (!Number.isFinite(recipe.durationSeconds) || recipe.durationSeconds <= 0)) {
      throw new Error(`invalid duration in ${recipe.id}`);
    }
  }
  return { recipeCount: ids.size };
}

export function evaluateProcess(recipe, context = {}) {
  const failures = [];
  if (recipe.requiresUi && context.uiConfirmed !== true) failures.push("ui_confirmation_required");
  if (recipe.requiresHeat && context.heatAvailable !== true) failures.push("heat_required");
  if (recipe.requiresMold && context.moldAvailable !== true) failures.push("mold_required");
  if (recipe.minimumTemperatureC != null && Number(context.temperatureC ?? -Infinity) < recipe.minimumTemperatureC) failures.push("temperature_too_low");
  for (const [itemId, amount] of Object.entries(recipe.inputs ?? {})) {
    if (Number(context.inventory?.[itemId] ?? 0) < amount) failures.push(`missing_input:${itemId}`);
  }
  return { allowed: failures.length === 0, failures };
}

/**
 * Applies a completed recipe to an abstract inventory atomically.
 * No input is consumed if any requirement or output capacity check fails.
 */
export function executeProcess(recipe, context = {}) {
  const evaluation = evaluateProcess(recipe, context);
  if (!evaluation.allowed) return { executed: false, failures: evaluation.failures, inventory: { ...(context.inventory ?? {}) } };
  const inventory = { ...(context.inventory ?? {}) };
  for (const [itemId, amount] of Object.entries(recipe.inputs ?? {})) {
    inventory[itemId] = Number(inventory[itemId] ?? 0) - amount;
    if (inventory[itemId] === 0) delete inventory[itemId];
  }
  for (const [itemId, amount] of Object.entries(recipe.outputs ?? {})) {
    inventory[itemId] = Number(inventory[itemId] ?? 0) + amount;
  }
  return { executed: true, failures: [], inventory };
}

export function calculateProcessProgress(elapsedSeconds, durationSeconds) {
  if (!Number.isFinite(elapsedSeconds) || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new RangeError("elapsedSeconds and positive durationSeconds are required");
  }
  const progress = Math.max(0, Math.min(1, elapsedSeconds / durationSeconds));
  return { progress, complete: progress >= 1, remainingSeconds: Math.max(0, durationSeconds - elapsedSeconds) };
}
