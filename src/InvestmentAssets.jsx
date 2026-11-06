import {contributionTrustShares} from './trustShares.js';
import {investmentPosition,redemptionCostAt} from './investmentLedger.js';
import {policyRedemptionProjection} from './policyRedemption.js';
import {t as i18n} from './i18n.js';
import React,{useEffect,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {InvestmentStack,InvestmentStackCard,InvestmentStackAsset,ClosingPrice} from './InvestmentStack.jsx';
import {ArrowLeft,Check,ChevronRight,Plus,RefreshCcw,Trash2,X,Landmark,ShieldCheck} from 'lucide-react';
import {db,today,uid} from './db.js';
import InvestmentNumberPicker from './InvestmentNumberPicker.jsx';
import NativeDatePicker from './NativeDatePicker.jsx';

const fmt=(n)=>Number(n||0).toLocaleString('zh-TW',{maximumFractionDigits:2});
const percentage=(v,c)=>c>0?`${v-c>=0?'+':''}${((v-c)/c*100).toFixed(2)}%`:'—';
const money=(v,c)=>`${c} ${Number(v||0).toLocaleString('zh-TW',{maximumFractionDigits:2,minimumFractionDigits:0})}`;
const summaryMoney=(v,c)=>`${c==='TWD'?'':c+' '}${Number(v||0).toLocaleString('zh-TW',{maximumFractionDigits:0,minimumFractionDigits:0})}`;
const displayMoney=(v,c)=>`${c==='TWD'?'':c+' '}${Number(v||0).toLocaleString('zh-TW',{maximumFractionDigits:2,minimumFractionDigits:0})}`;
const label={trust:'持股信託',policy:'投資保單'};
const number=(v)=>Number(String(v??'').replaceAll(',',''));
const initialForm=()=>({kind:'contribution',date:today(),amount:'',shares:'',costBasis:'',sourceAccount:'',note:'',currentValue:'',valueDate:today()});

export default function InvestmentAssets({type,items=[],flows=[],valuations=[],quotes={},cashAccounts=[],onChanged,onEditAccount,onBackOverview,onDetailChange,backToListSignal=0,askConfirm}){
 const [selected,setSelected]=useState(''),[dialog,setDialog]=useState(''),[editingEntry,setEditingEntry]=useState(null),[form,setForm]=useState(initialForm()),[error,setError]=useState(''),[busy,setBusy]=useState(false),[numberField,setNumberField]=useState(null);
 useEffect(()=>{onDetailChange?.(Boolean(selected));},[selected,onDetailChange]);
 useEffect(()=>{if(backToListSignal>0){setSelected('');setDialog('');setNumberField(null);}},[backToListSignal]);
 const patch=(k,v)=>setForm(f=>({...f,[k]:v}));
 const change=(action,asset)=>{setSelected(asset.id);setEditingEntry(null);setError('');setForm({...initialForm(),sourceAccount:action==='redemption'?(cashAccounts.find(a=>a.isDefault&&a.currency===asset.currency)||cashAccounts.find(a=>a.currency===asset.currency))?.id||'':''});setNumberField(null);setDialog(action)};
 const editEntry=(entry)=>{
  setEditingEntry(entry);setError('');
  setForm({...initialForm(),date:entry.date||today(),valueDate:entry.date||today(),amount:String(entry.kind==='redemption'&&type==='trust'&&contributionTrustShares(entry)>0?Number(entry.amount)/contributionTrustShares(entry):entry.amount??''),shares:String(contributionTrustShares(entry)),costBasis:String(entry.costBasis??''),sourceAccount:entry.sourceAccount||'',note:entry.note||'',currentValue:String(entry.kind==='redemption'?(valuations.find(v=>v.redemptionId===entry.id)?.value??''):entry.value??'')});
  setNumberField(null);setDialog(entry.entry==='valuation'?'value':entry.kind==='redemption'?'redemption':'contribution');
 };
 const latestValuation=(assetId,exceptId)=>valuations.filter(v=>v.assetId===assetId && v.id!==exceptId).slice().sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt||'').localeCompare(String(a.createdAt||''))||Number(b.id)-Number(a.id))[0];
 const updatePolicyFromHistory=async(assetId,exceptId)=>{
  const newest=await db.investmentValuations.where('assetId').equals(assetId).toArray();
  const last=newest.filter(v=>v.id!==exceptId).sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt||'').localeCompare(String(a.createdAt||''))||Number(b.id)-Number(a.id))[0];
  await db.accounts.update(assetId,{policyValue:last?Number(last.value):Number(items.find(a=>a.id===assetId)?.policyRedemptionBaseValue??0),policyValueDate:last?.date||''});
 };
 const rebuildPolicy=async(asset)=>{
  const currentFlows=await db.investmentFlows.where('assetId').equals(asset.id).toArray();
  const currentValuations=await db.investmentValuations.where('assetId').equals(asset.id).toArray();
  const firstHistorical=currentValuations.filter(v=>v.redemptionId).sort((a,b)=>String(a.date).localeCompare(String(b.date)))[0];
  const historicalFlow=currentFlows.find(f=>String(f.id)===String(firstHistorical?.redemptionId));
  const stored=await db.accounts.get(asset.id);
  const base=stored.policyRedemptionBaseValue!==undefined?Number(stored.policyRedemptionBaseValue):firstHistorical&&historicalFlow?Number(firstHistorical.value)+Number(historicalFlow.amount):Number(asset.policyValue||0);
  await db.accounts.update(asset.id,{policyRedemptionBaseValue:base});
  const result=policyRedemptionProjection({...asset,policyRedemptionBaseValue:base},currentFlows,currentValuations);
  if(!result.valid)throw Error('贖回金額超過當時保單現值，請檢查贖回紀錄及日期');
  const snapshots=new Map(result.snapshots.map(r=>[String(r.flowId),r]));
  for(const flow of currentFlows.filter(f=>f.kind==='redemption')){
   const snapshot=snapshots.get(String(flow.id));
   if(!snapshot)continue;
   await db.investmentFlows.update(flow.id,{costBasis:snapshot.costBasis});
   const previous=currentValuations.filter(v=>String(v.redemptionId)===String(flow.id));
   for(const v of previous)await db.investmentValuations.delete(v.id);
   await db.investmentValuations.add({assetId:asset.id,date:flow.date,value:snapshot.value,redemptionId:flow.id,createdAt:flow.createdAt||new Date().toISOString()});
  }
  await updatePolicyFromHistory(asset.id);
 };
 const deleteEntry=async(entry)=>{
  if(!active||busy)return;
  const typeName=entry.entry==='valuation'?'保單現值紀錄':entry.kind==='redemption'?'贖回紀錄':'追加投入紀錄';
  if(!(await askConfirm({kind:'delete',title:`刪除${typeName}？`,subtitle:entry.date,description:'刪除後將重新計算投入成本、現值與來源帳戶餘額。此操作無法直接復原。'})))return;
  setBusy(true);setError('');
  try{
   if(entry.entry==='valuation'){
    await db.transaction('rw',db.investmentValuations,db.accounts,async()=>{
     const current=await db.investmentValuations.get(entry.id);
     if(!current||current.assetId!==active.id)throw Error(i18n('估值紀錄不存在'));
     await db.investmentValuations.delete(entry.id);
     await rebuildPolicy(active);
    });
   }else{
    await db.transaction('rw',db.investmentFlows,db.investmentValuations,db.accounts,async()=>{
     const current=await db.investmentFlows.get(entry.id);
     if(!current||current.assetId!==active.id)throw Error(i18n('投入／贖回紀錄不存在'));
     const remaining=await db.investmentFlows.where('assetId').equals(active.id).toArray();
     if(!investmentPosition(active,remaining.filter(f=>f.id!==entry.id)).valid)throw Error('刪除後會使其他贖回超過持有數量或成本，請先修正後續紀錄');
     if(type==='policy'&&active.policyRedemptionBaseValue===undefined){
      const all=await db.investmentValuations.where('assetId').equals(active.id).toArray();
      const first=all.filter(v=>v.redemptionId).sort((a,b)=>String(a.date).localeCompare(String(b.date)))[0];
      const old=remaining.find(f=>String(f.id)===String(first?.redemptionId));
      await db.accounts.update(active.id,{policyRedemptionBaseValue:first&&old?Number(first.value)+Number(old.amount):Number(active.policyValue||0)});
     }
     await db.investmentFlows.delete(entry.id);
     if(type==='policy'){
      // Recalculate future redemptions after removal; the deleted snapshot is excluded.
      const all=await db.investmentValuations.where('assetId').equals(active.id).toArray();
      for(const v of all.filter(v=>String(v.redemptionId)===String(entry.id)))await db.investmentValuations.delete(v.id);
      await rebuildPolicy(active);
     }
    });
   }
   setDialog('');setEditingEntry(null);await onChanged();
  }catch(e){setError(e.message)}finally{setBusy(false)}
 };
 
  const metrics=(asset)=>{
   const position=investmentPosition(asset,flows);
   const {cost,shares,realized}=position;
   const quote=quotes[String(asset.trustSymbol||'').trim().toUpperCase()];
   const validQuote=type==='trust'&&Number.isFinite(number(quote?.price))&&number(quote?.price)>0;
   const value=type==='trust'?(validQuote?shares*number(quote.price):null):number(asset.policyValue);
   return {cost,shares,realized,value,pnl:value===null?null:value-cost,pct:value===null?'—':percentage(value,cost),quoteDate:quote?.date};
 };
 const history=useMemo(()=>{
  return [...flows.filter(f=>f.assetId===selected).map(f=>({...f,entry:'flow'})),...valuations.filter(v=>v.assetId===selected&&!v.redemptionId).map(v=>({...v,entry:'valuation'}))].sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt||'').localeCompare(String(a.createdAt||''))||String(b.id).localeCompare(String(a.id)));
 },[flows,valuations,selected]);
 const active=items.find(x=>x.id===selected);
 const realizedItems=items.map(asset=>({
  asset,
  position:investmentPosition(asset,flows),
  redemptions:flows.filter(f=>f.assetId===asset.id&&f.kind==='redemption')
 })).filter(({redemptions})=>redemptions.length>0);
 const realizedSingleCurrency=realizedItems.every(({asset})=>asset.currency===realizedItems[0]?.asset.currency);
 const realizedTotal=realizedItems.reduce((sum,{position})=>sum+position.realized,0);
 const overall=items.map(metrics);
 const homogeneous=items.every(a=>a.currency===items[0]?.currency);
 const summary=homogeneous&&items.length?overall.reduce((r,m)=>({cost:r.cost+m.cost,value:r.value===null||m.value===null?null:r.value+m.value}),{cost:0,value:0}):null;
 const submit=async(e)=>{
  e.preventDefault();if(!active)return;setBusy(true);setError('');
  try {
   if(dialog==='contribution'||dialog==='redemption'){
    const redemption=dialog==='redemption';
    const unitPrice=number(form.amount),shares=number(form.shares);
    const amount=redemption&&type==='trust'?unitPrice*shares:unitPrice;
    if(!form.date)throw Error(i18n('請選擇日期'));
    if(!Number.isFinite(amount)||amount<=0||String(form.amount).trim()==='')throw Error(redemption&&type==='trust'?'贖回價格及股數必須大於零':redemption?'贖回金額必須大於零':'追加投入金額必須大於零');
    if(type==='trust'&&(!Number.isFinite(shares)||(redemption?shares<=0:shares<0)))throw Error(redemption?'贖回股數必須大於零':'請輸入有效的新增股數（可為 0）');
    // The payout account is optional; when selected, the journal/ledger credits it.
    if(form.sourceAccount){
      const source=cashAccounts.find(a=>a.id===form.sourceAccount);
      if(!source)throw Error(i18n('資金帳戶不存在'));
      if(source.currency!==active.currency)throw Error(i18n('僅可選擇與投資帳戶同幣別的資金帳戶'));
    }
    const old=editingEntry?.entry==='flow'?await db.investmentFlows.get(editingEntry.id):null;
    if(editingEntry&&!old)throw Error(i18n('原始紀錄不存在，請重新開啟'));
    const candidate={id:old?.id||uid(),assetId:active.id,kind:redemption?'redemption':'contribution',date:form.date,amount,
     shares:type==='trust'?shares:0,costBasis:redemption&&type==='policy'?(old?.costBasis||0):0,
     sourceAccount:form.sourceAccount||'',note:form.note.trim(),createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
    const others=flows.filter(f=>f.assetId===active.id&&f.id!==old?.id);
    if(redemption&&type==='trust'){
      const check=redemptionCostAt(active,others,candidate);
      if(!check.valid)throw Error(type==='trust'?'贖回股數超過當時可持有股數':'本次沖減成本超過可用持有成本');
    }
    const after=investmentPosition(active,[...others,candidate]);
    if(type==='trust'&&!after.valid)throw Error('異動後持有股數或投資成本不可為負，請檢查交易日期與數量');
    await db.transaction('rw',db.investmentFlows,db.investmentValuations,db.accounts,async()=>{
     if(type==='policy'&&active.policyRedemptionBaseValue===undefined){
      const oldVal=valuations.filter(v=>v.assetId===active.id&&v.redemptionId).sort((a,b)=>String(a.date).localeCompare(String(b.date)))[0];
      const oldFlow=flows.find(f=>String(f.id)===String(oldVal?.redemptionId));
      await db.accounts.update(active.id,{policyRedemptionBaseValue:oldVal&&oldFlow?Number(oldVal.value)+Number(oldFlow.amount):Number(active.policyValue||0)});
     }
     await db.investmentFlows.put(candidate);
     if(type==='policy')await rebuildPolicy(active);
    });
   }else if(dialog==='value'){
    if(type!=='policy')throw Error(i18n('持股信託現值由官方收盤價自動計算'));
    const value=number(form.currentValue);
    if(!form.valueDate)throw Error(i18n('請選擇估值日期'));
    if(!Number.isFinite(value)||value<0||String(form.currentValue).trim()==='')throw Error(i18n('請輸入有效保單現值'));
    await db.transaction('rw',db.accounts,db.investmentValuations,async()=>{
     const old=editingEntry?.entry==='valuation'?await db.investmentValuations.get(editingEntry.id):null;
     if(editingEntry&&!old)throw Error(i18n('原始估值紀錄不存在，請重新開啟'));
     if(old&&old.assetId!==active.id)throw Error(i18n('估值關聯不正確'));
     const valueEntry={...(old||{}),assetId:active.id,date:form.valueDate,value,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
     if(old)await db.investmentValuations.put(valueEntry);else await db.investmentValuations.add(valueEntry);
     await rebuildPolicy(active);
    });
   }
   setDialog('');setEditingEntry(null);await onChanged();
  }catch(e){setError(e.message)}finally{setBusy(false)}
 };
 return <div className="investment-assets-page">
  {!active&&<button type="button" className="stock-back investment-upper-back investment-nav-back" onClick={onBackOverview}><ArrowLeft size={18}/>{i18n("返回投資總覽")}</button>}
  {!active&&<section className={`investment-stage-hero investment-category-hero investment-unified-summary investment-${type}-category-hero`} aria-label={`${i18n(label[type])}投資績效`}>
   <div className="investment-stage-heading"><div><span className="investment-stage-kicker">NEXPEN · {type==='trust'?'TRUST':'POLICY'}</span><h2>{i18n(label[type])}</h2></div><span className="investment-stage-count">{items.length} {i18n("筆")}</span></div>
   <div className="stock-summary-v48 investment-performance-summary investment-stage-summary">
   <div className="stock-summary-pair">
    <div className="stock-summary-item"><small>{i18n("持有成本")}</small><strong>{summary?summaryMoney(summary.cost,items[0].currency):'—'}</strong></div>
    <div className="stock-summary-item"><small>{i18n("估算現值")}</small><strong>{summary&&summary.value!==null?summaryMoney(summary.value,items[0].currency):'—'}</strong></div>
   </div>
   <div className="stock-summary-profit"><small>{i18n("未實現損益")}</small>
    <div className="stock-pnl-result investment-second-pnl-badges">
     <strong className={summary&&summary.value!==null?(summary.value-summary.cost>=0?'income':'expense'):''}>{summary&&summary.value!==null?summaryMoney(summary.value-summary.cost,items[0].currency):'—'}</strong>
     <span className={summary&&summary.value!==null?(summary.value-summary.cost>=0?'income':'expense'):''}>{summary&&summary.value!==null?percentage(summary.value,summary.cost):'—'}</span>
    </div>
   </div>
   </div>
  </section>}
  {active?<>
   <button type="button" className="stock-back investment-nav-back" onClick={()=>setSelected('')}><ArrowLeft size={17}/> {i18n("返回")}{i18n(label[type])}{i18n("列表")}</button>
   <section className="investment-third-level investment-third-listview">
    <div className="investment-third-listview-heading"><h2>{i18n('資金異動／估值歷史')}</h2><small>{active.name} · {history.length} {i18n('筆紀錄')} · 已實現損益 {displayMoney(metrics(active).realized,active.currency)}</small></div>
    <div className="stock-trade-detail-list investment-valuation-history investment-stage-history investment-third-list-content">
    <div className="investment-history-heading"><div className="investment-action-row"><button type="button" className="soft-btn small" onClick={()=>change('contribution',active)}><Plus size={16}/> {i18n("追加投入")}</button><button type="button" className="soft-btn small" onClick={()=>change('redemption',active)}>− 贖回</button>{type==='policy'&&<button type="button" className="soft-btn small" onClick={()=>change('value',active)}><RefreshCcw size={16}/> {i18n("更新現值")}</button>}<button type="button" className="soft-btn small" onClick={()=>onEditAccount(active)}>{i18n("編輯帳戶")}</button></div></div>
    {history.length?history.map(h=><button type="button" className="stock-detail-trade investment-history-button" key={`${h.entry}-${h.id}`} onClick={()=>editEntry(h)}>
      
      <div className="row-main"><b>{h.entry==='valuation'?i18n("現值更新"):h.kind==='redemption'?'贖回':i18n("追加投入")}</b><small>{h.date}{h.entry==='flow'&&type==='trust'?` · ${h.kind==='redemption'?'-':'+'}${fmt(contributionTrustShares(h))} ${i18n("股")}`:''}</small>{h.entry==='flow'&&h.note&&<small>{h.note}</small>}</div>
      <div className="transaction-right"><strong className={h.kind==='redemption'?'income':''}>{h.kind==='redemption'?'+':''}{money(h.entry==='valuation'?h.value:h.amount,active.currency)}</strong></div><ChevronRight size={17} className="faint"/>
     </button>):<p className="hint">{i18n("尚無異動紀錄")}</p>}
   </div></section>
  </>:<InvestmentStack className="investment-second-level investment-trust-policy-stack investment-asset-group-stack">
   <InvestmentStackCard
    accent={type==='trust'?'coral':'mint'}
    title={i18n('目前持有')}
    summary={`${items.length} ${i18n('筆')}`}
    amount={summary&&summary.value!==null?summaryMoney(summary.value,items[0].currency):items.length?'—':null}
   >
    <section className="glass panel investment-stage-list investment-holdings-list" aria-label={`${i18n(label[type])} · ${i18n('目前持有')}`}>
     {items.length?<div className="investment-tier-stack investment-asset-substack">
      {items.map(asset=>{
       const m=metrics(asset);
       const quote=quotes[String(asset.trustSymbol||'').trim().toUpperCase()];
       const quotePrice=Number(quote?.price)||0;
       return <InvestmentStackAsset
        key={asset.id}
        accent={type==='trust'?'coral':'mint'}
        stockLayout
        title={asset.name}
        topRight={type==='trust'?(quotePrice>0?<ClosingPrice value={fmt(quotePrice)} change={quote?.change}/>: '—'):(asset.policyValueDate||'—')}
        sharesLine={type==='trust'?`${asset.trustSymbol||'—'} · ${fmt(m.shares)} ${i18n('股')}`:`${i18n('持有成本')} ${displayMoney(m.cost,asset.currency)}`}
        averageLine={type==='trust'?`${i18n('均價')} ${m.shares>0?fmt(m.cost/m.shares):'—'}`:null}
        valueLine={m.value===null?'—':displayMoney(m.value,asset.currency)}
        profit={m.pnl===null?'—':`${m.pnl>=0?'+':''}${displayMoney(m.pnl,asset.currency)}`}
        rate={m.pct}
        profitTone={m.pnl===null?'':m.pnl>=0?'income':'expense'}
        onOpen={()=>setSelected(asset.id)}
       />;
      })}
     </div>:<p className="hint investment-empty-assets">{i18n('尚未建立')}{i18n(label[type])}{i18n('帳戶。請至「帳戶管理」新增，並選擇帳戶類型「')}{i18n(label[type])}」。</p>}
    </section>
   </InvestmentStackCard>
   <InvestmentStackCard accent="coral" title={i18n('已實現交易')} summary={`${realizedItems.length} ${i18n('筆')}`} amount={realizedSingleCurrency&&realizedItems.length?`${realizedTotal>=0?'+':''}${summaryMoney(realizedTotal,realizedItems[0].asset.currency)}`:realizedItems.length?'—':null}>
    <section className="glass panel investment-stage-list investment-holdings-list" aria-label={`${i18n(label[type])} · ${i18n('已實現交易')}`}>
     {type==='policy'&&realizedItems.length>0&&<p className="hint investment-policy-realized-note">保單贖回金額不是獲利。已實現損益＝贖回入帳－依贖回前現值比例分攤的投入成本；百分比是相對於該筆分攤成本的報酬率，非贖回比例。此為估算，請以保險公司明細為準。</p>}
     {realizedItems.length?<div className="investment-tier-stack investment-asset-substack">{realizedItems.map(({asset,position,redemptions})=>{
      const costRealized=redemptions.reduce((sum,f)=>sum+number(f.amount),0)-position.realized;
      const latest=redemptions.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
      return <InvestmentStackAsset key={asset.id} accent="coral" stockLayout title={asset.name}
       topRight={type==='trust'&&contributionTrustShares(latest)>0?fmt(number(latest.amount)/contributionTrustShares(latest)):`${redemptions.length} ${i18n('筆')}`}
       sharesLine={type==='trust'?`${i18n('股數')} ${fmt(redemptions.reduce((sum,f)=>sum+contributionTrustShares(f),0))}`:`贖回入帳 ${displayMoney(redemptions.reduce((sum,f)=>sum+number(f.amount),0),asset.currency)}`}
       averageLine={type==='policy'?`分攤投入成本 ${displayMoney(costRealized,asset.currency)} · 已實現損益` : null}
       profit={`${position.realized>=0?'+':''}${displayMoney(position.realized,asset.currency)}`}
       rate={costRealized>0?`${position.realized>=0?'+':''}${(position.realized/costRealized*100).toFixed(2)}%`:'—'}
       profitTone={position.realized>=0?'income':'expense'} onOpen={()=>setSelected(asset.id)}/>;
     })}</div>:<p className="hint">尚無贖回交易，贖回後將顯示已實現損益。</p>}
    </section>
   </InvestmentStackCard>
  </InvestmentStack>}

  {dialog&&active&&createPortal(<div className="modal-backdrop investment-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog('')}}><div className="sheet glass investment-modal"><div className="grabber"/><div className="sheet-head"><h2>{editingEntry?i18n("編輯"):dialog==='contribution'?i18n("追加投入"):dialog==='redemption'?'贖回':i18n("更新保單現值")} · {active.name}</h2><button type="button" className="circle-button" onClick={()=>setDialog('')}><X size={19}/></button></div><form className="sheet-body" onSubmit={submit}>
   <label className="investment-field">{i18n("日期")}<NativeDatePicker required value={dialog==='value'?form.valueDate:form.date} onChange={e=>patch(dialog==='value'?'valueDate':'date',e.target.value)}/></label>
   {(dialog==='contribution'||dialog==='redemption')?<><label className="investment-field">{dialog==='redemption'&&type==='trust'?'本次贖回價格（':dialog==='redemption'?'本次贖回金額（':i18n("本次投入金額（")}{active.currency}）<button type="button" className="money-trigger investment-number-trigger" onClick={()=>setNumberField('amount')} aria-label={i18n("輸入本次投入金額")}>{form.amount!==''&&form.amount!==undefined?String(form.amount):i18n("點擊輸入數字")}</button></label>{type==='trust'&&<label className="investment-field">{dialog==='redemption'?'本次贖回股數':i18n("本次新增股數（可為 0）")}<button type="button" className="money-trigger investment-number-trigger" onClick={()=>setNumberField('shares')} aria-label={i18n("輸入本次新增股數")}>{form.shares!==''&&form.shares!==undefined?String(form.shares):i18n("點擊輸入數字")}</button></label>}{dialog==='redemption'&&type==='trust'&&<div className="investment-redemption-total">本次贖回總金額：<strong>{money(number(form.amount)*number(form.shares),active.currency)}</strong></div>}<label className="investment-field">{dialog==='redemption'?'贖回入帳帳戶（選填）':i18n("資金來源（選填）")}<select value={form.sourceAccount} onChange={e=>patch('sourceAccount',e.target.value)}><option value="">{dialog==='redemption'?'請選擇入帳帳戶':i18n("外部資金／不連動銀行")}</option>{cashAccounts.filter(a=>a.currency===active.currency).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label className="investment-field">{i18n("備註")}<input value={form.note} onChange={e=>patch('note',e.target.value)}/></label></>:<label className="investment-field">{i18n("保單最新現值（")}{active.currency}）<button type="button" className="money-trigger investment-number-trigger" onClick={()=>setNumberField('currentValue')} aria-label={i18n("輸入保單最新現值")}>{form.currentValue!==''&&form.currentValue!==undefined?String(form.currentValue):i18n("點擊輸入數字")}</button></label>}
   {error&&<p className="investment-error" role="alert">{error}</p>}
   <div className="sheet-actions">{editingEntry&&<button type="button" className="soft-btn investment-delete-btn" disabled={busy} onClick={()=>deleteEntry(editingEntry)}><Trash2 size={16}/>{i18n("刪除")}</button>}<button type="button" className="soft-btn" onClick={()=>setDialog('')}>{i18n("取消")}</button><button type="submit" className="primary-btn" disabled={busy}><Check size={17}/>{busy?i18n("儲存中"):i18n("儲存")}</button></div>
  </form></div></div>,document.querySelector('.app-shell')||document.body)}
  {numberField&&<InvestmentNumberPicker key={numberField} initial={form[numberField]||''} onDone={value=>{patch(numberField,value);setError('')}} onClose={()=>setNumberField(null)}/>}
 </div>;
}
