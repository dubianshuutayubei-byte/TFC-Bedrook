const SEASON_LABELS = Object.freeze({
  winter: "冬",
  spring: "春",
  summer: "夏",
  autumn: "秋",
});

/**
 * Builds the compact, device-friendly survival HUD line.
 * Needs that are not yet connected to live player state are intentionally omitted.
 */
export function formatSurvivalHud(calendar) {
  if (!calendar || !Number.isInteger(calendar.year) ||
      !Number.isInteger(calendar.dayOfYearNumber) ||
      !Object.hasOwn(SEASON_LABELS, calendar.season)) {
    throw new TypeError("Invalid calendar data for survival HUD");
  }

  return `§6TFC§r  第${calendar.year}年  §e${SEASON_LABELS[calendar.season]}§r  ${calendar.dayOfYearNumber}日目`;
}
