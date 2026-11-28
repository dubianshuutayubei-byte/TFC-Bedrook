const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const finiteOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function createSoilState(input = {}) {
  return {
    hydration: clamp(finiteOr(input.hydration, 50), 0, 100),
    nitrogen: clamp(finiteOr(input.nitrogen, 50), 0, 100),
    phosphorus: clamp(finiteOr(input.phosphorus, 50), 0, 100),
    potassium: clamp(finiteOr(input.potassium, 50), 0, 100),
    soilType: input.soilType ?? "loam"
  };
}

export function evaluateCropGrowth(profile, environment, soilInput) {
  const soil = createSoilState(soilInput);
  const temperature = finiteOr(environment.temperatureC, 15);
  const minT = finiteOr(profile.minTemperatureC, -Infinity);
  const maxT = finiteOr(profile.maxTemperatureC, Infinity);
  const minH = finiteOr(profile.minHydration, 0);
  const maxH = finiteOr(profile.maxHydration, 100);
  const preferred = profile.preferredNutrient ?? "nitrogen";
  const nutrient = soil[preferred] ?? 0;
  const failures = [];
  if (temperature < minT || temperature > maxT) failures.push("temperature");
  if (soil.hydration < minH || soil.hydration > maxH) failures.push("hydration");
  if (nutrient < finiteOr(profile.minPreferredNutrient, 0)) failures.push(preferred);
  if (profile.soilTypes && !profile.soilTypes.includes(soil.soilType)) failures.push("soilType");

  const suitable = failures.length === 0;
  const nutrientFactor = clamp(nutrient / Math.max(1, finiteOr(profile.optimalNutrient, 50)), 0, 1);
  const hydrationMidpoint = (minH + maxH) / 2;
  const hydrationFactor = suitable ? clamp(1 - Math.abs(soil.hydration - hydrationMidpoint) / Math.max(1, maxH - minH), 0.5, 1) : 0;
  const growthMultiplier = suitable ? (0.5 + 0.5 * nutrientFactor) * hydrationFactor : 0;
  return { suitable, failures, growthMultiplier, soil };
}

export function advanceSoilHydration(soilInput, elapsedHours, {
  rainfallMm = 0, evaporationPerHour = 0.15, shadeFactor = 1
} = {}) {
  const soil = createSoilState(soilInput);
  const hours = Math.max(0, finiteOr(elapsedHours, 0));
  const rain = Math.max(0, finiteOr(rainfallMm, 0));
  const evaporation = Math.max(0, finiteOr(evaporationPerHour, 0));
  const shade = clamp(finiteOr(shadeFactor, 1), 0, 1.5);
  soil.hydration = clamp(soil.hydration + rain - hours * evaporation * shade, 0, 100);
  return soil;
}

export function applyNutrientUptake(soilInput, nutrient, amount) {
  const soil = createSoilState(soilInput);
  if (!["nitrogen", "phosphorus", "potassium"].includes(nutrient)) throw new Error("Invalid soil nutrient");
  soil[nutrient] = clamp(soil[nutrient] - Math.max(0, finiteOr(amount, 0)), 0, 100);
  return soil;
}

export function applyFertilizer(soilInput, fertilizer) {
  const soil = createSoilState(soilInput);
  for (const nutrient of ["nitrogen", "phosphorus", "potassium"]) {
    soil[nutrient] = clamp(soil[nutrient] + Math.max(0, finiteOr(fertilizer[nutrient], 0)), 0, 100);
  }
  return soil;
}

export function advanceCropStage(stage, maxStage, growthPoints, threshold = 100) {
  if (!Number.isFinite(threshold) || threshold <= 0) throw new RangeError("threshold must be positive");
  const current = clamp(Math.floor(finiteOr(stage, 0)), 0, Math.max(0, Math.floor(maxStage)));
  const points = Math.max(0, finiteOr(growthPoints, 0));
  const gained = Math.floor(points / threshold);
  return { stage: Math.min(maxStage, current + gained), remainder: points % threshold, mature: current + gained >= maxStage };
}

export function calculateCropGrowthPoints(profile, environment, soilInput, elapsedHours, basePointsPerHour = 1) {
  const hours = Math.max(0, finiteOr(elapsedHours, 0));
  const rate = Math.max(0, finiteOr(basePointsPerHour, 1));
  const evaluation = evaluateCropGrowth(profile, environment, soilInput);
  return { ...evaluation, growthPoints: hours * rate * evaluation.growthMultiplier };
}

export function advanceSoilDay(input,{rainfallMm=0,evaporation=2,nutrientLeaching=0.2}={}){const soil=createSoilState(input);soil.hydration=clamp(soil.hydration+Math.max(0,finiteOr(rainfallMm,0))-Math.max(0,finiteOr(evaporation,0)),0,100);for(const key of ["nitrogen","phosphorus","potassium"])soil[key]=clamp(soil[key]-Math.max(0,finiteOr(nutrientLeaching,0)),0,100);return soil;}
export function applySoilCompost(input,{nitrogen=15,phosphorus=8,potassium=12}={}){return applyFertilizer(input,{nitrogen,phosphorus,potassium});}

const SOIL_TYPE_BY_BLOCK = Object.freeze({
  "minecraft:clay": "clay",
  "minecraft:mud": "silt",
  "minecraft:dirt": "loam",
  "minecraft:grass_block": "loam",
  "minecraft:coarse_dirt": "loam",
  "minecraft:rooted_dirt": "loam",
  "minecraft:podzol": "loam",
});

export function inferSoilTypeFromBlockId(blockId) {
  return SOIL_TYPE_BY_BLOCK[String(blockId ?? "")] ?? "loam";
}
