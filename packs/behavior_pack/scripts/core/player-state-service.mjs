export const PLAYER_STATE_VERSION = 1;
export const PLAYER_STATE_KEY = "tfcb:player_state";

export const NUTRITION_KEYS = Object.freeze([
  "grain",
  "fruit",
  "vegetables",
  "protein",
  "dairy",
]);

export const DEFAULT_PLAYER_STATE = Object.freeze({
  version: PLAYER_STATE_VERSION,
  hydration: 100,
  nutrition: Object.freeze({
    grain: 0,
    fruit: 0,
    vegetables: 0,
    protein: 0,
    dairy: 0,
  }),
});

function finiteOr(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Normalize persisted data and safely migrate older/malformed records. */
export function normalizePlayerState(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const nutritionSource =
    source.nutrition && typeof source.nutrition === "object" && !Array.isArray(source.nutrition)
      ? source.nutrition
      : {};

  const nutrition = {};
  for (const key of NUTRITION_KEYS) {
    nutrition[key] = clamp(finiteOr(nutritionSource[key], 0), 0, 100);
  }

  return {
    version: PLAYER_STATE_VERSION,
    hydration: clamp(finiteOr(source.hydration, DEFAULT_PLAYER_STATE.hydration), 0, 100),
    nutrition,
  };
}

/** Parse a saved player state. Invalid JSON falls back without throwing. */
export function deserializePlayerState(serialized) {
  if (typeof serialized !== "string" || serialized.length === 0) {
    return { state: normalizePlayerState(DEFAULT_PLAYER_STATE), needsSave: true };
  }
  try {
    const parsed = JSON.parse(serialized);
    const state = normalizePlayerState(parsed);
    return {
      state,
      needsSave: parsed?.version !== PLAYER_STATE_VERSION,
    };
  } catch {
    return { state: normalizePlayerState(DEFAULT_PLAYER_STATE), needsSave: true };
  }
}

export function serializePlayerState(state) {
  return JSON.stringify(normalizePlayerState(state));
}

export function setHydration(state, value) {
  const normalized = normalizePlayerState(state);
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError("hydration must be a finite number");
  }
  normalized.hydration = clamp(value, 0, 100);
  return normalized;
}

export function changeNutrition(state, category, amount) {
  if (!NUTRITION_KEYS.includes(category)) {
    throw new RangeError(`unknown nutrition category: ${category}`);
  }
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new TypeError("nutrition amount must be a finite number");
  }
  const normalized = normalizePlayerState(state);
  normalized.nutrition[category] = clamp(normalized.nutrition[category] + amount, 0, 100);
  return normalized;
}
