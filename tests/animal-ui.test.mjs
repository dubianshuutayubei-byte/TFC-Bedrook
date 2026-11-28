import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("knapping UI presents a 3x3 selection grid without exposing the answer",()=>{
  assert.match(runtime,/const grid=Array\.from\(\{length:3\}/);
  assert.match(runtime,/同じ位置を再選択すると解除できます/);
  assert.doesNotMatch(runtime,/正解パターン: 左上・中央・右下/);
});

test("animal inspection uses a Japanese status form with husbandry values",()=>{
  assert.match(runtime,/async function animalInteract\(player,entity\)/);
  assert.match(runtime,/new ActionFormData\(\)\.title\(\(names\[entity\.typeId\]/);
  for(const label of ["性別: ","空腹: ","渇き: ","健康: ","なつき度: ","成熟目安: "]) {
    assert.ok(runtime.includes(label),`missing animal status field: ${label}`);
  }
  assert.match(runtime,/メスの成体には空き瓶を使うと搾乳できます/);
});
