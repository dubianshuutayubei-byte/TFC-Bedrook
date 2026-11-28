import test from "node:test";
import assert from "node:assert/strict";
import { isStationJobDue, getPendingStationOutputs, markStationOutputDelivered, markStationJobRecoverable } from "../packs/behavior_pack/scripts/core/station-job-service.mjs";

test("station jobs are due only after their end time", () => {
  const job = { status: "running", endsAt: 500 };
  assert.equal(isStationJobDue(job, 499), false);
  assert.equal(isStationJobDue(job, 500), true);
  assert.equal(isStationJobDue({ ...job, status: "complete" }, 900), false);
});

test("delivered outputs are excluded from recovery retries", () => {
  const job = { status: "delivering", outputs: { "tfc:copper_ingot": 2, "tfc:copper_sheet": 1 }, deliveredOutputs: { "tfc:copper_ingot": true } };
  assert.deepEqual(getPendingStationOutputs(job), [["tfc:copper_sheet", 1]]);
});

test("marking an output delivered preserves other job data", () => {
  const job = { status: "running", recipeId: "copper", outputs: { "tfc:copper_ingot": 1 }, playerId: "p1" };
  const next = markStationOutputDelivered(job, "tfc:copper_ingot");
  assert.equal(next.status, "delivering");
  assert.equal(next.deliveredOutputs["tfc:copper_ingot"], true);
  assert.equal(next.playerId, "p1");
  assert.deepEqual(job.deliveredOutputs, undefined);
  assert.throws(() => markStationOutputDelivered(job, "tfc:unknown"), /unknown station output/);
});

test("failed station delivery remains recoverable", () => {
  const job = { status: "delivering", outputs: {}, deliveredOutputs: { "tfc:copper_ingot": true } };
  const next = markStationJobRecoverable(job);
  assert.equal(next.status, "ready_to_claim");
  assert.equal(next.deliveredOutputs["tfc:copper_ingot"], true);
});
