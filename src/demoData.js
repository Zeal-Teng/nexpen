// Fictional product showcase. All values and identities are illustrative.
// This module must NEVER write to the user's personal IndexedDB database.
import {db, isDemoMode, ensureDefaults} from './db.js';

import {createDemoDataset} from './demoDataset.js';

export async function seedDemoIfEmpty({reset=false}={}) {
 if(!isDemoMode)throw Error('Cannot seed a personal database');
 const marker=await db.settings.get('demoSeedVersion');
 if(marker&&!reset)return false;
 // Never overwrite existing demo edits except by an explicit reset action.
 if(!reset&&await db.accounts.count()>0)return false;
 const data=createDemoDataset();
 const tables=[db.records,db.accounts,db.stocks,db.recurring,db.investmentValuations,db.investmentFlows,db.netWorthHistory,db.marketCache,db.investmentProducts];
 await db.transaction('rw',...tables,db.settings,async()=>{
  if(reset){for(const t of tables)await t.clear();await db.settings.clear();}
  for(const [name,rows] of Object.entries(data)){
   await db[name].bulkPut(rows);
  }
 });
 return true;
}

// On every fresh APP bootstrap in demo mode, throw away all previous demo edits.
// Keep a single in-flight initialization so React development remounts cannot
// run two destructive resets concurrently. This promise resets on a real page load.
let demoBootstrapPromise = null;
export function initializeDemoOnLaunch() {
 if(!isDemoMode) return Promise.resolve(false);
 if(!demoBootstrapPromise) {
  demoBootstrapPromise = (async()=>{
   await seedDemoIfEmpty({reset:true});
   // Reset clears demo-only settings; recreate defaults (including categories).
   await ensureDefaults();
   return true;
  })().catch(error=>{demoBootstrapPromise=null;throw error;});
 }
 return demoBootstrapPromise;
}

export function switchDemoMode(active) {
 try { if(active)sessionStorage.setItem('nexpen-demo-mode','1');else sessionStorage.removeItem('nexpen-demo-mode'); }
 catch { throw Error('瀏覽器無法切換演示模式'); }
 window.location.reload();
}
