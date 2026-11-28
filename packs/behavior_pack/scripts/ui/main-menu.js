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
    "※水分・栄養はプレイ中に時間経過で減少します。登録済み食品を食べると、栄養・水分が反映されます。"
  ].join("\n"));
}

async function showSystemOverview(player) {
  const body = [
    "実装状況（開発ブランチ）",
    "",
    "・プレイヤー状態: 保存・初期化・プレイ中の水分/栄養減少あり",
    "・気候 / 金属 / 熱: 基礎計算モジュールあり",
    "・農業 / 土壌 / 肥料: 小麦相当作物は気温・水分・窒素・土質の条件判定あり（気温は仮固定）",
    "・食品: 食べる操作とTFC栄養・水分への反映を接続",
    "・動物: シカとバニラ牛/羊/ニワトリの状態・給餌・採食・繁殖処理あり",
    "・地質 / 地形分類: 基礎モデルあり",
    "・専用アイテム: 石片・食品・土器・銅素材・設備を登録",
    "・設備: 焚き火 / Pit Kiln / るつぼ / 金床。加工レシピ統一、ジョブ保存/再参加復旧、鋳型焼成と銅鋳造あり",
    "",
    "農業は降雨イベントを水分へ反映。動物の採食は近傍草ブロックによる簡易モデルです。食品腐敗の全ゲーム接続、完全な金属熱伝達、26.60実機互換性は引き続き確認が必要です。"
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
