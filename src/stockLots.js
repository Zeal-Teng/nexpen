/**
 * Stock-lot accounting. Explicit matched sales consume the nominated purchase
 * batch; historical unmatched sales keep the existing moving-average method.
 * Shares are always whole shares. Purchases carry their original fee-inclusive
 * totalAmount and partial sales apportion that amount proportionally.
 */
const EPS=1e-7;
export function calculateLots(trades=[]){
  const sorted=trades.map((t,i)=>({t,i})).sort((a,b)=>
    String(a.t.date||'').localeCompare(String(b.t.date||''))||a.i-b.i);
  const groups=new Map(),rows=new Map(),issues=[];
  for(const {t} of sorted){
    const symbol=String(t.symbol||'').trim().toUpperCase();
    if(!symbol)continue;
    let g=groups.get(symbol);
    if(!g){g={symbol,lots:[],shares:0,cost:0,realized:0,realizedBasis:0,proceeds:0,soldShares:0,dividends:0,lastSaleDate:'',transactions:[],issues:[],securityName:''};groups.set(symbol,g)}
    if(t.securityName)g.securityName=t.securityName;
    const qty=Number(t.shares)||0,fee=Number(t.fee)||0,tax=Number(t.tax)||0;
    const gross=qty*(Number(t.price)||0);
    const amt=Number(t.totalAmount);
    const total=Number.isFinite(amt)&&amt>0?amt:(t.action==='buy'?gross+fee+tax:gross-fee-tax);
    let row={...t,realized:null,costBasis:null,netProceeds:null,returnPercent:null,matchedBuy:null};
    if(t.action==='buy'&&qty>0){
      g.lots.push({id:t.id,date:t.date,price:Number(t.price)||0,initialShares:qty,remaining:qty,remainingCost:total,initialCost:total,account:t.account});
    }else if(t.action==='sell'&&qty>0){
      const available=g.lots.reduce((n,l)=>n+l.remaining,0);
      if(available+EPS<qty){
        const message=`${symbol} ${t.date||''} 賣出 ${qty} 股，當時只有 ${available} 股`;
        g.issues.push(message);issues.push({id:t.id,message});
      }else{
        let basis=0;
        if(t.matchedBuyId){
          const lot=g.lots.find(l=>l.id===t.matchedBuyId);
          if(!lot||lot.remaining+EPS<qty){
            const message=`${symbol} ${t.date||''} 指定買進批次不存在或剩餘股數不足`;
            g.issues.push(message);issues.push({id:t.id,message});
            g.transactions.push(row);rows.set(t.id,row);continue;
          }
          basis=qty*(lot.remainingCost/lot.remaining);
          lot.remaining-=qty;lot.remainingCost-=basis;
          if(lot.remaining<EPS){lot.remaining=0;lot.remainingCost=0}
          row.matchedBuy={id:lot.id,date:lot.date,price:lot.price};
        }else{
          // Old sell records are allocated pro-rata across open purchases.
          // This yields precisely the historical moving-average basis.
          const fraction=qty/available;
          for(const lot of g.lots){
            const taken=lot.remaining*fraction;
            const costTaken=lot.remainingCost*fraction;
            lot.remaining-=taken;lot.remainingCost-=costTaken;basis+=costTaken;
            if(lot.remaining<EPS){lot.remaining=0;lot.remainingCost=0}
          }
        }
        const pnl=total-basis;
        g.realized+=pnl;g.realizedBasis+=basis;g.proceeds+=total;g.soldShares+=qty;
        g.lastSaleDate=t.date||'';
        row={...row,realized:pnl,costBasis:basis,netProceeds:total,returnPercent:basis>0?pnl/basis*100:null};
      }
    }else if(t.action==='dividend')g.dividends+=Number(t.amount)||0;
    g.transactions.push(row);rows.set(t.id,row);
  }
  for(const g of groups.values()){
    g.shares=g.lots.reduce((n,l)=>n+l.remaining,0);
    g.cost=g.lots.reduce((n,l)=>n+l.remainingCost,0);
    if(g.shares<EPS){g.shares=0;g.cost=0}
    g.realizedPercent=g.realizedBasis>0?g.realized/g.realizedBasis*100:null;
    g.isClosed=g.soldShares>0&&g.shares===0;
    g.transactions.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  }
  return {groups:[...groups.values()],rows,issues};
}
/** Remaining purchase lots as of a proposed sale, excluding the sale being edited. */
export function buyLotsForSale(trades,symbol,date,excludeId){
  const previous=trades.filter(t=>t.id!==excludeId&&t.date<=date);
  const groups=calculateLots(previous).groups;
  const group=groups.find(g=>g.symbol===String(symbol||'').toUpperCase());
  return (group?.lots||[]).filter(l=>l.remaining>EPS).map(l=>({...l}));
}
