const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const finiteOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export const SOIL_FERTILITY_MULTIPLIERS = Object.freeze({
  entisol: 1.0, andisol: 1.1, fluvisol: 1.1, alfisol: 1.1,
  mollisol: 1.2, podzol: 0.9, aridisol: 0.9, oxisol: 0.8
});

export function getSoilFertilityMultiplier(soilInput = {}) {
  return SOIL_FERTILITY_MULTIPLIERS[soilInput.fertilityClass] ?? 1.0;
}

export function createSoilState(input = {}) {
  return {
    hydration: clamp(finiteOr(input.hydration, 50), 0, 100),
    nitrogen: clamp(finiteOr(input.nitrogen, 50), 0, 100),
    phosphorus: clamp(finiteOr(input.phosphorus, 50), 0, 100),
    potassium: clamp(finiteOr(input.potassium, 50), 0, 100),
    soilType: input.soilType ?? "loam",
    fertilityClass: Object.hasOwn(SOIL_FERTILITY_MULTIPLIERS, input.fertilityClass) ? input.fertilityClass : "entisol"
  };
}

export function evaluateCropGrowth(profile, environment, soilInput) {
  const soil = createSoilState(soilInput);
  const temperature = finiteOr(environment.temperatureC, 15);
  const minT = finiteOr(profile.minTemperatureC, -Infinity);
  const maxT = finiteOr(profile.maxTemperatureC, Infinity);
  const minH = finiteOr(profile.minHydration, 0);
  const maxH = finiteOr(profile.maxHydration, 100);
  const failures = [];
  if (temperature < minT || temperature > maxT) failures.push("temperature");
  if (soil.hydration < minH || soil.hydration > maxH) failures.push("hydration");

  const nutrientDemand = profile.nutrientDemand ??
    (profile.preferredNutrient ? { [profile.preferredNutrient]: finiteOr(profile.optimalNutrient, 50) } : {});
  const nutrientFactors = Object.entries(nutrientDemand).map(([nutrient, demand]) =>
    clamp((soil[nutrient] ?? 0) / Math.max(1, finiteOr(demand, 1)), 0, 1)
  );
  const nutrientFactor = nutrientFactors.length
    ? nutrientFactors.reduce((sum, value) => sum + value, 0) / nutrientFactors.length
    : 1;
  const suitable = failures.length === 0;
  const hydrationMidpoint = (minH + maxH) / 2;
  const hydrationFactor = suitable
    ? clamp(1 - Math.abs(soil.hydration - hydrationMidpoint) / Math.max(1, maxH - minH), 0.5, 1)
    : 0;
  // Nutrients improve growth rate but do not prevent growth when depleted.
  const growthMultiplier = suitable ? (0.35 + 0.65 * nutrientFactor) * hydrationFactor : 0;
  return { suitable, failures, growthMultiplier, nutrientFactor, soil };
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
  const multiplier = getSoilFertilityMultiplier(soil);
  for (const nutrient of ["nitrogen", "phosphorus", "potassium"]) {
    soil[nutrient] = clamp(soil[nutrient] + Math.max(0, finiteOr(fertilizer[nutrient], 0)) * multiplier, 0, 100);
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
export function applySoilCompost(input,{nitrogen=20,phosphorus=0,potassium=20}={}){return applyFertilizer(input,{nitrogen,phosphorus,potassium});}

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

export function advanceCropGrowthProgress(currentProgress, growthMultiplier, growthPointsPerTick = 25, threshold = 100) {
  if (!Number.isFinite(growthPointsPerTick) || growthPointsPerTick <= 0) throw new RangeError("growthPointsPerTick must be positive");
  if (!Number.isFinite(threshold) || threshold <= 0) throw new RangeError("threshold must be positive");
  const current = clamp(finiteOr(currentProgress, 0), 0, threshold);
  const multiplier = clamp(finiteOr(growthMultiplier, 0), 0, 1);
  const total = current + multiplier * growthPointsPerTick;
  const stageAdvanced = total >= threshold;
  return { progress: stageAdvanced ? total - threshold : total, stageAdvanced };
}

export function applyCropNutrientEffects(soilInput, effects = {}, intensity = 1) {
  const soil = createSoilState(soilInput);
  const scale = Math.max(0, finiteOr(intensity, 1));
  const fertilityMultiplier = getSoilFertilityMultiplier(soil);
  for (const nutrient of ["nitrogen", "phosphorus", "potassium"]) {
    const change = finiteOr(effects[nutrient], 0) * scale;
    const adjustedChange = change > 0 ? change * fertilityMultiplier : change;
    soil[nutrient] = clamp(soil[nutrient] + adjustedChange, 0, 100);
  }
  return soil;
}

const SOIL_FERTILITY_BY_BIOME = Object.freeze({
  "minecraft:basalt_deltas": "andisol"
});

export function inferSoilFertilityClassFromBiomeId(biomeId) {
  const id = String(biomeId ?? "").toLowerCase();
  if (SOIL_FERTILITY_BY_BIOME[id]) return SOIL_FERTILITY_BY_BIOME[id];
  if (id.includes("volcanic")) return "andisol";
  if (id.includes("river")) return "fluvisol";
  if (id.includes("jungle") || id.includes("mangrove")) return "oxisol";
  if (id.includes("desert") || id.includes("badlands") || id.includes("savanna")) return "aridisol";
  if (id.includes("taiga") || id.includes("grove") || id.includes("pine")) return "podzol";
  if (id.includes("forest") || id.includes("birch") || id.includes("cherry")) return "alfisol";
  if (id.includes("snowy_plains") || id.includes("ice_spikes") || id.includes("meadow")) return "mollisol";
  return "entisol";
}
