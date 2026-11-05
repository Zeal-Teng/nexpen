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
