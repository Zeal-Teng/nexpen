export function normalizePastedAmount(value){
  const raw=String(value??'').trim().replace(/^(?:NTD|NT\$|TWD|USD)\s*/i,'').replace(/[\s,，＄$￥¥€£]/g,'').replace(/−/g,'-').replace(/×/g,'*').replace(/÷/g,'/').replace(/＋/g,'+').replace(/．/g,'.');
  if(!raw || raw.length>120 || !/^[0-9.+*/-]+$/.test(raw)) throw new Error('貼上的內容不是有效金額');
  return raw;
}
