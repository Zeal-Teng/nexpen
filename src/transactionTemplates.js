// Templates are locally stored reusable field values, not booked transactions.
// Never retain a transaction id, date, recurring id, or database metadata.
export const TEMPLATE_FIELDS=['type','amount','account','fromAccount','toAccount','mainCategory','subCategory','note','projectId'];
export const templatePayload=(form)=>Object.fromEntries(TEMPLATE_FIELDS.map(key=>[key,String(form?.[key]??'')]));
export function normalizeTemplates(value){
 if(!Array.isArray(value))return [];
 const seen=new Set();
 return value.flatMap(x=>{if(!x||typeof x!=='object'||typeof x.id!=='string'||seen.has(x.id)||typeof x.name!=='string')return [];seen.add(x.id);return [{id:x.id,name:x.name.slice(0,48),...templatePayload(x)}]});
}
export function applyTransactionTemplate(form,template,accounts,categories,projects){
 const data=templatePayload(template);
 const type=['expense','income','transfer'].includes(data.type)?data.type:'expense';
 const eligible=accounts.filter(a=>!['trust','policy'].includes(a.type));
 const accountValid=id=>eligible.some(a=>a.id===id);
 const account=accountValid(data.account)?data.account:(accountValid(form.account)?form.account:eligible[0]?.id||'');
 const fromAccount=accountValid(data.fromAccount)?data.fromAccount:(accountValid(form.fromAccount)?form.fromAccount:eligible[0]?.id||'');
 const toAccount=accountValid(data.toAccount)&&data.toAccount!==fromAccount?data.toAccount:eligible.find(a=>a.id!==fromAccount)?.id||'';
 const mains=categories[type]||{};
 const mainCategory=Object.hasOwn(mains,data.mainCategory)?data.mainCategory:Object.keys(mains)[0]||'';
 const subCategory=(mains[mainCategory]||[]).includes(data.subCategory)?data.subCategory:(mains[mainCategory]||[])[0]||'';
 const projectId=projects.some(p=>p.id===data.projectId)?data.projectId:'';
 return {...form,type,amount:data.amount,account,fromAccount,toAccount,mainCategory:type==='transfer'?'帳戶互轉':mainCategory,subCategory:type==='transfer'?'內部轉帳':subCategory,note:data.note,projectId};
}
