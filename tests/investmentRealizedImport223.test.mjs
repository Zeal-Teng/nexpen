import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {investmentPosition} from '../src/investmentLedger.js';

test('investment assets imports only available policy redemption exports and defines realized summary',async()=>{
 const jsx=readFileSync(new URL('../src/InvestmentAssets.jsx',import.meta.url),'utf8');
 const mod=await import('../src/policyRedemption.js');
 const imported=jsx.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/policyRedemption\.js['"]/);
 assert.ok(imported);
 for(const name of imported[1].split(',').map(x=>x.trim()))assert.equal(typeof mod[name],'function',`Missing export: ${name}`);
 for(const name of ['realizedItems','realizedTotal','realizedSingleCurrency'])assert.match(jsx,new RegExp(`const\\s+${name}\\s*=`));
});
test('realized summary includes only redeemed investments and their corresponding realized profit',()=>{
 const assets=[{id:'t',type:'trust',investmentCost:100,initialShares:10,currency:'TWD'},{id:'p',type:'policy',investmentCost:1000,currency:'TWD'}];
 const flows=[{assetId:'p',kind:'redemption',amount:200,costBasis:180},{assetId:'t',kind:'contribution',amount:20,shares:2}];
 const realized=assets.map(asset=>({asset,position:investmentPosition(asset,flows),redemptions:flows.filter(f=>f.assetId===asset.id&&f.kind==='redemption')})).filter(r=>r.redemptions.length);
 assert.equal(realized.length,1);
 assert.equal(realized[0].asset.id,'p');
 assert.equal(realized.reduce((sum,r)=>sum+r.position.realized,0),20);
});
