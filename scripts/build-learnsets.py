#!/usr/bin/env python3
"""Builds src/data/learnsets/<version-group>.json from PokeAPI's static mirror.

Per game (version group): for every species, the moves it learns by level-up (with level), by TM/HM/TR,
from a tutor and as egg moves, plus each machine's number (e.g. TM26) — so the move picker can offer
only moves the Pokémon can actually have.

Run: python3 scripts/build-learnsets.py
"""
import json
import os
import ssl
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

API = 'https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2'
OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'learnsets')
MAX_ID = 1025
VERSION_GROUPS = [
    'red-blue', 'yellow', 'gold-silver', 'crystal', 'ruby-sapphire', 'emerald', 'firered-leafgreen',
    'diamond-pearl', 'platinum', 'heartgold-soulsilver', 'black-white', 'black-2-white-2', 'x-y',
    'omega-ruby-alpha-sapphire', 'sun-moon', 'ultra-sun-ultra-moon', 'lets-go-pikachu-lets-go-eevee',
    'sword-shield', 'brilliant-diamond-shining-pearl', 'scarlet-violet',
]
METHOD = {'level-up': 'l', 'machine': 'm', 'tutor': 't', 'egg': 'e'}
ctx = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))


def get(path):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(f'{API}/{path}/index.json', context=ctx, timeout=60) as r:
                return json.load(r)
        except Exception:
            if attempt == 3:
                raise


def learnset(species_id):
    out = defaultdict(lambda: defaultdict(list))  # vg -> method -> entries
    for m in get(f'pokemon/{species_id}')['moves']:
        move = m['move']['name']
        for d in m['version_group_details']:
            vg, method = d['version_group']['name'], METHOD.get(d['move_learn_method']['name'])
            if vg not in VERSION_GROUPS or not method:
                continue
            out[vg][method].append([move, d['level_learned_at']] if method == 'l' else move)
    return species_id, out


def machine(entry):
    m = get(entry['url'].replace('/api/v2/', '').strip('/'))
    return m['version_group']['name'], m['move']['name'], m['item']['name'].upper()


with ThreadPoolExecutor(32) as ex:
    learnsets = dict(ex.map(learnset, range(1, MAX_ID + 1)))
    machines = list(ex.map(machine, get('machine')['results']))

machine_names = defaultdict(dict)
for vg, move, item in machines:
    machine_names[vg][move] = item

os.makedirs(OUT, exist_ok=True)
for vg in VERSION_GROUPS:
    moves, index = [], {}

    def idx(move):
        if move not in index:
            index[move] = len(moves)
            moves.append(move)
        return index[move]

    species = {}
    for sid, by_vg in learnsets.items():
        methods = by_vg.get(vg)
        if not methods:
            continue
        entry = {}
        if methods['l']:
            entry['l'] = sorted({(idx(mv), lv) for mv, lv in methods['l']}, key=lambda x: (x[1], x[0]))
        for key in 'mte':
            if methods[key]:
                entry[key] = sorted({idx(mv) for mv in methods[key]})
        species[sid] = entry
    tms = {index[mv]: item for mv, item in machine_names[vg].items() if mv in index}
    path = os.path.join(OUT, f'{vg}.json')
    json.dump({'moves': moves, 'species': species, 'tm': tms}, open(path, 'w'), separators=(',', ':'))
    print(f'{vg}: {len(species)} species, {len(moves)} moves, {len(tms)} machines, {os.path.getsize(path) // 1024} KB')
