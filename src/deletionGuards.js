// Pure reference checks shared by delete workflows. Legacy records remain protected.
const usesAccount=(row,id)=>row?.account===id||row?.fromAccount===id||row?.toAccount===id;
export function accountRefs(id,records=[],stocks=[],recurring=[]){
 const r=records.filter(x=>usesAccount(x,id)).length;
 const s=stocks.filter(x=>usesAccount(x,id)).length;
 const c=recurring.filter(x=>usesAccount(x,id)).length;
 return {records:r,stocks:s,recurring:c,total:r+s+c};
}
export const accountTypeRefs=(id,accounts=[])=>accounts.filter(x=>x.type===id).length;
export const projectRefs=(id,records=[],recurring=[])=>records.filter(x=>x.projectId===id).length+recurring.filter(x=>x.projectId===id).length;
export const stockBuyRefs=(id,stocks=[])=>stocks.filter(x=>x.action==='sell'&&x.matchedBuyId===id).length;
export function categoryRefs(flow,main,sub,records=[],recurring=[],stocks=[]){
 const match=row=>row.type===flow&&row.mainCategory===main&&(!sub||row.subCategory===sub);
 const r=records.filter(match).length;
 const c=recurring.filter(match).length;
 // Dividends are virtual income entries projected into the diary, not stored in records.
 const s=flow==='income'&&main==='投資收益'&&(!sub||sub==='股票股利')?stocks.filter(x=>x.action==='dividend').length:0;
 return {records:r,recurring:c,stocks:s,total:r+c+s};
}
