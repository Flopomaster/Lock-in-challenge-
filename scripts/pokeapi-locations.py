#!/usr/bin/env python3
"""Lists a region's PokeAPI locations that have wild encounters in the given game versions.

Used by build-games.py to fill places the route data is missing (e.g. post-game areas).
Output: JSON [{"n": English name, "e": [species ids]}] on stdout.
Usage: python3 scripts/pokeapi-locations.py <region-id> <version> [<version> ...]
"""
import json
import os
import ssl
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

API = 'https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2'
ctx = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))


def get(path):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(f'{API}/{path.strip("/").removeprefix("api/v2/")}/index.json', context=ctx, timeout=30) as r:
                return json.load(r)
        except Exception:
            if attempt == 3:
                raise


def url_id(url):
    return int(url.rstrip('/').split('/')[-1])


region, versions = sys.argv[1], set(sys.argv[2:])


def location(entry):
    loc = get(f'location/{url_id(entry["url"])}')
    name = next((n['name'] for n in loc['names'] if n['language']['name'] == 'en'), loc['name'])
    species = []
    for area in loc['areas']:
        for enc in get(f'location-area/{url_id(area["url"])}')['pokemon_encounters']:
            if any(v['version']['name'] in versions for v in enc['version_details']):
                pid = url_id(enc['pokemon']['url'])
                sid = pid if pid < 10000 else url_id(get(f'pokemon/{pid}')['species']['url'])
                if sid not in species:
                    species.append(sid)
    return {'n': name, 'e': species, 'slug': loc['name']}


with ThreadPoolExecutor(16) as ex:
    found = [l for l in ex.map(location, get(f'region/{region}')['locations']) if l['e']]
json.dump(found, sys.stdout, ensure_ascii=False)
