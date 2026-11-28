import { ActionFormData } from "@minecraft/server-ui";
import { deserializePlayerState } from "../core/player-state-service.mjs";

const UI_TITLE = "TerraFirmaCraft: Bedrook";
const PLAYER_STATE_KEY = "tfc:player_state";
const NUTRITION_LABELS = Object.freeze({
  grain: "穀物", fruit: "果物", vegetables: "野菜", protein: "タンパク質", dairy: "乳製品"
});

async function showForm(player, form) {
  try {
    return await form.show(player);
  } catch (error) {
    player.sendMessage("§cTFC-Bedrook: UIを開けませんでした。もう一度お試しください。");
    console.warn("[TFC-Bedrook] UI error:", error);
    return undefined;
  }
}

async function showInfo(player, title, body) {
  const form = new ActionFormData().title(title).body(body).button("メインメニューへ戻る");
  const response = await showForm(player, form);
  if (response && !response.canceled) await showMainMenu(player);
}

async function showFieldGuide(player) {
  const form = new ActionFormData()
    .title("フィールドガイド")
    .body("TFCの主要な進行・自然環境システムを確認できます。")
    .button("序盤の進行")
    .button("地質・鉱石・気候")
    .button("金属加工・鍛冶")
    .button("農業・食品")
    .button("動物・畜産")
    .button("戻る");
  const response = await showForm(player, form);
  if (!response || response.canceled) return;
  const pages = [
    ["序盤の進行", "採集、石器、焚き火、粘土成形、Pit Kiln、初期金属加工を段階的に進めます。"],
    ["地質・鉱石・気候", "岩石層、鉱脈、地域気候、季節、標高が資源と生態系に関係します。"],
    ["金属加工・鍛冶", "鉱石処理、溶解、鋳造、合金、加熱、金床加工を共通の熱・金属データで管理します。"],
    ["農業・食品", "作物ごとの気温・水分・土壌栄養、食品の栄養・水分・鮮度・腐敗・保存を管理します。"],
    ["動物・畜産", "動物の生息条件、成長、親密度、繁殖、産出を管理します。"]
  ];
  if (response.selection === 5) return void await showMainMenu(player);
  const page = pages[response.selection];
  if (page) await showInfo(player, page[0], page[1]);
}

async function showPlayerStatus(player) {
  const raw = player.getDynamicProperty(PLAYER_STATE_KEY);
  const state = deserializePlayerState(typeof raw === "string" ? raw : "");
  const nutrition = Object.entries(state.nutrition)
    .map(([key, value]) => `${NUTRITION_LABELS[key] ?? key}: ${Math.round(value)} / 100`)
    .join("\n");
  await showInfo(player, "プレイヤー情報", [
    `水分: ${Math.round(state.hydration)} / 100`,
    "",
    "栄養状態:",
    nutrition,
    "",
    "※水分・栄養はプレイ中に時間経過で減少します。食品の栄養・水分反映、体温補正、オフライン中の経過はゲーム内接続前です。"
  ].join("\n"));
}

async function showSystemOverview(player) {
  const body = [
    "実装状況（開発ブランチ）",
    "",
    "・プレイヤー状態: 保存・初期化・プレイ中の水分/栄養減少あり",
    "・気候 / 金属 / 熱: 基礎計算モジュールあり",
    "・農業 / 土壌 / 肥料: 判定・成長計算モジュールあり",
    "・食品 / 腐敗 / 保存: 鮮度区分・保存・栄養計算あり",
    "・動物 / 生息条件 / 繁殖: 状態・判定モジュールあり",
    "・地質 / 地形分類: 基礎モデルあり",
    "・専用アイテム・設備との接続: 未完成",
    "・本格的な地形生成: 未完成",
    "",
    "基礎ロジックの存在と、ゲーム内機能の完成は区別しています。"
  ].join("\n");
  await showInfo(player, "システム一覧", body);
}

export async function showMainMenu(player) {
  const form = new ActionFormData()
    .title(UI_TITLE)
    .body("自然環境・採集・加工・生活をつなぐTFC再現アドオン")
    .button("フィールドガイド")
    .button("プレイヤー情報")
    .button("システム一覧")
    .button("閉じる");
  const response = await showForm(player, form);
  if (!response || response.canceled) return;
  switch (response.selection) {
    case 0: await showFieldGuide(player); break;
    case 1: await showPlayerStatus(player); break;
    case 2: await showSystemOverview(player); break;
    default: break;
  }
}
