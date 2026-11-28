const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function hash2D(x, z, seed = 0) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) + Math.imul(seed | 0, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

export function sampleTerrainProfile(x, z, profile = {}) {
  const seed = Number(profile.seed ?? 0);
  const continentalScale = Math.max(1, Number(profile.continentalScale ?? 512));
  const mountainScale = Math.max(1, Number(profile.mountainScale ?? 128));
  const detailScale = Math.max(1, Number(profile.detailScale ?? 32));
  const continental = hash2D(Math.floor(x / continentalScale), Math.floor(z / continentalScale), seed);
  const mountain = hash2D(Math.floor(x / mountainScale), Math.floor(z / mountainScale), seed + 17);
  const detail = hash2D(Math.floor(x / detailScale), Math.floor(z / detailScale), seed + 37);
  const seaLevel = Number(profile.seaLevel ?? 63);
  const baseRelief = Number(profile.baseRelief ?? 48);
  const mountainGain = Number(profile.mountainGain ?? 96);
  const detailGain = Number(profile.detailGain ?? 8);
  const elevation = seaLevel + (continental - 0.5) * baseRelief + Math.max(0, mountain - 0.58) * mountainGain + (detail - 0.5) * detailGain;
  const slopeProxy = clamp(Math.abs(mountain - 0.5) * 1.8 + Math.abs(detail - 0.5) * 0.3, 0, 1);
  return { elevation: Math.round(elevation * 100) / 100, continentalness: continental, ruggedness: mountain, detail, slopeProxy };
}

export function classifyTerrainSample(sample) {
  const e = sample.elevation;
  const s = sample.slopeProxy;
  if (e < 0) return "ocean";
  if (e < 8 && s < 0.15) return "coast";
  if (e > 150 && s > 0.45) return "mountain";
  if (e > 90 && sample.ruggedness > 0.6) return "highlands";
  if (s > 0.25) return "hills";
  return "plains";
}
