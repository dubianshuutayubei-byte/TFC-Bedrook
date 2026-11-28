# 外部Addon・公式サンプルの高速再利用監査（2026-11-28）

## 目的
TFC-Bedrookの開発期間を短縮する。外部Addonを丸ごと統合するのではなく、既存コード・データ・UI・Entity構造を調査し、TFC仕様に合うものだけを採用する。ゲーム内実機確認が必要な項目は「未検証」と明記する。

## 提供ZIPの監査結果

### 1. minecraft-samples-main.zip
- 2,307 entries。MicrosoftのMinecraftサンプル集。
- ルートLICENSEはMIT License（Copyright Microsoft Corporation）。
- Entity追加例、Addon starter、Behavior/Resource Packの基本構造を含む。
- MIT対象コードを再利用する場合は著作権表示とLICENSEを保持する。
- 採用方針：Entity/Block/Item/UIの雛形や登録構造の比較に使用。既存TFC-Bedrookの構造を壊す全面置換はしない。

### 2. bedrock-samples-main.zip
- 22,939 entries。MojangのBedrock Add-On sample files。
- LICENSE.mdはMinecraft EULA適用を明記。一般的なMITコードとして扱わない。
- Behavior/Resource Pack定義とJSON schemaの参照資料として使用する。
- 採用方針：26.60で使うコンポーネント・フォーマット・定義の照合に優先使用。サンプル素材の再配布はEULA条件を確認する。

### 3. wheel-of-creation-addon-master.zip
- 590 entries。Bedrock 1.21+を対象とする農業・栄養Addon。
- READMEは農業Update I（温度・水分・土壌・遺伝）とUpdate II（栄養・料理）を説明。
- Behavior側LICENSEはGPL-3.0、Resource側LICENSEはCC BY-SA 4.0。Resource内には別ライセンスの第三者素材も存在する。
- 採用方針：土壌水分・養分・作物成長・栄養の設計を比較参照する。コードを取り込む場合はGPL-3.0の派生物・ソース公開条件をプロジェクト全体の配布方針と照合する。Resource Pack素材は個別ライセンスを確認する。

### 4. WorldAnimals-main.zip
- 1,782 entries。READMEは70種以上の動物、繁殖・卵孵化・DNA変換等を説明し、Bedrock 1.21.20+を対象としている。
- ZIP内にプロジェクト全体を対象とする明確なLICENSEファイルを確認できなかった。
- 採用方針：動物Entityの構成・スポーン・繁殖・孵化の調査資料としてのみ使用。ライセンス/権利者の明確な許諾が得られるまでコード・モデル・テクスチャをコピーしない。70種をTFCの動物ロスターとして扱わない。

## 開発短縮に向けた採用順位
1. 公式Bedrock Samples：JSON仕様・API構造の照合。
2. Microsoft minecraft-samples：MIT条件を守った実装雛形の再利用。
3. Wheel of Creation：農業・栄養ロジックの比較。GPL条件を満たせる範囲に限定。
4. World Animals：動物システムの参考資料。ライセンス確認まではコード流用禁止。

## TFC-Bedrook側の優先作業
- 既存の63種プロフィールとEntity/Spawn定義の対応を自動検査する。
- 既存の家畜共通処理を各種固有の産出・繁殖条件へ接続する。
- 公式サンプルと照合してmanifest/Entity/Block/Itemの定義漏れを検出する。
- 既存のNodeテストを維持し、実装変更ごとにCIを通す。
- 地形生成はユーザー提供の地形資料が届くまで、地形以外の統合・登録・検査を優先する。

## 重要な制約
- ZIPの内容確認は静的監査であり、Minecraft 26.60での動作確認ではない。
- サンプルAddonがBedrock 1.21.x対応であることだけを根拠に26.60互換とは判断しない。
- TFC公式仕様を優先し、参考Addonのゲームバランスや追加要素をそのままTFCへ混ぜない。
