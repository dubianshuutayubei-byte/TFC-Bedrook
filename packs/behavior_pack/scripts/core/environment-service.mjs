const DIMENSION_ALIASES = Object.freeze({
  "minecraft:overworld": "overworld",
  "minecraft:nether": "nether",
  "minecraft:the_end": "the_end"
});

export function normalizeDimensionId(value) {
  const id = String(value ?? "").trim().toLowerCase();
  return DIMENSION_ALIASES[id] ?? id.replace(/^minecraft:/, "");
}

export function normalizeWeather(value) {
  const weather = String(value ?? "clear").trim().toLowerCase();
  if (weather.includes("thunder")) return "thunder";
  if (weather.includes("rain")) return "rain";
  return "clear";
}

export function getRainfallMm(weather, rainfallPerTick = 0.8, regionalMultiplier = 1) {
  const amount = Number(rainfallPerTick);
  if (!Number.isFinite(amount) || amount < 0) throw new RangeError("rainfallPerTick must be a non-negative finite number");
  const multiplier = Number(regionalMultiplier);
  if (!Number.isFinite(multiplier) || multiplier < 0) throw new RangeError("regionalMultiplier must be a non-negative finite number");
  const normalized = normalizeWeather(weather);
  return normalized === "rain" || normalized === "thunder" ? amount * multiplier : 0;
}

/** Approximate rainfall factor inferred from vanilla biome families. */
export function inferBiomeRainfallMultiplierFromBiomeId(biomeId) {
  const id = String(biomeId ?? "").toLowerCase().replace(/^minecraft:/, "");
  if (/(desert|badlands)/.test(id)) return 0.15;
  if (/savanna/.test(id)) return 0.55;
  if (/(jungle|mangrove|swamp)/.test(id)) return 1.45;
  if (/(taiga|snowy|frozen|grove)/.test(id)) return 0.8;
  if (/(forest|birch|cherry_grove)/.test(id)) return 1.1;
  if (/(ocean|river|beach)/.test(id)) return 1.05;
  return 1;
}
