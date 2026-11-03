/**
 * CYBERPULSE offline securities code classifier.
 * Rules based on TWSE ETF code allocation (2025-05-05):
 * https://www.twse.com.tw/downloads/zh/ETF/ETFcode.pdf
 * Codes identify *likely* product classes; they do not confirm listing status.
 * No security-name network calls are made.
 */
const KNOWN_ETFS=new Set(['0050','0056','006208','00878','00919','00929','00940','00939','00900','00713','00881']);
const KNOWN_BOND_ETFS=new Set(['00679B','00687B','00696B','00720B','00725B','00751B','00772B','00857B','00937B']);
const KNOWN_STOCKS=new Set(['2330','2317','2454','2303','2882','2891']);
const SPECIAL={
 A:'主動式 ETF',T:'平衡型 ETF',L:'槓桿型 ETF',M:'外幣槓桿型 ETF',
 R:'反向型 ETF',S:'外幣反向型 ETF',U:'期貨型 ETF',V:'外幣期貨型 ETF',K:'外幣 ETF'
};
export function classifySecurity(raw){
 const code=String(raw??'').trim().toUpperCase();
 if(!code)return {type:null,confidence:'none',message:''};
 if(KNOWN_BOND_ETFS.has(code))return {type:'bondEtf',confidence:'known',message:'已辨識為債券 ETF（內建代號）；請核對商品資料'};
 if(KNOWN_ETFS.has(code))return {type:'etf',confidence:'known',message:'已辨識為一般 ETF（內建代號）；請核對商品資料'};
 if(KNOWN_STOCKS.has(code))return {type:'stock',confidence:'known',message:'已辨識為一般股票（內建代號）'};
 // TWSE 00 + three numerical digits + suffix per official table.
 if(/^00\d{3}[BC]$/.test(code))return {type:'bondEtf',confidence:'pattern',message:'依證交所 ETF 編碼 B/C 後綴判定債券 ETF，請核對'};
 if(/^00\d{3}D$/.test(code))return {type:'bondEtf',confidence:'pattern',message:'依證交所編碼 D 後綴判定「債券主動式 ETF」；請確認稅率與商品'};
 const special=/^00\d{3}([ATLMRSUVK])$/.exec(code);
 if(special)return {type:'etf',confidence:'special',message:`依官方代號判斷為${SPECIAL[special[1]]}，非一般股票型 ETF；請人工確認交易稅規則`};
 // New 6-digit numeric ETF codes are allocated in 00980-00999 then 00400-00499,
 // and eventually 00500-00979. Avoid classifying arbitrary six digit codes as ETFs.
 if(/^00\d{4}$/.test(code)){
  const prefix=Number(code.slice(0,5));
  if(prefix>=980&&prefix<=999||prefix>=400&&prefix<=979)
   return {type:'etf',confidence:'pattern',message:'符合證交所六碼一般型 ETF 編碼區間；仍請確認已上市與商品類型'};
 }
 // Legacy 5-digit numeric ETF codes (e.g. 00966), or common 4-digit 00 ETFs.
 if(/^00\d{2,3}$/.test(code))return {type:'etf',confidence:'pattern',message:'符合既有 ETF 代號格式；單憑格式無法保證類型，請確認'};
 // No blanket assumption that a four-digit security is common stock.
 return {type:null,confidence:'unknown',message:'無法由 ETF 編碼規則確認此代號，請自行選擇頁籤與 ETF 稅別'};
}
