import test from "node:test";
import assert from "node:assert/strict";
import { formatSurvivalHud } from "../packs/behavior_pack/scripts/ui/hud-service.mjs";

test("formats Japanese calendar data as a compact HUD line", () => {
  assert.equal(
    formatSurvivalHud({ year: 2, season: "spring", dayOfYearNumber: 17 }),
    "§6TFC§r  第2年  §e春§r  17日目"
  );
});

test("supports every season", () => {
  for (const [season, label] of Object.entries({
    winter: "冬", spring: "春", summer: "夏", autumn: "秋"
  })) {
    assert.match(
      formatSurvivalHud({ year: 1, season, dayOfYearNumber: 1 }),
      new RegExp(label)
    );
  }
});

test("rejects incomplete or invalid calendar data", () => {
  assert.throws(() => formatSurvivalHud(null), TypeError);
  assert.throws(
    () => formatSurvivalHud({ year: 1, season: "monsoon", dayOfYearNumber: 1 }),
    TypeError
  );
});
