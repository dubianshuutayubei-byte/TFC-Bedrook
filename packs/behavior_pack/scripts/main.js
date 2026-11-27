import { world } from "@minecraft/server";

/**
 * TFC-Bedrook bootstrap.
 * Keep startup side effects small; gameplay services are connected only after
 * their Bedrock API and persistence contracts have been verified.
 */
world.afterEvents.playerSpawn.subscribe((event) => {
  if (!event.initialSpawn) return;
  event.player.sendMessage("§6[TFC-Bedrook]§r 初期化しました。開発版のため、機能は順次追加されます。");
});
