import React,{useMemo,useState} from 'react';
import {ArrowLeft,Check,ChevronRight,Plus,RefreshCcw,Trash2,X} from 'lucide-react';
import {db,today,uid} from './db.js';
import InvestmentNumberPicker from './InvestmentNumberPicker.jsx';

const fmt=(n)=>Number(n||0).toLocaleString('zh-TW',{maximumFractionDigits:2});
const percentage=(v,c)=>c>0?`${v-c>=0?'+':''}${((v-c)/c*100).toFixed(2)}%`:'—';
const money=(v,c)=>`${c} ${fmt(v)}`;
const label={trust:'持股信託',policy:'投資保單'};
const number=(v)=>Number(String(v??'').replaceAll(',',''));
const initialForm=()=>({kind:'contribution',date:today(),amount:'',units:'',sourceAccount:'',note:'',currentValue:'',valueDate:today()});

export default function InvestmentAssets({type,items=[],flows=[],valuations=[],quotes={},cashAccounts=[],onChanged,onEditAccount}){
 const [selected,setSelected]=useState(''),[dialog,setDialog]=useState(''),[editingEntry,setEditingEntry]=useState(null),[form,setForm]=useState(initialForm()),[error,setError]=useState(''),[busy,setBusy]=useState(false),[numberField,setNumberField]=useState(null);
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
     if(!current||current.assetId!==active.id)throw Error('估值紀錄不存在');
     await db.investmentValuations.delete(entry.id);
     await updatePolicyFromHistory(active.id);
    });
   }else{
    await db.transaction('rw',db.investmentFlows,async()=>{
     const current=await db.investmentFlows.get(entry.id);
     if(!current||current.assetId!==active.id)throw Error('投入紀錄不存在');
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
    if(!form.date)throw Error('請選擇投入日期');
    if(!Number.isFinite(amount)||amount<=0||String(form.amount).trim()==='')throw Error('追加投入金額必須大於零');
    if(type==='trust'&&(!Number.isFinite(units)||units<0))throw Error('請輸入有效的新增張數（可為 0）');
    if(form.sourceAccount){
      const source=cashAccounts.find(a=>a.id===form.sourceAccount);
      if(!source)throw Error('資金來源帳戶不存在');
      if(source.currency!==active.currency)throw Error('僅可選擇與投資帳戶同幣別的資金來源');
    }
    const old=editingEntry?.entry==='flow'?await db.investmentFlows.get(editingEntry.id):null;
    if(editingEntry&&!old)throw Error('原始投入紀錄不存在，請重新開啟');
    const others=contribution(active).filter(f=>f.id!==old?.id);
    const remainingCost=number(active.investmentCost)+others.reduce((sum,f)=>sum+number(f.amount),0)+amount;
    const remainingLots=number(active.trustLots)+others.reduce((sum,f)=>sum+number(f.units),0)+(type==='trust'?units:0);
    if(remainingCost<0||remainingLots<0)throw Error('修正後投資餘額不可為負');
    await db.investmentFlows.put({id:old?.id||uid(),assetId:active.id,kind:'contribution',date:form.date,amount,units:type==='trust'?units:0,sourceAccount:form.sourceAccount||'',note:form.note.trim(),createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});
   }else if(dialog==='value'){
    if(type!=='policy')throw Error('持股信託現值由官方收盤價自動計算');
    const value=number(form.currentValue);
    if(!form.valueDate)throw Error('請選擇估值日期');
    if(!Number.isFinite(value)||value<0||String(form.currentValue).trim()==='')throw Error('請輸入有效保單現值');
    await db.transaction('rw',db.accounts,db.investmentValuations,async()=>{
     const old=editingEntry?.entry==='valuation'?await db.investmentValuations.get(editingEntry.id):null;
     if(editingEntry&&!old)throw Error('原始估值紀錄不存在，請重新開啟');
     if(old&&old.assetId!==active.id)throw Error('估值關聯不正確');
     const valueEntry={...(old||{}),assetId:active.id,date:form.valueDate,value,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
     if(old)await db.investmentValuations.put(valueEntry);else await db.investmentValuations.add(valueEntry);
     await updatePolicyFromHistory(active.id);
    });
   }
   setDialog('');setEditingEntry(null);await onChanged();
  }catch(e){setError(e.message)}finally{setBusy(false)}
 };
 return <div className="investment-assets-page">
  <section className="stock-summary-v48 investment-performance-summary" aria-label={`${label[type]}投資績效`}>
   <div className="stock-summary-pair">
    <div className="stock-summary-item"><small>持有成本</small><strong>{summary?money(summary.cost,items[0].currency):'—'}</strong></div>
    <div className="stock-summary-item"><small>估算現值</small><strong>{summary&&summary.value!==null?money(summary.value,items[0].currency):'—'}</strong></div>
   </div>
   <div className="stock-summary-profit"><small>未實現損益</small>
    <div className="stock-pnl-result">
     <strong className={summary&&summary.value!==null?(summary.value-summary.cost>=0?'income':'expense'):''}>{summary&&summary.value!==null?money(summary.value-summary.cost,items[0].currency):'—'}</strong>
     <span className={summary&&summary.value!==null?(summary.value-summary.cost>=0?'income':'expense'):''}>{summary&&summary.value!==null?percentage(summary.value,summary.cost):'—'}</span>
    </div>
   </div>
  </section>
  {active?<>
   <button type="button" className="stock-back" onClick={()=>setSelected('')}><ArrowLeft size={17}/> 返回{label[type]}列表</button>
   <section className="glass panel investment-asset-detail"><div className="investment-detail-head"><div><h2>{active.name}</h2><small>{type==='trust'?`${active.trustSymbol} · ${fmt(metrics(active).lots)} 張`:`保單現值更新 ${active.policyValueDate||'尚無'}`}</small></div><button type="button" className="soft-btn small" onClick={()=>onEditAccount(active)}>編輯帳戶</button></div>
    <div className="stock-summary-v48 investment-detail-performance"><div className="stock-summary-pair"><div className="stock-summary-item"><small>持有成本</small><strong>{money(metrics(active).cost,active.currency)}</strong></div><div className="stock-summary-item"><small>估算現值</small><strong>{metrics(active).value===null?'尚無報價':money(metrics(active).value,active.currency)}</strong></div></div><div className="stock-summary-profit"><small>未實現損益</small><div className="stock-pnl-result"><strong className={metrics(active).pnl===null?'':metrics(active).pnl>=0?'income':'expense'}>{metrics(active).pnl===null?'—':money(metrics(active).pnl,active.currency)}</strong><span className={metrics(active).pnl===null?'':metrics(active).pnl>=0?'income':'expense'}>{metrics(active).pct}</span></div></div></div>
    <div className="investment-action-row"><button type="button" className="primary-btn" onClick={()=>change('contribution',active)}><Plus size={16}/> 記錄追加投入</button>{type==='policy'&&<button type="button" className="soft-btn" onClick={()=>change('value',active)}><RefreshCcw size={16}/> 更新現值</button>}</div>
    <p className="hint">{type==='trust'?`依最近收盤價估值（${metrics(active).quoteDate||'未取得日期'}）。尚未取得報價時不計算損益。`:'新增保費投入只增加投入成本；目前現值須依保險公司提供的數字更新。'} 追加投入若選擇銀行帳戶，會扣除該帳戶現金，不另列為一般支出。</p>
   </section>
   <section className="glass panel investment-valuation-history"><h3>資金異動／估值歷史</h3><p className="hint">點選紀錄可編輯金額、日期、張數或資金來源；也可刪除錯誤紀錄。</p>{history.length?history.map(h=><button type="button" className="investment-valuation-row investment-history-button" key={`${h.entry}-${h.id}`} onClick={()=>editEntry(h)}><span className="investment-history-info"><b>{h.date} · {h.entry==='valuation'?'現值更新':'追加投入'}</b>{h.entry==='flow'&&type==='trust'&&<small>增加 {fmt(h.units)} 張</small>}{h.entry==='flow'&&h.note&&<small>{h.note}</small>}</span><span className="investment-history-value"><strong>{money(h.entry==='valuation'?h.value:h.amount,active.currency)}</strong><small>點擊編輯</small></span><ChevronRight size={17}/></button>):<p className="hint">尚無異動紀錄</p>}</section>
  </>:<section className="glass panel investment-list-section"><div className="stock-holdings-heading"><h2>{label[type]}</h2><small>{items.length} 筆</small></div>{items.length?items.map(a=>{const m=metrics(a);return <button type="button" key={a.id} className="list-row stock-performance-row" onClick={()=>setSelected(a.id)}><div className="row-main"><b>{a.name}</b><small>{type==='trust'?`${a.trustSymbol} · ${fmt(m.lots)} 張`:`最新保單現值：${a.policyValueDate||'未更新'}`}</small><small>累計投入 {money(m.cost,a.currency)}</small></div><div className="holding-right"><strong>{m.value===null?'尚無報價':money(m.value,a.currency)}</strong><div className={'holding-pnl '+(m.pnl>=0?'income':'expense')}><span className="holding-pnl-value">{m.pnl===null?'—':money(m.pnl,a.currency)}</span><span className="holding-pnl-rate">{m.pct}</span></div></div><ChevronRight size={17}/></button>}):<p className="hint">尚未建立{label[type]}帳戶。請至「帳戶管理」新增，並選擇帳戶類型「{label[type]}」。</p>}</section>}
  {dialog&&active&&<div className="modal-backdrop investment-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog('')}}><div className="sheet glass investment-modal"><div className="grabber"/><div className="sheet-head"><h2>{editingEntry?'編輯':dialog==='contribution'?'追加投入':'更新保單現值'} · {active.name}</h2><button type="button" className="circle-button" onClick={()=>setDialog('')}><X size={19}/></button></div><form className="sheet-body" onSubmit={submit}>
   <label className="investment-field">日期<input type="date" required value={dialog==='value'?form.valueDate:form.date} onChange={e=>patch(dialog==='value'?'valueDate':'date',e.target.value)}/></label>
   {dialog==='contribution'?<><label className="investment-field">本次投入金額（{active.currency}）<button type="button" className="money-trigger investment-number-trigger" onClick={()=>setNumberField('amount')} aria-label="輸入本次投入金額">{form.amount!==''&&form.amount!==undefined?String(form.amount):'點擊輸入數字'}</button></label>{type==='trust'&&<label className="investment-field">本次新增張數（可為 0）<button type="button" className="money-trigger investment-number-trigger" onClick={()=>setNumberField('units')} aria-label="輸入本次新增張數">{form.units!==''&&form.units!==undefined?String(form.units):'點擊輸入數字'}</button></label>}<label className="investment-field">資金來源（選填）<select value={form.sourceAccount} onChange={e=>patch('sourceAccount',e.target.value)}><option value="">外部資金／不連動銀行</option>{cashAccounts.filter(a=>a.currency===active.currency).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label className="investment-field">備註<input value={form.note} onChange={e=>patch('note',e.target.value)}/></label></>:<label className="investment-field">保單最新現值（{active.currency}）<button type="button" className="money-trigger investment-number-trigger" onClick={()=>setNumberField('currentValue')} aria-label="輸入保單最新現值">{form.currentValue!==''&&form.currentValue!==undefined?String(form.currentValue):'點擊輸入數字'}</button></label>}
   {error&&<p className="investment-error" role="alert">{error}</p>}
   <div className="sheet-actions">{editingEntry&&<button type="button" className="soft-btn investment-delete-btn" disabled={busy} onClick={()=>deleteEntry(editingEntry)}><Trash2 size={16}/>刪除</button>}<button type="button" className="soft-btn" onClick={()=>setDialog('')}>取消</button><button type="submit" className="primary-btn" disabled={busy}><Check size={17}/>{busy?'儲存中':'儲存'}</button></div>
  </form></div></div>}
  {numberField&&<InvestmentNumberPicker key={numberField} initial={form[numberField]||''} onDone={value=>{patch(numberField,value);setError('')}} onClose={()=>setNumberField(null)}/>}
 </div>;
}
