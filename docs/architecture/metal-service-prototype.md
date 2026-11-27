# Metal and alloy service prototype

The source-backed database contains 28 metal profiles and 9 alloy ratio recipes
from TerraFirmaCraft 3.2.26. The values are transcribed into normalized IDs.

- Melt temperature is stored in degrees Celsius.
- Specific heat capacity is retained as a source value; it is not converted
  into a Bedrock physical unit.
- Metal tier is stored independently from melt temperature.
- Alloy matching uses the fraction of total input amount and inclusive min/max
  bounds for every declared component.
- Unlisted metals invalidate a match; zero-amount inputs are ignored.

This module does not yet implement crucible inventory, item temperatures,
heating, fluid transfer, or Bedrock UI. It is a tested rules engine only.
