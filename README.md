# Nuzlocke Tracker

אפליקציית מובייל (PWA) למעקב אחרי ריצות Nuzlocke בפוקימון — מפגשים לפי מסלול, קבוצה וקופסה, בית קברות, תגים וחוקים.

A mobile-first PWA for tracking Pokémon Nuzlocke runs. Works offline; all data stays on the device (with JSON backup export/import). Hebrew and English, light and dark.

## Features (stage 1)

- Multiple runs in parallel, for every main-series game (Gen 1–9) plus custom games / ROM hacks
- Classic, Hardcore, Soul Link and custom variants with rule toggles (warnings, never blocking)
- Per-location encounter log with Dupes Clause and party-size warnings
- Party & box with nicknames, level, nature, ability, gender, shiny, notes and evolution
- Graveyard with killer, location, cause and epitaph — and a proper funeral
- Game-accurate sprites (Gen 1–6 per-game sprites, modern sprites after)

## Development

```sh
npm install
npm run dev
```

Pokémon data (`src/data/pokedex.json`) is bundled from PokéAPI's static data mirror. Regenerate with `python3 scripts/build-pokedex.py`.
