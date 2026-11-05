// NEXPEN category presets v171. Keep this module independent of IndexedDB for testing.
export const defaultCategories = {
  expense: {
    '餐飲美食': ['早餐','午餐','晚餐','宵夜','飲料','咖啡','點心零食','食材採買','聚餐','其他飲食'],
    '居家生活': ['房租','房貸利息','管理費','水費','電費','瓦斯費','家具','家電','居家用品','房屋修繕','其他住家'],
    '電信': ['手機費','網路費','通訊設備','郵資與運費','其他電信'],
    '訂閱服務': ['AI 工具','影音串流','音樂串流','雲端儲存','雲端伺服器','軟體服務','會員訂閱','其他訂閱'],
    '交通運輸': ['大眾運輸','計程車','油資','停車費','過路費','車輛保養','車輛維修','交通罰款','其他交通'],
    '教育學習': ['學費','補習費','才藝課程','書籍教材','線上課程','證照考試','研習進修','文具用品','其他學習'],
    '休閒娛樂': ['旅遊住宿','景點門票','電影','遊戲','樂透','串流影音','音樂表演','休閒活動','其他娛樂'],
    '購物消費': ['服飾','鞋包','化妝保養','3C 產品','生活用品','網路購物','飾品配件','其他購物'],
    '家庭': ['孩子用品','育兒支出','孝親費','長輩照護','家庭共同支出','寵物支出','其他家庭'],
    '送禮＆捐贈': ['送禮','婚喪喜慶','公益捐款','其他送禮'],
    '醫療＆健康': ['門診掛號','藥品','牙科','眼科','健身運動','保健用品','其他醫療'],
    '金融＆保險': ['保險費','貸款利息','銀行手續費','信用卡費用','投資手續費','其他金融'],
    '稅金': ['所得稅','房屋稅','地價稅','牌照稅','燃料費','其他稅費'],
    '其他雜項': ['行政規費','證件申辦','遺失賠償','其他支出']
  },
  income: {
    '主動收入': ['薪資所得','兼職收入','加班費','獎金','年終獎金','績效獎金','鐘點費','接案收入','業務收入','其他工作收入'],
    '被動收入': ['存款利息','股票股利','基金配息','債券利息','租金收入','投資收益','權利金','其他被動收入'],
    '意外收入': ['中獎獎金','發票中獎','抽獎收入','意外獲得款項','其他意外收入'],
    '其他收入': ['政府補助','退款退費','禮金紅包','現金回饋','二手出售','其他收入']
  }
};

// Previous factory defaults from v168, used to distinguish user-created labels.
export const v168Categories = {
 expense: {
  '飲食':['早餐','午餐','晚餐','飲料咖啡','零食點心','聚餐','其他飲食'],
  '住家':['房租房貸','水費','電費','瓦斯','管理費','居家修繕','家具家電','生活用品'],
  '電信':['手機電信費','網路費','通訊設備','訂閱服務'],
  '交通':['大眾運輸','油資','停車費','計程車／叫車','車輛保養','過路費','其他交通'],
  '學習':['學費','補習課程','書籍教材','文具用品','研習進修'],
  '娛樂':['電影展演','遊戲','影音串流','旅遊','休閒活動'],
  '購物':['服飾鞋包','美妝保養','電子產品','生活百貨','線上購物'],
  '家庭':['育兒用品','孝親費','家庭支出','寵物用品'],
  '送禮&捐贈':['禮金紅包','生日節慶','公益捐款','其他贈禮'],
  '醫療&健康':['門診掛號','藥品','牙科','健檢','健身運動','保健用品'],
  '金融&保險':['保險費','銀行手續費','貸款利息','投資手續費'],
  '稅金':['所得稅','房屋稅','地價稅','牌照稅','其他稅費'],
  '其他雜項':['未分類支出','臨時支出','其他費用']
 },
 income: {
  '主動收入':['薪資','獎金','年終獎金','加班費','兼職收入','接案收入'],
  '被動收入':['股利','利息','租金收入','投資收益','權利金'],
  '意外收入':['中獎獎金','發票中獎','退款退費','補助津貼','意外所得'],
  '其他':['二手出售','親友贈與','其他收入']
 }
};
const legacyMain = {
 expense: {
  '飲食':'餐飲美食','住家':'居家生活','居住居家':'居家生活',
  '交通':'交通運輸','學習':'教育學習','娛樂':'休閒娛樂','購物':'購物消費',
  '送禮&捐贈':'送禮＆捐贈','醫療&健康':'醫療＆健康','醫療健康':'醫療＆健康',
  '金融&保險':'金融＆保險'
 },
 income: {'其他':'其他收入','薪資所得':'主動收入','投資收益':'開支被動收入'}
};
const legacySub = {
 expense: {
  '餐飲美食': {'飲料咖啡':'飲料','手搖咖啡':'飲料','零食點心':'點心零食','聚會聚餐':'聚餐'},
  '居家生活': {'房租房貸':'房租','租金房貸':'房租','瓦斯':'瓦斯費','居家修繕':'房屋修繕','家具家電':'家具','生活用品':'居家用品','水電瓦斯':'水費','生活雜貨':'居家用品','居家裝潢':'房屋修繕'},
  '電信': {'手機電信費':'手機費'},
  '交通運輸': {'大眾捷運':'大眾運輸','油資加滿':'油資','停車場':'停車費','計程車／叫車':'計程車','計程車/Uber':'計程車'},
  '教育學習': {'補習課程':'補習費'},
  '休閒娛樂': {'電影展演':'電影','旅遊':'旅遊住宿','遊戲課金':'遊戲','電影串流':'串流影音','旅行露營':'旅遊住宿'},
  '購物消費': {'服飾鞋包':'服飾','美妝保養':'化妝保養','電子產品':'3C 產品','生活百貨':'生活用品','線上購物':'網路購物'},
  '家庭': {'育兒用品':'孩子用品','家庭支出':'家庭共同支出','寵物用品':'寵物支出'},
  '送禮＆捐贈': {'禮金紅包':'送禮','生日節慶':'送禮','其他贈禮':'其他送禮'},
  '醫療＆健康': {'看診掛號':'門診掛號','日常保健品':'保健用品','健檢':'其他醫療'},
  '其他雜項': {'未分類支出':'其他支出','臨時支出':'其他支出','其他費用':'其他支出'}
 },
 income: {
  '主動收入': {'薪資':'薪資所得','每月底薪':'薪資所得','專案獎金':'獎金','年終津貼':'年終獎金','副業兼差':'兼職收入'},
  '被動收入': {'股利':'股票股利','利息':'存款利息','資本利得':'投資收益','定存利息':'存款利息'},
  '意外收入': {'意外所得':'意外獲得款項'},
  '其他收入': {'補助津貼':'政府補助','政府補助款':'政府補助','二手變賣':'二手出售','中獎發票':'發票中獎','親友贈與':'禮金紅包'}
 }
};
const presetNames=new Set(Object.values(v168Categories).flatMap(flow=>Object.keys(flow)));
export function mapCategory(flow,main,sub='') {
  if(flow==='expense' && main==='電信' && sub==='訂閱服務') return {main:'訂閱服務',sub:'其他訂閱'};
  if(flow==='income' && main==='意外收入' && ['退款退費','補助津貼'].includes(sub))return {main:'其他收入',sub:sub==='補助津貼'?'政府補助':'退款退費'};
  const dest=legacyMain[flow]?.[main] || main;
  return {main:dest,sub:legacySub[flow]?.[dest]?.[sub] || sub};
}
export function migrateCategoryData(existing,records=[],recurring=[],icons={}) {
  const result=structuredClone(defaultCategories);
  const knownOld=(flow,main,sub)=>v168Categories[flow]?.[main]?.includes(sub)===true;
  const old=existing&&typeof existing==='object'?existing:{};
  for(const flow of ['expense','income']){
    for(const [main,subs] of Object.entries(old[flow]||{})){
      const target=mapCategory(flow,main).main;
      if(!result[flow][target])result[flow][target]=[];
      if(!Array.isArray(subs))continue;
      for(const sub of subs){
        const mapped=mapCategory(flow,main,sub);
        if(knownOld(flow,main,sub)&&mapped.main==='訂閱服務'&&sub==='訂閱服務')continue;
        if(knownOld(flow,main,sub) && (mapped.sub!==sub || (defaultCategories[flow]?.[mapped.main]||[]).includes(mapped.sub)))continue;
        if(!result[flow][mapped.main])result[flow][mapped.main]=[];
        if(mapped.sub && !result[flow][mapped.main].includes(mapped.sub))result[flow][mapped.main].push(mapped.sub);
      }
    }
  }
  const mappedRecords=records.map(row=>{
    if(!['income','expense'].includes(row.type))return row;
    const mapped=mapCategory(row.type,row.mainCategory,row.subCategory);
    if(!result[row.type][mapped.main])result[row.type][mapped.main]=[];
    if(mapped.sub&&!result[row.type][mapped.main].includes(mapped.sub))result[row.type][mapped.main].push(mapped.sub);
    return {...row,mainCategory:mapped.main,subCategory:mapped.sub};
  });
  const mappedRecurring=recurring.map(row=>{
    if(!['income','expense'].includes(row.type))return row;
    const mapped=mapCategory(row.type,row.mainCategory,row.subCategory);
    if(!result[row.type][mapped.main])result[row.type][mapped.main]=[];
    if(mapped.sub&&!result[row.type][mapped.main].includes(mapped.sub))result[row.type][mapped.main].push(mapped.sub);
    return {...row,mainCategory:mapped.main,subCategory:mapped.sub};
  });
  const mappedIcons={};
  for(const [key,value] of Object.entries(icons||{})){
    const parts=key.split('/');
    if(!['expense','income'].includes(parts[0])||!['main','sub'].includes(parts[1])){mappedIcons[key]=value;continue;}
    const category=mapCategory(parts[0],parts[2],parts.slice(3).join('/'));
    const newKey=parts[1]==='main'?`${parts[0]}/main/${category.main}`:`${parts[0]}/sub/${category.main}/${category.sub}`;
    mappedIcons[newKey]=value;
  }
  return {categories:result,records:mappedRecords,recurring:mappedRecurring,icons:mappedIcons};
}
