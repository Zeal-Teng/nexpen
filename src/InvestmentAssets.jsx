import {t as i18n} from './i18n.js';
import React,{useEffect,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {InvestmentStack,InvestmentStackCard} from './InvestmentStack.jsx';
import {ArrowLeft,Check,ChevronRight,Plus,RefreshCcw,Trash2,X,TrendingUp,Landmark,ShieldCheck,Coins} from 'lucide-react';
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
const initialForm=()=>({kind:'contribution',date:today(),amount:'',units:'',sourceAccount:'',note:'',currentValue:'',valueDate:today()});

export default function InvestmentAssets({type,items=[],flows=[],valuations=[],quotes={},cashAccounts=[],onChanged,onEditAccount,onBackOverview,onDetailChange,backToListSignal=0}){
 const [selected,setSelected]=useState(''),[dialog,setDialog]=useState(''),[editingEntry,setEditingEntry]=useState(null),[form,setForm]=useState(initialForm()),[error,setError]=useState(''),[busy,setBusy]=useState(false),[numberField,setNumberField]=useState(null);
 useEffect(()=>{onDetailChange?.(Boolean(selected));},[selected,onDetailChange]);
 useEffect(()=>{if(backToListSignal>0){setSelected('');setDialog('');setNumberField(null);}},[backToListSignal]);
 const patch=(k,v)=>setForm(f=>({...f,[k]:v}));
 const change=(action,asset)=>{setSelected(asset.id);setEditingEntry(null);setError('');setForm(initialForm());setNumberField(null);setDialog(action)};
 const editEntry=(entry)=>{
  setEditingEntry(entry);setError('');
  setForm({...initialForm(),date:entry.date||today(),valueDate:entry.date||today(),amount:String(entry.amount??''),units:String(entry.units??''),sourceAccount:entry.sourceAccount||'',note:entry.note||'',currentValue:String(entry.value??'')});
  setNumberField(null);setDialog(entry.entry==='valuation'?'value':'contribution');
 };
 const latestValuation=(assetId,exceptId)=>valuations.filter(v=>v.assetId===assetId && v.id!==exceptId).slice().sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt||'').localeCompare(String(a.createdAt||''))||Number(b.id)-Number(a.id))[0];
 const updatePolicyFromHistory=async(assetId,exceptId)=>{
  const newest=await db.investmentValuations.where('assetId').equals(assetId).toArray();
  const last=newest.filter(v=>v.id!==exceptId).sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt||'').localeCompare(String(a.createdAt||''))||Number(b.id)-Number(a.id))[0];
  await db.accounts.update(assetId,{policyValue:last?Number(last.value):0,policyValueDate:last?.date||''});
 };
 const deleteEntry=async(entry)=>{
  if(!active||busy)return;
  const typeName=entry.entry==='valuation'?'保單現值紀錄':'追加投入紀錄';
  if(!window.confirm(`確定刪除 ${entry.date} 的${typeName}？\n刪除後將重新計算投資成本、現值與來源帳戶餘額。此操作無法直接復原。`))return;
  setBusy(true);setError('');
  try{
   if(entry.entry==='valuation'){
    await db.transaction('rw',db.investmentValuations,db.accounts,async()=>{
     const current=await db.investmentValuations.get(entry.id);
     if(!current||current.assetId!==active.id)throw Error(i18n('估值紀錄不存在'));
     await db.investmentValuations.delete(entry.id);
     await updatePolicyFromHistory(active.id);
    });
   }else{
    await db.transaction('rw',db.investmentFlows,async()=>{
     const current=await db.investmentFlows.get(entry.id);
     if(!current||current.assetId!==active.id)throw Error(i18n('投入紀錄不存在'));
     await db.investmentFlows.delete(entry.id);
    });
   }
   setDialog('');setEditingEntry(null);await onChanged();
  }catch(e){setError(e.message)}finally{setBusy(false)}
 };
 
 const contribution=(asset)=>flows.filter(x=>x.assetId===asset.id&&x.kind==='contribution');
 const metrics=(asset)=>{
   const added=contribution(asset),cost=number(asset.investmentCost)+added.reduce((s,f)=>s+number(f.amount),0);
   const lots=number(asset.trustLots)+added.reduce((s,f)=>s+number(f.units),0);
   const quote=quotes[String(asset.trustSymbol||'').trim().toUpperCase()];
   const validQuote=type==='trust'&&Number.isFinite(number(quote?.price))&&number(quote?.price)>0;
   const value=type==='trust'?(validQuote?lots*1000*number(quote.price):null):number(asset.policyValue);
   return {cost,lots,value,pnl:value===null?null:value-cost,pct:value===null?'—':percentage(value,cost),quoteDate:quote?.date};
 };
 const history=useMemo(()=>{
  return [...flows.filter(f=>f.assetId===selected).map(f=>({...f,entry:'flow'})),...valuations.filter(v=>v.assetId===selected).map(v=>({...v,entry:'valuation'}))].sort((a,b)=>b.date.localeCompare(a.date)||String(b.createdAt||'').localeCompare(String(a.createdAt||''))||String(b.id).localeCompare(String(a.id)));
 },[flows,valuations,selected]);
 const active=items.find(x=>x.id===selected);
 const overall=items.map(metrics);
 const homogeneous=items.every(a=>a.currency===items[0]?.currency);
 const summary=homogeneous&&items.length?overall.reduce((r,m)=>({cost:r.cost+m.cost,value:r.value===null||m.value===null?null:r.value+m.value}),{cost:0,value:0}):null;
 const submit=async(e)=>{
  e.preventDefault();if(!active)return;setBusy(true);setError('');
  try {
   if(dialog==='contribution'){
    const amount=number(form.amount),units=number(form.units);
    if(!form.date)throw Error(i18n('請選擇投入日期'));
    if(!Number.isFinite(amount)||amount<=0||String(form.amount).trim()==='')throw Error(i18n('追加投入金額必須大於零'));
    if(type==='trust'&&(!Number.isFinite(units)||units<0))throw Error(i18n('請輸入有效的新增張數（可為 0）'));
    if(form.sourceAccount){
      const source=cashAccounts.find(a=>a.id===form.sourceAccount);
      if(!source)throw Error(i18n('資金來源帳戶不存在'));
      if(source.currency!==active.currency)throw Error(i18n('僅可選擇與投資帳戶同幣別的資金來源'));
    }
    const old=editingEntry?.entry==='flow'?await db.investmentFlows.get(editingEntry.id):null;
    if(editingEntry&&!old)throw Error(i18n('原始投入紀錄不存在，請重新開啟'));
    const others=contribution(active).filter(f=>f.id!==old?.id);
    const remainingCost=number(active.investmentCost)+others.reduce((sum,f)=>sum+number(f.amount),0)+amount;
    const remainingLots=number(active.trustLots)+others.reduce((sum,f)=>sum+number(f.units),0)+(type==='trust'?units:0);
    if(remainingCost<0||remainingLots<0)throw Error(i18n('修正後投資餘額不可為負'));
    await db.investmentFlows.put({id:old?.id||uid(),assetId:active.id,kind:'contribution',date:form.date,amount,units:type==='trust'?units:0,sourceAccount:form.sourceAccount||'',note:form.note.trim(),createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});
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
     await updatePolicyFromHistory(active.id);
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
    <div className="stock-pnl-result">
     <strong className={summary&&summary.value!==null?(summary.value-summary.cost>=0?'income':'expense'):''}>{summary&&summary.value!==null?summaryMoney(summary.value-summary.cost,items[0].currency):'—'}</strong>
     <span className={summary&&summary.value!==null?(summary.value-summary.cost>=0?'income':'expense'):''}>{summary&&summary.value!==null?percentage(summary.value,summary.cost):'—'}</span>
    </div>
   </div>
   </div>
  </section>}
  {active?<>
   <button type="button" className="stock-back investment-nav-back" onClick={()=>setSelected('')}><ArrowLeft size={17}/> {i18n("返回")}{i18n(label[type])}{i18n("列表")}</button>
   <section className="investment-third-level investment-third-listview">
    <div className="investment-third-listview-heading"><h2>{i18n('資金異動／估值歷史')}</h2><small>{active.name} · {history.length} {i18n('筆紀錄')}</small></div>
    <div className="stock-trade-detail-list investment-valuation-history investment-stage-history investment-third-list-content">
    <div className="investment-history-heading"><div className="investment-action-row"><button type="button" className="soft-btn small" onClick={()=>change('contribution',active)}><Plus size={16}/> {i18n("追加投入")}</button>{type==='policy'&&<button type="button" className="soft-btn small" onClick={()=>change('value',active)}><RefreshCcw size={16}/> {i18n("更新現值")}</button>}<button type="button" className="soft-btn small" onClick={()=>onEditAccount(active)}>{i18n("編輯帳戶")}</button></div></div>
    {history.length?history.map(h=><button type="button" className="stock-detail-trade investment-history-button" key={`${h.entry}-${h.id}`} onClick={()=>editEntry(h)}>
      <div className={'transaction-icon '+(h.entry==='valuation'?'income':'transfer')}>{h.entry==='valuation'?<TrendingUp size={18}/>:<Coins size={18}/>}</div>
      <div className="row-main"><b>{h.entry==='valuation'?i18n("現值更新"):i18n("追加投入")}</b><small>{h.date}{h.entry==='flow'&&type==='trust'?` · ${fmt(h.units)} ${i18n("張")}`:''}</small>{h.entry==='flow'&&h.note&&<small>{h.note}</small>}</div>
      <div className="transaction-right"><strong>{money(h.entry==='valuation'?h.value:h.amount,active.currency)}</strong></div><ChevronRight size={17} className="faint"/>
     </button>):<p className="hint">{i18n("尚無異動紀錄")}</p>}
   </div></section>
  </>:<InvestmentStack className="investment-second-level investment-trust-policy-stack investment-individual-asset-stack">
   {items.length?items.map((asset)=>{
    const m=metrics(asset);
    return <InvestmentStackCard
      key={asset.id}
      accent={type==='trust'?'coral':'mint'}
      title={asset.name}
      summary={type==='trust'?`${asset.trustSymbol||'—'} · ${fmt(m.lots)} ${i18n('張')}`:`${i18n('最後更新')} ${asset.policyValueDate||'—'}`}
      amount={m.value===null?i18n('尚無報價'):displayMoney(m.value,asset.currency)}
    >
     <div className="investment-single-asset-detail" aria-label={asset.name}>
      <button type="button" className="investment-single-asset-summary-row investment-account-list-row" onClick={()=>setSelected(asset.id)} aria-label={`${asset.name} · ${i18n('資金異動／估值歷史')}`}>
       <span className="investment-account-list-info investment-asset-financial-details">
        {/* The asset name (and symbol/quantity or valuation date) is already visible
            on the parent card. Show only additional information in this row. */}
        {type==='trust'?<>
         <strong>{i18n('均價')} {m.lots>0?fmt(m.cost/(m.lots*1000)):'—'}</strong>
         <small>{i18n('參考收盤')} {quotes[String(asset.trustSymbol||'').trim().toUpperCase()]?.price?fmt(quotes[String(asset.trustSymbol||'').trim().toUpperCase()].price):'—'}</small>
         <small>{i18n('持有成本')} {displayMoney(m.cost,asset.currency)}</small>
        </>:<>
         <strong>{i18n('持有成本')} {displayMoney(m.cost,asset.currency)}</strong>
        </>}
       </span>
       <span className="investment-account-list-values">
        <b>{m.value===null?'—':displayMoney(m.value,asset.currency)}</b>
        <small className={m.pnl===null?'':m.pnl>=0?'income':'expense'}>{m.pnl===null?'—':`${m.pnl>=0?'+':''}${displayMoney(m.pnl,asset.currency)} · ${m.pct}`}</small>
       </span>
       <ChevronRight size={18} aria-hidden="true" className="investment-account-list-chevron"/>
      </button>
     </div>
    </InvestmentStackCard>;
   }):<p className="hint investment-empty-assets">{i18n('尚未建立')}{i18n(label[type])}{i18n('帳戶。請至「帳戶管理」新增，並選擇帳戶類型「')}{i18n(label[type])}」。</p>}
  </InvestmentStack>}

  {dialog&&active&&createPortal(<div className="modal-backdrop investment-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog('')}}><div className="sheet glass investment-modal"><div className="grabber"/><div className="sheet-head"><h2>{editingEntry?i18n("編輯"):dialog==='contribution'?i18n("追加投入"):i18n("更新保單現值")} · {active.name}</h2><button type="button" className="circle-button" onClick={()=>setDialog('')}><X size={19}/></button></div><form className="sheet-body" onSubmit={submit}>
   <label className="investment-field">{i18n("日期")}<NativeDatePicker required value={dialog==='value'?form.valueDate:form.date} onChange={e=>patch(dialog==='value'?'valueDate':'date',e.target.value)}/></label>
   {dialog==='contribution'?<><label className="investment-field">{i18n("本次投入金額（")}{active.currency}）<button type="button" className="money-trigger investment-number-trigger" onClick={()=>setNumberField('amount')} aria-label={i18n("輸入本次投入金額")}>{form.amount!==''&&form.amount!==undefined?String(form.amount):i18n("點擊輸入數字")}</button></label>{type==='trust'&&<label className="investment-field">{i18n("本次新增張數（可為 0）")}<button type="button" className="money-trigger investment-number-trigger" onClick={()=>setNumberField('units')} aria-label={i18n("輸入本次新增張數")}>{form.units!==''&&form.units!==undefined?String(form.units):i18n("點擊輸入數字")}</button></label>}<label className="investment-field">{i18n("資金來源（選填）")}<select value={form.sourceAccount} onChange={e=>patch('sourceAccount',e.target.value)}><option value="">{i18n("外部資金／不連動銀行")}</option>{cashAccounts.filter(a=>a.currency===active.currency).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label className="investment-field">{i18n("備註")}<input value={form.note} onChange={e=>patch('note',e.target.value)}/></label></>:<label className="investment-field">{i18n("保單最新現值（")}{active.currency}）<button type="button" className="money-trigger investment-number-trigger" onClick={()=>setNumberField('currentValue')} aria-label={i18n("輸入保單最新現值")}>{form.currentValue!==''&&form.currentValue!==undefined?String(form.currentValue):i18n("點擊輸入數字")}</button></label>}
   {error&&<p className="investment-error" role="alert">{error}</p>}
   <div className="sheet-actions">{editingEntry&&<button type="button" className="soft-btn investment-delete-btn" disabled={busy} onClick={()=>deleteEntry(editingEntry)}><Trash2 size={16}/>{i18n("刪除")}</button>}<button type="button" className="soft-btn" onClick={()=>setDialog('')}>{i18n("取消")}</button><button type="submit" className="primary-btn" disabled={busy}><Check size={17}/>{busy?i18n("儲存中"):i18n("儲存")}</button></div>
  </form></div></div>,document.querySelector('.app-shell')||document.body)}
  {numberField&&<InvestmentNumberPicker key={numberField} initial={form[numberField]||''} onDone={value=>{patch(numberField,value);setError('')}} onClose={()=>setNumberField(null)}/>}
 </div>;
}
