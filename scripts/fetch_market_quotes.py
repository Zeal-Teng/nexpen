#!/usr/bin/env python3
"""Fetch public market data at deployment time. Does not handle any private app data."""
import json,urllib.request,datetime, pathlib,sys
URLS={
 'twse':'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL',
 'tpex':'https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes',
}
def roc_date(s):
 s=str(s).strip()
 if len(s)==7 and s.isdigit():return f'{int(s[:3])+1911:04d}-{s[3:5]}-{s[5:7]}'
 return s if len(s)==10 and s[4]=='-' and s[7]=='-' else ''
def parse(rows,market):
 if not isinstance(rows,list):raise ValueError('not JSON array')
 result={}
 for r in rows:
  code=str(r.get('Code' if market=='twse' else 'SecuritiesCompanyCode','')).strip().upper()
  raw=str(r.get('ClosingPrice' if market=='twse' else 'Close','')).strip().replace(',','')
  date=roc_date(r.get('Date',''))
  try:p=float(raw)
  except (ValueError,TypeError):continue
  if not code.isalnum() or not (4<=len(code)<=8) or p<=0 or not date:continue
  result[code]={'price':p,'date':date,'source':'證交所（上市）' if market=='twse' else '櫃買中心（上櫃）'}
 return result
quotes={};fail=[]
for market,url in URLS.items():
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 CYBERPULSE/1.0','Accept':'application/json'})
  with urllib.request.urlopen(req,timeout=35) as response:rows=json.load(response)
  found=parse(rows,market)
  if not found:raise ValueError('no valid closing quotes')
  quotes.update(found)
  print(f'{market}: {len(found)} closing prices')
 except Exception as exc:
  fail.append(f'{market}: {exc}')
  print(f'WARNING {market}: {exc}',file=sys.stderr)
if not quotes:
 raise SystemExit('Both official sources failed; refusing to replace last deployed quotes')
p=pathlib.Path(__file__).resolve().parents[1]/'public'/'market-quotes.json'
p.write_text(json.dumps({'format':'cyberpulse-market-quotes-v1','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'quotes':quotes},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('wrote',p,'with',len(quotes),'entries','; '.join(fail))
