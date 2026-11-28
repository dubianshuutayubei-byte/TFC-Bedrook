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

function positive(value, name) {
  const number = finite(value, name);
  if (number <= 0) throw new RangeError(`${name} must be > 0`);
  return number;
}

/**
 * Normalize an arbitrary day index into [0, yearLengthDays).
 * Negative and overflow values wrap across year boundaries.
 */
export function normalizeDayOfYear(dayOfYear, yearLengthDays = DEFAULTS.yearLengthDays) {
  const day = finite(dayOfYear, "dayOfYear");
  const yearLength = positive(yearLengthDays, "yearLengthDays");
  return ((day % yearLength) + yearLength) % yearLength;
}

/**
 * Four equal seasons. Day zero is the winter-solstice start of winter.
 * This is the addon calendar convention, not a claim that Java TFC uses
 * identical season lengths.
 */
export function getSeasonInfo(dayOfYear, yearLengthDays = DEFAULTS.yearLengthDays) {
  const yearLength = positive(yearLengthDays, "yearLengthDays");
  const day = normalizeDayOfYear(dayOfYear, yearLength);
  const seasonLength = yearLength / 4;
  const seasonIndex = Math.min(3, Math.floor(day / seasonLength));
  const seasonDay = day - seasonIndex * seasonLength;
  const seasons = ["winter", "spring", "summer", "autumn"];

  return {
    season: seasons[seasonIndex],
    dayOfYear: day,
    dayInSeason: Math.floor(seasonDay),
    seasonProgress: seasonDay / seasonLength,
    seasonIndex,
  };
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

  const normalizedDay = normalizeDayOfYear(day, yearLength);
  const phase = (normalizedDay / yearLength - DEFAULTS.summerPeakDayFraction) * 2 * Math.PI;
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
  const tempWiggle = finite(profile.temperatureWiggleC ?? 0, "profile.temperatureWiggleC");
  const hydrationWiggle = finite(profile.hydrationWiggle ?? 0, "profile.hydrationWiggle");
  if (tempWiggle < 0 || hydrationWiggle < 0) {
    throw new RangeError("climate wiggle ranges must be >= 0");
  }

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
 * Convert the Bedrock world-day counter into the addon calendar.
 * World day 0 is year 1, winter, day 1.
 */
export function getCalendarInfo(worldDay, daysPerYear = DEFAULTS.yearLengthDays) {
  const day = finite(worldDay, "worldDay");
  const yearLength = positive(daysPerYear, "daysPerYear");
  if (day < 0) throw new RangeError("worldDay must be >= 0");
  const yearIndex = Math.floor(day / yearLength);
  const seasonInfo = getSeasonInfo(day % yearLength, yearLength);
  return {
    year: yearIndex + 1,
    dayOfYear: seasonInfo.dayOfYear,
    dayOfYearNumber: Math.floor(seasonInfo.dayOfYear) + 1,
    ...seasonInfo,
  };
}

/**
 * Validate the imported crop/plant climate threshold database.
 * Values are source thresholds; this does not calibrate Bedrock soil hydration.
 */
export function validateClimateProfiles(data) {
  const errors = [];
  if (!data || data.schemaVersion !== 1) return ["schemaVersion must be 1"];
  for (const category of ["crops", "plants"]) {
    if (!Array.isArray(data[category])) {
      errors.push(`${category} must be an array`);
      continue;
    }
    const ids = new Set();
    for (const profile of data[category]) {
      if (!profile || typeof profile.id !== "string" || !profile.id) {
        errors.push(`${category} contains a profile without an id`);
        continue;
      }
      if (ids.has(profile.id)) errors.push(`duplicate ${category} id: ${profile.id}`);
      ids.add(profile.id);
      for (const key of ["minTemperatureC", "maxTemperatureC", "temperatureWiggleC", "minHydration", "maxHydration", "hydrationWiggle"]) {
        if (typeof profile[key] !== "number" || !Number.isFinite(profile[key])) {
          errors.push(`${category}/${profile.id}: ${key} must be finite`);
        }
      }
      if (profile.minTemperatureC > profile.maxTemperatureC) errors.push(`${category}/${profile.id}: temperature minimum exceeds maximum`);
      if (profile.minHydration > profile.maxHydration) errors.push(`${category}/${profile.id}: hydration minimum exceeds maximum`);
      if (profile.minHydration < 0 || profile.maxHydration > 100) errors.push(`${category}/${profile.id}: hydration must be within 0..100`);
      if (profile.temperatureWiggleC < 0 || profile.hydrationWiggle < 0) errors.push(`${category}/${profile.id}: wiggle ranges must be >= 0`);
    }
  }
  return errors;
}

/** Find one source profile without merging crop and wild-plant namespaces. */
export function getClimateProfile(data, category, id) {
  if (category !== "crops" && category !== "plants") {
    throw new RangeError("category must be crops or plants");
  }
  const profile = data?.[category]?.find(entry => entry.id === id);
  if (!profile) throw new RangeError(`unknown ${category} climate profile: ${id}`);
  return profile;
}
