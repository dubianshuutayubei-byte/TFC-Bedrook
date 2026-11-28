import { world } from "@minecraft/server";
import { showMainMenu } from "./ui/main-menu.js";
import { createPlayerState, deserializePlayerState, serializePlayerState } from "./core/player-state-service.mjs";

const MENU_EVENT_ID = "tfc:menu";
const PLAYER_STATE_KEY = "tfc:player_state";

world.afterEvents.playerSpawn.subscribe((event) => {
  const player = event.player;
  if (!player) return;

  const raw = player.getDynamicProperty(PLAYER_STATE_KEY);
  const state = deserializePlayerState(typeof raw === "string" ? raw : "");
  player.setDynamicProperty(PLAYER_STATE_KEY, serializePlayerState(state));
});

world.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== MENU_EVENT_ID) return;

  const player = event.sourceEntity;
  if (!player || player.typeId !== "minecraft:player") return;

  void showMainMenu(player);
});
