import { world } from "@minecraft/server";
import { showMainMenu } from "./ui/main-menu.js";

const MENU_EVENT_ID = "tfc:menu";

world.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== MENU_EVENT_ID) return;

  const player = event.sourceEntity;
  if (!player || player.typeId !== "minecraft:player") return;

  void showMainMenu(player);
});
