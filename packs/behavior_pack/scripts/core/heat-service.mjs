/**
 * Data-driven heat calculations for TFC-Bedrook.
 * Energy = heatCapacity * temperatureDelta, following TFC's documented
 * Energy / °C heat-capacity unit. This is not a tick-by-tick forge simulation.
 */
function finite(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}

export function validateFuelDatabase(database) {
  if (!database || !Array.isArray(database.fuels)) throw new TypeError("database.fuels is required");
  const ids = new Set();
  for (const fuel of database.fuels) {
    if (!fuel.id || ids.has(fuel.id)) throw new Error(`missing or duplicate fuel id: ${fuel.id}`);
    ids.add(fuel.id);
    if (!Array.isArray(fuel.ingredient) || fuel.ingredient.length === 0) throw new Error(`fuel ingredients missing: ${fuel.id}`);
    if (!Number.isInteger(fuel.duration) || fuel.duration <= 0) throw new RangeError(`invalid fuel duration: ${fuel.id}`);
    if (finite(fuel.temperatureC, fuel.id) <= 0) throw new RangeError(`invalid fuel temperature: ${fuel.id}`);
    if (fuel.purity !== undefined && (finite(fuel.purity, fuel.id) < 0 || fuel.purity > 1)) {
      throw new RangeError(`invalid fuel purity: ${fuel.id}`);
    }
  }
  return { fuelCount: ids.size };
}

export function validateItemHeatDatabase(database, metalIds) {
  if (!database || !Array.isArray(database.profiles)) throw new TypeError("database.profiles is required");
  const ids = new Set();
  for (const profile of database.profiles) {
    if (!profile.id || ids.has(profile.id)) throw new Error(`missing or duplicate heat profile id: ${profile.id}`);
    ids.add(profile.id);
    if (!metalIds.has(profile.metalId)) throw new Error(`unknown metal in heat profile: ${profile.id}`);
    if (finite(profile.heatCapacity, profile.id) <= 0) throw new RangeError(`invalid heat capacity: ${profile.id}`);
    const forging = finite(profile.forgingTemperatureC, profile.id);
    const welding = finite(profile.weldingTemperatureC, profile.id);
    if (forging < 0 || welding < forging) throw new RangeError(`invalid work temperatures: ${profile.id}`);
  }
  return { profileCount: ids.size };
}

/** Energy needed to move an item from currentC to targetC. Cooling returns zero. */
export function energyRequired(profile, currentC, targetC) {
  const capacity = finite(profile.heatCapacity, "heatCapacity");
  const current = finite(currentC, "currentC");
  const target = finite(targetC, "targetC");
  if (capacity <= 0) throw new RangeError("heatCapacity must be positive");
  return Math.max(0, target - current) * capacity;
}

/** Idealized temperature change from supplied energy; no heat loss is modeled. */
export function temperatureAfterEnergy(profile, currentC, energy) {
  const capacity = finite(profile.heatCapacity, "heatCapacity");
  const current = finite(currentC, "currentC");
  const supplied = finite(energy, "energy");
  if (capacity <= 0) throw new RangeError("heatCapacity must be positive");
  if (supplied < 0) throw new RangeError("energy cannot be negative");
  return current + supplied / capacity;
}

export function evaluateMetalWorkState(itemProfile, metalProfile, temperatureC) {
  const temperature = finite(temperatureC, "temperatureC");
  const canWork = temperature >= itemProfile.forgingTemperatureC;
  const canWeld = temperature >= itemProfile.weldingTemperatureC;
  const canMelt = temperature >= metalProfile.meltTemperatureC;
  return {
    canWork,
    canWeld,
    canMelt,
    workMarginC: temperature - itemProfile.forgingTemperatureC,
    weldMarginC: temperature - itemProfile.weldingTemperatureC,
    meltMarginC: temperature - metalProfile.meltTemperatureC,
  };
}
