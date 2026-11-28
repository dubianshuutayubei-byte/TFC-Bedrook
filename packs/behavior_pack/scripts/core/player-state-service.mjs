export const PLAYER_STATE_DEFAULTS = Object.freeze({
  hydration: 100,
  nutrition: Object.freeze({ grain: 0, fruit: 0, vegetables: 0, protein: 0, dairy: 0 }),
  temperature: 20,
  lastUpdated: 0
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createPlayerState(overrides = {}) {
  const nutrition = { ...PLAYER_STATE_DEFAULTS.nutrition, ...(overrides.nutrition ?? {}) };
  return {
    hydration: clamp(Number(overrides.hydration ?? 100), 0, 100),
    nutrition: Object.fromEntries(Object.entries(nutrition).map(([k,v]) => [k, clamp(Number(v) || 0, 0, 100)])),
    temperature: Number.isFinite(overrides.temperature) ? overrides.temperature : 20,
    lastUpdated: Number.isFinite(overrides.lastUpdated) ? Math.max(0, overrides.lastUpdated) : 0
  };
}

export function applyHydration(state, amount) {
  const next = createPlayerState(state);
  next.hydration = clamp(next.hydration + Number(amount || 0), 0, 100);
  return next;
}

export function applyNutrition(state, category, amount) {
  if (!(category in PLAYER_STATE_DEFAULTS.nutrition)) throw new Error(`Unknown nutrition category: ${category}`);
  const next = createPlayerState(state);
  next.nutrition[category] = clamp(next.nutrition[category] + Number(amount || 0), 0, 100);
  return next;
}

/**
 * Advances needs during active play. One Minecraft day is 24,000 ticks.
 * Rates are deliberately conservative prototype balance values, not copied
 * from TFC source code. Negative or invalid elapsed time is ignored.
 */
export function advancePlayerNeeds(state, elapsedTicks, nowTick = undefined) {
  const next = createPlayerState(state);
  const ticks = Number(elapsedTicks);
  if (!Number.isFinite(ticks) || ticks <= 0) {
    if (Number.isFinite(nowTick) && nowTick >= 0) next.lastUpdated = nowTick;
    return next;
  }
  const days = ticks / 24000;
  next.hydration = clamp(next.hydration - 18 * days, 0, 100);
  for (const category of Object.keys(next.nutrition)) {
    next.nutrition[category] = clamp(next.nutrition[category] - 2.4 * days, 0, 100);
  }
  if (Number.isFinite(nowTick) && nowTick >= 0) next.lastUpdated = nowTick;
  return next;
}

export function serializePlayerState(state) {
  return JSON.stringify(createPlayerState(state));
}

export function deserializePlayerState(serialized) {
  try {
    const parsed = JSON.parse(serialized);
    if (!parsed || typeof parsed !== "object") return createPlayerState();
    return createPlayerState(parsed);
  } catch {
    return createPlayerState();
  }
}

export function readEntityState(entity, key = "tfc:player_state") {
  const raw = entity.getDynamicProperty(key);
  return deserializePlayerState(typeof raw === "string" ? raw : "");
}

export function writeEntityState(entity, state, key = "tfc:player_state") {
  entity.setDynamicProperty(key, serializePlayerState(state));
}
