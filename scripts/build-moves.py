#!/usr/bin/env python3
"""Builds src/data/moves.json (type, power, category, generation per move) from PokeAPI's static mirror.

Run: python3 scripts/build-moves.py
"""
import json
import os
import ssl
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = 'https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2'
GEN = {'generation-i': 1, 'generation-ii': 2, 'generation-iii': 3, 'generation-iv': 4, 'generation-v': 5,
       'generation-vi': 6, 'generation-vii': 7, 'generation-viii': 8, 'generation-ix': 9}
CLASS = {'physical': 'p', 'special': 's', 'status': 'x'}
ctx = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))


def get(path):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(f'{BASE}/{path}/index.json', context=ctx, timeout=30) as r:
                return json.load(r)
        except Exception:
            if attempt == 3:
                raise


def build(entry):
    move_id = int(entry['url'].rstrip('/').split('/')[-1])
    m = get(f'move/{move_id}')
    return {'n': m['name'], 't': m['type']['name'], 'p': m['power'], 'c': CLASS.get(m['damage_class']['name'], 'x'),
            'g': GEN.get(m['generation']['name'], 9)}


moves = [m for m in get('move')['results'] if int(m['url'].rstrip('/').split('/')[-1]) < 10000]
with ThreadPoolExecutor(24) as ex:
    data = sorted(ex.map(build, moves), key=lambda m: m['n'])
out = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'moves.json')
json.dump(data, open(out, 'w'), separators=(',', ':'))
print(f'wrote {len(data)} moves to {out}')
