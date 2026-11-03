#!/usr/bin/env python3
"""Generate same-origin securities catalog without calling ISIN again.

fetch_market_quotes.py has already fetched TWSE/TPEx quotes and created
public/security-market-names.json. Read that file so deployment is not blocked
by slow or unavailable ISIN pages. Do not publish empty/incomplete catalogs.
"""
import datetime
import json
import pathlib
import sys

PUBLIC = pathlib.Path(__file__).resolve().parents[1] / 'public'
SOURCE = PUBLIC / 'security-market-names.json'
OUTPUT = PUBLIC / 'security-catalog.json'


def main():
    if not SOURCE.is_file():
        raise SystemExit('ERROR: missing security-market-names.json; run fetch_market_quotes.py first')
    raw = json.loads(SOURCE.read_text(encoding='utf-8'))
    securities = raw.get('securities', {})
    if not isinstance(securities, dict):
        raise SystemExit('ERROR: market securities should be an object')
    valid = {}
    for code, entry in securities.items():
        if not isinstance(code, str) or not isinstance(entry, dict):
            continue
        name = entry.get('name')
        if not isinstance(name, str) or not name.strip():
            continue
        valid[code] = entry
    if len(valid) < 100:
        raise SystemExit(f'ERROR: incomplete official names: {len(valid)} entries; not deploying')
    payload = {
        'format': 'cyberpulse-security-catalog-v1',
        'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'securities': valid,
        'errors': [],
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'Built {OUTPUT} with {len(valid)} securities from TWSE/TPEx closing quotes (no additional HTTP requests)')

if __name__ == '__main__':
    main()
