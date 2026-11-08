import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(new URL(p, import.meta.url),'utf8');
test('version is emitted on every production build and excluded from SW precache',()=>{
 const conf=src('../vite.config.js');
 assert.match(conf,/fileName:'version.json'/);
 assert.match(conf,/buildId/);
 assert.match(conf,/injectRegister:null/);
 assert.match(conf,/registerType:'prompt'/);
 assert.match(conf,/globPatterns:\['\*\*\/\*\.\{js,css,html,svg,png\}'\]/);
});
test('update system prompts in session, applies on startup and protects edit dialogs',()=>{
 const code=src('../src/PwaUpdateManager.jsx');
 assert.match(code,/onNeedRefresh\(\)/);
 assert.match(code,/bootUntil/);
 assert.match(code,/hasOpenEditor\(\)/);
 assert.match(code,/version\.json/);
 assert.match(code,/cache:'no-store'/);
 assert.match(code,/visibilitychange/);
 assert.match(code,/updateSWRef\.current\?\.\(true\)/);
});
test('settings shows build and manual check while app boot mounts update manager',()=>{
 assert.match(src('../src/App.jsx'),/requestPwaUpdateCheck/);
 assert.match(src('../src/App.jsx'),/pwaBuildInfo\.buildId/);
 assert.match(src('../src/main.jsx'),/<PwaUpdateManager\/>/);
});
