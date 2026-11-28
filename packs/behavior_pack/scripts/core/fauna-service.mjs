const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function createAnimalState(input = {}) {
  return {
    species: input.species ?? "unknown",
    sex: input.sex ?? "unknown",
    ageDays: Math.max(0, Number(input.ageDays ?? 0)),
    familiarity: clamp(Number(input.familiarity ?? 0), 0, 100),
    pregnancyDays: Math.max(0, Number(input.pregnancyDays ?? 0)),
    health: clamp(Number(input.health ?? 100), 0, 100),
    lastProductAt: Math.max(0, Number(input.lastProductAt ?? 0))
  };
}

export function evaluateHabitat(profile, environment) {
  const failures = [];
  if (profile.minTemperatureC != null && environment.temperatureC < profile.minTemperatureC) failures.push("temperature_low");
  if (profile.maxTemperatureC != null && environment.temperatureC > profile.maxTemperatureC) failures.push("temperature_high");
  if (profile.minRainfall != null && environment.rainfall < profile.minRainfall) failures.push("rainfall_low");
  if (profile.maxRainfall != null && environment.rainfall > profile.maxRainfall) failures.push("rainfall_high");
  if (profile.waterType && profile.waterType !== environment.waterType) failures.push("waterType");
  if (profile.terrain && !profile.terrain.includes(environment.terrain)) failures.push("terrain");
  return { suitable: failures.length === 0, failures };
}

export function feedAnimal(input, familiarityGain = 5) {
  const animal = createAnimalState(input);
  animal.familiarity = clamp(animal.familiarity + Math.max(0, familiarityGain), 0, 100);
  return animal;
}

export function advanceAnimalAge(input, elapsedDays) {
  const animal = createAnimalState(input);
  animal.ageDays += Math.max(0, Number(elapsedDays) || 0);
  return animal;
}

export function canBreed(firstInput, secondInput, profile) {
  const a = createAnimalState(firstInput);
  const b = createAnimalState(secondInput);
  const adultAge = Number(profile.adultAgeDays ?? 0);
  const requiredFamiliarity = Number(profile.requiredFamiliarity ?? 0);
  const validSexPair = (a.sex === "male" && b.sex === "female") || (a.sex === "female" && b.sex === "male");
  return a.species === b.species && validSexPair &&
    a.ageDays >= adultAge && b.ageDays >= adultAge &&
    a.health > 0 && b.health > 0 &&
    a.familiarity >= requiredFamiliarity && b.familiarity >= requiredFamiliarity &&
    a.pregnancyDays === 0 && b.pregnancyDays === 0;
}
