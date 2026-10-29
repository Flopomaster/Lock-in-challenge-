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

## Features (stage 2)

- Boss list per game (gyms, league, rivals, villains, titans) with full teams, moves, abilities, items and weaknesses
- Level caps, "next boss" on the dashboard, over-cap warnings, badges tracked from defeated gyms
- Rival teams matched to your starter
- Party type-matchup chart (generation-accurate type chart)
- "Possible here" encounter list per route with dupes marked
- 13 built-in ROM hacks (Radical Red, Unbound, Emerald Kaizo, Run & Bun, Renegade Platinum, …)

## Features (stage 3)

- Soul Link: share your side as a compact code / link (WhatsApp-friendly), import your partner's, see linked pairs, broken links and type clashes
- Statistics across all runs: win rate, survival, deadliest foes and places, most caught species
- Wheel: random Pokémon (randomizers), random box pick, or a random challenge rule
- Shareable team / Hall of Fame image
- Catch celebration animation

## Features (stage 4)

- Battle plan per boss: for each of its Pokémon, your best answers ranked by your strongest hit, its most dangerous move against you, and level
- Four moves per Pokémon (generation-filtered, from PokéAPI) and a dashboard warning when nobody hits the next boss super-effectively
- Hall of Fame: winning a run freezes the champion team in a permanent gallery, inducted with a full ceremony (fanfare, spotlight per champion, the fallen remembered)

## Development

```sh
npm install
npm run dev
```

Pokémon data (`src/data/pokedex.json`) is bundled from PokéAPI's static data mirror. Regenerate with `python3 scripts/build-pokedex.py`.

Move data (`src/data/moves.json`) comes from PokéAPI too: `python3 scripts/build-moves.py`.

Route lists and boss teams (`src/data/games/*.json`) are converted from [domtronn/nuzlocke.data](https://github.com/domtronn/nuzlocke.data):

```sh
git clone --depth 1 https://github.com/domtronn/nuzlocke.data /tmp/nuzlocke.data
python3 scripts/build-games.py /tmp/nuzlocke.data
```
