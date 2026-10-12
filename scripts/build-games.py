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
    leagues = parse_leagues(lpath) if os.path.exists(lpath) else {}
    bosses = []
    seen = set()
    for b in route_bosses:
        league = leagues.get(b['id'])
        if not league or not league['team'] or b['id'] in seen:
            continue
        seen.add(b['id'])
        boss = {'id': b['id'], 'name': league['name'], 'type': b['type'], 'loc': b['loc'], 'after': b['after'], 'team': league['team']}
        if league['spec']:
            boss['spec'] = league['spec']
        if league.get('double'):
            boss['double'] = True
        bosses.append(boss)
    with open(os.path.join(OUT, f'{game}.json'), 'w') as fh:
        json.dump({'locations': locations, 'bosses': bosses}, fh, separators=(',', ':'), ensure_ascii=False)
    print(f'{game}: {len(locations)} locations, {len(bosses)} bosses')

if unknown:
    print(f'{len(unknown)} unresolved names (fakemon / typos):', ', '.join(sorted(unknown)[:60]))
