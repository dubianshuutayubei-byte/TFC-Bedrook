import { world, system } from "@minecraft/server";
import { showMainMenu } from "./ui/main-menu.js";
import { createPlayerState, deserializePlayerState, serializePlayerState, advancePlayerNeeds } from "./core/player-state-service.mjs";

const MENU_EVENT_ID = "tfc:menu";
const PLAYER_STATE_KEY = "tfc:player_state";
const NEEDS_UPDATE_INTERVAL_TICKS = 200;

function loadPlayerState(player, nowTick) {
  const raw = player.getDynamicProperty(PLAYER_STATE_KEY);
  const state = typeof raw === "string"
    ? deserializePlayerState(raw)
    : createPlayerState();
  // Offline time is not simulated yet; reset the clock on join to avoid
  // treating a server restart or offline period as active survival time.
  const synchronized = { ...state, lastUpdated: nowTick };
  player.setDynamicProperty(PLAYER_STATE_KEY, serializePlayerState(synchronized));
}

world.afterEvents.playerSpawn.subscribe((event) => {
  const player = event.player;
  if (!player) return;
  loadPlayerState(player, system.currentTick);
});

system.runInterval(() => {
  const nowTick = system.currentTick;
  for (const player of world.getAllPlayers()) {
    try {
      const raw = player.getDynamicProperty(PLAYER_STATE_KEY);
      const state = deserializePlayerState(typeof raw === "string" ? raw : "");
      const elapsedTicks = state.lastUpdated > 0 && nowTick >= state.lastUpdated
        ? nowTick - state.lastUpdated
        : NEEDS_UPDATE_INTERVAL_TICKS;
      const next = advancePlayerNeeds(state, elapsedTicks, nowTick);
      player.setDynamicProperty(PLAYER_STATE_KEY, serializePlayerState(next));
    } catch (error) {
      console.warn("[TFC-Bedrook] Player needs update failed:", error);
    }
  }
}, NEEDS_UPDATE_INTERVAL_TICKS);

world.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== MENU_EVENT_ID) return;
  const player = event.sourceEntity;
  if (!player || player.typeId !== "minecraft:player") return;
  void showMainMenu(player);
});
