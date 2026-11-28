/**
 * TFC-Bedrook climate calculations.
 *
 * Pure functions: no Minecraft API imports, so the model can be tested in Node
 * before it is connected to Bedrock events. Units are explicit:
 * temperature = degrees Celsius; hydration = normalized 0..100;
 * rainfall = source-profile units until the TFC-to-Bedrock scale is calibrated.
 */

const DEFAULTS = Object.freeze({
  yearLengthDays: 96,
  lapseRateCPerKm: 6.5,
  summerPeakDayFraction: 0.5,
});

function finite(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return value;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Calculate local temperature from annual mean, seasonal amplitude and height.
 * Day zero is the winter solstice; the seasonal curve peaks halfway through
 * the configured year. This is a gameplay approximation, not a claim of exact
 * TFC climate-engine parity.
 */
export function calculateTemperatureC({
  meanAnnualTempC,
  seasonalAmplitudeC = 0,
  dayOfYear,
  elevationM = 0,
  yearLengthDays = DEFAULTS.yearLengthDays,
  lapseRateCPerKm = DEFAULTS.lapseRateCPerKm,
}) {
  const mean = finite(meanAnnualTempC, "meanAnnualTempC");
  const amplitude = finite(seasonalAmplitudeC, "seasonalAmplitudeC");
  const day = finite(dayOfYear, "dayOfYear");
  const elevation = finite(elevationM, "elevationM");
  const yearLength = finite(yearLengthDays, "yearLengthDays");
  const lapseRate = finite(lapseRateCPerKm, "lapseRateCPerKm");

  if (yearLength <= 0) throw new RangeError("yearLengthDays must be > 0");
  if (amplitude < 0) throw new RangeError("seasonalAmplitudeC must be >= 0");
  if (lapseRate < 0) throw new RangeError("lapseRateCPerKm must be >= 0");

  const phase = (day / yearLength - DEFAULTS.summerPeakDayFraction) * 2 * Math.PI;
  const seasonalOffset = amplitude * Math.cos(phase);
  const altitudeOffset = -(elevation / 1000) * lapseRate;
  return mean + seasonalOffset + altitudeOffset;
}

/**
 * Returns "optimal", "marginal", or "unsuitable".
 * Wiggle ranges soften the edge of the source TFC climate interval.
 */
export function evaluateCropClimate(profile, climate) {
  if (!profile || !climate) throw new TypeError("profile and climate are required");

  const temperature = finite(climate.temperatureC, "climate.temperatureC");
  const hydration = finite(climate.hydration, "climate.hydration");
  const tempWiggle = profile.temperatureWiggleC ?? 0;
  const hydrationWiggle = profile.hydrationWiggle ?? 0;

  const values = [
    ["minTemperatureC", "maxTemperatureC", temperature, tempWiggle],
    ["minHydration", "maxHydration", hydration, hydrationWiggle],
  ];

  let marginal = false;
  const reasons = [];
  for (const [minKey, maxKey, value, wiggle] of values) {
    const min = finite(profile[minKey], `profile.${minKey}`);
    const max = finite(profile[maxKey], `profile.${maxKey}`);
    if (min > max) throw new RangeError(`${minKey} cannot exceed ${maxKey}`);
    if (value < min - wiggle || value > max + wiggle) {
      reasons.push(value < min ? minKey : maxKey);
      return { status: "unsuitable", reasons };
    }
    if (value < min || value > max) {
      marginal = true;
      reasons.push(value < min ? `low_${minKey}` : `high_${maxKey}`);
    }
  }
  return { status: marginal ? "marginal" : "optimal", reasons };
}

/**
 * Tests the environmental constraints present in a fauna profile.
 * Missing/null profile limits mean "no limit specified", never zero.
 */
export function evaluateFaunaHabitat(profile, environment) {
  if (!profile || !environment) throw new TypeError("profile and environment are required");
  const failures = [];
  const checks = [
    ["minTemperatureC", "temperatureC", (limit, actual) => actual >= limit],
    ["maxTemperatureC", "temperatureC", (limit, actual) => actual <= limit],
    ["minRainfall", "rainfall", (limit, actual) => actual >= limit],
    ["maxRainfall", "rainfall", (limit, actual) => actual <= limit],
    ["minBelowSeaLevel", "belowSeaLevel", (limit, actual) => actual >= limit],
    ["maxBrightness", "brightness", (limit, actual) => actual <= limit],
  ];

  for (const [limitKey, actualKey, predicate] of checks) {
    const limit = profile[limitKey];
    if (limit === undefined || limit === null) continue;
    const actual = finite(environment[actualKey], `environment.${actualKey}`);
    if (!predicate(finite(limit, `profile.${limitKey}`), actual)) failures.push(limitKey);
  }

  // ForestType ordering is intentionally not inferred here. TFC's edge/normal
  // labels need an explicit source-enum mapping before min/max are evaluated.
  if (profile.waterType && environment.waterType !== profile.waterType) {
    failures.push("waterType");
  }

  return { suitable: failures.length === 0, failures };
}

export function normalizeHydration(value) {
  return clamp(finite(value, "hydration"), 0, 100);
}

/**
 * Estimate ambient temperature from the 96-day seasonal cycle and time of day.
 * Bedrock time is a global clock; regional climate and altitude are added later.
 */
export function calculateAmbientTemperatureC({
  meanAnnualTempC,
  seasonalAmplitudeC = 0,
  dayOfYear,
  timeOfDay = 12000,
  elevationM = 0,
  diurnalAmplitudeC = 3,
  yearLengthDays = DEFAULTS.yearLengthDays,
}) {
  const time = finite(timeOfDay, "timeOfDay");
  const dailyAmplitude = finite(diurnalAmplitudeC, "diurnalAmplitudeC");
  if (time < 0 || time > 24000) throw new RangeError("timeOfDay must be between 0 and 24000");
  if (dailyAmplitude < 0) throw new RangeError("diurnalAmplitudeC must be >= 0");
  const seasonal = calculateTemperatureC({
    meanAnnualTempC,
    seasonalAmplitudeC,
    dayOfYear,
    elevationM,
    yearLengthDays,
  });
  const dailyPhase = (time / 24000 - 0.5) * 2 * Math.PI;
  return seasonal + Math.cos(dailyPhase) * dailyAmplitude;
}

export function getSeasonName(dayOfYear) {
  const day = Math.floor(finite(dayOfYear, "dayOfYear"));
  const normalized = ((day % DEFAULTS.yearLengthDays) + DEFAULTS.yearLengthDays) % DEFAULTS.yearLengthDays;
  return ["冬", "春", "夏", "秋"][Math.floor(normalized / 24)];
}


/**
 * Approximate regional climate defaults inferred from vanilla biome families.
 * These are intentionally a bridge until the project's TFC climate/terrain data
 * can replace the broad family mapping.
 */
export function getBiomeClimateProfile(biomeId) {
  const id = String(biomeId ?? "").toLowerCase().replace(/^minecraft:/, "");
  if (/(desert|badlands)/.test(id)) return { meanAnnualTempC: 22, seasonalAmplitudeC: 16 };
  if (/(jungle|bamboo_jungle|mangrove_swamp)/.test(id)) return { meanAnnualTempC: 24, seasonalAmplitudeC: 8 };
  if (/(savanna)/.test(id)) return { meanAnnualTempC: 20, seasonalAmplitudeC: 13 };
  if (/(snowy|ice_spikes|frozen|grove)/.test(id)) return { meanAnnualTempC: -2, seasonalAmplitudeC: 18 };
  if (/(taiga|old_growth_pine|old_growth_spruce)/.test(id)) return { meanAnnualTempC: 3, seasonalAmplitudeC: 16 };
  if (/(swamp)/.test(id)) return { meanAnnualTempC: 16, seasonalAmplitudeC: 10 };
  if (/(mushroom_fields)/.test(id)) return { meanAnnualTempC: 15, seasonalAmplitudeC: 8 };
  if (/(windswept|stony_peaks|jagged_peaks|frozen_peaks)/.test(id)) return { meanAnnualTempC: 4, seasonalAmplitudeC: 17 };
  if (/(ocean|beach|shore)/.test(id)) return { meanAnnualTempC: 11, seasonalAmplitudeC: 9 };
  if (/(forest|birch|cherry_grove|flower_forest)/.test(id)) return { meanAnnualTempC: 10, seasonalAmplitudeC: 13 };
  return { meanAnnualTempC: 12, seasonalAmplitudeC: 14 };
}

/** Exact TFC 4.2.16 annual groundwater formula: min(base groundwater + annual rainfall, 500). */
export function calculateTfcAverageGroundwater(baseGroundwater, averageRainfall) {
  const base = finite(baseGroundwater, "baseGroundwater");
  const rainfall = finite(averageRainfall, "averageRainfall");
  return Math.min(base + rainfall, 500);
}

/** Exact TFC 4.2.16 average temperature adjustment above sea level. */
export function adjustTfcAverageTemperatureForElevation(y, averageSeaLevelTemperature, seaLevel = 63) {
  const height = finite(y, "y");
  const temperature = finite(averageSeaLevelTemperature, "averageSeaLevelTemperature");
  const level = finite(seaLevel, "seaLevel");
  if (height <= level) return temperature;
  const offset = clamp((height - level) * 0.16225, 0, 17.822);
  return temperature - offset;
}

/** Exact ClimatePlacement hemisphere sign handling for non-absolute rain variance. */
export function adjustTfcRainVarianceForHemisphere(rainVariance, isNorthernHemisphere, absolute = false) {
  const value = finite(rainVariance, "rainVariance");
  return absolute ? Math.abs(value) : value * (isNorthernHemisphere ? 1 : -1);
}
