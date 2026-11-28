import { ActionFormData } from "@minecraft/server-ui";

const UI_TITLE = "TerraFirmaCraft: Bedrook";

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
  const form = new ActionFormData()
    .title(title)
    .body(body)
    .button("メインメニューへ戻る");

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
    ["金属加工・鍛冶", "鉱石処理、溶解、鋳造、合金、加熱、金床加工を共通の熱・金属データで管理する計画です。"],
    ["農業・食品", "作物ごとの気温・水分・土壌栄養、食品の栄養・水分・腐敗を連動させます。"],
    ["動物・畜産", "動物の生息条件、成長、親密度、繁殖、産出を管理する計画です。"]
  ];

  if (response.selection === 5) {
    await showMainMenu(player);
    return;
  }

  const page = pages[response.selection];
  if (page) await showInfo(player, page[0], page[1]);
}

async function showPlayerStatus(player) {
  const hydration = player.getDynamicProperty("tfc:hydration");
  const nutrition = player.getDynamicProperty("tfc:nutrition_summary");
  const lines = ["プレイヤー状態"];

  lines.push(typeof hydration === "number" ? `水分: ${Math.round(hydration)}` : "水分: 未初期化");
  lines.push(typeof nutrition === "string" ? `栄養: ${nutrition}` : "栄養: 未初期化");
  lines.push("");
  lines.push("状態データの保存基盤は準備中です。未実装の値を実測値として表示しません。");

  await showInfo(player, "プレイヤー情報", lines.join("\n"));
}

async function showSystemOverview(player) {
  const body = [
    "実装状況（開発ブランチ）",
    "",
    "・気候計算: 基礎ロジックあり",
    "・金属 / 合金: 基礎ロジックあり",
    "・熱 / 燃料: 基礎ロジックあり",
    "・UI: 初期メニューを実装",
    "・地形 / 地質生成: 未実装",
    "・食品 / 農業 / 動物: データ・ゲーム内連携は未完成",
    "",
    "この画面は開発状況を示すもので、ゲーム内機能の完成を意味しません。"
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
