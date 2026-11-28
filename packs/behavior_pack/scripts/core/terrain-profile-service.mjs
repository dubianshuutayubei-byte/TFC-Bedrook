const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const smooth = (t) => t * t * (3 - 2 * t);

function hash2D(x, z, seed = 0) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) + Math.imul(seed | 0, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

// Smooth, deterministic value noise in world-coordinate space.
// This is a planning model only; it is not a Bedrock world-generation hook.
function valueNoise(x, z, scale, seed) {
  const sx = x / Math.max(1, scale);
  const sz = z / Math.max(1, scale);
  const x0 = Math.floor(sx);
  const z0 = Math.floor(sz);
  const tx = smooth(sx - x0);
  const tz = smooth(sz - z0);
  const a = hash2D(x0, z0, seed);
  const b = hash2D(x0 + 1, z0, seed);
  const c = hash2D(x0, z0 + 1, seed);
  const d = hash2D(x0 + 1, z0 + 1, seed);
  const north = a + (b - a) * tx;
  const south = c + (d - c) * tx;
  return north + (south - north) * tz;
}

export function sampleTerrainProfile(x, z, profile = {}) {
  const seed = Number(profile.seed ?? 0);
  const continentalScale = Math.max(1, Number(profile.continentalScale ?? 4096));
  const mountainScale = Math.max(1, Number(profile.mountainScale ?? 1024));
  const detailScale = Math.max(1, Number(profile.detailScale ?? 160));
  const valleyScale = Math.max(1, Number(profile.valleyScale ?? 640));
  const riverScale = Math.max(1, Number(profile.riverScale ?? 1800));
  const seaLevel = Number(profile.seaLevel ?? 63);
  const baseRelief = Number(profile.baseRelief ?? 112);
  const mountainGain = Number(profile.mountainGain ?? 150);
  const detailGain = Number(profile.detailGain ?? 9);
  const valleyDepth = Number(profile.valleyDepth ?? 34);
  const riverWidth = Math.max(0.005, Number(profile.riverWidth ?? 0.055));

  const continental = valueNoise(x, z, continentalScale, seed + 3);
  const mountainField = valueNoise(x, z, mountainScale, seed + 17);
  const detail = valueNoise(x, z, detailScale, seed + 37);
  const valleyField = valueNoise(x, z, valleyScale, seed + 59);
  const riverField = valueNoise(x, z, riverScale, seed + 83);

  // Ridge shaping creates long mountain chains from broad, smooth fields.
  const ridge = 1 - Math.abs(mountainField * 2 - 1);
  const mountainMask = smooth(clamp((continental - 0.42) / 0.34, 0, 1));
  const ridgeStrength = Math.pow(clamp((ridge - 0.42) / 0.58, 0, 1), 1.65);
  const valleyMask = Math.pow(clamp((valleyField - 0.52) / 0.48, 0, 1), 1.4);
  const riverDistance = Math.abs(riverField - 0.5);
  const riverMask = 1 - smooth(clamp(riverDistance / riverWidth, 0, 1));

  const continentalElevation = (continental - 0.5) * baseRelief;
  const mountainElevation = ridgeStrength * mountainMask * mountainGain;
  const valleyCut = valleyMask * valleyDepth;
  const riverCut = riverMask * (3 + 7 * mountainMask);
  const detailElevation = (detail - 0.5) * detailGain;
  const elevation = seaLevel + continentalElevation + mountainElevation - valleyCut - riverCut + detailElevation;

  const slopeProxy = clamp(
    Math.abs(mountainField - 0.5) * 1.25 +
    Math.abs(detail - 0.5) * 0.22 +
    ridgeStrength * mountainMask * 0.42,
    0, 1
  );

  return {
    elevation: Math.round(elevation * 100) / 100,
    continentalness: continental,
    ruggedness: ridgeStrength * mountainMask,
    detail,
    valleyStrength: valleyMask,
    riverStrength: riverMask,
    slopeProxy
  };
}

export function classifyTerrainSample(sample) {
  const e = sample.elevation;
  const s = sample.slopeProxy;
  if (e < 0) return "ocean";
  if (e < 8 && s < 0.18) return "coast";
  if (sample.riverStrength > 0.72) return "river";
  if (sample.valleyStrength > 0.72 && e > 12) return "valley";
  if (e > 150 && sample.ruggedness > 0.45) return "mountain";
  if (e > 90 && sample.ruggedness > 0.25) return "highlands";
  if (s > 0.28) return "hills";
  return "plains";
}
