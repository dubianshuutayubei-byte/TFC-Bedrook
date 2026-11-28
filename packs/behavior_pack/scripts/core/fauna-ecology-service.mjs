/** Lightweight species-level predator/prey relationships for TFC fauna. */
export const FAUNA_ECOLOGY = Object.freeze({
  cougar: { prey: ["deer", "rabbit", "boar", "sheep", "goat"] },
  black_bear: { prey: ["salmon", "cod", "rabbit", "deer"] },
  grizzly_bear: { prey: ["salmon", "cod", "rabbit", "deer", "boar"] },
  direwolf: { prey: ["deer", "caribou", "boar", "sheep", "goat", "rabbit"] },
  wolf: { prey: ["deer", "caribou", "boar", "sheep", "goat", "rabbit"] },
  fox: { prey: ["rabbit", "chicken", "duck", "quail", "grouse", "pheasant"] },
  polar_bear: { prey: ["salmon", "cod", "lake_trout"] },
  hyena: { prey: ["gazelle", "wildebeest", "deer", "boar"] },
  lion: { prey: ["gazelle", "wildebeest", "boar", "deer"] },
  panther: { prey: ["deer", "boar", "rabbit", "peafowl"] },
  tiger: { prey: ["deer", "boar", "moose", "caribou", "gazelle"] },
  sabertooth: { prey: ["deer", "caribou", "moose", "boar"] },
  crocodile: { prey: ["cod", "salmon", "tropical_fish", "turtle"] },
  ocelot: { prey: ["rabbit", "chicken", "quail", "pheasant"] },
  orca: { prey: ["cod", "salmon", "tropical_fish", "squid", "dolphin"] }
});

export function getFaunaPrey(species) {
  return [...(FAUNA_ECOLOGY[String(species)]?.prey ?? [])];
}

export function isFaunaPredatorOf(predatorSpecies, preySpecies) {
  return getFaunaPrey(predatorSpecies).includes(String(preySpecies));
}

export function isFaunaThreatenedBy(preySpecies, predatorSpecies) {
  return getFaunaPrey(predatorSpecies).includes(String(preySpecies));
}

export function getFaunaPredators(species) {
  const target = String(species);
  return Object.entries(FAUNA_ECOLOGY)
    .filter(([, profile]) => profile.prey.includes(target))
    .map(([predator]) => predator);
}
