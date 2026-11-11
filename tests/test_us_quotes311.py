import datetime as dt
import importlib.util
import pathlib
import unittest

path = pathlib.Path(__file__).resolve().parents[1] / 'scripts' / 'fetch_us_market_quotes.py'
spec = importlib.util.spec_from_file_location('fetch_us_market_quotes', path)
quotes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(quotes)

class USQuotesTest(unittest.TestCase):
    def test_parallel_fetch_preserves_previous_when_symbol_fails(self):
        day = (quotes.TODAY - dt.timedelta(days=1)).isoformat()
        previous = {'US:MSFT': {'price': 400, 'date': day, 'source': 'cached'}}
        def fake_fetch(symbol):
            if symbol == 'MSFT':
                raise OSError('outage')
            return {'price': 200, 'date': day, 'source': 'test'}
        result = quotes.build(['AAPL', 'MSFT'], previous, fake_fetch, workers=2)
        self.assertEqual(result['US:MSFT']['price'], 400)
        self.assertEqual(result['US:AAPL']['price'], 200)

    def test_reject_stale_and_invalid_quotes(self):
        date = (quotes.TODAY - dt.timedelta(days=20)).isoformat()
        self.assertFalse(quotes.valid({'price': 100, 'date': date}))
        self.assertFalse(quotes.valid({'price': 0, 'date': quotes.TODAY.isoformat()}))

if __name__ == '__main__':
    unittest.main()
