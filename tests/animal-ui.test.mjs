import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const runtime=readFileSync(join(root,"packs/behavior_pack/scripts/gameplay-runtime.js"),"utf8");

test("knapping UI presents a 5x5 selection grid",()=>{
  assert.match(runtime,/const grid=Array\.from\(\{length:5\}/);
  assert.match(runtime,/for\(let i=0;i<25;i\+\+\)form\.button/);
  assert.match(runtime,/v<25/);
  assert.match(runtime,/同じ位置を再選択すると解除できます/);
});

test("animal inspection uses a Japanese status form with husbandry values",()=>{
  assert.match(runtime,/async function animalInteract\(player,entity\)/);
  assert.match(runtime,/new ActionFormData\(\)\.title\(\(names\[entity\.typeId\]/);
  for(const label of ["性別: ","空腹: ","渇き: ","健康: ","なつき度: ","成熟目安: "]) {
    assert.ok(runtime.includes(label),`missing animal status field: ${label}`);
  }
  assert.match(runtime,/産出: 牛乳（メスの成体・健康条件を満たすと空き瓶で採取、"\+profile\.productCooldownDays\+"日間隔）/);
});
