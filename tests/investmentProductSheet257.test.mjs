import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const component = fs.readFileSync(new URL('../src/InvestmentProducts.jsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/folio-redesign.css', import.meta.url), 'utf8');

test('Fund and bond dialog escapes investment-page transforms through document.body portal', () => {
  assert.match(component, /import\s*\{createPortal\}\s*from\s*'react-dom'/);
  assert.match(component, /dialog&&createPortal\(<div className="investment-product-backdrop"/);
  assert.match(component, /<\/section><\/div>, document\.body\)/);
});

test('Fund and bond dialog supports desktop viewport and scrolling form with persistent actions', () => {
  assert.match(css, /html \.investment-product-backdrop\s*\{[^}]*position:\s*fixed\s*!important/s);
  assert.match(css, /html \.investment-product-backdrop \.investment-product-sheet\s*\{[^}]*max-height:\s*calc\(100dvh - 40px\)/s);
  assert.match(css, /html \.investment-product-sheet > form\s*\{[^}]*overflow-y:\s*auto\s*!important/s);
  assert.match(css, /html \.investment-product-sheet > form > footer\s*\{[^}]*position:\s*sticky\s*!important/s);
});
