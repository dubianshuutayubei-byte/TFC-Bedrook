const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finiteOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

// Bedrock simulation runs at 20 ticks per second: 72,000 ticks = one hour.
export function ticksToHours(ticks) {
  const value = Number(ticks);
  return Number.isFinite(value) && value > 0 ? value / 72000 : 0;
}
const NUTRITION_CATEGORIES = Object.freeze(["grain", "fruit", "vegetables", "protein", "dairy"]);
const PRESERVATION_MULTIPLIERS = Object.freeze({ none: 1, cooked: 0.8, salted: 0.35, pickled: 0.25, sealed: 0.5 });

export function validateFoodDatabase(database) {
  if (!database || !Array.isArray(database.foods)) throw new TypeError("database.foods is required");
  const ids = new Set();
  for (const profile of database.foods) {
    if (!profile.id || ids.has(profile.id)) throw new Error(`missing or duplicate food id: ${profile.id}`);
    ids.add(profile.id);
    for (const [category, amount] of Object.entries(profile.nutrition ?? {})) {
      if (!NUTRITION_CATEGORIES.includes(category)) throw new Error(`unknown nutrition category in ${profile.id}: ${category}`);
      if (!Number.isFinite(amount) || amount < 0 || amount > 100) throw new RangeError(`invalid nutrition amount: ${profile.id}.${category}`);
    }
    if (!Number.isFinite(profile.hydration ?? 0) || profile.hydration < 0 || profile.hydration > 100) {
      throw new RangeError(`invalid hydration: ${profile.id}`);
    }
  }
  return { foodCount: ids.size };
}

export function createFoodState(input = {}) {
  const nutrition = {};
  for (const category of NUTRITION_CATEGORIES) {
    const amount = finiteOr(input.nutrition?.[category], 0);
    if (amount > 0) nutrition[category] = clamp(amount, 0, 100);
  }
  return {
    id: input.id ?? "unknown",
    freshness: clamp(finiteOr(input.freshness, 100), 0, 100),
    nutrition,
    hydration: clamp(finiteOr(input.hydration, 0), 0, 100),
    preservation: Object.hasOwn(PRESERVATION_MULTIPLIERS, input.preservation) ? input.preservation : "none",
    cooked: Boolean(input.cooked),
    spoiled: Boolean(input.spoiled) || finiteOr(input.freshness, 100) <= 0
  };
}

export function createFoodFromProfile(profile, overrides = {}) {
  if (!profile?.id) throw new TypeError("food profile with id is required");
  return createFoodState({ ...profile, ...overrides, id: profile.id,
    nutrition: { ...(profile.nutrition ?? {}), ...(overrides.nutrition ?? {}) } });
}

export function classifyFoodFreshness(foodInput) {
  const food = createFoodState(foodInput);
  if (food.spoiled) return "spoiled";
  if (food.freshness >= 75) return "fresh";
  if (food.freshness >= 40) return "aging";
  if (food.freshness > 0) return "near_spoilage";
  return "spoiled";
}

export function advanceFoodDecay(foodInput, elapsedHours, environment = {}) {
  const food = createFoodState(foodInput);
  if (food.spoiled) return food;
  const hours = Number(elapsedHours);
  if (!Number.isFinite(hours) || hours <= 0) return food;
  const temperature = clamp(finiteOr(environment.temperatureC, 20), -20, 60);
  const baseRate = Math.max(0, finiteOr(environment.baseDecayPerHour, 0.1));
  const temperatureFactor = clamp(1 + (temperature - 20) * 0.025, 0.1, 3);
  const preservation = food.preservation === "none" && food.cooked ? "cooked" : food.preservation;
  const multiplier = PRESERVATION_MULTIPLIERS[preservation];
  food.freshness = clamp(food.freshness - hours * baseRate * temperatureFactor * multiplier, 0, 100);
  food.spoiled = food.freshness <= 0;
  return food;
}

export function preserveFood(foodInput, method) {
  if (!Object.hasOwn(PRESERVATION_MULTIPLIERS, method) || method === "none") throw new Error("Unsupported preservation method");
  const food = createFoodState(foodInput);
  if (food.spoiled) throw new Error("Spoiled food cannot be preserved");
  food.preservation = method;
  return food;
}

export function consumeFood(playerState, foodInput) {
  const food = createFoodState(foodInput);
  if (food.spoiled || food.freshness <= 0) return { consumed: false, reason: "spoiled", playerState };
  const next = {
    ...playerState,
    nutrition: { ...(playerState.nutrition ?? {}) }
  };
  for (const category of NUTRITION_CATEGORIES) {
    const amount = food.nutrition[category] ?? 0;
    next.nutrition[category] = clamp(finiteOr(next.nutrition[category], 0) + amount, 0, 100);
  }
  next.hydration = clamp(finiteOr(next.hydration, 100) + food.hydration, 0, 100);
  return { consumed: true, playerState: next };
}
