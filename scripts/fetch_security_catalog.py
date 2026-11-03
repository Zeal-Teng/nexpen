#!/usr/bin/env python3
"""Build same-origin ISIN securities catalog for GitHub Pages from TWSE ISIN tables.
If one source fails the other can still work; never publish an empty catalog.
"""
from html.parser import HTMLParser
from pathlib import Path
import datetime,json,re,sys,urllib.request

URLS={'twse':'https://isin.twse.com.tw/isin/C_public.jsp?strMode=2',
      'tpex':'https://isin.twse.com.tw/isin/C_public.jsp?strMode=4'}
class Table(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.rows=[];self.current=None;self.in_td=False;self.parts=[]
 def handle_starttag(self,tag,attrs):
  if tag=='tr':self.current=[]
  if tag=='td' and self.current is not None:self.in_td=True;self.parts=[]
  if tag=='br' and self.in_td:self.parts.append(' ')
 def handle_data(self,data):
  if self.in_td:self.parts.append(data)
 def handle_endtag(self,tag):
  if tag=='td' and self.in_td:
   self.current.append(''.join(self.parts).replace('\xa0',' ').strip());self.in_td=False
  if tag=='tr' and self.current is not None:
   if self.current:self.rows.append(self.current)
   self.current=None

def sec_type(section):
 s=re.sub(r'\s+','',section)
 if re.search('權證|認購|認售|存託憑證|公司債|可轉換|受益證券|特別股|股款|期貨|選擇權',s):return None
 if re.search('ETF|指數股票型基金|交易所交易基金',s,re.I):return 'etf'
 if '股票' in s:return 'stock'
 return None

def parse_html(html,market):
 p=Table();p.feed(html)
 current='';out={}
 for cells in p.rows:
  if len(cells)==1:current=cells[0];continue
  if len(cells)<3:continue
  kind=sec_type(current)
  if kind is None:continue
  match=re.match(r'^([0-9A-Z]{4,8})[\s\u3000]+(.+)$',cells[0],re.I)
  if not match:continue
  code,name=match.group(1).upper(),match.group(2).strip()
  if not name or '有價證券代號' in name:continue
  bond=kind=='etf' and (re.search('債券|債|公司債|公債',name) or re.fullmatch(r'[0-9]{5}[BCD]',code))
  out[code]={'name':name,'market':market,'kind':'bondEtf' if bond else kind,'category':current}
 return out

def fetch(url):
 req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (CYBERPULSE; security catalog)','Accept':'text/html'})
 with urllib.request.urlopen(req,timeout=50) as r:
  raw=r.read();charset=r.headers.get_content_charset()
 for encoding in [charset,'big5','cp950','utf-8']:
  if not encoding:continue
  try:return raw.decode(encoding)
  except (LookupError,UnicodeDecodeError):continue
 return raw.decode('big5',errors='replace')

def listed_fallback():
 """Build listed Code/Name fallback independent of ISIN HTML availability."""
 url='https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL'
 req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 CYBERPULSE/1.0','Accept':'application/json'})
 with urllib.request.urlopen(req,timeout=40) as response:rows=json.load(response)
 output={}
 for item in rows:
  code=str(item.get('Code','')).strip().upper()
  name=str(item.get('Name','')).strip()
  if not re.fullmatch(r'[0-9A-Z]{4,8}',code) or not name:continue
  etf=code.startswith('00')
  bond=etf and (bool(re.search('債券|美債|公債|公司債',name)) or bool(re.fullmatch(r'[0-9]{5}[BCD]',code)))
  output[code]={'name':name,'market':'twse','kind':'bondEtf' if bond else 'etf' if etf else 'stock','category':'上市官方行情名稱'}
 if len(output)<100:raise ValueError('上市行情名冊太少，不使用備援')
 return output

def main():
 securities={};fail=[]
 for market,url in URLS.items():
  try:
   parsed=parse_html(fetch(url),market)
   if len(parsed)<30:raise ValueError(f'only {len(parsed)} entries; likely layout changed')
   securities.update(parsed)
   print(f'{market}: {len(parsed)} listed securities')
  except Exception as exc:
   fail.append(f'{market}: {exc}');print('WARNING:',fail[-1],file=sys.stderr)
 try:
  listed=listed_fallback()
  # ISIN classification is more precise, so its entries override the fallback.
  securities={**listed,**securities}
  dest_fallback=Path(__file__).resolve().parents[1]/'public'/'security-listed-fallback.json'
  dest_fallback.write_text(json.dumps({'format':'cyberpulse-listed-names-v1','securities':listed},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
  print('official TWSE Code/Name fallback:',len(listed))
 except Exception as exc:
  print('WARNING: listed name fallback:',exc,file=sys.stderr)
 # Prefer precise ISIN classification; use the same-day official quote name lists
 # when the ISIN website blocks GitHub hosted runners.
 namesfile=Path(__file__).resolve().parents[1]/'public'/'security-market-names.json'
 if namesfile.exists():
  try:
   quotesnames=json.loads(namesfile.read_text(encoding='utf-8')).get('securities',{})
   securities={**quotesnames,**securities}
   print('official quotes fallback:',len(quotesnames),'names')
  except (ValueError,OSError) as exc:print('WARNING: cannot read quote name cache:',exc,file=sys.stderr)
 if not securities:raise SystemExit('ISIN and listing sources failed; refusing to publish empty catalog')
 dest=Path(__file__).resolve().parents[1]/'public'/'security-catalog.json'
 dest.write_text(json.dumps({'format':'cyberpulse-security-catalog-v1','generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'securities':securities,'errors':fail},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 print('wrote',dest,'entries',len(securities))
if __name__=='__main__':main()
