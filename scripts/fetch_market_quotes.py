#!/usr/bin/env python3
"""Publish verified TWSE/TPEx closing quotes for the static GitHub Pages app.

No financial account data is sent or stored. When one market is unavailable,
recover its last valid quotes from the already deployed public JSON. If that
fallback is unavailable, fail the deployment instead of publishing partial data.
"""
import datetime as dt
import html
import json
import os
import pathlib
import random
import re
import sys
import time
import urllib.error
import urllib.request
import urllib.parse

PUBLIC = pathlib.Path(__file__).resolve().parents[1] / 'public'
URLS = {
    'twse': 'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL',
    'tpex': 'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes',
}
HISTORY_URLS = {
    'twse': 'https://www.twse.com.tw/exchangeReport/MI_INDEX',
    'tpex': 'https://www.tpex.org.tw/www/zh-tw/afterTrading/dailyQuotes',
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
            record = {'price': price, 'date': date, 'source': SOURCES[market]}
            raw_change = row.get('Change') if market == 'twse' else (row.get('Change') or row.get('PriceChange'))
            change = _signed_change(raw_change, row.get('ChangeSign') or row.get('UpDown') or row.get('ChangeType'))
            if change is not None:
                record['change'] = change
            quotes[code] = record
            name = str(row.get('Name') if market == 'twse' else (row.get('CompanyName') or row.get('Name') or '')).strip()
            if name:
                etf = code.startswith('00')
                bond = etf and (code.endswith(('B', 'C', 'D')) or any(term in name for term in ('債券', '美債', '公債', '公司債')))
                names[code] = {'name': name, 'market': market, 'kind': 'bondEtf' if bond else 'etf' if etf else 'stock', 'category': '官方收盤行情'}
    if len(quotes) < MIN_MARKET_ROWS:
        raise ValueError(f'{market}: insufficient valid prices ({len(quotes)})')
    return quotes, names



def _column_index(fields, candidates):
    """Resolve indices from source-provided table headings, not table position."""
    if not isinstance(fields, list):
        return None
    for index, field in enumerate(fields):
        label = re.sub(r'[\s\u3000()（）]', '', str(field))
        if any(candidate in label for candidate in candidates):
            return index
    return None


def _quote_sign(raw):
    """Recognize explicit exchange up/down marks, including HTML and Unicode."""
    value = html.unescape(re.sub(r'<[^>]*>', '', str(raw or ''))).strip()
    if value in ('-', '－', '−', '﹣', '▼', '▽', '↓') or value.startswith(('▼', '▽', '↓')):
        return -1
    if value in ('+', '＋', '﹢', '▲', '△', '↑') or value.startswith(('▲', '△', '↑')):
        return 1
    return None


def _signed_change(raw, sign=None):
    """Use the separate trend marker over an unsigned exchange price difference."""
    value = html.unescape(re.sub(r'<[^>]*>', '', str(raw if raw is not None else ''))).strip()
    value = value.replace(',', '').replace('＋', '+').replace('－', '-').replace('−', '-')
    marker = _quote_sign(sign)
    if marker is None:
        marker = _quote_sign(value[:1])
    value = value.lstrip('▲△↑▼▽↓').strip()
    if not re.fullmatch(r'[+-]?(?:\d+(?:\.\d*)?|\.\d+)', value):
        return None
    n = float(value)
    return abs(n) * marker if marker is not None else n


def _read_history_table(table, market, trade_date):
    rows = table.get('data') or table.get('aaData') or []
    fields = table.get('fields') or table.get('header') or table.get('columns') or []
    if not isinstance(rows, list) or not rows:
        return [], []
    if market == 'twse':
        code_idx = _column_index(fields, ('證券代號', '股票代號', '代號'))
        name_idx = _column_index(fields, ('證券名稱', '股票名稱', '名稱'))
        price_idx = _column_index(fields, ('收盤價',))
        # The TWSE MI_INDEX body sometimes supplies no headings for data9/10.
        if code_idx is None or price_idx is None:
            if not fields and all(isinstance(row, list) and len(row) >= 11 for row in rows[:10]):
                code_idx, name_idx, price_idx = 0, 1, 8
            else:
                return [], []
    else:
        code_idx = _column_index(fields, ('代號', '股票代號', '證券代號'))
        name_idx = _column_index(fields, ('名稱', '股票名稱', '證券名稱'))
        price_idx = _column_index(fields, ('收盤',))
        if code_idx is None or price_idx is None:
            # The provided TPEx history function uses [code,name,close,...].
            if not fields and all(isinstance(row, list) and len(row) >= 11 for row in rows[:10]):
                code_idx, name_idx, price_idx = 0, 1, 2
            else:
                return [], []
    change_idx = _column_index(fields, ('漲跌價差', '漲跌', '漲跌價'))
    # Resolve columns independently: generic '漲跌' must not swallow '漲跌價差'.
    sign_idx = next((i for i, f in enumerate(fields) if re.sub(r'[\s\u3000()（）]', '', str(f)) in ('漲跌+/-', '漲跌符號', '漲跌標記')), None) if market == 'twse' else None
    if market == 'twse':
        change_idx = _column_index(fields, ('漲跌價差', '漲跌價'))
    if market == 'twse' and not fields and price_idx == 8:
        sign_idx, change_idx = 9, 10
    found = []
    titles = []
    for row in rows:
        if not isinstance(row, list) or max(code_idx, price_idx) >= len(row):
            continue
        code = str(row[code_idx]).strip().upper()
        price_text = str(row[price_idx]).replace(',', '').strip()
        if not re.fullmatch(r'[0-9A-Z]{4,8}', code):
            continue
        try:
            price = float(price_text)
        except (TypeError, ValueError):
            continue
        if not (0 < price < 1_000_000):
            continue
        change = None
        if change_idx is not None and change_idx < len(row):
            marker = row[sign_idx] if sign_idx is not None and sign_idx < len(row) else None
            change = _signed_change(row[change_idx], marker)
        found.append((code, price, change))
        name = str(row[name_idx]).strip() if name_idx is not None and name_idx < len(row) else ''
        if name:
            titles.append((code, name))
    return found, titles


def parse_history(payload, market, target_date):
    """Verify exact response date, then parse a market-wide closing-price table."""
    target = target_date.isoformat()
    if not isinstance(payload, dict):
        raise ValueError(f'{market}: history response is not a JSON object')
    if market == 'twse':
        if payload.get('stat') != 'OK':
            raise ValueError(f'twse: historical data unavailable: {payload.get("stat")}')
        reported = parse_date(payload.get('date') or payload.get('Date'))
        # TWSE MI_INDEX JSON may not contain a top-level date. In that case,
        # the endpoint was explicitly queried by date; never infer a different day.
        if reported and reported != target:
            raise ValueError(f'twse: requested {target}, received {reported}')
        tables = payload.get('tables', [])
        if not tables:
            tables = [dict(data=payload.get(key, [])) for key in ('data9','data10','data11','data8') if isinstance(payload.get(key), list)]
    else:
        reported = parse_date(payload.get('date') or payload.get('Date'))
        if reported != target:
            raise ValueError(f'tpex: requested {target}, received {reported or "no date"}')
        tables = payload.get('tables', [])
    if not isinstance(tables, list):
        raise ValueError(f'{market}: history tables malformed')
    best = ([], [])
    for table in tables:
        if not isinstance(table, dict):
            continue
        result = _read_history_table(table, market, target)
        if len(result[0]) > len(best[0]):
            best = result
    if len(best[0]) < MIN_MARKET_ROWS:
        raise ValueError(f'{market}: insufficient history prices ({len(best[0])}) for {target}')
    quotes, names = {}, {}
    for code, price, change in best[0]:
        quotes[code] = {'price': price, 'date': target, 'source': SOURCES[market]}
        if change is not None:
            quotes[code]['change'] = change
    for code, name in best[1]:
        etf = code.startswith('00')
        bond = etf and (code.endswith(('B','C','D')) or any(term in name for term in ('債券','美債','公債','公司債')))
        names[code] = {'name': name, 'market': market, 'kind': 'bondEtf' if bond else 'etf' if etf else 'stock', 'category': '官方收盤行情'}
    return quotes, names


def history_url(market, day):
    if market == 'twse':
        params = {'response':'json', 'date':day.strftime('%Y%m%d'), 'type':'ALLBUT0999'}
    else:
        params = {'date':day.strftime('%Y/%m/%d'), 'response':'json'}
    return HISTORY_URLS[market] + '?' + urllib.parse.urlencode(params)


def fetch_preferred_market(market, *, today=None, fetcher=fetch_json):
    """Try dated history first, falling back to official latest OpenAPI.

    Weekend days are skipped; market holidays return no/invalid history data.
    Do not query farther back than seven calendar days, and avoid many costly
    retry rounds for an ordinary not-yet-published trading day.
    """
    today = today or dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).date()
    failures = []
    for offset in range(8):
        day = today - dt.timedelta(days=offset)
        if day.weekday() >= 5:
            continue
        url = history_url(market, day)
        try:
            quotes, names = parse_history(fetcher(url, retries=1), market, day)
            print(f'{market}: history {day} contains {len(quotes)} verified prices')
            return quotes, names, f'history:{day.isoformat()}'
        except Exception as exc:
            failures.append(f'{day.isoformat()}: {exc}')
    try:
        quotes, names = parse_quotes(fetcher(URLS[market]), market, today=today)
        print(f'{market}: latest OpenAPI fallback has {len(quotes)} prices')
        return quotes, names, 'openapi'
    except Exception as exc:
        raise RuntimeError(f'{market}: history and OpenAPI both failed; latest={exc}; historical attempts={"; ".join(failures[:3])}') from exc

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

    fresh, errors, origins = {}, {}, {}
    for market in URLS:
        try:
            quotes, names, source = fetch_preferred_market(market)
            fresh[market] = (quotes, names)
            origins[market] = source
            print(f'{market}: {len(quotes)} valid prices; latest {max(q["date"] for q in quotes.values())}; source={source}')
        except Exception as exc:
            errors[market] = str(exc)
            print(f'WARNING {market}: {exc}', file=sys.stderr)

    quotes, names, markets = merge_markets(fresh, previous)
    for market, source in origins.items():
        markets[market]['method'] = source
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
