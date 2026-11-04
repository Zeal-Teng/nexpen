import React,{useMemo,useState} from 'react';

const i18n={
 'zh-TW':{title:'淨資產走勢',desc:'每日快照（以當天最後一次開啟或更新時的金額為準）',empty:'尚未有歷史紀錄；開啟 APP 後會開始逐日累積。',one:'目前只有一天的紀錄，累積第二天後會呈現趨勢。',incomplete:'當日部分投資缺少報價',all:'全部',days:'天'},
 'zh-CN':{title:'净资产走势',desc:'每日快照（按当天最后一次更新的金额）',empty:'暂无历史记录',one:'目前只有一天的记录',incomplete:'当日部分投资缺少报价',all:'全部',days:'天'},
 en:{title:'Net worth trend',desc:'Daily snapshots (latest observed value each day)',empty:'No history yet. Open the app on future days to build your trend.',one:'One day recorded; more points will appear over time.',incomplete:'Some quotes were unavailable on this day',all:'All',days:'days'},
 ja:{title:'純資産の推移',desc:'日次スナップショット（当日の最新値）',empty:'履歴はまだありません',one:'現在の記録は1日分です',incomplete:'一部の相場が未取得',all:'全期間',days:'日'}
};
export default function NetWorthTrend({history=[],format,language='zh-TW',currency='TWD'}){
 const t=i18n[language]||i18n['zh-TW'];
 const [range,setRange]=useState(30);
 const [selected,setSelected]=useState(null);
 const sorted=useMemo(()=>history.filter(p=>/^\d{4}-\d{2}-\d{2}$/.test(p.date)&&Number.isFinite(p.netWorth)).slice().sort((a,b)=>a.date.localeCompare(b.date)),[history]);
 const data=useMemo(()=>range==='all'?sorted:sorted.filter(p=>{const cutoff=new Date();cutoff.setHours(0,0,0,0);cutoff.setDate(cutoff.getDate()-range+1);return p.date>=`${cutoff.getFullYear()}-${String(cutoff.getMonth()+1).padStart(2,'0')}-${String(cutoff.getDate()).padStart(2,'0')}`;}),[sorted,range]);
 const point=data.find(p=>p.date===selected)||data.at(-1);
 const W=600,H=215,L=12,R=12,T=20,B=30;
 const lo=Math.min(0,...data.map(p=>p.netWorth)),hi=Math.max(0,...data.map(p=>p.netWorth));
 const spread=Math.max(1,hi-lo);
 const x=(i)=>L+(data.length<2?0.5:i/(data.length-1))*(W-L-R);
 const y=(v)=>T+(hi-v)/spread*(H-T-B);
 const pts=data.map((p,i)=>[x(i),y(p.netWorth)]);
 const path=pts.map(([px,py],i)=>`${i?'L':'M'}${px.toFixed(2)} ${py.toFixed(2)}`).join(' ');
 const fill=path&&`${path} L${pts.at(-1)[0]} ${H-B} L${pts[0][0]} ${H-B} Z`;
 const value=n=>`${currency==='TWD'?'':currency+' '}${format(n)}`;
 return <section className="networth-trend-panel" aria-label={t.title}>
  <div className="networth-trend-heading"><div><h3>{t.title}</h3><small>{t.desc}</small></div></div>
  <div className="networth-trend-ranges" role="group" aria-label={t.title}>{[7,30,90,'all'].map(r=><button key={r} type="button" aria-pressed={range===r} onClick={()=>{setRange(r);setSelected(null)}} className={range===r?'active':''}>{r==='all'?t.all:`${r}${t.days}`}</button>)}</div>
  {data.length? <>
   <div className="networth-trend-selected"><small>{point.date}{point.complete===false?` · ${t.incomplete}`:''}</small><strong>{value(point.netWorth)}</strong></div>
   <svg className="networth-trend-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${t.title}：${data.map(p=>`${p.date} ${value(p.netWorth)}`).join('；')}`}>
    <defs><linearGradient id="networth-trend-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--theme-accent)" stopOpacity=".28"/><stop offset="100%" stopColor="var(--theme-accent)" stopOpacity=".015"/></linearGradient></defs>
    {[0,.5,1].map(v=><line key={v} x1={L} x2={W-R} y1={T+v*(H-T-B)} y2={T+v*(H-T-B)} stroke="var(--theme-line)" strokeDasharray="5 6"/>) }
    {data.length>1&&<path d={fill} fill="url(#networth-trend-fill)"/>}
    <path d={path} fill="none" stroke="var(--theme-accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
    {data.map((p,i)=><circle key={p.date} cx={pts[i][0]} cy={pts[i][1]} r={selected===p.date||point?.date===p.date?6:4} fill="var(--theme-surface)" stroke="var(--theme-accent)" strokeWidth="2.8" onClick={()=>setSelected(p.date)}><title>{p.date} · {value(p.netWorth)}</title></circle>)}
    <text x={L} y={H-6} fill="var(--theme-muted)" fontSize="13">{data[0].date.slice(5)}</text>
    <text x={W-R} y={H-6} textAnchor="end" fill="var(--theme-muted)" fontSize="13">{data.at(-1).date.slice(5)}</text>
   </svg>
   {data.length===1&&<p className="networth-trend-note">{t.one}</p>}
  </>:<p className="networth-trend-note">{t.empty}</p>}
 </section>;
}
