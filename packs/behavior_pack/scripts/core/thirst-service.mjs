/**
 * TFC v3.2.26 thirst rules adapted as pure functions for Bedrock.
 *
 * Source behavior: thirst is 0..100; each exhaustion threshold event removes
 * the configured thirst modifier, increased by ambient heat. The source
 * default thirst modifier is 5 and heat contribution is capped at 0.4.
 */

export const TFC_THIRST_DEFAULTS = Object.freeze({
  maxThirst: 100,
  thirstModifier: 5,
  temperatureStartC: 22,
  temperatureEndC: 34,
  maxTemperatureContribution: 0.4,
  exhaustionThreshold: 4,
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

export function normalizeThirst(value, maxThirst = TFC_THIRST_DEFAULTS.maxThirst) {
  const thirst = finite(value, "thirst");
  const max = finite(maxThirst, "maxThirst");
  if (max <= 0) throw new RangeError("maxThirst must be > 0");
  return clamp(thirst, 0, max);
}

/** TFC maps ambient temperature 22..34 C to an extra 0..0.4 thirst loss. */
export function getTemperatureThirstContribution(
  temperatureC,
  enabled = true,
  {
    temperatureStartC = TFC_THIRST_DEFAULTS.temperatureStartC,
    temperatureEndC = TFC_THIRST_DEFAULTS.temperatureEndC,
    maxContribution = TFC_THIRST_DEFAULTS.maxTemperatureContribution,
  } = {},
) {
  const temperature = finite(temperatureC, "temperatureC");
  const start = finite(temperatureStartC, "temperatureStartC");
  const end = finite(temperatureEndC, "temperatureEndC");
  const maximum = finite(maxContribution, "maxContribution");
  if (end <= start || maximum < 0) throw new RangeError("invalid temperature contribution range");
  if (!enabled) return 0;
  return clamp((temperature - start) / (end - start), 0, 1) * maximum;
}

/** Amount removed when TFC's exhaustion level reaches its 4-point threshold. */
export function calculateExhaustionThirstLoss({
  thirstModifier = TFC_THIRST_DEFAULTS.thirstModifier,
  temperatureContribution = 0,
} = {}) {
  const modifier = finite(thirstModifier, "thirstModifier");
  const contribution = finite(temperatureContribution, "temperatureContribution");
  if (modifier < 0 || contribution < 0) throw new RangeError("thirst loss inputs cannot be negative");
  return modifier * (1 + contribution);
}

/**
 * Apply one exhaustion-triggered thirst event. TFC checks >= 4 once per player
 * tick; this function intentionally does not loop over multiple thresholds.
 */
export function applyExhaustionThirstLoss({
  thirst,
  exhaustion,
  temperatureC = 22,
  thirstModifier = TFC_THIRST_DEFAULTS.thirstModifier,
  overheatingEnabled = true,
} = {}) {
  const current = normalizeThirst(thirst);
  const exhaustionLevel = finite(exhaustion, "exhaustion");
  if (exhaustionLevel < TFC_THIRST_DEFAULTS.exhaustionThreshold) {
    return { thirst: current, changed: false, loss: 0 };
  }
  const temperatureContribution = getTemperatureThirstContribution(
    temperatureC,
    overheatingEnabled,
  );
  const loss = calculateExhaustionThirstLoss({ thirstModifier, temperatureContribution });
  const next = normalizeThirst(current - loss);
  return { thirst: next, changed: next !== current, loss: current - next };
}

/** Apply a data-driven water value from food/drink profiles. */
export function applyWaterIntake(thirst, waterValue) {
  const current = normalizeThirst(thirst);
  const amount = finite(waterValue, "waterValue");
  const next = normalizeThirst(current + amount);
  return { thirst: next, change: next - current };
}

/** TFC's periodic low-thirst thresholds; caller handles difficulty/tick gating. */
export function evaluateThirstEffects(thirst) {
  const value = normalizeThirst(thirst);
  if (value < 10) {
    return {
      level: "critical",
      movementSlowdownAmplifier: 1,
      miningSlowdownAmplifier: 1,
      dehydrationDamage: value <= 0 ? 1 : 0,
    };
  }
  if (value < 20) {
    return {
      level: "low",
      movementSlowdownAmplifier: 0,
      miningSlowdownAmplifier: 0,
      dehydrationDamage: 0,
    };
  }
  return {
    level: "normal",
    movementSlowdownAmplifier: null,
    miningSlowdownAmplifier: null,
    dehydrationDamage: 0,
  };
}
