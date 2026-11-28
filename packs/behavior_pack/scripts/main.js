import { system, world } from "@minecraft/server";
import { getCalendarInfo } from "./core/climate-service.mjs";
import { formatSurvivalHud } from "./ui/hud-service.mjs";

const DAYS_PER_YEAR = 96;
const HUD_REFRESH_TICKS = 40;
const SEASON_CHECK_TICKS = 200;

const SEASON_JA = Object.freeze({
  winter: "冬",
  spring: "春",
  summer: "夏",
  autumn: "秋",
});

function announceSeasonChange(previousSeason, nextSeason) {
  if (previousSeason === nextSeason) return;
  world.sendMessage(
    `§6[TFC-Bedrook]§r 季節が${SEASON_JA[nextSeason]}に変わりました。`
  );
}

function updatePlayerHud(player, calendar) {
  try {
    player.onScreenDisplay.setActionBar(formatSurvivalHud(calendar));
  } catch (error) {
    console.warn(`[TFC-Bedrook] HUD update failed for ${player.name}: ${error}`);
  }
}

world.afterEvents.playerSpawn.subscribe((event) => {
  if (!event.initialSpawn) return;
  system.run(() => {
    try {
      const calendar = getCalendarInfo(world.getDay(), DAYS_PER_YEAR);
      updatePlayerHud(event.player, calendar);
    } catch (error) {
      console.warn(`[TFC-Bedrook] Initial HUD display failed: ${error}`);
    }
  });
});

let lastSeason;
let seasonCheckCounter = 0;

system.runTimeout(() => {
  try {
    lastSeason = getCalendarInfo(world.getDay(), DAYS_PER_YEAR).season;
    system.runInterval(() => {
      try {
        const calendar = getCalendarInfo(world.getDay(), DAYS_PER_YEAR);
        for (const player of world.getPlayers()) {
          updatePlayerHud(player, calendar);
        }

        seasonCheckCounter += HUD_REFRESH_TICKS;
        if (seasonCheckCounter >= SEASON_CHECK_TICKS) {
          seasonCheckCounter = 0;
          announceSeasonChange(lastSeason, calendar.season);
          lastSeason = calendar.season;
        }
      } catch (error) {
        console.warn(`[TFC-Bedrook] HUD/calendar update failed: ${error}`);
      }
    }, HUD_REFRESH_TICKS);
  } catch (error) {
    console.warn(`[TFC-Bedrook] HUD startup failed: ${error}`);
  }
}, 1);
