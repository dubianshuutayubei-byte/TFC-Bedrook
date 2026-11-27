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

/** Temperature color bands documented by the TFC 1.20.1 Field Guide. */
export function classifyTemperature(temperatureC) {
  const temperature = finite(temperatureC, "temperatureC");
  if (temperature <= 0) return "unheated";
  if (temperature < 80) return "warming";
  if (temperature < 210) return "hot";
  if (temperature < 480) return "very_hot";
  if (temperature < 580) return "faint_red";
  if (temperature < 730) return "dark_red";
  if (temperature < 930) return "bright_red";
  if (temperature < 1100) return "orange";
  if (temperature < 1300) return "yellow";
  if (temperature < 1400) return "yellow_white";
  if (temperature < 1500) return "white";
  return "brilliant_white";
}

/**
 * TFC device target temperature:
 * bellows add min(4 * airTicks, 600, 50% of base target), then rain removes 300 C.
 */
export function targetDeviceTemperature(baseTargetC, airTicks = 0, isRaining = false) {
  const base = finite(baseTargetC, "baseTargetC");
  if (!Number.isInteger(airTicks) || airTicks < 0) throw new RangeError("airTicks must be a non-negative integer");
  let target = base;
  if (airTicks > 0) target += Math.min(4 * airTicks, 600, target * 0.5);
  if (isRaining) target = Math.max(0, target - 300);
  return target;
}

/**
 * One TFC device tick. deviceHeatingModifier is the server config value;
 * it is required rather than guessed. Bellows alter heating/cooling speed.
 */
export function advanceDeviceTemperature(currentC, baseTargetC, {
  airTicks = 0, isRaining = false, deviceHeatingModifier
} = {}) {
  const current = finite(currentC, "currentC");
  const modifier = finite(deviceHeatingModifier, "deviceHeatingModifier");
  if (modifier < 0) throw new RangeError("deviceHeatingModifier cannot be negative");
  const target = targetDeviceTemperature(baseTargetC, airTicks, isRaining);
  if (current < target) return Math.min(current + modifier * (airTicks > 0 ? 2 : 1), target);
  if (current > target) return Math.max(current - modifier * (airTicks > 0 ? 0.5 : 1), target);
  return target;
}

/** TFC fuel burn rate: one burn tick normally, two with active bellows or rain. */
export function advanceFuelBurnTicks(remainingTicks, { airTicks = 0, isRaining = false } = {}) {
  if (!Number.isInteger(remainingTicks) || remainingTicks < 0) throw new RangeError("remainingTicks must be a non-negative integer");
  if (!Number.isInteger(airTicks) || airTicks < 0) throw new RangeError("airTicks must be a non-negative integer");
  return Math.max(0, remainingTicks - (airTicks > 0 || isRaining ? 2 : 1));
}

/**
 * TFC item heating step. The server config modifiers are explicit inputs.
 * This function models the HeatCapability.addTemp formula; it does not guess
 * config defaults. TFC only raises the item temperature here, capped by target.
 */
export function advanceItemTemperature(profile, currentC, targetC, {
  coolingModifier, heatingModifier, modifier = 3
} = {}) {
  const capacity = finite(profile.heatCapacity, "heatCapacity");
  const current = finite(currentC, "currentC");
  const target = finite(targetC, "targetC");
  const cooling = finite(coolingModifier, "coolingModifier");
  const heating = finite(heatingModifier, "heatingModifier");
  const heatModifier = finite(modifier, "modifier");
  if (capacity <= 0) throw new RangeError("heatCapacity must be positive");
  if (cooling < 0 || heating < 0 || heatModifier < 0) throw new RangeError("heat modifiers cannot be negative");
  const next = current + (cooling - 1 + heatModifier * heating) / capacity;
  return Math.max(current, Math.min(next, target));
}

/** Passive item cooling after a time skip, matching TFC's heat decay formula. */
export function coolItemTemperature(currentC, profile, ticksSinceUpdate, coolingModifier) {
  const current = finite(currentC, "currentC");
  const capacity = finite(profile.heatCapacity, "heatCapacity");
  const cooling = finite(coolingModifier, "coolingModifier");
  if (!Number.isInteger(ticksSinceUpdate) || ticksSinceUpdate < 0) throw new RangeError("ticksSinceUpdate must be a non-negative integer");
  if (capacity <= 0 || cooling < 0) throw new RangeError("invalid heat capacity or cooling modifier");
  return Math.max(0, current - ticksSinceUpdate * cooling / capacity);
}
