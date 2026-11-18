# Nuzlocke Tracker — notes for Claude

Mobile-first PWA (React + Vite + Tailwind + Dexie), Hebrew/English. All data lives on the
user's device (IndexedDB); deploys to GitHub Pages on push to `main`. The owner talks in Hebrew.

## Planned next (owner's request)

- **Soul Link live**: when the owner brings up doing a Soul Link with a friend, improve Soul Link
  and build a *live* mode — both players see each other's catches and deaths in real time instead
  of exchanging share codes (`src/lib/soulLink.ts`). This needs a backend + sign-in (e.g. Supabase,
  which is available as a connector) — plan it with the owner before building.

## Ideas offered but not chosen yet

Damage calculator (Showdown calc) in the battle plan, "ready to evolve", haptics, gift/static clause,
quick "next route" encounter, level-cap bar per Pokémon, persistent storage + backup reminders.

## Data notes

Route/boss data comes from nuzlocke.data via `scripts/build-games.py`, which also fills missing places
from PokeAPI (`SUPPLEMENTS`, hand-checked per game) and fixes boss names/categories (`BOSS_FIXES`;
villain climaxes become 'final' = story bosses). When a user reports a missing place or fight, fix it there.
