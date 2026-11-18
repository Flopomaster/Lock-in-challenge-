#!/usr/bin/env python3
"""Builds per-game route + boss data (src/data/games/*.json) from domtronn/nuzlocke.data.

Usage:
  git clone --depth 1 https://github.com/domtronn/nuzlocke.data /tmp/nuzlocke.data
  python3 scripts/build-games.py /tmp/nuzlocke.data

Pokémon names in that data are PokeAPI slugs (incl. regional forms such as
`rattata-alola`); they're resolved against PokeAPI's static data mirror.
"""
import json
import os
import re
import subprocess
import ssl
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

SRC = sys.argv[1]
ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'src', 'data', 'games')
CACHE = os.path.join(ROOT, 'node_modules', '.cache', 'pokeapi-slugs.json')
API = 'https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2'

# app game id -> (routes file, leagues file)
GAMES = {
    'red-blue': ('rb', 'rb'),
    'yellow': ('yel', 'yel'),
    'gold-silver': ('gsc', 'gsc'),
    'crystal': ('crys', 'gsc'),
    'ruby-sapphire': ('ruby', 'rs'),
    'emerald': ('em', 'em'),
    'firered-leafgreen': ('frlg', 'frlg'),
    'diamond-pearl': ('dp', 'dp'),
    'platinum': ('plat', 'plat'),
    'heartgold-soulsilver': ('hg', 'hgss'),
    'black-white': ('bl', 'bw'),
    'black2-white2': ('b2w2', 'b2w2'),
    'x-y': ('xy', 'xy'),
    'oras': ('or', 'oras'),
    'sun-moon': ('sun', 'sm'),
    'usum': ('usun', 'usum'),
    'sword-shield': ('sw', 'swsh'),
    'bdsp': ('bdsp', 'bdsp'),
    'scarlet-violet': ('sc', 'sv'),
    # ROM hacks
    'radical-red': ('radred', 'radred'),
    'unbound': ('unbound', 'unbound'),
    'emerald-kaizo': ('emkaizo', 'emkaizo'),
    'run-and-bun': ('emrunbun', 'emrunbun'),
    'renegade-platinum': ('renplat', 'renplat'),
    'glazed': ('glazed', 'glazed'),
    'insurgence': ('insurgence', 'insurgence'),
    'blaze-black': ('blaze', 'blazevolt'),
    'blaze-black-2': ('blazevolt2', 'blazevolt2'),
    'inclement-emerald': ('incem', 'incem'),
    'blazing-emerald': ('blazingem', 'blazingem'),
    'rising-ruby': ('rrss', 'rrss'),
    'sacred-gold': ('sacredgold', 'sssg'),
}

# Where the starter is actually received. The data lists a separate "Starter" pseudo-location;
# we fold its choices into this real place instead (inserting it first when the data lacks it).
# Games not listed use their first location.
STARTER_AT = {
    'ruby-sapphire': 'Route 101', 'emerald': 'Route 101', 'emerald-kaizo': 'Route 101',
    'run-and-bun': 'Route 101', 'inclement-emerald': 'Route 101', 'blazing-emerald': 'Route 101',
    'diamond-pearl': 'Route 201', 'platinum': 'Route 201', 'renegade-platinum': 'Route 201', 'bdsp': 'Route 201',
    'black-white': 'Nuvema Town', 'blaze-black': 'Nuvema Town',
    'x-y': 'Aquacorde Town',
    'sun-moon': 'Iki Town', 'usum': 'Iki Town',
    'sword-shield': 'Postwick',
}

ctx = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))


def get(path):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(f'{API}/{path}/index.json', context=ctx, timeout=30) as r:
                return json.load(r)
        except Exception:
            if attempt == 3:
                raise


def url_id(url):
    return int(url.rstrip('/').split('/')[-1])


def load_slugs():
    """slug -> [pokemon id (sprite), species id, types]"""
    if os.path.exists(CACHE):
        return json.load(open(CACHE))
    pokemon = get('pokemon')['results']
    species = get('pokemon-species')['results']

    def form(p):
        d = get(f'pokemon/{url_id(p["url"])}')
        return p['name'], [d['id'], url_id(d['species']['url']), [t['type']['name'] for t in sorted(d['types'], key=lambda t: t['slot'])]]

    slugs = {}
    for s in species:
        sid = url_id(s['url'])
        slugs[s['name']] = [sid, sid, None]
    with ThreadPoolExecutor(24) as ex:
        for name, val in ex.map(form, [p for p in pokemon if url_id(p['url']) > 10000]):
            slugs[name] = val
    for p in pokemon:
        if url_id(p['url']) <= 10000:
            slugs.setdefault(p['name'], [url_id(p['url'])] * 2 + [None])
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    json.dump(slugs, open(CACHE, 'w'))
    return slugs


SLUGS = load_slugs()
ALIASES = {'nidoran-f': 'nidoran-f', 'nidoranf': 'nidoran-f', 'nidoranm': 'nidoran-m', 'farfetchd': 'farfetchd',
           'mr.-mime': 'mr-mime', 'mime-jr.': 'mime-jr', 'flabebe': 'flabebe'}
unknown = set()


def resolve(slug):
    """Returns {s: species, f?: form pokemon id, ty?: form types} or None for fakemon."""
    slug = slug.strip().lower().split('>')[0].replace(' ', '-').replace("'", '').replace('é', 'e')
    slug = ALIASES.get(slug, slug)
    hit = SLUGS.get(slug)
    if not hit:
        # e.g. "deoxys" vs "deoxys-normal", "pikachu-xyz" unknown forms -> base species
        base = slug.split('-')[0]
        hit = SLUGS.get(base)
        if hit:
            hit = [hit[1], hit[1], None]
    if not hit:
        unknown.add(slug)
        return None
    pid, sid, types = hit
    out = {'s': sid}
    if pid != sid:
        out['f'] = pid
        out['ty'] = types
    return out


# Misspelled place names in the source data.
TYPOS = {'Vermillion City': 'Vermilion City', 'Fuschia City': 'Fuchsia City', 'Viridan Forest': 'Viridian Forest', 'Routes 219': 'Route 219',
         'Five Isalnd': 'Five Island', 'Six Isalnd': 'Six Island', 'Seven Isalnd': 'Seven Island'}

# Places the route data lacks, filled from PokeAPI's per-version encounter tables (scripts/pokeapi-locations.py).
# Each game lists its PokeAPI `sources` (region id, versions) and either:
#   `add`: exactly these places, as {PokeAPI name: (display name, place it after)} — anchor None = at the end;
#   or (Sinnoh) every missing place except `skip`, placed by `after` / `postgame` (after `league`).
# Places checked by hand: event-only areas (Faraway Island, Navel Rock, ...) and internal entries are left out.
SINNOH_SUPPLEMENT = {
    'skip': {'Ruin Maniac Cave', 'Maniac Tunnel', 'Hall of Origin', 'Flower Paradise', 'Newmoon Island', 'Roaming Sinnoh', 'sinnoh-pokemart'},
    'after': {'Lake Valor': 'Valor Lakefront', 'Snowpoint City': 'Lake Acuity', 'Spear Pillar': 'Snowpoint Temple', 'Distortion World': 'Spear Pillar'},
    'league': 'Pokémon League',
    'postgame': ['Route 224', 'Route 225', 'Route 226', 'Route 227', 'Stark Mountain', 'Route 228', 'Route 229', 'Route 230',
                 'Resort Area', 'Turnback Cave', 'Sendoff Spring', 'Trophy Garden'],
}
HOENN_REGIS = {'Island Cave': ('Island Cave', None), 'Desert Ruins': ('Desert Ruins', None), 'Ancient Tomb': ('Ancient Tomb', None)}
SEVII = {
    'Treasure Beach': ('Treasure Beach', 'One Island'), 'Kindle Road': ('Kindle Road', 'Treasure Beach'), 'Mt. Ember': ('Mt. Ember', 'Kindle Road'),
    'Cape Brink': ('Cape Brink', 'Two Island'),
    'Bond Bridge': ('Bond Bridge', 'Three Island'), 'Three Isle Port': ('Three Isle Port', 'Bond Bridge'), 'Berry Forest': ('Berry Forest', 'Three Isle Port'),
    'Icefall Cave': ('Icefall Cave', 'Four Island'),
    'Five Island': ('Five Island', 'Icefall Cave'), 'Five Isle Meadow': ('Five Isle Meadow', 'Five Island'), 'Memorial Pillar': ('Memorial Pillar', 'Five Isle Meadow'),
    'Water Labyrinth': ('Water Labyrinth', 'Memorial Pillar'), 'Resort Gorgeous': ('Resort Gorgeous', 'Water Labyrinth'), 'Lost Cave': ('Lost Cave', 'Resort Gorgeous'),
    'Water Path': ('Water Path', 'Six Island'), 'Ruin Valley': ('Ruin Valley', 'Water Path'), 'Green Path': ('Green Path', 'Ruin Valley'),
    'Outcast Island': ('Outcast Island', 'Green Path'), 'Pattern Bush': ('Pattern Bush', 'Outcast Island'), 'Altering Cave': ('Altering Cave', 'Pattern Bush'),
    'Canyon Entrance': ('Canyon Entrance', 'Seven Island'), 'Sevault Canyon': ('Sevault Canyon', 'Canyon Entrance'), 'Tanoby Ruins': ('Tanoby Ruins', 'Sevault Canyon'),
    'Trainer Tower': ('Trainer Tower', 'Tanoby Ruins'),
}
SUPPLEMENTS = {
    'platinum': {**SINNOH_SUPPLEMENT, 'sources': [(4, ['platinum'])]},
    'diamond-pearl': {**SINNOH_SUPPLEMENT, 'sources': [(4, ['diamond', 'pearl'])]},
    'gold-silver': {'sources': [(1, ['gold', 'silver'])], 'add': {'Celadon City': ('Celadon City', None)}},
    'crystal': {'sources': [(1, ['crystal'])], 'add': {'Celadon City': ('Celadon City', None)}},
    'heartgold-soulsilver': {'sources': [(1, ['heartgold', 'soulsilver']), (2, ['heartgold', 'soulsilver'])],
                             'add': {'Seafoam Islands': ('Seafoam Islands', 'Route 20'), 'Cerulean Cave': ('Cerulean Cave', None),
                                     'Embedded Tower': ('Embedded Tower', None)}},
    'firered-leafgreen': {'sources': [(1, ['firered', 'leafgreen'])], 'add': {'S.S. Anne': ('S.S. Anne', 'Vermilion City'), **SEVII}},
    'ruby-sapphire': {'sources': [(3, ['ruby', 'sapphire'])],
                      'add': {'Team Magma Hideout': ('Team Magma Hideout', 'Jagged Pass'), 'Team Aqua Hideout': ('Team Aqua Hideout', 'Lilycove City'),
                              **HOENN_REGIS, 'Southern Island': ('Southern Island', None)}},
    'emerald': {'sources': [(3, ['emerald'])],
                'add': {'Team Aqua Hideout': ('Team Aqua Hideout', 'Lilycove City'), **HOENN_REGIS, 'Southern Island': ('Southern Island', None),
                        'Terra Cave': ('Terra Cave', None), 'Marine Cave': ('Marine Cave', None)}},
    'oras': {'sources': [(3, ['omega-ruby', 'alpha-sapphire'])],
             'add': {'Team Aqua Hideout': ('Team Aqua Hideout', 'Lilycove City'), 'Mossdeep Space Center': ('Mossdeep Space Center', 'Mossdeep City'),
                     **HOENN_REGIS, 'Soaring in the sky': ('Soaring in the Sky', None)}},
    'black-white': {'sources': [(5, ['black', 'white'])],
                    'add': {"Icirrus City": ('Icirrus City', 'Moor of Icirrus'), "Trial Chamber": ('Trial Chamber', 'Victory Road'),
                            "Challenger's Cave": ("Challenger's Cave", 'Trial Chamber'), "N's Castle": ("N's Castle", "Challenger's Cave"),
                            'Giant Chasm': ('Giant Chasm', None), 'Guidance Chamber': ('Guidance Chamber', None)}},
    'black2-white2': {'sources': [(5, ['black-2', 'white-2'])],
                      'add': {'Route 8': ('Route 8', 'Route 7'), 'Guidance Chamber': ('Guidance Chamber', None), 'Nature Sanctuary': ('Nature Sanctuary', None),
                              'Rocky Mountain Room': ('Rocky Mountain Room', None), 'Glacier Room': ('Glacier Room', None), 'Iron Room': ('Iron Room', None)}},
    'x-y': {'sources': [(6, ['x', 'y'])],
            'add': {'Tower of Mastery': ('Tower of Mastery', 'Shalour City'), 'Unknown Dungeon': ('Unknown Dungeon', None), 'Friend Safari': ('Friend Safari', None)}},
    'sun-moon': {'sources': [(7, ['sun', 'moon'])],
                 'add': {'Royal Avenue': ('Royal Avenue', None), 'Aether Paradise': ('Aether Paradise', None),
                         'Lake of the Sunne': ('Lake of the Sunne', 'Lake of the Moone'), 'Altar of the Moone': ('Altar of the Moone', 'Altar of the Sunne')}},
    'usum': {'sources': [(7, ['ultra-sun', 'ultra-moon'])],
             'add': {'Heahea City': ('Heahea City', 'Route 4'), 'Heahea Beach': ('Heahea Beach', 'Heahea City'), 'Sandy Cave': ('Sandy Cave', None),
                     'Lake of the Sunne': ('Lake of the Sunne', 'Lake of the Moone'), 'Ultra Megalopolis': ('Ultra Megalopolis', None),
                     'Ultra Space Wilds': ('Ultra Space Wilds', None)}},
    'sword-shield': {'sources': [(8, ['sword', 'shield'])],
                     'add': {'Meetup Spot': ('Meetup Spot', 'Route 2'), 'Turffield': ('Turffield', 'Route 4'), 'Hammerlocke': ('Hammerlocke', 'Hammerlocke Hills'),
                             'Stow-on-Side': ('Stow-on-Side', 'Route 6'), 'Ballonlea': ('Ballonlea', 'Glimwood Tangle'), 'Circhester': ('Circhester', 'Route 8'),
                             'Spikemuth': ('Spikemuth', 'Route 9'), 'Wyndon': ('Wyndon', 'Route 10'), 'Energy Plant': ('Energy Plant', None),
                             'Max Dens in the Galar Wild Area': ('Max Raid Dens', None)}},
}


# Per-game corrections to boss names / categories: {game: {"Name" or "Name@Location": (fixed name, type)}}.
# The data files story climaxes (villain bosses) as evil-team, which the Bosses tab hides; they get the
# 'final' (story boss) type so they're listed and set level caps. "@Location" picks one fight of a name
# that appears more than once (Maxie at Mt. Chimney is not a climax). In Black/White N plays the rival.
STORY = 'final'
BOSS_FIXES = {
    'black-white': {'Ghestsis': ('Ghetsis', STORY), 'N': ('N', 'rival')},
    'blaze-black': {'Ghestsis': ('Ghetsis', STORY), 'N': ('N', 'rival')},
    'black2-white2': {'Ghetsis': ('Ghetsis', STORY)},
    'blaze-black-2': {'Ghetsis': ('Ghetsis', STORY)},
    'diamond-pearl': {'Mars & Jupiter@Spear Pillar': ('Mars & Jupiter', STORY), 'Cyrus@Spear Pillar': ('Cyrus', STORY)},
    'bdsp': {'Mars & Jupiter@Spear Pillar': ('Mars & Jupiter', STORY), 'Cyrus@Spear Pillar': ('Cyrus', STORY)},
    'platinum': {'Mars & Jupiter@Spear Pillar': ('Mars & Jupiter', STORY), 'Cyrus@Distortion World': ('Cyrus', STORY)},
    'renegade-platinum': {'Cyrus@Distortion World': ('Cyrus', STORY)},
    'ruby-sapphire': {'Maxie@Seafloor Cavern': ('Maxie', STORY)},
    'emerald': {'Maxie & Tabitha@Mossdeep Space Center': ('Maxie & Tabitha', STORY), 'Archie@Seafloor Cavern': ('Archie', STORY)},
    'oras': {'Maxie@Seafloor Cavern': ('Maxie', STORY)},
    'rising-ruby': {'Maxie@Seafloor Cavern': ('Maxie', STORY)},
    'emerald-kaizo': {'Archie@Seafloor Cavern': ('Archie', STORY)},
    'run-and-bun': {'Leader Maxie@Mossdeep Space Center': ('Maxie', STORY), 'Leader Archie@Cave of Origin': ('Archie', STORY)},
    'sun-moon': {'Lusamine@Aether Paradise': ('Lusamine', STORY), 'Ultra Lusamine@Ultra Space': ('Lusamine', STORY)},
    'usum': {'Necrozma@Megalopolis': ('Necrozma', STORY)},
    'sword-shield': {'Oleana@Rose Tower': ('Oleana', STORY), 'Rose@Energy Plant': ('Rose', STORY)},
}


def pokeapi_locations(region, versions):
    cache = os.path.join(os.path.dirname(CACHE), f"pokeapi-locations-{region}-{'-'.join(versions)}.json")
    if not os.path.exists(cache):
        script = os.path.join(os.path.dirname(__file__), 'pokeapi-locations.py')
        out = subprocess.run([sys.executable, script, str(region), *versions], check=True, capture_output=True, text=True).stdout
        open(cache, 'w').write(out)
    return json.load(open(cache))


def supplement(game, locations):
    cfg = SUPPLEMENTS.get(game)
    if not cfg:
        return
    found = [f for region, versions in cfg['sources'] for f in pokeapi_locations(region, versions)]
    norm = lambda n: re.sub(r'^the', '', re.sub(r'[^a-z0-9]', '', n.lower().replace('sea route', 'route')))
    have = {norm(l['n']) for l in locations}

    def insert_after(anchor, entry):
        idx = next((i for i, l in enumerate(locations) if l['n'] == anchor), None)
        if anchor and idx is None:
            print(f'  {game}: anchor "{anchor}" not found, "{entry["n"]}" goes at the end')
        locations.insert(len(locations) if idx is None else idx + 1, entry)
        have.add(norm(entry['n']))

    if 'add' in cfg:
        by_api = {f['n']: f for f in found}
        for api_name, (name, anchor) in cfg['add'].items():
            if norm(name) in have:
                continue
            if api_name not in by_api:
                print(f'  {game}: "{api_name}" not in PokeAPI data')
                continue
            insert_after(anchor, {'n': name, 'e': by_api[api_name]['e']})
        return

    missing = []
    for f in found:
        name = re.sub(r'^Sea Route', 'Route', f['n'])
        if f['n'] in cfg['skip'] or f['slug'] in cfg['skip'] or norm(name) in have:
            continue
        missing.append({'n': name, 'e': f['e']})
    by_name = {m['n']: m for m in missing}
    for name, anchor in cfg['after'].items():
        if name in by_name:
            insert_after(anchor, by_name.pop(name))
    idx = next((i for i, l in enumerate(locations) if l['n'] == cfg['league']), len(locations) - 1)
    for name in cfg['postgame']:
        if name in by_name:
            idx += 1
            locations.insert(idx, by_name.pop(name))
    locations.extend(by_name.values())  # anything else, at the end



def parse_routes(path):
    locations, bosses = [], []
    for raw in open(path, encoding='utf-8'):
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        if line.startswith('--'):
            parts = line[2:].split('|')
            if len(parts) < 3:
                continue
            bosses.append({'id': parts[1].strip(), 'loc': parts[0].strip(), 'type': (parts[2].strip() or 'mini-boss').replace('mini-bos', 'mini-boss').replace('mini-bosss', 'mini-boss'),
                           'after': len(locations)})
            continue
        name, _, mons = line.partition('|')
        name = name.strip().lstrip('-').strip()  # stray "-Hau'oli City"-style prefixes
        name = TYPOS.get(name, name)
        enc = []
        for m in mons.split(','):
            if m.strip():
                r = resolve(m)
                if r and r['s'] not in enc:
                    enc.append(r['s'])
        if name.strip() in {l['n'] for l in locations}:
            continue
        locations.append({'n': name.strip(), 'e': enc})
    return locations, bosses


def parse_leagues(path):
    leagues = {}
    cur = None
    for raw in open(path, encoding='utf-8'):
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        if line.startswith('--'):
            parts = line[2:].split('|')
            cur = {'name': parts[1].strip() if len(parts) > 1 else parts[0], 'spec': (parts[2].strip() if len(parts) > 2 else '') or None, 'team': []}
            leagues[parts[0].strip()] = cur
            continue
        if cur is None:
            continue
        if line.startswith('=='):
            for kv in line[2:].split(','):
                k, _, v = kv.partition(':')
                if k.strip() == 'double' and v.strip() == 'true':
                    cur['double'] = True
            continue
        f = line.split('|')
        mon = resolve(f[0])
        level = re.match(r'\d+', f[1].strip()) if len(f) > 1 else None
        entry = {**(mon or {'n': f[0].split('>')[0]}), 'l': int(level.group()) if level else 0}
        moves = [m.strip() for m in f[2].split(',') if m.strip()] if len(f) > 2 else []
        if moves:
            entry['m'] = moves
        if len(f) > 3 and f[3].strip():
            entry['a'] = f[3].strip()
        if len(f) > 4 and f[4].strip():
            entry['i'] = f[4].strip()
        if len(f) > 5 and f[5].strip():
            entry['st'] = f[5].strip()
        if len(f) > 6 and f[6].strip():
            entry['tt'] = f[6].strip()
        cur['team'].append(entry)
    return leagues


os.makedirs(OUT, exist_ok=True)
for game, (rfile, lfile) in GAMES.items():
    rpath = os.path.join(SRC, 'routes', f'{rfile}.txt')
    lpath = os.path.join(SRC, 'leagues', f'{lfile}.txt')
    if not os.path.exists(rpath):
        print(f'skip {game}: no {rpath}')
        continue
    locations, route_bosses = parse_routes(rpath)
    supplement(game, locations)
    starters = []
    if locations and locations[0]['n'] == 'Starter':
        starters = locations.pop(0)['e']
        for b in route_bosses:
            b['after'] = max(0, b['after'] - 1)
        home = STARTER_AT.get(game, locations[0]['n'] if locations else 'Starter')
        target = next((l for l in locations if l['n'] == home), None)
        if target is None:
            target = {'n': home, 'e': []}
            locations.insert(0, target)
        target['e'] = starters + [e for e in target['e'] if e not in starters]
    leagues = parse_leagues(lpath) if os.path.exists(lpath) else {}
    bosses = []
    seen = set()
    for b in route_bosses:
        league = leagues.get(b['id'])
        if not league or not league['team'] or b['id'] in seen:
            continue
        seen.add(b['id'])
        fixes = BOSS_FIXES.get(game, {})
        name, btype = fixes.get(f"{league['name']}@{b['loc']}") or fixes.get(league['name']) or (league['name'], None)
        boss = {'id': b['id'], 'name': name, 'type': btype or b['type'], 'loc': b['loc'], 'after': b['after'], 'team': league['team']}
        if league['spec']:
            boss['spec'] = league['spec']
        if league.get('double'):
            boss['double'] = True
        bosses.append(boss)
    with open(os.path.join(OUT, f'{game}.json'), 'w') as fh:
        json.dump({'locations': locations, 'bosses': bosses, 'starters': starters}, fh, separators=(',', ':'), ensure_ascii=False)
    print(f'{game}: {len(locations)} locations, {len(bosses)} bosses')

if unknown:
    print(f'{len(unknown)} unresolved names (fakemon / typos):', ', '.join(sorted(unknown)[:60]))
