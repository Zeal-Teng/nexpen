import datetime as dt
import importlib.util
import pathlib
import unittest

MODULE = pathlib.Path(__file__).resolve().parents[1] / 'scripts' / 'fetch_market_quotes.py'
spec = importlib.util.spec_from_file_location('fetch_market_quotes', MODULE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class Tests(unittest.TestCase):
    def test_dates(self):
        for raw in ('1151105', '20261105', '115/11/05', '2026-11-05'):
            self.assertEqual(mod.parse_date(raw), '2026-11-05')
        self.assertEqual(mod.parse_date('20260230'), '')

    def test_market_and_preserve_newer(self):
        today = dt.date(2026,11,5)
        listed = [{'Code':str(2300+i),'Name':'測試','Date':'1151105','ClosingPrice':'1,000'} for i in range(120)]
        otc = [{'SecuritiesCompanyCode':str(6000+i),'CompanyName':'測試','Date':'20261105','Close':'33.2'} for i in range(120)]
        a=mod.parse_quotes(listed,'twse',today=today)
        b=mod.parse_quotes(otc,'tpex',today=today)
        self.assertEqual(len(a[0]),120)
        self.assertEqual(len(b[0]),120)
        previous={'quotes':{'2300':{'price':1200,'date':'2026-11-06','source':'證交所（上市）'}}}
        quotes,names,status=mod.merge_markets({'twse':a,'tpex':b},previous)
        self.assertEqual(quotes['2300']['price'],1200)
        self.assertEqual(status['tpex']['status'],'updated')

    def test_missing_market_fails_closed(self):
        prior={'quotes':{str(6000+i):{'price':20,'date':'2026-11-04','source':'櫃買中心（上櫃）'} for i in range(110)}}
        listed=[{'Code':str(2300+i),'Name':'測試','Date':'1151105','ClosingPrice':'100'} for i in range(110)]
        fresh={'twse':mod.parse_quotes(listed,'twse',today=dt.date(2026,11,5))}
        _,_,status=mod.merge_markets(fresh,prior)
        self.assertEqual(status['tpex']['status'],'cached')
        with self.assertRaises(RuntimeError):mod.merge_markets(fresh,{'quotes':{}})

if __name__=='__main__': unittest.main()

class HistoricalTests(unittest.TestCase):
    def setUp(self):
        self.day = dt.date(2026, 11, 5)
        self.listed_fields = ['證券代號', '證券名稱', '成交股數', '成交筆數', '成交金額', '開盤價', '最高價', '最低價', '收盤價', '漲跌(+/-)', '漲跌價差']
        self.twse = {'stat':'OK', 'tables':[{'title':'每日收盤行情', 'fields':self.listed_fields,
                     'data':[[str(2300+i),'上市'+str(i),'100','1','100','11','12','10','20.5','+','0.2'] for i in range(110)]}]}
        self.tpex = {'date':'20261105','tables':[{'fields':['代號','名稱','收盤','漲跌','開盤','最高','最低','成交股數','成交金額','成交筆數','備註'],
                     'data':[[str(6000+i),'上櫃'+str(i),'35.6','+0.1','35','36','34','100','1000','15',''] for i in range(110)]}]}

    def test_verified_historical_response(self):
        quotes, names = mod.parse_history(self.twse,'twse',self.day)
        self.assertEqual(len(quotes),110)
        self.assertEqual(quotes['2300']['price'],20.5)
        self.assertEqual(quotes['2300']['date'],'2026-11-05')
        self.assertEqual(names['2300']['market'],'twse')
        self.assertEqual(quotes['2300']['change'],0.2)
        quotes, names = mod.parse_history(self.tpex,'tpex',self.day)
        self.assertEqual(len(quotes),110)
        self.assertEqual(quotes['6000']['price'],35.6)
        self.assertEqual(quotes['6000']['change'],0.1)

    def test_reject_wrong_date_and_partial_response(self):
        from copy import deepcopy
        bad=deepcopy(self.tpex)
        bad['date']='20261104'
        with self.assertRaises(ValueError):mod.parse_history(bad,'tpex',self.day)
        bad=deepcopy(self.twse)
        bad['tables'][0]['data']=bad['tables'][0]['data'][:5]
        with self.assertRaises(ValueError):mod.parse_history(bad,'twse',self.day)

    def test_history_first_and_openapi_fallback(self):
        calls=[]
        def fetch(url,**kwargs):
            calls.append(url)
            if 'MI_INDEX' in url:return self.twse
            raise ValueError('should not call fallback')
        quotes,_,source=mod.fetch_preferred_market('twse',today=self.day,fetcher=fetch)
        self.assertEqual(source,'history:2026-11-05')
        self.assertEqual(len(calls),1)
        self.assertEqual(len(quotes),110)
        calls=[]
        def fallback(url,**kwargs):
            calls.append(url)
            if 'STOCK_DAY_ALL' in url:
                return [{'Code':str(2300+i),'Date':'1151104','Name':'測試','ClosingPrice':'25'} for i in range(110)]
            raise ValueError('history not ready')
        quotes,_,source=mod.fetch_preferred_market('twse',today=self.day,fetcher=fallback)
        self.assertEqual(source,'openapi')
        self.assertEqual(len(quotes),110)
        self.assertTrue(any('STOCK_DAY_ALL' in x for x in calls))

    def test_history_column_name_reorder(self):
        altered={'stat':'OK','tables':[{'title':'每日收盤行情','fields':['收盤價','證券名稱','證券代號'],
                'data':[['43.9','測試',str(2300+i)] for i in range(110)]}]}
        quotes,_=mod.parse_history(altered,'twse',self.day)
        self.assertEqual(quotes['2300']['price'],43.9)

class TrendSign225Tests(unittest.TestCase):
    def test_explicit_down_mark_overrides_unsigned_difference(self):
        self.assertEqual(mod._signed_change('1.50', '-'), -1.5)
        self.assertEqual(mod._signed_change('1.50', '<p style="color:green">▼</p>'), -1.5)
        self.assertEqual(mod._signed_change('▼1.50'), -1.5)
        self.assertEqual(mod._signed_change('0.3', '▲'), 0.3)
        self.assertIsNone(mod._signed_change('—'))
    def test_history_decline_with_separate_twse_sign(self):
        day=dt.date(2026,11,5)
        table={'fields':['證券代號','證券名稱','收盤價','漲跌(+/-)','漲跌價差'],
               'data':[['2330','股票','100','<span>－</span>','2.0']]}
        found,_=mod._read_history_table(table,'twse',day)
        self.assertEqual(found[0][2],-2.0)
