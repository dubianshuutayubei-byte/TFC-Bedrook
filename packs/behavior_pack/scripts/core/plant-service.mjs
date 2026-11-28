import { evaluateCropClimate } from "./climate-service.mjs";

function finite(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return value;
}

export function validatePlantClimateDatabase(database) {
  if (!database || !Array.isArray(database.plants)) {
    throw new TypeError("database.plants is required");
  }
  const ids = new Set();
  for (const profile of database.plants) {
    if (!profile || typeof profile.id !== "string" || !profile.id.trim() || ids.has(profile.id)) {
      throw new Error(`missing or duplicate plant id: ${profile?.id}`);
    }
    ids.add(profile.id);
    for (const [minKey, maxKey, wiggleKey] of [
      ["minHydration", "maxHydration", "hydrationWiggle"],
      ["minTemperatureC", "maxTemperatureC", "temperatureWiggleC"],
    ]) {
      const min = finite(profile[minKey], `${profile.id}.${minKey}`);
      const max = finite(profile[maxKey], `${profile.id}.${maxKey}`);
      const wiggle = finite(profile[wiggleKey], `${profile.id}.${wiggleKey}`);
      if (min > max || wiggle < 0) throw new RangeError(`invalid climate range: ${profile.id}`);
    }
    if (profile.minHydration < 0 || profile.maxHydration > 100) {
      throw new RangeError(`${profile.id}: hydration must stay within 0..100`);
    }
  }
  return { plantCount: ids.size };
}

/** Wild plant climate ranges have no wiggle range in the source data. */
export function evaluatePlantEnvironment(database, plantId, climate) {
  if (!database || !Array.isArray(database.plants)) throw new TypeError("database.plants is required");
  const profile = database.plants.find(plant => plant.id === plantId);
  if (!profile) return { status: "unknown_plant", reasons: ["plant_not_found"] };
  return evaluateCropClimate(profile, climate);
}
