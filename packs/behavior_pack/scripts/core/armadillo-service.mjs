export const ARMADILLO_SCUTE_COOLDOWN_TICKS = 30 * 60 * 20;
export const ARMADILLO_INITIAL_PROGRESS_TICKS = 20 * 60 * 20;

export function initializeArmadilloScuteClock(nowTick, random = 0) {
  const now = Number(nowTick);
  const roll = Number(random);
  if (!Number.isFinite(now)) throw new TypeError("nowTick must be finite");
  const normalized = Number.isFinite(roll) ? Math.min(1, Math.max(0, roll)) : 0;
  return now - Math.floor(normalized * ARMADILLO_INITIAL_PROGRESS_TICKS);
}

export function isArmadilloScuteDue(lastProducedTick, nowTick, cooldownTicks = ARMADILLO_SCUTE_COOLDOWN_TICKS) {
  const last = Number(lastProducedTick);
  const now = Number(nowTick);
  const cooldown = Number(cooldownTicks);
  return Number.isFinite(last) && Number.isFinite(now) && Number.isFinite(cooldown)
    && cooldown >= 0 && now >= last && now - last >= cooldown;
}
