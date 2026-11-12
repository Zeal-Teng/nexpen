import {dateGapDays} from './goalMilestones.js';
import {formatMoneyDisplay} from './moneyDisplay.js';
import MarqueeInput from './MarqueeInput.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {History,X} from 'lucide-react';
import AnimatedNumber from './AnimatedNumber.jsx';

const messages={
 'zh-TW':{title:'淨資產目標',desc:'設定希望達成的淨資產金額',goal:'目標金額',achieved:'達成率',remaining:'距離目標還差',exceeded:'已超越目標',reached:'已達成目標',edit:'設定目標',save:'儲存目標',cancel:'取消',remove:'移除目標',empty:'設定目標金額後，即可追蹤達成進度。',invalid:'請輸入大於 0 的有效目標金額',unavailable:'目前匯率不可用，暫時無法編輯目標',incomplete:'部分投資尚未取得報價，進度可能低估。'},
 'zh-CN':{title:'净资产目标',desc:'设定希望达成的净资产金额',goal:'目标金额',achieved:'达成率',remaining:'距离目标还差',exceeded:'已超过目标',reached:'已达成目标',edit:'设定目标',save:'保存目标',cancel:'取消',remove:'移除目标',empty:'设定目标金额后即可追踪进度',invalid:'请输入大于 0 的有效金额',unavailable:'汇率不可用，暂时无法编辑',incomplete:'部分资产缺少报价，进度可能低估。'},
 en:{title:'Net worth goal',desc:'Track progress toward your target',goal:'Target',achieved:'Progress',remaining:'Remaining',exceeded:'Above target',reached:'Goal reached',edit:'Set goal',save:'Save goal',cancel:'Cancel',remove:'Remove goal',empty:'Set a target to start tracking your progress.',invalid:'Enter a valid amount greater than zero',unavailable:'Exchange rate unavailable',incomplete:'Some investment prices are missing; progress may be understated.'},
 ja:{title:'純資産目標',desc:'目標金額までの進捗を記録',goal:'目標金額',achieved:'達成率',remaining:'目標まで',exceeded:'目標超過',reached:'目標達成',edit:'目標を設定',save:'保存',cancel:'キャンセル',remove:'目標を削除',empty:'目標金額を設定してください',invalid:'0より大きい金額を入力してください',unavailable:'為替レートが取得できません',incomplete:'一部の価格が未取得のため推定値です。'}
};
/** Goal is persisted in TWD so changing the preferred display currency does not change its value. */
export default function NetWorthGoal({goalTwd=null,currentTwd=0,mainRate=1,currency='TWD',language='zh-TW',incomplete=false,onSave,milestones=[],onRecordGoal=()=>{}}){
 const t=messages[language]||messages['zh-TW'];
 const usableRate=Number.isFinite(Number(mainRate))&&Number(mainRate)>0;
 const goal=Number(goalTwd)>0?Number(goalTwd):null;
 const [trackEntered,setTrackEntered]=useState(false);
 const alreadyRecorded=!!goal&&milestones.some(item=>item.amountTwd===goal);
 const [historyOpen,setHistoryOpen]=useState(false);
 const panelRef=useRef(null);
 const [portalAppearance,setPortalAppearance]=useState({style:{},hideAmounts:false});
 useEffect(()=>{
  if(!historyOpen)return;
  const panel=panelRef.current;
  const shell=panel?.closest('.app-shell');
  if(!panel||!shell)return;
  const computed=window.getComputedStyle(shell);
  const themeVars=['--theme-surface','--theme-surface2','--theme-line','--theme-text','--theme-muted','--theme-accent'];
  const style=Object.fromEntries(themeVars.map(key=>[key,computed.getPropertyValue(key).trim()]));
  setPortalAppearance({style,hideAmounts:shell.getAttribute('data-hide-amounts')==='true'});
 },[historyOpen]);
 useEffect(()=>{if(!historyOpen)return;const onKey=e=>{if(e.key==='Escape')setHistoryOpen(false)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[historyOpen]);
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState(''),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const localValue=goal&&usableRate?goal/Number(mainRate):null;
 const current=Number(currentTwd)||0;
 const display=n=>formatMoneyDisplay(n,{currency,primaryCurrency:'TWD',maximumFractionDigits:0});
 const progress=goal?Math.max(0,current/goal*100):0;
 const remaining=goal?Math.max(0,goal-current):0;
 useEffect(()=>{if(!editing)setDraft(localValue===null?'':String(Math.round(localValue)));},[editing,goalTwd,mainRate]);
 // Animate the progress fill from zero on entering the overview; later changes transition smoothly.
 useEffect(()=>{setTrackEntered(false);const raf=requestAnimationFrame(()=>requestAnimationFrame(()=>setTrackEntered(true)));return ()=>cancelAnimationFrame(raf);},[goalTwd]);
 const begin=()=>{setDraft(localValue===null?'':String(Math.round(localValue)));setError('');setEditing(true)};
 const save=async e=>{e.preventDefault();const number=Number(String(draft).replace(/[,，\s]/g,''));if(!usableRate||!Number.isFinite(number)||number<=0){setError(t.invalid);return;}setSaving(true);try{await onSave(number*Number(mainRate));setEditing(false);setError('');}catch(err){setError(err?.message||String(err))}finally{setSaving(false)}};
 const clear=async()=>{setSaving(true);try{await onSave(null);setEditing(false);setError('')}catch(err){setError(err?.message||String(err))}finally{setSaving(false)}};
 return <section ref={panelRef} className="networth-goal-panel" aria-label={t.title}>
  <div className="networth-goal-heading"><div className="networth-goal-heading-copy"><h3>{t.title}</h3><small>{t.desc}</small></div><div className="networth-goal-head-actions"><button className="soft-btn small" type="button" onClick={editing?()=>setEditing(false):begin} disabled={!usableRate&&!editing}>{editing?t.cancel:t.edit}</button><button className="soft-btn small networth-milestone-open" type="button" onClick={()=>setHistoryOpen(true)} aria-label={language==='en'?'Achievement history':'歷次達標紀錄'}><History size={15} aria-hidden="true"/>{language==='en'?'History':language==='ja'?'達成履歴':language==='zh-CN'?'达标记录':'達標紀錄'}</button></div></div>
  {!usableRate&&<p className="hint">{t.unavailable}</p>}
  {goal&&usableRate?<>
   <div className="networth-goal-numbers"><div><small>{t.goal}</small><strong><AnimatedNumber value={display(localValue)}/></strong></div><div><small>{t.achieved}</small><strong><AnimatedNumber value={`${progress.toFixed(1)}%`}/></strong></div></div>
   <div className="networth-goal-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100,progress)} aria-label={t.achieved}><div style={{width:`${trackEntered?Math.min(100,progress):0}%`}}/></div>
   <div className="networth-goal-remaining"><span>{current>=goal?(current>goal?t.exceeded:t.reached):t.remaining}</span><strong><AnimatedNumber value={current>=goal?display((current-goal)/Number(mainRate)):display(remaining/Number(mainRate))}/></strong></div>
   {incomplete&&<p className="hint networth-goal-warning">{t.incomplete}</p>}
   {alreadyRecorded&&<p className="networth-milestone-confirmed">✓ {language==='en'?'Achievement automatically recorded': '已自動記錄本次目標達成日期'}</p>}
  </>:!editing&&<p className="hint">{t.empty}</p>}
  {historyOpen&&createPortal(<div className="networth-goal-portal networth-milestone-modal-backdrop" style={portalAppearance.style} data-hide-amounts={portalAppearance.hideAmounts?'true':'false'} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setHistoryOpen(false)}}><section className="networth-milestone-modal glass" role="dialog" aria-modal="true" aria-label={language==='en'?'Achievement history':'歷次達標紀錄'}><header className="networth-milestone-modal-head"><div><h2>{language==='en'?'Achievement history':language==='ja'?'達成履歴':language==='zh-CN'?'历次达标记录':'歷次達標紀錄'}</h2><small>{language==='en'?'Automatically saved when the target is reached':'達標時自動儲存日期，依目標順序排列'}</small></div><button type="button" className="soft-btn small" aria-label="關閉達標紀錄" onClick={()=>setHistoryOpen(false)}><X size={20}/></button></header><div className="networth-milestone-modal-body">{milestones.length?<div className="networth-milestone-list">{milestones.map((entry,index)=>{const prior=milestones[index-1];const days=prior?dateGapDays(prior.achievedDate,entry.achievedDate):null;return <div className="networth-milestone-row" key={`${entry.amountTwd}-${entry.achievedDate}`}><span><strong>NT$ {new Intl.NumberFormat('zh-TW',{maximumFractionDigits:0}).format(entry.amountTwd)}</strong><small>{entry.achievedDate.replace(/-/g,'/')}</small></span><span className="networth-milestone-days">{prior?`${days} 天`:'首次達標'}</span></div>})}</div>:<p className="hint">{language==='en'?'No completed goals yet. Your first milestone will be saved automatically.':'尚無達標紀錄，達成目標後將自動新增。'}</p>}</div></section></div>,document.body)}
  {editing&&<form className="networth-goal-editor" onSubmit={save}><label><span>{t.goal}（{currency}）</span><MarqueeInput type="text" inputMode="decimal" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="10000000" autoFocus/></label>{error&&<p className="networth-goal-error" role="alert">{error}</p>}<div className="networth-goal-actions"><button className="primary-btn" type="submit" disabled={saving||!usableRate}>{t.save}</button>{goal&&<button type="button" className="soft-btn" onClick={clear} disabled={saving}>{t.remove}</button>}</div></form>}
 </section>;
}
