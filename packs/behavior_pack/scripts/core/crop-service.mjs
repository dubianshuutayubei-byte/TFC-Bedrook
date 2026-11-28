import { evaluateCropClimate } from "./climate-service.mjs";

function finite(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return value;
}

function validateRange(profile, minKey, maxKey, wiggleKey) {
  const min = finite(profile[minKey], `${profile.id}.${minKey}`);
  const max = finite(profile[maxKey], `${profile.id}.${maxKey}`);
  const wiggle = finite(profile[wiggleKey], `${profile.id}.${wiggleKey}`);
  if (min > max) throw new RangeError(`${profile.id}: ${minKey} cannot exceed ${maxKey}`);
  if (wiggle < 0) throw new RangeError(`${profile.id}: ${wiggleKey} cannot be negative`);
}

export function validateCropClimateDatabase(database) {
  if (!database || !Array.isArray(database.crops)) {
    throw new TypeError("database.crops is required");
  }
  const ids = new Set();
  for (const profile of database.crops) {
    if (!profile || typeof profile.id !== "string" || !profile.id.trim() || ids.has(profile.id)) {
      throw new Error(`missing or duplicate crop id: ${profile?.id}`);
    }
    ids.add(profile.id);
    validateRange(profile, "minHydration", "maxHydration", "hydrationWiggle");
    validateRange(profile, "minTemperatureC", "maxTemperatureC", "temperatureWiggleC");
    if (profile.minHydration < 0 || profile.maxHydration > 100) {
      throw new RangeError(`${profile.id}: hydration must stay within 0..100`);
    }
  }
  return { cropCount: ids.size };
}

/**
 * Evaluate a crop against the source TFC climate-range profile.
 * This does not calculate Bedrock soil hydration or crop growth speed; those
 * inputs must be supplied by the future world/soil runtime systems.
 */
export function evaluateCropEnvironment(database, cropId, climate) {
  if (!database || !Array.isArray(database.crops)) throw new TypeError("database.crops is required");
  const profile = database.crops.find(crop => crop.id === cropId);
  if (!profile) return { status: "unknown_crop", reasons: ["crop_not_found"] };
  return evaluateCropClimate(profile, climate);
}
