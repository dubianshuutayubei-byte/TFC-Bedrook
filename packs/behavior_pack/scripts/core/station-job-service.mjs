export function isStationJobDue(job, now = Date.now()) {
  return Boolean(job && ["running", "ready_to_claim", "delivering"].includes(job.status)
    && Number.isFinite(job.endsAt) && now >= job.endsAt);
}

export function getPendingStationOutputs(job) {
  if (!job || !job.outputs || typeof job.outputs !== "object") return [];
  const delivered = job.deliveredOutputs ?? {};
  return Object.entries(job.outputs).filter(([id, amount]) =>
    typeof id === "string" && Number.isInteger(amount) && amount > 0 && delivered[id] !== true
  );
}

export function markStationOutputDelivered(job, itemId) {
  if (!job || !Object.hasOwn(job.outputs ?? {}, itemId)) {
    throw new Error(`unknown station output: ${itemId}`);
  }
  return {
    ...job,
    status: "delivering",
    deliveredOutputs: { ...(job.deliveredOutputs ?? {}), [itemId]: true }
  };
}

export function markStationJobRecoverable(job) {
  return { ...job, status: "ready_to_claim" };
}
