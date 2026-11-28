const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function createFoodState(input = {}) {
  return {
    freshness: clamp(Number(input.freshness ?? 100), 0, 100),
    nutrition: { ...(input.nutrition ?? {}) },
    hydration: Number(input.hydration ?? 0),
    preservation: input.preservation ?? "none",
    cooked: Boolean(input.cooked),
    spoiled: Boolean(input.spoiled)
  };
}

const PRESERVATION_MULTIPLIERS = Object.freeze({ none: 1, cooked: 0.8, salted: 0.35, pickled: 0.25, sealed: 0.5 });

export function advanceFoodDecay(foodInput, elapsedHours, environment = {}) {
  const food = createFoodState(foodInput);
  if (food.spoiled) return food;
  const temperature = Math.max(-20, Number(environment.temperatureC ?? 20));
  const baseRate = Math.max(0, Number(environment.baseDecayPerHour ?? 0.1));
  const temperatureFactor = clamp(1 + (temperature - 20) * 0.025, 0.1, 3);
  const preservation = food.preservation === "none" && food.cooked ? "cooked" : food.preservation;
  const multiplier = PRESERVATION_MULTIPLIERS[preservation] ?? 1;
  food.freshness = clamp(food.freshness - Math.max(0, elapsedHours) * baseRate * temperatureFactor * multiplier, 0, 100);
  food.spoiled = food.freshness <= 0;
  return food;
}

export function preserveFood(foodInput, method) {
  if (!Object.hasOwn(PRESERVATION_MULTIPLIERS, method) || method === "none") throw new Error("Unsupported preservation method");
  const food = createFoodState(foodInput);
  food.preservation = method;
  return food;
}

export function consumeFood(playerState, foodInput) {
  const food = createFoodState(foodInput);
  if (food.spoiled) return { consumed: false, reason: "spoiled", playerState };
  const next = {
    ...playerState,
    nutrition: { ...(playerState.nutrition ?? {}) }
  };
  for (const [category, amount] of Object.entries(food.nutrition)) {
    if (category in next.nutrition) next.nutrition[category] = clamp(next.nutrition[category] + Number(amount || 0), 0, 100);
  }
  next.hydration = clamp(next.hydration + food.hydration, 0, 100);
  return { consumed: true, playerState: next };
}
