#!/usr/bin/env python3
"""Builds src/data/gen4.json (save-file import tables) from PKHeX + PokeAPI.

Usage: python3 scripts/build-gen4.py /path/to/PKHeX
  (a sparse clone of https://github.com/kwsch/PKHeX with PKHeX.Core/PKM and PKHeX.Core/Resources/text)
"""
import json
import os
import re
import ssl
import sys
import urllib.request

PKHEX = os.path.join(sys.argv[1], 'PKHeX.Core')
OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'gen4.json')

# Character table (international): only the 0x100+ range is used by Western-language saves.
src = open(os.path.join(PKHEX, 'PKM/Strings/StringConverter4Util.cs'), encoding='utf-8-sig').read()
i = src.index('TableINT')
j = src.index('[', src.index('=>', i))
k = src.index('];', j)
NAMED = {'HGM': '♂', 'HGF': '♀'}  # PKHeX's private-use gender symbols
table = []
for line in src[j + 1:k].split('\n'):
    for t in re.findall(r"'(?:\\.|[^'])'|\b[A-Za-z_]+\b|0x[0-9A-Fa-f]+", line.split('//')[0]):
        table.append(eval(t) if t.startswith("'") else chr(int(t, 16)) if t.startswith('0x') else NAMED.get(t, '\0'))
chars = ''.join(table[0x100:])

# Met-location names, keyed by id (ids 0.., 2000.., 3000..).
locations = {}
for base in (0, 2000, 3000):
    path = os.path.join(PKHEX, f'Resources/text/locations/gen4/text_hgss_{base:05d}_en.txt')
    for n, name in enumerate(open(path, encoding='utf-8-sig').read().splitlines()):
        if name.strip():
            locations[base + n] = name.strip().replace('’', "'")

# Ability ids -> PokeAPI slugs (Gen 4 ids match the national ability numbering).
ctx = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE'))
with urllib.request.urlopen('https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2/ability/index.json', context=ctx) as r:
    abilities = {int(a['url'].rstrip('/').split('/')[-1]): a['name'] for a in json.load(r)['results']}
ability_list = [abilities.get(n, '') for n in range(0, 124)]

json.dump({'charStart': 0x100, 'chars': chars, 'locations': locations, 'abilities': ability_list},
          open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
print(f'wrote {OUT}: {len(chars)} chars, {len(locations)} locations, {len(ability_list)} abilities')
