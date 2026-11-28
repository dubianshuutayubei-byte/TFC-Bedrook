const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function createSoilState(input = {}) {
  return {
    hydration: clamp(Number(input.hydration ?? 50), 0, 100),
    nitrogen: clamp(Number(input.nitrogen ?? 50), 0, 100),
    phosphorus: clamp(Number(input.phosphorus ?? 50), 0, 100),
    potassium: clamp(Number(input.potassium ?? 50), 0, 100),
    soilType: input.soilType ?? "loam"
  };
}

export function evaluateCropGrowth(profile, environment, soilInput) {
  const soil = createSoilState(soilInput);
  const temperature = Number(environment.temperatureC ?? 15);
  const minT = Number(profile.minTemperatureC ?? -Infinity);
  const maxT = Number(profile.maxTemperatureC ?? Infinity);
  const minH = Number(profile.minHydration ?? 0);
  const maxH = Number(profile.maxHydration ?? 100);
  const preferred = profile.preferredNutrient ?? "nitrogen";
  const nutrient = soil[preferred] ?? 0;
  const failures = [];
  if (temperature < minT || temperature > maxT) failures.push("temperature");
  if (soil.hydration < minH || soil.hydration > maxH) failures.push("hydration");
  if (nutrient < Number(profile.minPreferredNutrient ?? 0)) failures.push(preferred);
  if (profile.soilTypes && !profile.soilTypes.includes(soil.soilType)) failures.push("soilType");

  const suitable = failures.length === 0;
  const temperatureFactor = temperature < minT || temperature > maxT ? 0 : 1;
  const hydrationFactor = soil.hydration < minH || soil.hydration > maxH ? 0 : 1;
  const nutrientFactor = clamp(nutrient / Math.max(1, Number(profile.optimalNutrient ?? 50)), 0, 1);
  const growthMultiplier = suitable ? 0.5 + 0.5 * nutrientFactor : 0;
  return { suitable, failures, growthMultiplier, soil };
}

export function applyNutrientUptake(soilInput, nutrient, amount) {
  const soil = createSoilState(soilInput);
  if (!["nitrogen", "phosphorus", "potassium"].includes(nutrient)) throw new Error("Invalid soil nutrient");
  soil[nutrient] = clamp(soil[nutrient] - Math.max(0, Number(amount) || 0), 0, 100);
  return soil;
}

export function applyFertilizer(soilInput, fertilizer) {
  const soil = createSoilState(soilInput);
  for (const nutrient of ["nitrogen", "phosphorus", "potassium"]) {
    soil[nutrient] = clamp(soil[nutrient] + Math.max(0, Number(fertilizer[nutrient] ?? 0)), 0, 100);
  }
  return soil;
}

export function advanceCropStage(stage, maxStage, growthPoints, threshold = 100) {
  const current = Math.max(0, Math.min(maxStage, Math.floor(stage)));
  const points = Math.max(0, Number(growthPoints) || 0);
  const gained = Math.floor(points / threshold);
  return { stage: Math.min(maxStage, current + gained), remainder: points % threshold, mature: current + gained >= maxStage };
}
