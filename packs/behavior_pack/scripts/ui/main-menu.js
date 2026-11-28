import { ActionFormData } from "@minecraft/server-ui";
import { deserializePlayerState } from "../core/player-state-service.mjs";

const UI_TITLE = "TerraFirmaCraft: Bedrook";
const PLAYER_STATE_KEY = "tfc:player_state";
const FOOD_FRESHNESS_KEY = "tfc:food_freshness";
const FOOD_LABELS = Object.freeze({ "tfc:raw_meat":"生肉", "tfc:cooked_meat":"焼いた肉", "tfc:grain":"穀物", "tfc:maize":"トウモロコシ", "tfc:potato":"ジャガイモ", "tfc:milk_bottle":"牛乳瓶" });
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
  let freshness = {};
  try { freshness = JSON.parse(String(player.getDynamicProperty(FOOD_FRESHNESS_KEY) ?? "{}")); } catch {}
  const freshnessLines = Object.entries(freshness)
    .filter(([id]) => FOOD_LABELS[id])
    .map(([id, value]) => `${FOOD_LABELS[id]}: ${Math.round(value.freshness ?? 100)}%`)
    .join("\n");
  await showInfo(player, "プレイヤー情報", [
    `水分: ${Math.round(state.hydration)} / 100`,
    "",
    "栄養状態:",
    nutrition,
    "",
    "インベントリ食品の鮮度:",
    freshnessLines || "鮮度計測中 / 対象食品なし",
    "",
    "※食品は時間経過で鮮度が低下し、腐敗すると腐敗食品へ変換されます。鮮度は食品種類ごとにプレイヤー単位で管理する簡易方式です。"
  ].join("\n"));
}

async function showSystemOverview(player) {
  const body = [
    "実装状況（開発ブランチ）",
    "",
    "・プレイヤー状態: 保存・初期化・プレイ中の水分/栄養減少あり",
    "・気候 / 金属 / 熱: 基礎計算モジュールあり",
    "・農業 / 土壌 / 肥料: 小麦・トウモロコシ・ジャガイモは品種別に水分・栄養・土質・季節/昼夜気温を判定（地域気候は未接続）",
    "・食品: 摂取による栄養/水分反映、インベントリ鮮度減少、腐敗食品への変換を接続",
    "・動物: シカとバニラ牛/羊/ニワトリの状態・給餌・採食・繁殖処理あり。成体の牛から瓶でミルク採取",
    "・地質 / 地形分類: 基礎モデルあり",
    "・専用アイテム: 石片・食品・土器・銅素材・設備を登録",
    "・設備: 焚き火 / Pit Kiln / るつぼ / 金床。加工レシピ統一、ジョブ保存/再参加復旧、鋳型焼成と銅鋳造あり",
    "",
    "農業は降雨と96日季節/昼夜気温を反映。気温は全地域共通の暫定値で、地形・標高・地域気候は未接続。動物の採食は近傍草ブロックによる簡易モデルです。食品鮮度はプレイヤー単位・食品種類単位で、温度は仮固定。食品の受け渡し時の鮮度継承、保存食、完全な金属熱伝達、26.60実機互換性は引き続き確認が必要です。"
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
