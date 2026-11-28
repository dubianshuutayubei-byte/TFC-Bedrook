# NeoForge TFC 1.21.1-4.2.16 畜産仕様監査

## 参照範囲

- ユーザー提供: `TerraFirmaCraft-NeoForge-1.21.1-4.2.16.jar`
- Java版公式ソース: [ServerConfig.java / 1.21.x](https://github.com/TerraFirmaCraft/TerraFirmaCraft/blob/1.21.x/src/main/java/net/dries007/tfc/config/ServerConfig.java)
- Java版共通動物仕様: [TFCAnimalProperties.java / 1.21.x](https://github.com/TerraFirmaCraft/TerraFirmaCraft/blob/1.21.x/src/main/java/net/dries007/tfc/common/entities/livestock/TFCAnimalProperties.java)
- 公式ガイド: [Animal Husbandry](https://terrafirmacraft.github.io/Field-Guide/21/en_us/food/animal_husbandry/)

この資料では、Java 1.21.1系の畜産値をBedrock実装の参照基準にする。JAR内のクラス一覧で `TFCAnimalProperties`、`Mammal`、`ProducingMammal`、`DairyAnimal`、`OviparousAnimal`、`WoolyAnimal`、`BreedBehavior`、`LayEggBehavior`、`LivestockAi`、`NearestNestBoxSensor` を確認した。

## Java 1.21.x のServerConfig値

| 種 | 成熟日 | 老齢化までの使用回数 | 妊娠日数 | 子の数 | 産出間隔 |
|---|---:|---:|---:|---:|---:|
| ブタ | 80 | 60 | 19 | 最大10 | — |
| ロバ | 80 | 60 | 19 | 1 | — |
| ラバ | 80 | 60 | 19 | 1 | — |
| ウマ | 80 | 60 | 19 | 1 | — |
| ヒトコブラクダ | 80 | 60 | 19 | 1 | — |
| ネコ | 50 | 60 | 19 | 6 | — |
| イヌ | 50 | 60 | 19 | 2 | — |
| ウサギ | 30 | 40 | 19 | 6 | — |
| ウシ | 192 | 128 | 58 | 2 | 24時間 |
| ヤギ | 96 | 60 | 32 | 2 | 72時間 |
| ヤク | 180 | 230 | 64 | 1 | 24時間 |
| アルパカ | 98 | 128 | 36 | 2 | 120時間 |
| ヒツジ | 56 | 60 | 32 | 2 | 96時間 |
| ジャコウウシ | 168 | 160 | 64 | 1 | 96時間 |
| フタコブラクダ | 80 | 80 | 24 | 1 | 168時間 |
| ニワトリ | 24 | 100 | — | — | 産卵30時間・孵化8日 |
| アヒル | 32 | 72 | — | — | 産卵32時間・孵化8日 |
| ウズラ | 22 | 48 | — | — | 産卵28時間・孵化8日 |

時間単位はJava側の `PLAYER_TICKS_IN_DEFAULT_HOUR` に基づく。Bedrock側ではTFCのゲーム内カレンダーへ変換して扱う。値はServerConfigの既定値であり、サーバー設定変更時には異なる。

## 共通動物仕様として再現する項目

- 性別、出生時刻、成熟、老齢、使用回数、なつき度、最終給餌、最終交配、受精状態を個体データとして保持する。
- 成体の交配には原則としてなつき度30%以上、未受精、空腹でないこと、交配クールダウンを要求する。
- 受精したメスが妊娠状態を保持し、妊娠期間後に出産する。オスは交配時に使用回数が5増える。
- 子は親のなつき度を引き継ぐ。親のなつき度が90%未満なら半分、90%以上なら90%相当を継承する。
- 乳畜・羊毛動物・卵生動物は、成熟・なつき度・産出クールダウンなどを満たした場合だけ産出する。
- 卵生動物は巣箱を自分で探して産卵する。オスがメスを受精させると、次に産む卵が受精卵となり、孵化までの時間を持つ。
- 飼料タグと腐敗食品可否は種ごとに異なる。全種共通の餌として扱わない。

## 現行Bedrock実装との照合・修正履歴

- 旧ロスターはTFC 3.2.26の `data/tfc/tfc/fauna` 由来63種だった。Java 1.21.xの `Faunas.java`（49種）と `Fish.java`（16種）、および13種の魚・水生動物登録を照合すると公式対象は78種。旧ロスターに欠けていた15種（池のカメ、ヒョウアザラシ、バイソン、ヒトコブラクダ、フタコブラクダ、アルマジロ、ノーザンパイク、バーボット、アークティックチャー、ムクスン、ティラピア、スポッテッドガジョン、ピーコックバス、パクー、レッドピラニア）を追加し、Bedrock未実装として明示した。
- ウサギの成熟日を20日から、1.21.x ServerConfig既定値の30日に修正した。
- ヒトコブラクダ・フタコブラクダのJava設定値をライフサイクル表に追加した。Bedrock側のEntity定義・モデル・自然スポーン・AI接続は別途実装が必要であり、この追加だけでゲーム内対応済みとはしない。
- `canProduce` が `maxUses` 引数を受け取っているのに上限判定をしていなかったため、使用回数上限に達した個体の産出を拒否するよう修正し、回帰テストを追加した。
- 産出回数上限到達時の老齢化猶予期間について、サービス層では継続産出を許可していた一方、乳・羊毛の操作UIが `uses >= maxUses` で即時拒否していた不整合を修正した。現在は `oldDay` までは産出可能、期限経過後または `lifeStage=old` で停止する。回帰テストを追加し、CIで338件すべて成功。
- 交配時にオスの共通使用回数を5増やすJava TFCの仕様を確認し、Bedrock側の処理を維持する回帰テストを追加した。繁殖回数は乳・羊毛・卵の使用回数とは別カウンターではなく、Java参照どおり共通の老齢化カウンターに加算する。CIで341件すべて成功。
- Java 1.21.xの `TFCEntities` と `ServerConfig` を再照合し、ヒトコブラクダ・フタコブラクダ・ネコ・イヌのランタイム種別プロファイルを追加した。成熟・妊娠・子数・使用回数はServerConfig既定値に接続。餌候補は `CAMEL_FOOD`（穀物・果物）、`CAT_FOOD`（穀物・加熱肉・乳製品・加熱魚）、`DOG_FOOD`（肉類）の公式タグ構成を参照して、現行Bedrockアイテムに存在する範囲で登録した。プロファイル接続のCIは342件すべて成功。ただし4種のBedrock Entity定義・専用モデル/テクスチャ・スポーン・専用AIは未実装であり、ゲーム内対応済みとは扱わない。
- 追加監査で `ServerConfig.java` の既定値を再検証し、4種の値を `OFFICIAL_LIVESTOCK_LIFECYCLE` に集約。フタコブラクダは `ProducingMammalConfig` + `IShearable` のため `wooly=true` とし、168時間の毛再生間隔（7日）を反映。イヌは `dogEatsRottenFood=true` のため `tfc:spoiled_food` を餌候補へ追加。成長イベント対象にも4種を接続した。
- `BuiltinFauna.java` ではヒトコブラクダが `maxGroundwater(100)` + `minTemperature(-5)`、フタコブラクダが `maxGroundwater(100)` + `maxTemperature(-5)`。これは降雨量ではなく地下水条件であるため、現行Bedrockの降雨量プロファイルへ誤変換しない。地下水を取得・評価する環境層が未実装のため、正確な自然スポーン制限は保留。
- `Faunas.java` はラクダ2種を自然スポーン対象として登録する一方、ネコ・イヌは `TFCEntities` / spawn egg と `ServerConfig` に存在するが `Faunas` の自然スポーン登録には含まれない。したがってネコ・イヌにラクダと同じ自然スポーン規則を与えない。
- Java 1.21.x公式ロスターを78種へ拡張。既存Bedrock実装63種は維持し、追加15種は `fauna-roster.json` / `fauna-archetypes.json` / `fauna-runtime-coverage.json` に未実装として登録した。カバレッジの完了フラグを `false` に変更し、未実装を完了扱いしないテストを追加。

## 残作業（完成判定に必要）

1. 78種の公式ロスターとBedrock既存63種を完全照合し、追加15種を実装する。
2. ラクダ2種、ネコ、イヌなど不足Entityの実装要否を確定し、必要なものを追加する。
3. 種別の餌タグ、腐敗食品可否、繁殖可否、産出種別、産出間隔、巣箱挙動を照合する。
4. 産出上限・老齢化・死亡・出産再試行・孵化再試行の保存整合性テストを拡張する。
5. Minecraft Bedrock 26.60実機で、繁殖・出産・産卵・孵化・採乳・毛刈り・死亡・再参加後の状態復元を確認する。

## 完了条件

- 全対象種に対して個体状態、自然スポーン、生息条件、AI、餌、繁殖または卵生産、成長、産出、老齢/死亡が接続されている。
- アイテム・Entity・ブロック・Script APIのIDが整合し、Node/CI検査を通過する。
- 産出物・卵・子個体が、失敗や再起動で重複または消失しない。
- 実機未確認の項目は完成扱いにしない。
