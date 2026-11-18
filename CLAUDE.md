# Nuzlocke Tracker — notes for Claude

Mobile-first PWA (React + Vite + Tailwind + Dexie), Hebrew/English. All data lives on the
user's device (IndexedDB); deploys to GitHub Pages on push to `main`. The owner talks in Hebrew.

## Planned next (owner's request)

- **Soul Link live**: when the owner brings up doing a Soul Link with a friend, improve Soul Link
  and build a *live* mode — both players see each other's catches and deaths in real time instead
  of exchanging share codes (`src/lib/soulLink.ts`). This needs a backend + sign-in (e.g. Supabase,
  which is available as a connector) — plan it with the owner before building.

## Parked (owner wants to come back to it)

- **Storytelling journal**: owner asked for a less dry, more story-like journal (`src/pages/Journal.tsx`).
  Proposed: (1) chapters split by gym wins, each event written as varied narrative sentences in
  Hebrew/English, big moments styled (deaths grey + candle, gym wins gold); (2) a "Wrapped"-style
  full-screen story slideshow for a finished run (days, first catch, most painful loss, top killer,
  survivor from start to finish, shareable final slide); (3) later maybe a region map of the journey.
  Recommended 1 + 2. Also offered: a direct "📖 Journal" button on run cards and Hall of Fame plaques.

## Ideas offered but not chosen yet

Damage calculator (Showdown calc) in the battle plan, "ready to evolve", haptics, gift/static clause,
quick "next route" encounter, level-cap bar per Pokémon, persistent storage + backup reminders.

## Data notes

Route/boss data comes from nuzlocke.data via `scripts/build-games.py`, which also fills missing places
from PokeAPI (`SUPPLEMENTS`, hand-checked per game) and fixes boss names/categories (`BOSS_FIXES`;
villain climaxes become 'final' = story bosses). When a user reports a missing place or fight, fix it there.
