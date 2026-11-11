#!/usr/bin/env python3
"""Build a publicly cached US *daily closing* price file for popular symbols.

The user's watchlist stays local. Symbols beyond the published coverage may
require direct client-side requests subject to third-party CORS restrictions.
No secrets or personal account data are required.
"""
import csv
import datetime as dt
import io
import json
import pathlib
import re
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1] / 'public'
DEFAULT = ('AAPL MSFT NVDA AMZN GOOGL GOOG META TSLA AMD INTC NFLX AVGO ORCL IBM '
           'CSCO CRM ADBE QCOM TXN MU PLTR UBER ABNB SHOP SQ PYPL COIN HOOD '
           'V V MA JPM BAC WFC GS MS C BRK.B UNH JNJ PFE LLY MRK ABBV TMO '
           'COST WMT TGT HD LOW NKE DIS SBUX MCD KO PEP PG CAT BA GE XOM '
           'CVX OXY NEE F T GM RIVN LCID SMCI ARM SOFI VOO VTI SPY QQQ '
           'QQQM DIA IWM SCHD VIG VYM VT BND TLT IEF HYG GLD SLV USO ').split()

def parse_csv(body, symbol):
    records=list(csv.DictReader(io.StringIO(body)))
    today=dt.datetime.now(dt.timezone.utc).date()
    for row in reversed(records):
        try:
            day=dt.date.fromisoformat(row['Date']); close=float(row['Close'])
            if 0<close<1000000 and 0 <= (today-day).days <= 14:
                return {'price':close, 'date':day.isoformat(), 'source':'Stooq 美國市場日收盤'}
        except (KeyError, ValueError, TypeError):
            continue
    return None

def fetch(symbol):
    url='https://stooq.com/q/d/l/?'+urllib.parse.urlencode({'s':symbol.lower().replace('.','-')+'.us','i':'d','d1':(dt.datetime.now(dt.timezone.utc).date()-dt.timedelta(days=12)).strftime('%Y%m%d')})
    request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Accept':'text/csv'})
    with urllib.request.urlopen(request,timeout=14) as response:
        return parse_csv(response.read().decode('utf-8-sig'),symbol)

def fetch_yahoo(symbol):
    """GitHub Actions server-side fallback; never expose credentials in the PWA."""
    for host in ('query1.finance.yahoo.com','query2.finance.yahoo.com'):
        url=f'https://{host}/v8/finance/chart/{urllib.parse.quote(symbol)}?range=14d&interval=1d'
        request=urllib.request.Request(url, headers={
            'User-Agent':'Mozilla/5.0 (compatible; NEXPEN/1.0)',
            'Accept':'application/json',
        })
        try:
            with urllib.request.urlopen(request,timeout=12) as response:
                data=json.loads(response.read().decode('utf-8'))
            result=(data.get('chart',{}).get('result') or [None])[0]
            if not result:continue
            timestamps=result.get('timestamp') or []
            closes=((result.get('indicators') or {}).get('quote') or [{}])[0].get('close') or []
            for timestamp,close in reversed(list(zip(timestamps,closes))):
                if close is None or not (0<float(close)<1000000):continue
                # Yahoo timestamps reference the corresponding exchange trading day.
                day=dt.datetime.fromtimestamp(timestamp,dt.timezone.utc).date()
                if 0<=(dt.datetime.now(dt.timezone.utc).date()-day).days<=14:
                    return {'price':round(float(close),6),'date':day.isoformat(),'source':'Yahoo Finance 美國市場日收盤'}
        except (OSError,ValueError,KeyError,TypeError):
            continue
    return None

def fetch_with_fallback(symbol):
    try:
        data=fetch(symbol)
        if data:return data
    except (OSError,ValueError,KeyError,TypeError):pass
    return fetch_yahoo(symbol)

def main():
    path=ROOT/'us-market-quotes.json';old={}
    if path.exists():
        try:old=json.loads(path.read_text()).get('quotes',{})
        except (ValueError,OSError):pass
    fresh={}; failed=[]
    for symbol in DEFAULT:
        if not re.fullmatch(r'[A-Z][A-Z0-9]*(?:\.[A-Z0-9]+)?',symbol):continue
        code='US:'+symbol
        try:
            rec=fetch_with_fallback(symbol)
            if rec and rec['date']>=old.get(code,{}).get('date',''):fresh[code]=rec
            elif code in old:fresh[code]=old[code]
        except Exception as error:
            failed.append(symbol)
            if code in old:fresh[code]=old[code]
        time.sleep(0.12)
    if not fresh:raise RuntimeError('No valid US closes or cached US prices; refusing empty publication')
    path.write_text(json.dumps({'format':'nexpen-us-market-quotes-v1','generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'quotes':fresh},separators=(',',':'))+'\n',encoding='utf-8')
    print(f'US market quotes: {len(fresh)} symbols, missing {len(failed)}')
if __name__=='__main__':main()
