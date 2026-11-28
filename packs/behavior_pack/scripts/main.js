import { system, world } from "@minecraft/server";
import { getCalendarInfo } from "./core/climate-service.mjs";

const DAYS_PER_YEAR = 96;
const CALENDAR_POLL_TICKS = 200;

const SEASON_JA = Object.freeze({
  winter: "冬",
  spring: "春",
  summer: "夏",
  autumn: "秋",
});

function formatCalendar(calendar) {
  return `第${calendar.year}年・${SEASON_JA[calendar.season]} ${calendar.dayOfYearNumber}日目`;
}

function announceSeasonChange(previousSeason, nextSeason) {
  if (previousSeason === nextSeason) return;
  world.sendMessage(
    `§6[TFC-Bedrook]§r 季節が${SEASON_JA[nextSeason]}に変わりました。`
  );
}

world.afterEvents.playerSpawn.subscribe((event) => {
  if (!event.initialSpawn) return;
  system.run(() => {
    try {
      const calendar = getCalendarInfo(world.getDay(), DAYS_PER_YEAR);
      event.player.sendMessage(
        `§6[TFC-Bedrook]§r 暦：${formatCalendar(calendar)}`
      );
    } catch (error) {
      console.warn(`[TFC-Bedrook] Calendar display failed: ${error}`);
    }
  });
});

system.runTimeout(() => {
  try {
    let lastSeason = getCalendarInfo(world.getDay(), DAYS_PER_YEAR).season;
    system.runInterval(() => {
      try {
        const currentSeason = getCalendarInfo(world.getDay(), DAYS_PER_YEAR).season;
        announceSeasonChange(lastSeason, currentSeason);
        lastSeason = currentSeason;
      } catch (error) {
        console.warn(`[TFC-Bedrook] Calendar update failed: ${error}`);
      }
    }, CALENDAR_POLL_TICKS);
  } catch (error) {
    console.warn(`[TFC-Bedrook] Calendar startup failed: ${error}`);
  }
}, 1);
