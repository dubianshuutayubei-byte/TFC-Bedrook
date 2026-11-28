/** Generated from official-fauna-habitat-1.21x.json and official-fauna-spawn-profiles.json. TFC Java 1.21.1-4.2.16 source blobs are recorded in the JSON source metadata. */
export const OFFICIAL_FAUNA_HABITATS_1_21 = Object.freeze({
  "isopod": {
    "sourceExpression": "distanceBelowSeaLevel(20).maxTemperature(14)",
    "maxTemperatureC": 14,
    "distanceBelowSeaLevel": 20,
    "placement": "in_water"
  },
  "crayfish": {
    "sourceExpression": "distanceBelowSeaLevel(2).minTemperature(5).minGroundwater(125)",
    "minTemperatureC": 5,
    "minGroundwater": 125,
    "distanceBelowSeaLevel": 2,
    "placement": "in_water"
  },
  "lobster": {
    "sourceExpression": "distanceBelowSeaLevel(1).maxTemperature(21)",
    "maxTemperatureC": 21,
    "distanceBelowSeaLevel": 1,
    "placement": "in_water"
  },
  "horseshoe_crab": {
    "sourceExpression": "distanceBelowSeaLevel(1).temperature(10, 21).maxGroundwater(400)",
    "minTemperatureC": 10,
    "maxTemperatureC": 21,
    "maxGroundwater": 400,
    "distanceBelowSeaLevel": 1,
    "placement": "in_water"
  },
  "cod": {
    "sourceExpression": "distanceBelowSeaLevel(5).maxTemperature(18)",
    "maxTemperatureC": 18,
    "distanceBelowSeaLevel": 5,
    "placement": "in_water"
  },
  "pufferfish": {
    "sourceExpression": "distanceBelowSeaLevel(3).minTemperature(10)",
    "minTemperatureC": 10,
    "distanceBelowSeaLevel": 3,
    "placement": "in_water"
  },
  "tropical_fish": {
    "sourceExpression": "distanceBelowSeaLevel(3).minTemperature(18)",
    "minTemperatureC": 18,
    "distanceBelowSeaLevel": 3,
    "placement": "in_water"
  },
  "jellyfish": {
    "sourceExpression": "distanceBelowSeaLevel(3).minTemperature(18)",
    "minTemperatureC": 18,
    "distanceBelowSeaLevel": 3,
    "placement": "in_water"
  },
  "orca": {
    "sourceExpression": "distanceBelowSeaLevel(6).maxTemperature(19).minGroundwater(100).chance(10)",
    "maxTemperatureC": 19,
    "minGroundwater": 100,
    "chance": 10,
    "distanceBelowSeaLevel": 6,
    "placement": "in_water"
  },
  "dolphin": {
    "sourceExpression": "distanceBelowSeaLevel(6).minTemperature(10).minGroundwater(200).chance(10)",
    "minTemperatureC": 10,
    "minGroundwater": 200,
    "chance": 10,
    "distanceBelowSeaLevel": 6,
    "placement": "in_water"
  },
  "manatee": {
    "sourceExpression": "distanceBelowSeaLevel(3).minTemperature(20).minGroundwater(300).chance(10)",
    "minTemperatureC": 20,
    "minGroundwater": 300,
    "chance": 10,
    "distanceBelowSeaLevel": 3,
    "placement": "in_water"
  },
  "crocodile": {
    "sourceExpression": "distanceBelowSeaLevel(0).minTemperature(15)",
    "minTemperatureC": 15,
    "distanceBelowSeaLevel": 0,
    "placement": "no_restrictions"
  },
  "bluegill": {
    "sourceExpression": "temperature(-10, 15).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": -10,
    "maxTemperatureC": 15,
    "placement": "in_water"
  },
  "crappie": {
    "sourceExpression": "temperature(-10, 20).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": -10,
    "maxTemperatureC": 20,
    "placement": "in_water"
  },
  "lake_trout": {
    "sourceExpression": "temperature(-5, 15).minGroundwater(250).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "minGroundwater": 250,
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": -5,
    "maxTemperatureC": 15,
    "placement": "in_water"
  },
  "rainbow_trout": {
    "sourceExpression": "temperature(-12, 10).minGroundwater(150).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "minGroundwater": 150,
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": -12,
    "maxTemperatureC": 10,
    "placement": "in_water"
  },
  "largemouth_bass": {
    "sourceExpression": "temperature(-14, 16).groundwater(200, 500).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "minGroundwater": 200,
    "maxGroundwater": 500,
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": -14,
    "maxTemperatureC": 16,
    "placement": "in_water"
  },
  "smallmouth_bass": {
    "sourceExpression": "temperature(-14, 16).groundwater(0, 300).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "minGroundwater": 0,
    "maxGroundwater": 300,
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": -14,
    "maxTemperatureC": 16,
    "placement": "in_water"
  },
  "salmon": {
    "sourceExpression": "temperature(-8, 12).groundwater(250, 500).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "minGroundwater": 250,
    "maxGroundwater": 500,
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": -8,
    "maxTemperatureC": 12,
    "placement": "in_water"
  },
  "arctic_char": {
    "sourceExpression": "temperature(-20, -8).groundwater(150, 400).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "minGroundwater": 150,
    "maxGroundwater": 400,
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": -20,
    "maxTemperatureC": -8,
    "placement": "in_water"
  },
  "northern_pike": {
    "sourceExpression": "temperature(-14, -5).groundwater(150, 400).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "minGroundwater": 150,
    "maxGroundwater": 400,
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": -14,
    "maxTemperatureC": -5,
    "placement": "in_water"
  },
  "peacock_bass": {
    "sourceExpression": "temperature(12, 25).groundwater(200, 400).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "minGroundwater": 200,
    "maxGroundwater": 400,
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": 12,
    "maxTemperatureC": 25,
    "placement": "in_water"
  },
  "pacu": {
    "sourceExpression": "temperature(20, 35).groundwater(200, 500).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "minGroundwater": 200,
    "maxGroundwater": 500,
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": 20,
    "maxTemperatureC": 35,
    "placement": "in_water"
  },
  "red_piranha": {
    "sourceExpression": "temperature(22, 35).groundwater(300, 500).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "minGroundwater": 300,
    "maxGroundwater": 500,
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": 22,
    "maxTemperatureC": 35,
    "placement": "in_water"
  },
  "tilapia": {
    "sourceExpression": "temperature(10, 32).groundwater(0, 300).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "minGroundwater": 0,
    "maxGroundwater": 300,
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": 10,
    "maxTemperatureC": 32,
    "placement": "in_water"
  },
  "spotted_gudgeon": {
    "sourceExpression": "temperature(6, 24).groundwater(0, 250).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "minGroundwater": 0,
    "maxGroundwater": 250,
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": 6,
    "maxTemperatureC": 24,
    "placement": "in_water"
  },
  "muksun": {
    "sourceExpression": "temperature(-20, -10).groundwater(250, 500).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "minGroundwater": 250,
    "maxGroundwater": 500,
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": -20,
    "maxTemperatureC": -10,
    "placement": "in_water"
  },
  "burbot": {
    "sourceExpression": "temperature(-16, -9).groundwater(0, 350).ignoreRivers().months(FRESHWATER_FISH_MONTHS)",
    "minGroundwater": 0,
    "maxGroundwater": 350,
    "ignoreRivers": true,
    "months": [
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER"
    ],
    "minTemperatureC": -16,
    "maxTemperatureC": -9,
    "placement": "in_water"
  },
  "penguin": {
    "sourceExpression": "maxTemperature(-11).minGroundwater(75)",
    "minGroundwater": 75,
    "maxTemperatureC": -11,
    "placement": "on_ground"
  },
  "leopard_seal": {
    "sourceExpression": "maxTemperature(-9).minGroundwater(105)",
    "minGroundwater": 105,
    "maxTemperatureC": -9,
    "placement": "on_ground"
  },
  "frog": {
    "sourceExpression": "minGroundwater(150).minTemperature(-13)",
    "minTemperatureC": -13,
    "minGroundwater": 150,
    "placement": "on_ground"
  },
  "turtle": {
    "sourceExpression": "minTemperature(21).minGroundwater(250)",
    "minGroundwater": 250,
    "minTemperatureC": 21,
    "placement": "on_ground"
  },
  "pond_turtle": {
    "sourceExpression": "minTemperature(5).minGroundwater(200)",
    "minGroundwater": 200,
    "minTemperatureC": 5,
    "placement": "on_ground"
  },
  "polar_bear": {
    "sourceExpression": "maxTemperature(-10).minGroundwater(100)",
    "minGroundwater": 100,
    "maxTemperatureC": -10,
    "placement": "on_ground"
  },
  "grizzly_bear": {
    "sourceExpression": "temperature(-15, 15).minGroundwater(200).minForest(2)",
    "minGroundwater": 200,
    "minForestDensity": 2,
    "minTemperatureC": -15,
    "maxTemperatureC": 15,
    "placement": "on_ground"
  },
  "black_bear": {
    "sourceExpression": "temperature(5, 20).minGroundwater(250).minForest(2)",
    "minGroundwater": 250,
    "minForestDensity": 2,
    "minTemperatureC": 5,
    "maxTemperatureC": 20,
    "placement": "on_ground"
  },
  "cougar": {
    "sourceExpression": "temperature(-10, 21).minGroundwater(150)",
    "minGroundwater": 150,
    "minTemperatureC": -10,
    "maxTemperatureC": 21,
    "placement": "on_ground"
  },
  "panther": {
    "sourceExpression": "temperature(-10, 21).minGroundwater(150)",
    "minGroundwater": 150,
    "minTemperatureC": -10,
    "maxTemperatureC": 21,
    "placement": "on_ground"
  },
  "lion": {
    "sourceExpression": "minTemperature(16).groundwater(50, 300).maxForest(2)",
    "minGroundwater": 50,
    "maxGroundwater": 300,
    "maxForestDensity": 2,
    "minTemperatureC": 16,
    "placement": "on_ground"
  },
  "sabertooth": {
    "sourceExpression": "maxTemperature(0).minGroundwater(250)",
    "minGroundwater": 250,
    "maxTemperatureC": 0,
    "placement": "on_ground"
  },
  "tiger": {
    "sourceExpression": "minTemperature(13).minGroundwater(100).minForest(2)",
    "minGroundwater": 100,
    "minForestDensity": 2,
    "minTemperatureC": 13,
    "placement": "on_ground"
  },
  "squid": {
    "sourceExpression": "distanceBelowSeaLevel(15)",
    "distanceBelowSeaLevel": 15,
    "placement": "in_water"
  },
  "octopoteuthis": {
    "sourceExpression": "maxBrightness(0).distanceBelowSeaLevel(40)",
    "distanceBelowSeaLevel": 40,
    "maxBrightness": 0,
    "placement": "in_water"
  },
  "pig": {
    "sourceExpression": "temperature(-10, 35).minGroundwater(200).minForest(2)",
    "minGroundwater": 200,
    "minForestDensity": 2,
    "minTemperatureC": -10,
    "maxTemperatureC": 35,
    "placement": "on_ground"
  },
  "cow": {
    "sourceExpression": "temperature(-10, 35).minGroundwater(250)",
    "minGroundwater": 250,
    "minTemperatureC": -10,
    "maxTemperatureC": 35,
    "placement": "on_ground"
  },
  "goat": {
    "sourceExpression": "temperature(-12, 25).maxGroundwater(300)",
    "maxGroundwater": 300,
    "minTemperatureC": -12,
    "maxTemperatureC": 25,
    "placement": "on_ground"
  },
  "yak": {
    "sourceExpression": "maxTemperature(-11).minGroundwater(100)",
    "minGroundwater": 100,
    "maxTemperatureC": -11,
    "placement": "on_ground"
  },
  "alpaca": {
    "sourceExpression": "temperature(-8, 20).minGroundwater(250)",
    "minGroundwater": 250,
    "minTemperatureC": -8,
    "maxTemperatureC": 20,
    "placement": "on_ground"
  },
  "sheep": {
    "sourceExpression": "temperature(0, 35).groundwater(70, 300)",
    "minGroundwater": 70,
    "maxGroundwater": 300,
    "minTemperatureC": 0,
    "maxTemperatureC": 35,
    "placement": "on_ground"
  },
  "musk_ox": {
    "sourceExpression": "temperature(-25, 0).minGroundwater(100)",
    "minGroundwater": 100,
    "minTemperatureC": -25,
    "maxTemperatureC": 0,
    "placement": "on_ground"
  },
  "chicken": {
    "sourceExpression": "minTemperature(14).minGroundwater(225).minForest(2)",
    "minGroundwater": 225,
    "minForestDensity": 2,
    "minTemperatureC": 14,
    "placement": "on_ground"
  },
  "duck": {
    "sourceExpression": "temperature(-25, 30).minGroundwater(100).maxForest(2)",
    "minGroundwater": 100,
    "maxForestDensity": 2,
    "minTemperatureC": -25,
    "maxTemperatureC": 30,
    "placement": "on_ground"
  },
  "quail": {
    "sourceExpression": "temperature(-15, 10).minGroundwater(200)",
    "minGroundwater": 200,
    "minTemperatureC": -15,
    "maxTemperatureC": 10,
    "placement": "on_ground"
  },
  "rabbit": {
    "sourceExpression": "minTemperature(-16).minGroundwater(15)",
    "minGroundwater": 15,
    "minTemperatureC": -16,
    "placement": "on_ground"
  },
  "fox": {
    "sourceExpression": "groundwater(130, 400).maxTemperature(25).minForest(2)",
    "maxTemperatureC": 25,
    "minForestDensity": 2,
    "minGroundwater": 130,
    "maxGroundwater": 400,
    "placement": "on_ground"
  },
  "panda": {
    "sourceExpression": "temperature(18, 28).groundwater(300, 500).minForest(3).fuzzy()",
    "minGroundwater": 300,
    "maxGroundwater": 500,
    "minForestDensity": 3,
    "fuzzy": true,
    "minTemperatureC": 18,
    "maxTemperatureC": 28,
    "placement": "on_ground"
  },
  "boar": {
    "sourceExpression": "groundwater(130, 400).temperature(-5, 25).maxForest(3)",
    "minTemperatureC": -5,
    "maxTemperatureC": 25,
    "maxForestDensity": 3,
    "minGroundwater": 130,
    "maxGroundwater": 400,
    "placement": "on_ground"
  },
  "wildebeest": {
    "sourceExpression": "groundwater(90, 380).minTemperature(13).maxForest(2)",
    "minTemperatureC": 13,
    "maxForestDensity": 2,
    "minGroundwater": 90,
    "maxGroundwater": 380,
    "placement": "on_ground"
  },
  "bison": {
    "sourceExpression": "groundwater(160, 420).temperature(-10, 15).maxForest(2)",
    "minTemperatureC": -10,
    "maxTemperatureC": 15,
    "maxForestDensity": 2,
    "minGroundwater": 160,
    "maxGroundwater": 420,
    "placement": "on_ground"
  },
  "ocelot": {
    "sourceExpression": "groundwater(300, 500).temperature(15, 30).minForest(2)",
    "minTemperatureC": 15,
    "maxTemperatureC": 30,
    "minForestDensity": 2,
    "minGroundwater": 300,
    "maxGroundwater": 500,
    "placement": "on_ground"
  },
  "caribou": {
    "sourceExpression": "groundwater(110, 500).maxTemperature(-9)",
    "maxTemperatureC": -9,
    "minGroundwater": 110,
    "maxGroundwater": 500,
    "placement": "on_ground"
  },
  "deer": {
    "sourceExpression": "groundwater(160, 500).temperature(-12, 16).minForest(2)",
    "minTemperatureC": -12,
    "maxTemperatureC": 16,
    "minForestDensity": 2,
    "minGroundwater": 160,
    "maxGroundwater": 500,
    "placement": "on_ground"
  },
  "gazelle": {
    "sourceExpression": "groundwater(90, 380).minTemperature(12).maxForest(2)",
    "minTemperatureC": 12,
    "maxForestDensity": 2,
    "minGroundwater": 90,
    "maxGroundwater": 380,
    "placement": "on_ground"
  },
  "bongo": {
    "sourceExpression": "groundwater(230, 500).minTemperature(15).minForest(2)",
    "minTemperatureC": 15,
    "minForestDensity": 2,
    "minGroundwater": 230,
    "maxGroundwater": 500,
    "placement": "on_ground"
  },
  "moose": {
    "sourceExpression": "groundwater(150, 300).temperature(-15, 10).minForest(2)",
    "minTemperatureC": -15,
    "maxTemperatureC": 10,
    "minForestDensity": 2,
    "minGroundwater": 150,
    "maxGroundwater": 300,
    "placement": "on_ground"
  },
  "grouse": {
    "sourceExpression": "groundwater(150, 400).temperature(-12, 13)",
    "minTemperatureC": -12,
    "maxTemperatureC": 13,
    "minGroundwater": 150,
    "maxGroundwater": 400,
    "placement": "on_ground"
  },
  "pheasant": {
    "sourceExpression": "groundwater(100, 300).temperature(-5, 17).minForest(2)",
    "minTemperatureC": -5,
    "maxTemperatureC": 17,
    "minForestDensity": 2,
    "minGroundwater": 100,
    "maxGroundwater": 300,
    "placement": "on_ground"
  },
  "turkey": {
    "sourceExpression": "groundwater(250, 450).temperature(0, 17).maxForest(3)",
    "minTemperatureC": 0,
    "maxTemperatureC": 17,
    "maxForestDensity": 3,
    "minGroundwater": 250,
    "maxGroundwater": 450,
    "placement": "on_ground"
  },
  "peafowl": {
    "sourceExpression": "groundwater(190, 500).minTemperature(14).minForest(3)",
    "minTemperatureC": 14,
    "minForestDensity": 3,
    "minGroundwater": 190,
    "maxGroundwater": 500,
    "placement": "on_ground"
  },
  "wolf": {
    "sourceExpression": "groundwater(150, 420).temperature(-12, 17).maxForest(3)",
    "minTemperatureC": -12,
    "maxTemperatureC": 17,
    "maxForestDensity": 3,
    "minGroundwater": 150,
    "maxGroundwater": 420,
    "placement": "on_ground"
  },
  "hyena": {
    "sourceExpression": "groundwater(80, 380).minTemperature(15).maxForest(3)",
    "minTemperatureC": 15,
    "maxForestDensity": 3,
    "minGroundwater": 80,
    "maxGroundwater": 380,
    "placement": "on_ground"
  },
  "direwolf": {
    "sourceExpression": "groundwater(150, 420).maxTemperature(-5).maxForest(3)",
    "maxTemperatureC": -5,
    "maxForestDensity": 3,
    "minGroundwater": 150,
    "maxGroundwater": 420,
    "placement": "on_ground"
  },
  "donkey": {
    "sourceExpression": "groundwater(130, 400).minTemperature(-15).maxForest(2)",
    "minTemperatureC": -15,
    "maxForestDensity": 2,
    "minGroundwater": 130,
    "maxGroundwater": 400,
    "placement": "on_ground"
  },
  "mule": {
    "sourceExpression": "groundwater(130, 400).minTemperature(-15).maxForest(2)",
    "minTemperatureC": -15,
    "maxForestDensity": 2,
    "minGroundwater": 130,
    "maxGroundwater": 400,
    "placement": "on_ground"
  },
  "horse": {
    "sourceExpression": "groundwater(130, 400).minTemperature(-15).maxForest(2)",
    "minTemperatureC": -15,
    "maxForestDensity": 2,
    "minGroundwater": 130,
    "maxGroundwater": 400,
    "placement": "on_ground"
  },
  "dromedary_camel": {
    "sourceExpression": "maxGroundwater(100).minTemperature(-5)",
    "minTemperatureC": -5,
    "maxGroundwater": 100,
    "placement": "on_ground"
  },
  "bactrian_camel": {
    "sourceExpression": "maxGroundwater(100).maxTemperature(-5)",
    "maxTemperatureC": -5,
    "maxGroundwater": 100,
    "placement": "on_ground"
  },
  "armadillo": {
    "sourceExpression": "groundwater(100, 400).minTemperature(12)",
    "minTemperatureC": 12,
    "minGroundwater": 100,
    "maxGroundwater": 400,
    "placement": "on_ground"
  }
});
