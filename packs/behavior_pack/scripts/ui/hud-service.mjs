const SEASON_LABELS = Object.freeze({
  winter: "冬",
  spring: "春",
  summer: "夏",
  autumn: "秋",
});

/**
 * Builds the compact, device-friendly survival HUD line.
 * Only values supplied by live player state are displayed.
 */
export function formatSurvivalHud(calendar, playerState = undefined) {
  if (!calendar || !Number.isInteger(calendar.year) ||
      !Number.isInteger(calendar.dayOfYearNumber) ||
      !Object.hasOwn(SEASON_LABELS, calendar.season)) {
    throw new TypeError("Invalid calendar data for survival HUD");
  }

  const date = `§6TFC§r  第${calendar.year}年  §e${SEASON_LABELS[calendar.season]}§r  ${calendar.dayOfYearNumber}日目`;
  if (!playerState) return date;

  const hydration = playerState.hydration;
  if (typeof hydration !== "number" || !Number.isFinite(hydration)) {
    throw new TypeError("Invalid hydration value for survival HUD");
  }
  return `${date}  §b水分 ${Math.round(Math.max(0, Math.min(100, hydration)))}%§r`;
}
