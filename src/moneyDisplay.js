/** Display-only currency decoration. No changes to stored amounts or conversion. */
export function moneySymbol(formatted, currency='', primaryCurrency='TWD') {
 const str=String(formatted??'');
 if(!str||str==='—'||str.includes('匯率尚未取得')||str.includes('無法計算'))return str;
 if(/[$＄]/.test(str))return str;
 const code=currency && currency!==primaryCurrency?`${currency} `:'';
 const sign=/^[+\-−]/.exec(str)?.[0]||'';
 const digits=sign?str.slice(sign.length):str;
 return `${sign}${code}$${digits}`;
}
export function formatMoneyDisplay(amount,{currency='TWD',primaryCurrency='TWD',locale='zh-TW',maximumFractionDigits=2,minimumFractionDigits=0}={}) {
 const n=Number(amount)||0;
 const formatted=Math.abs(n).toLocaleString(locale,{maximumFractionDigits,minimumFractionDigits});
 return moneySymbol(`${n<0?'−':''}${formatted}`,currency,primaryCurrency);
}
