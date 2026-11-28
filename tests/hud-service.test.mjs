import test from "node:test";
import assert from "node:assert/strict";
import { formatSurvivalHud } from "../packs/behavior_pack/scripts/ui/hud-service.mjs";

test("formats Japanese calendar data as a compact HUD line", () => {
  assert.equal(
    formatSurvivalHud({ year: 2, season: "spring", dayOfYearNumber: 17 }),
    "§6TFC§r  第2年  §e春§r  17日目"
  );
});

test("adds live hydration without inventing other needs", () => {
  assert.equal(
    formatSurvivalHud(
      { year: 1, season: "winter", dayOfYearNumber: 1 },
      { hydration: 76.4 }
    ),
    "§6TFC§r  第1年  §e冬§r  1日目  §b水分 76%§r"
  );
});

test("clamps displayed hydration and rejects invalid values", () => {
  assert.match(
    formatSurvivalHud({ year: 1, season: "spring", dayOfYearNumber: 1 }, { hydration: 150 }),
    /水分 100%/
  );
  assert.throws(
    () => formatSurvivalHud({ year: 1, season: "spring", dayOfYearNumber: 1 }, { hydration: "bad" }),
    TypeError
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
