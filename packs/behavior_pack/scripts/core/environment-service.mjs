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

export function getRainfallMm(weather, rainfallPerTick = 0.8) {
  const amount = Number(rainfallPerTick);
  if (!Number.isFinite(amount) || amount < 0) throw new RangeError("rainfallPerTick must be a non-negative finite number");
  const normalized = normalizeWeather(weather);
  return normalized === "rain" || normalized === "thunder" ? amount : 0;
}
