#!/usr/bin/env python3
"""Publish cached US closes for static GitHub Pages, without user holdings.

Fetch a bounded number of public symbols in parallel, preserve valid previous
published quotes on upstream outages, and reject empty/incomplete output.
"""
import concurrent.futures
import datetime as dt
import json
import os
import pathlib
import re
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1] / 'public'
PREVIOUS_URL = os.getenv('NEXPEN_PREVIOUS_US_QUOTES_URL',
                         'https://zeal-teng.github.io/nexpen/us-market-quotes.json')
DEFAULT = ('AAPL MSFT NVDA AMZN GOOGL GOOG META TSLA AMD INTC NFLX AVGO ORCL IBM '
           'CSCO CRM ADBE QCOM TXN MU PLTR UBER ABNB SHOP SQ PYPL COIN HOOD '
           'V MA JPM BAC WFC GS MS C BRK.B UNH JNJ PFE LLY MRK ABBV TMO '
           'COST WMT TGT HD LOW NKE DIS SBUX MCD KO PEP PG CAT BA GE XOM '
           'CVX OXY NEE F T GM RIVN LCID SMCI ARM SOFI VOO VTI SPY QQQ '
           'QQQM DIA IWM SCHD VIG VYM VT BND TLT IEF HYG GLD SLV USO').split()
TODAY = dt.datetime.now(dt.timezone.utc).date()


def valid(record):
    if not isinstance(record, dict):
        return False
    try:
        day = dt.date.fromisoformat(record['date'])
        price = float(record['price'])
        return 0 < price < 1_000_000 and 0 <= (TODAY - day).days <= 14
    except (ValueError, TypeError, KeyError):
        return False


def request_text(url, *, timeout=7, accept='application/json'):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; NEXPEN-quote-builder/1.1)',
        'Accept': accept,
    })
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read().decode('utf-8-sig')


def fetch_yahoo(symbol):
    """Only Yahoo Finance; alternate Yahoo hosts and retry transient failures."""
    encoded = urllib.parse.quote(symbol, safe='')
    for attempt in range(3):
        for host in ('query1.finance.yahoo.com', 'query2.finance.yahoo.com'):
            try:
                url = (f'https://{host}/v8/finance/chart/{encoded}'
                       '?range=14d&interval=1d')
                data = json.loads(request_text(url, timeout=12))
                result = (data.get('chart', {}).get('result') or [None])[0]
                if not result:
                    continue
                timestamps = result.get('timestamp') or []
                closes = ((result.get('indicators') or {}).get('quote') or [{}])[0].get('close') or []
                for stamp, close in reversed(list(zip(timestamps, closes))):
                    if close is None:
                        continue
                    # Yahoo timestamps are UTC instants, but US session dates must
                    # be interpreted in the America/New_York market timezone.
                    from zoneinfo import ZoneInfo
                    day = dt.datetime.fromtimestamp(stamp, ZoneInfo('America/New_York')).date()
                    record = {'price': close, 'date': day.isoformat(),
                              'source': 'Yahoo Finance 美國市場日收盤'}
                    if valid(record):
                        record['price'] = round(float(close), 6)
                        return record
            except (OSError, ValueError, TypeError, KeyError) as exc:
                print(f'Yahoo {host} {symbol} attempt {attempt+1} failed: {exc}')
        if attempt < 2:
            time.sleep(1.5 * (attempt + 1))
    return None


def fetch_with_fallback(symbol):
    # No Stooq or other provider: Yahoo-only host/retry fallback.
    return fetch_yahoo(symbol)


fetch = fetch_with_fallback


def load_previous(path):
    for origin in (str(path), PREVIOUS_URL):
        try:
            if origin.startswith('https://'):
                data = json.loads(request_text(origin, timeout=8))
            else:
                data = json.loads(pathlib.Path(origin).read_text(encoding='utf-8'))
            rows = data.get('quotes', {})
            return {key: value for key, value in rows.items()
                    if re.fullmatch(r'US:[A-Z][A-Z0-9]*(?:[.-][A-Z0-9]+)?', key)
                    and valid(value)}
        except (OSError, ValueError, KeyError, TypeError):
            continue
    return {}


def build(symbols, previous, fetcher=fetch, workers=4):
    output = dict(previous)
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(fetcher, symbol): symbol for symbol in symbols}
        for future in concurrent.futures.as_completed(futures):
            symbol = futures[future]
            try:
                record = future.result()
            except Exception:
                record = None
            if valid(record):
                key = 'US:' + symbol
                if record['date'] >= output.get(key, {}).get('date', ''):
                    output[key] = record
    return output


def main():
    path = ROOT / 'us-market-quotes.json'
    previous = load_previous(path)
    symbols = [s for s in DEFAULT if re.fullmatch(r'[A-Z][A-Z0-9]*(?:\.[A-Z0-9]+)?', s)]
    quotes = build(symbols, previous)
    if 'US:AAPL' not in quotes or not valid(quotes['US:AAPL']):
        raise RuntimeError('Cannot publish US quotes: valid AAPL close unavailable')
    ROOT.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({
        'format': 'nexpen-us-market-quotes-v1',
        'provider': 'Yahoo Finance',
        'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
        'quotes': quotes,
    }, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(f'US closing prices published: {len(quotes)}; AAPL={quotes["US:AAPL"]["price"]}'
          f' ({quotes["US:AAPL"]["date"]})')


if __name__ == '__main__':
    main()
