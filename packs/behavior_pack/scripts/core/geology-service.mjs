export function selectRockLayer(profile, depth) {
  const layers = [...(profile.layers ?? [])].sort((a, b) => a.minDepth - b.minDepth);
  const layer = layers.find((entry) => depth >= entry.minDepth && depth <= entry.maxDepth);
  return layer?.rock ?? profile.defaultRock ?? "minecraft:stone";
}

export function evaluateOreProspecting(vein, sample) {
  if (!vein || !sample) return { found: false, abundance: "none", confidence: 0 };
  if (vein.hostRock && vein.hostRock !== sample.rock) return { found: false, abundance: "none", confidence: 0 };
  const distance = Math.max(0, Number(sample.distance ?? 0));
  const radius = Math.max(1, Number(vein.radius ?? 1));
  if (distance > radius) return { found: false, abundance: "none", confidence: 0 };
  const confidence = Math.max(0, 1 - distance / (radius + 1));
  const amount = Number(vein.abundance ?? 0) * confidence;
  const abundance = amount >= 70 ? "very_large" : amount >= 40 ? "large" : amount >= 15 ? "small" : "trace";
  return { found: amount > 0, abundance: amount > 0 ? abundance : "none", confidence };
}

export function classifyTerrain(elevation, slope, ruggedness = 0) {
  if (elevation < 0) return "ocean";
  if (elevation < 8 && slope < 0.08) return "coast";
  if (elevation > 150 && slope > 0.45) return "mountain";
  if (elevation > 90 && ruggedness > 0.6) return "highlands";
  if (slope > 0.25) return "hills";
  return "plains";
}
