#!/usr/bin/env python3
"""Builds src/data/pokedex.json from PokeAPI's static data mirror on GitHub.

Bundling the data keeps the app fully offline and independent of pokeapi.co.
Run: python3 scripts/build-pokedex.py
"""
import json
import os
import ssl
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = 'https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2'
MAX_ID = 1025
GEN = {'generation-i': 1, 'generation-ii': 2, 'generation-iii': 3, 'generation-iv': 4,
       'generation-v': 5, 'generation-vi': 6, 'generation-vii': 7, 'generation-viii': 8,
       'generation-ix': 9}
STATS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']

ctx = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))


def get(path):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(f'{BASE}/{path}/index.json', context=ctx, timeout=30) as r:
                return json.load(r)
        except Exception:
            if attempt == 3:
                raise


def url_id(url):
    return int(url.rstrip('/').split('/')[-1])


def build(i):
    sp = get(f'pokemon-species/{i}')
    pk = get(f'pokemon/{i}')
    name = next(n['name'] for n in sp['names'] if n['language']['name'] == 'en')
    entry = {
        'id': i,
        'name': name,
        'gen': GEN[sp['generation']['name']],
        'types': [t['type']['name'] for t in sorted(pk['types'], key=lambda t: t['slot'])],
        'chain': url_id(sp['evolution_chain']['url']),
        'stats': [next(s['base_stat'] for s in pk['stats'] if s['stat']['name'] == n) for n in STATS],
        'abilities': [a['ability']['name'] for a in sorted(pk['abilities'], key=lambda a: a['slot'])],
    }
    past = [{'gen': GEN[p['generation']['name']],
             'types': [t['type']['name'] for t in sorted(p['types'], key=lambda t: t['slot'])]}
            for p in pk.get('past_types', [])]
    if past:
        entry['pastTypes'] = past
    return entry


with ThreadPoolExecutor(24) as ex:
    data = list(ex.map(build, range(1, MAX_ID + 1)))

out = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'pokedex.json')
with open(out, 'w') as f:
    json.dump(data, f, separators=(',', ':'), ensure_ascii=False)
print(f'wrote {len(data)} species to {out}')
