/** Lightweight species-level predator/prey relationships for TFC fauna. */
export const FAUNA_ECOLOGY = Object.freeze({
  cougar: { prey: ["deer", "rabbit", "boar", "sheep", "goat"], predators: ["wolf", "direwolf", "grizzly_bear"] },
  black_bear: { prey: ["salmon", "cod", "rabbit", "deer"], predators: ["grizzly_bear"] },
  grizzly_bear: { prey: ["salmon", "cod", "rabbit", "deer", "boar"], predators: [] },
  direwolf: { prey: ["deer", "caribou", "boar", "sheep", "goat", "rabbit"], predators: ["sabertooth", "tiger"] },
  wolf: { prey: ["deer", "caribou", "boar", "sheep", "goat", "rabbit"], predators: ["direwolf", "sabertooth", "tiger"] },
  fox: { prey: ["rabbit", "chicken", "duck", "quail", "grouse", "pheasant"], predators: ["wolf", "cougar", "tiger"] },
  polar_bear: { prey: ["salmon", "cod", "lake_trout", "seal"], predators: [] },
  hyena: { prey: ["gazelle", "wildebeest", "deer", "boar"], predators: ["lion"] },
  lion: { prey: ["gazelle", "wildebeest", "boar", "deer"], predators: [] },
  panther: { prey: ["deer", "boar", "rabbit", "peafowl"], predators: ["tiger"] },
  tiger: { prey: ["deer", "boar", "moose", "caribou", "gazelle"], predators: [] },
  sabertooth: { prey: ["deer", "caribou", "moose", "boar"], predators: [] },
  crocodile: { prey: ["cod", "salmon", "tropical_fish", "turtle"], predators: [] },
  ocelot: { prey: ["rabbit", "chicken", "quail", "pheasant"], predators: ["cougar", "panther", "tiger"] },
  orca: { prey: ["cod", "salmon", "tropical_fish", "squid", "dolphin"], predators: [] }
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
