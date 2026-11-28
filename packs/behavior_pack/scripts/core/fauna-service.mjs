const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const finiteOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function createAnimalState(input = {}) {
  return {
    species: input.species ?? "unknown",
    sex: input.sex ?? "unknown",
    ageDays: Math.max(0, finiteOr(input.ageDays, 0)),
    familiarity: clamp(finiteOr(input.familiarity, 0), 0, 100),
    pregnancyDays: Math.max(0, finiteOr(input.pregnancyDays, 0)),
    health: clamp(finiteOr(input.health, 100), 0, 100),
    lastProductAt: Math.max(0, finiteOr(input.lastProductAt, 0))
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

export function feedAnimal(input, familiarityGain = 5, healthGain = 0) {
  const animal = createAnimalState(input);
  animal.familiarity = clamp(animal.familiarity + Math.max(0, finiteOr(familiarityGain, 0)), 0, 100);
  animal.health = clamp(animal.health + Math.max(0, finiteOr(healthGain, 0)), 0, 100);
  return animal;
}

export function advanceAnimalAge(input, elapsedDays) {
  const animal = createAnimalState(input);
  animal.ageDays += Math.max(0, finiteOr(elapsedDays, 0));
  return animal;
}

export function canBreed(firstInput, secondInput, profile) {
  const a = createAnimalState(firstInput);
  const b = createAnimalState(secondInput);
  const adultAge = finiteOr(profile.adultAgeDays, 0);
  const requiredFamiliarity = finiteOr(profile.requiredFamiliarity, 0);
  const validSexPair = (a.sex === "male" && b.sex === "female") || (a.sex === "female" && b.sex === "male");
  return a.species === b.species && validSexPair &&
    a.ageDays >= adultAge && b.ageDays >= adultAge &&
    a.health > 0 && b.health > 0 &&
    a.familiarity >= requiredFamiliarity && b.familiarity >= requiredFamiliarity &&
    a.pregnancyDays === 0 && b.pregnancyDays === 0;
}

export function beginPregnancy(input, partnerInput, profile) {
  if (!canBreed(input, partnerInput, profile)) return { started: false, animal: createAnimalState(input), reason: "breeding_requirements_not_met" };
  const animal = createAnimalState(input);
  animal.pregnancyDays = 0.001;
  return { started: true, animal };
}

export function advancePregnancy(input, elapsedDays, gestationDays) {
  const animal = createAnimalState(input);
  if (animal.pregnancyDays <= 0) return { animal, birthReady: false, progress: 0 };
  const duration = finiteOr(gestationDays, 0);
  if (duration <= 0) throw new RangeError("gestationDays must be positive");
  animal.pregnancyDays += Math.max(0, finiteOr(elapsedDays, 0));
  return { animal, birthReady: animal.pregnancyDays >= duration, progress: clamp(animal.pregnancyDays / duration, 0, 1) };
}

export function canProduce(input, { requiredFamiliarity = 0, cooldownDays = 0, currentDay = 0 } = {}) {
  const animal = createAnimalState(input);
  return animal.health > 0 && animal.ageDays > 0 &&
    animal.familiarity >= requiredFamiliarity &&
    currentDay - animal.lastProductAt >= cooldownDays;
}

export function recordProduct(input, currentDay) {
  const animal = createAnimalState(input);
  animal.lastProductAt = Math.max(animal.lastProductAt, finiteOr(currentDay, animal.lastProductAt));
  return animal;
}
