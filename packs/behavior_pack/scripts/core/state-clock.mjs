export function elapsedGameHours(previousTick, currentTick, ticksPerHour = 1000) {
  if (![previousTick, currentTick, ticksPerHour].every(Number.isFinite) || ticksPerHour <= 0) return 0;
  return Math.max(0, currentTick - previousTick) / ticksPerHour;
}

export function shouldRunInterval(currentTick, intervalTicks, lastRunTick = 0) {
  if (!Number.isFinite(currentTick) || !Number.isFinite(intervalTicks) || intervalTicks <= 0) return false;
  return currentTick - lastRunTick >= intervalTicks;
}
