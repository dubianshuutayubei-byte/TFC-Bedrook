import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../packs/behavior_pack/scripts/ui/main-menu.js", import.meta.url),
  "utf8"
);

test("Japanese field guide exposes separate livestock basics and lifecycle pages", () => {
  assert.match(source, /\.button\("動物・畜産（基本）"\)/);
  assert.match(source, /\.button\("動物・畜産（繁殖・産出）"\)/);
  assert.match(source, /\["動物・畜産（基本）",/);
  assert.match(source, /\["動物・畜産（繁殖・産出）",/);
});

test("field guide return index matches its nine content pages", () => {
  assert.match(source, /if \(response\.selection === 9\) return void await showMainMenu\(player\);/);
  const pageArrayStart = source.indexOf("  const pages = [");
  const pageArrayEnd = source.indexOf("\n  ];", pageArrayStart);
  assert.ok(pageArrayStart >= 0 && pageArrayEnd > pageArrayStart);
  const pageCount = (source.slice(pageArrayStart, pageArrayEnd).match(/^    \[/gm) ?? []).length;
  assert.equal(pageCount, 9);
});

test("livestock guide documents implemented limits without claiming full 78-species completion", () => {
  assert.match(source, /1ゲーム日1回/);
  assert.match(source, /巣箱/);
  assert.match(source, /公式78種のロスター登録とゲーム内完全実装は別/);
  assert.match(source, /この3種を対象/);
});
