import { ActionFormData } from "@minecraft/server-ui";
import { world } from "@minecraft/server";
import { calculateAmbientTemperatureC, getSeasonName, getBiomeClimateProfile } from "../core/climate-service.mjs";
import { deserializePlayerState } from "../core/player-state-service.mjs";
import { readStackFreshness } from "../core/food-stack-service.mjs";

const UI_TITLE = "TerraFirmaCraft: Bedrook";
const PLAYER_STATE_KEY = "tfc:player_state";
const FOOD_LABELS = Object.freeze({ "tfc:raw_meat":"生肉", "tfc:cooked_meat":"焼いた肉", "tfc:grain":"穀物", "tfc:maize":"トウモロコシ", "tfc:potato":"ジャガイモ", "tfc:vegetable":"野菜", "tfc:fruit":"果物", "tfc:milk_bottle":"牛乳瓶", "tfc:dried_meat":"干し肉", "tfc:dried_fruit":"干し果物", "tfc:dried_vegetables":"干し野菜", "tfc:barley":"大麦", "tfc:oat":"オーツ麦", "tfc:rye":"ライ麦", "tfc:beet":"ビーツ", "tfc:cabbage":"キャベツ", "tfc:carrot":"ニンジン","tfc:garlic":"ニンニク","tfc:onion":"タマネギ","tfc:squash":"カボチャ","tfc:lentils":"レンズ豆","tfc:soybean":"大豆","tfc:peanuts":"落花生","tfc:bread":"パン","tfc:rice":"米","tfc:cassava":"キャッサバ","tfc:green_beans":"インゲン","tfc:pumpkin":"パンプキン","tfc:melon":"メロン","tfc:tomato":"トマト","tfc:green_bell_pepper":"ピーマン","tfc:radish":"ラディッシュ" });
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
    .button("食品保存・乾燥")
    .button("堆肥・土壌肥沃度")
    .button("石臼・パン作り")
    .button("戻る");
  const response = await showForm(player, form);
  if (!response || response.canceled) return;
  const pages = [
    ["序盤の進行", "火打石を使うと5×5ナッピングUIが開きます。正しい位置を選ぶと石片を作成できます。粘土玉4個で未焼成土器、8個で未焼成インゴット鋳型を作り、Pit Kilnで焼成します。"],
    ["地質・鉱石・気候", "地質調査具を岩石に使うと、周囲9×9×5ブロックの範囲にあるバニラ鉱石を調査し、専用UIに検出数と量の目安を表示します。現段階では既存鉱石の痕跡調査で、TFC独自の鉱脈生成や岩石層による鉱石制限は地形工程に残しています。"],
    ["金属加工・鍛冶", "焚き火/Pit Kiln/るつぼは燃料を手に持って操作すると燃料を投入します。必要温度に達したら設備UIから工程を選択。銅・錫鉱石をそれぞれ2個と焼成済み鋳型で鋳造し、加熱インゴットを水で冷却します。銅9・錫1の比率で青銅を鋳造し、金床で銅板/青銅板へ加工できます。金床の「水で冷却」は近くに水源が必要です。"],
    ["農業・食品", "小麦・トウモロコシ・ジャガイモの種は既存レシピで作成できます。穀物・豆類・アルファルファ・カノーラ・ラディッシュの種は草地、野菜・トマト・パプリカ・ジュートの種はシダ、水稲・パピルス・サトウキビの種は水草、キャッサバなどは枯れ木から低確率で見つかります。成熟作物を収穫すると対応する種が1つ戻ります。穀物やトウモロコシは石臼で小麦粉にし、小麦粉と水入り土器を使って生地を作り、焚き火でパンを焼けます。TFC耕作土に対応する種を持って操作して植え付け、適温・適水分で成長し、トウモロコシ・インゲン・トマト・サトウキビ・ジュート・パピルスは2ブロックの高さまで育ちます。インゲンとトマトには隣接するトレリスが必要です。米は近くに淡水が必要です。赤/黄パプリカは成熟途中から実を繰り返し収穫できます。カボチャ/メロンは成熟後、周囲に最大2個の実ブロックを広げます。実を壊しても株は残り、再び実をつけます。アルファルファ・カノーラ・ラディッシュは土壌養分を補う被覆作物です。NPKは成長速度と土壌への養分出入りに影響します。肥沃度クラスは肥料効果を補正します。成熟後に操作して収穫します。大麦・オーツ麦・ライ麦・米は穀物、ビーツ・キャベツ・ニンジン・ニンニク・タマネギ・カボチャ・キャッサバ・インゲン・パンプキン・トマト・ピーマン・ラディッシュは野菜、レンズ豆・大豆・落花生はタンパク源として食品栄養と腐敗管理に接続しています。メロンは果物として扱います。食品は実時間換算で鮮度が下がり、腐敗すると腐敗食品へ変わります。乾燥棚では肉・果物・野菜を長時間かけて干し、腐敗速度を抑えた保存食を作れます。乾燥食品も鮮度が下がりますが、生鮮食品より長持ちします。粘土の封印具をチェストや樽などの容器に使うと封印状態になり、中の食品の腐敗速度が半分になります。容器を開くと自動で封印が解除されます。"],
    ["動物・畜産", "牛・羊・ニワトリの給餌と繁殖はバニラの仕組みを使い、TFC側で空腹/渇き/健康/年齢を管理します。牛にはオス/メスがあり、メスの成体だけが1日ごとに牛乳を生産します。空き瓶で採取できます。シカは独自の給餌・繁殖処理です。"],
    ["食品保存・乾燥", "作業台で棒6本と糸1本から乾燥棚を作れます。乾燥棚を設置して操作し、生肉・果物・野菜を時間をかけて乾燥。干し肉・干し果物・干し野菜は通常の食品より鮮度が長持ちします。"],
    ["堆肥・土壌肥沃度", "コンポスターでは野菜または果物と落ち葉を組み合わせ、約10日かけて堆肥を作れます。堆肥は窒素とカリウム、骨粉はリンを補給します。土壌の肥沃度クラスによって肥料の効果が変化します。"],
    ["石臼・パン作り", "石臼は上臼石と穀物を投入して操作すると、小麦粉を作れます。小麦粉を手に持って使用し、水入り土器をインベントリに用意すると生地を作り、空の土器が戻ります。生地を焚き火で焼くとパンになります。"]
  ];
  if (response.selection === 8) return void await showMainMenu(player);
  const page = pages[response.selection];
  if (page) await showInfo(player, page[0], page[1]);
}

async function showFoodInventory(player) {
  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory) return void await showInfo(player,"食品鮮度一覧","インベントリを読み取れませんでした。");
  const rows=[];
  for(let slot=0;slot<inventory.size;slot++){
    const stack=inventory.getItem(slot);
    if(!stack)continue;
    const name=FOOD_LABELS[stack.typeId];
    if(!name&&stack.typeId!=="tfc:spoiled_food")continue;
    let freshness=0;
    if(stack.typeId!=="tfc:spoiled_food"){
      try{freshness=readStackFreshness(stack.getLore()).freshness;}catch{freshness=100;}
    }
    const stage=stack.typeId==="tfc:spoiled_food"||freshness<=0?"腐敗":freshness>=75?"新鮮":freshness>=40?"劣化中":"腐敗間近";
    const color=stage==="新鮮"?"§a":stage==="劣化中"?"§e":"§c";
    rows.push(color+"スロット "+(slot+1)+"｜"+(name??"腐敗食品")+" ×"+stack.amount+"｜鮮度 "+Math.round(freshness)+"%｜"+stage);
  }
  const body=rows.length?rows.join("\n")+"\n\n各行は別々のItemStackです。同じ種類でもスタックごとに鮮度が異なる場合があります。":"インベントリに対象食品はありません。";
  await showInfo(player,"食品鮮度一覧",body);
}

async function showPlayerStatus(player) {
  const raw = player.getDynamicProperty(PLAYER_STATE_KEY);
  const state = deserializePlayerState(typeof raw === "string" ? raw : "");
  const dayOfYear = ((world.getDay() % 96) + 96) % 96;
  const season = getSeasonName(dayOfYear);
  let biomeId = "minecraft:plains";
  try { biomeId = player.dimension.getBiome({ x: Math.floor(player.location.x), y: Math.floor(player.location.y), z: Math.floor(player.location.z) }).id; } catch {}
  const temperatureC = calculateAmbientTemperatureC({ ...getBiomeClimateProfile(biomeId), dayOfYear, timeOfDay: world.getTimeOfDay(), elevationM: Math.max(0, player.location.y - 63), diurnalAmplitudeC: 3 });
  const nutrition = Object.entries(state.nutrition)
    .map(([key, value]) => `${NUTRITION_LABELS[key] ?? key}: ${Math.round(value)} / 100`)
    .join("\n");
  const inventory = player.getComponent("minecraft:inventory")?.container;
  const freshnessByFood = {};
  if (inventory) for (let slot = 0; slot < inventory.size; slot++) {
    const stack = inventory.getItem(slot);
    if (!stack || !FOOD_LABELS[stack.typeId]) continue;
    const freshness = readStackFreshness(stack.getLore()).freshness;
    if (!freshnessByFood[stack.typeId]) freshnessByFood[stack.typeId] = [];
    freshnessByFood[stack.typeId].push(freshness);
  }
  const freshnessLines = Object.entries(freshnessByFood)
    .map(([id, values]) => `${FOOD_LABELS[id]}: ${Math.round(Math.min(...values))}%（${values.length}スタック）`)
    .join("\n");
  await showInfo(player, "プレイヤー情報", [
    `季節: ${season}（${dayOfYear + 1} / 96日）`,
    `推定気温: ${temperatureC.toFixed(1)}°C`,
    "",
    `水分: ${Math.round(state.hydration)} / 100`,
    "",
    "栄養状態:",
    nutrition,
    "",
    "インベントリ食品の鮮度:",
    freshnessLines || "鮮度計測中 / 対象食品なし",
    "",
    "※食品は時間経過で鮮度が低下し、腐敗すると腐敗食品へ変換されます。鮮度は食品スタックごとに保存され、インベントリ移動後も引き継がれます。開いた収納箱も追跡対象として保存され、箱の中の食品も腐敗します。同じスタック内の食品は同じ鮮度です。"
  ].join("\n"));
}

async function showSystemOverview(player) {
  const body = [
    "実装状況（開発ブランチ）",
    "",
    "・プレイヤー状態: 保存・初期化・プレイ中の水分/栄養減少あり",
    "・気候 / 金属 / 熱: 基礎計算モジュールあり",
    "・農業 / 土壌 / 肥料: 15品種（小麦・トウモロコシ・ジャガイモ・大麦・オーツ麦・ライ麦・根菜・葉菜・豆類等）を適温/水分とNPKで判定。8種の肥沃度クラスが肥料効果を補正。コンポスター・堆肥・木灰を実装。バイオーム系統別の地域気温を作物成長に反映。栽培中の最低栄養充足率が収穫量を補正",
    "・食品: 32種類の摂取による栄養/水分反映、実時間換算の鮮度減少、腐敗食品への変換、乾燥棚による保存食作成を接続",
    "・動物: シカとバニラ牛/羊/ニワトリの状態・給餌・採食・繁殖処理あり。成体の牛から瓶でミルク採取",
    "・地質 / 地形分類: 基礎モデルあり",
    "・専用アイテム: 石片・食品・土器・銅素材・設備を登録",
    "・設備: 焚き火 / Pit Kiln / るつぼ / 金床 / 乾燥棚 / コンポスター / 石臼。加工レシピ統一、ジョブ保存/再参加復旧、鋳型焼成、銅/錫/青銅鋳造、乾燥保存、堆肥発酵あり",
    "",
    "農業は降雨はバイオーム系統別の降水係数を反映し、96日季節/昼夜気温・地域気温・標高補正も適用。地域値はバニラBiome IDからの大まかな推定で、TFC気候データへの置換は地形資料と合わせて実施。動物の採食は近傍草ブロックによる簡易モデルです。食品鮮度はItemStack Loreに保存し、72000 ticksを実時間1時間として換算、季節/昼夜/標高/バイオームの推定気温でスタックごとに腐敗計算します。開いた収納箱は座標をワールド保存し、箱内の食品も追跡します。Loreの保存・分割/統合・摂取イベント、ワールドに落ちた食品の腐敗、完全な金属熱伝達、乾燥棚の温湿度による乾燥速度調整、26.60実機互換性は引き続き確認が必要です。"
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
    .button("食品鮮度一覧")
    .button("閉じる");
  const response = await showForm(player, form);
  if (!response || response.canceled) return;
  switch (response.selection) {
    case 0: await showFieldGuide(player); break;
    case 1: await showPlayerStatus(player); break;
    case 2: await showSystemOverview(player); break;
    case 3: await showFoodInventory(player); break;
    default: break;
  }
}
