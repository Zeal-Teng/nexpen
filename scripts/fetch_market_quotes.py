#!/usr/bin/env python3
"""Publish verified TWSE/TPEx closing quotes for the static GitHub Pages app.

No financial account data is sent or stored. When one market is unavailable,
recover its last valid quotes from the already deployed public JSON. If that
fallback is unavailable, fail the deployment instead of publishing partial data.
"""
import datetime as dt
import json
import os
import pathlib
import random
import re
import sys
import time
import urllib.error
import urllib.request

PUBLIC = pathlib.Path(__file__).resolve().parents[1] / 'public'
URLS = {
    'twse': 'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL',
    'tpex': 'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes',
}
PREVIOUS_URL = os.getenv('NEXPEN_PREVIOUS_QUOTES_URL', 'https://zeal-teng.github.io/nexpen/market-quotes.json')
MIN_MARKET_ROWS = 100
RETRY_CODES = {408, 425, 429, 500, 502, 503, 504}
SOURCES = {'twse': '證交所（上市）', 'tpex': '櫃買中心（上櫃）'}


def parse_date(raw):
    value = str(raw or '').strip().replace('/', '').replace('-', '')
    if re.fullmatch(r'\d{7}', value):
        value = str(int(value[:3]) + 1911) + value[3:]
    if not re.fullmatch(r'\d{8}', value):
        return ''
    try:
        day = dt.datetime.strptime(value, '%Y%m%d').date()
    except ValueError:
        return ''
    # A quote may legitimately be from a previous trading day (weekends/holidays).
    return day.isoformat()


def fetch_json(url, *, retries=4, timeout=30):
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; NEXPEN-public-quote-fetcher/1.1)',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
            })
            with urllib.request.urlopen(req, timeout=timeout) as res:
                return json.load(res)
        except (urllib.error.URLError, TimeoutError, ValueError, OSError) as exc:
            last = exc
            code = getattr(exc, 'code', None)
            if code is not None and code not in RETRY_CODES:
                break
            if attempt + 1 < retries:
                delay = min(2 * 2 ** attempt, 20) + random.uniform(0.2, 0.9)
                print(f'WARNING request attempt {attempt+1}/{retries} failed ({type(exc).__name__}); retry in {delay:.1f}s', file=sys.stderr)
                time.sleep(delay)
    raise RuntimeError(f'failed to fetch {url}: {last}')


def parse_quotes(rows, market, *, today=None):
    if not isinstance(rows, list):
        raise ValueError(f'{market}: response is not an array')
    today = today or dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).date()
    quotes, names = {}, {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        code = str(row.get('Code') if market == 'twse' else (row.get('SecuritiesCompanyCode') or row.get('Code') or '')).strip().upper()
        raw = str(row.get('ClosingPrice') if market == 'twse' else (row.get('Close') or row.get('ClosingPrice') or '')).replace(',', '').strip()
        date = parse_date(row.get('Date'))
        try:
            price = float(raw)
        except (TypeError, ValueError):
            continue
        if not re.fullmatch(r'[0-9A-Z]{4,8}', code) or not (0 < price < 1_000_000) or not date:
            continue
        day = dt.date.fromisoformat(date)
        if day > today or (today - day).days > 14:
            continue
        if code not in quotes or date >= quotes[code]['date']:
            quotes[code] = {'price': price, 'date': date, 'source': SOURCES[market]}
            name = str(row.get('Name') if market == 'twse' else (row.get('CompanyName') or row.get('Name') or '')).strip()
            if name:
                etf = code.startswith('00')
                bond = etf and (code.endswith(('B', 'C', 'D')) or any(term in name for term in ('債券', '美債', '公債', '公司債')))
                names[code] = {'name': name, 'market': market, 'kind': 'bondEtf' if bond else 'etf' if etf else 'stock', 'category': '官方收盤行情'}
    if len(quotes) < MIN_MARKET_ROWS:
        raise ValueError(f'{market}: insufficient valid prices ({len(quotes)})')
    return quotes, names


def valid_old_quote(code, record):
    if not isinstance(record, dict) or not re.fullmatch(r'[0-9A-Z]{4,8}', str(code)):
        return False
    try:
        return float(record.get('price', 0)) > 0 and bool(parse_date(record.get('date')))
    except (ValueError, TypeError):
        return False


def quote_market(record):
    return 'twse' if '證交所' in str(record.get('source', '')) else 'tpex' if '櫃買' in str(record.get('source', '')) else None


def merge_markets(fresh, previous, *, required=('twse', 'tpex')):
    """Never publish an incomplete market; don't replace a newer cached date."""
    old_quotes = previous.get('quotes', {}) if isinstance(previous, dict) else {}
    old_names = previous.get('securities', {}) if isinstance(previous, dict) else {}
    old_quotes = old_quotes if isinstance(old_quotes, dict) else {}
    old_names = old_names if isinstance(old_names, dict) else {}
    merged_quotes = {code: rec for code, rec in old_quotes.items() if valid_old_quote(code, rec)}
    merged_names = {code: rec for code, rec in old_names.items() if isinstance(rec, dict) and rec.get('name')}
    status = {}
    for market in required:
        got = fresh.get(market)
        if got:
            quotes, names = got
            for code, rec in quotes.items():
                if code not in merged_quotes or rec['date'] >= merged_quotes[code]['date']:
                    merged_quotes[code] = rec
            merged_names.update(names)
            status[market] = {'status': 'updated', 'count': len(quotes), 'latestDate': max(q['date'] for q in quotes.values())}
        else:
            fallback = {code: rec for code, rec in merged_quotes.items() if quote_market(rec) == market}
            if len(fallback) < MIN_MARKET_ROWS:
                raise RuntimeError(f'{market} fetch failed and no complete deployed fallback ({len(fallback)} records): deployment stopped')
            status[market] = {'status': 'cached', 'count': len(fallback), 'latestDate': max(q['date'] for q in fallback.values())}
    return merged_quotes, merged_names, status


def main():
    previous = {}
    try:
        payload = fetch_json(PREVIOUS_URL, retries=2, timeout=12)
        if payload.get('format') == 'cyberpulse-market-quotes-v1':
            previous['quotes'] = payload.get('quotes', {})
            print('Loaded last deployed public quotes:', len(previous['quotes']))
        else:
            print('WARNING old quote bundle format mismatch', file=sys.stderr)
    except Exception as exc:
        print(f'WARNING previously deployed quotes unavailable: {exc}', file=sys.stderr)
    try:
        names_payload = fetch_json(PREVIOUS_URL.replace('market-quotes.json', 'security-market-names.json'), retries=1, timeout=8)
        previous['securities'] = names_payload.get('securities', {})
    except Exception:
        pass

    fresh, errors = {}, {}
    for market, url in URLS.items():
        try:
            quotes, names = parse_quotes(fetch_json(url), market)
            fresh[market] = (quotes, names)
            print(f'{market}: {len(quotes)} valid prices; latest {max(q["date"] for q in quotes.values())}')
        except Exception as exc:
            errors[market] = str(exc)
            print(f'WARNING {market}: {exc}', file=sys.stderr)

    quotes, names, markets = merge_markets(fresh, previous)
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    PUBLIC.mkdir(parents=True, exist_ok=True)
    out = PUBLIC / 'market-quotes.json'
    out.write_text(json.dumps({'format': 'cyberpulse-market-quotes-v1', 'generatedAt': now, 'quotes': quotes,
                               'markets': markets, 'errors': errors}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    namefile = PUBLIC / 'security-market-names.json'
    namefile.write_text(json.dumps({'format': 'cyberpulse-market-names-v1', 'securities': names}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'Published {len(quotes)} prices, {len(names)} names; market status: {markets}')


if __name__ == '__main__':
    main()
