import {
  evaluateCropClimate,
  getClimateProfile,
  validateClimateProfiles,
} from "./climate-service.mjs";

/**
 * Validate the unified TFC crop and wild-plant climate database.
 * Source thresholds are preserved; Bedrock hydration calibration is separate.
 */
export function validateCropPlantDatabase(database) {
  const errors = validateClimateProfiles(database);
  if (errors.length) throw new Error(`invalid crop/plant climate database: ${errors.join("; ")}`);
  return {
    cropCount: database.crops.length,
    plantCount: database.plants.length,
  };
}

/**
 * Evaluate one crop or wild plant against its own source climate thresholds.
 * category must be "crops" or "plants"; unknown IDs are reported explicitly.
 */
export function evaluateCropOrPlantEnvironment(database, category, id, climate) {
  let profile;
  try {
    profile = getClimateProfile(database, category, id);
  } catch (error) {
    if (error instanceof RangeError) {
      return { status: "unknown_profile", reasons: [error.message] };
    }
    throw error;
  }
  return evaluateCropClimate(profile, climate);
}
