import InvestmentCategoryColorPicker,{categoryColor} from './InvestmentCategoryColorPicker.jsx';
import {productTwdRate} from './investmentValuationsProduct.js';
import {balanceAuditDelta,isBalanceAudit} from './balanceAudit.js';
import {investmentDiaryRows} from './investmentDiary.js';
import {investmentPosition} from './investmentLedger.js';
import {initialTrustShares, contributionTrustShares, totalTrustShares, trustMarketValue} from './trustShares.js';
import MarqueeInput from './MarqueeInput.jsx';
import {t as i18n,setLocale} from './i18n.js';
import AmountCalculator from './AmountCalculator.jsx';
import { normalizeQuoteRows, validateQuoteBundle, quoteMarketStatus } from './marketQuotes.js';
import React,{useEffect,useMemo,useRef,useState}from 'react';
import{createPortal}from'react-dom';
import{Wallet,Layers3,ChartNoAxesCombined,Landmark,TrendingUp,Repeat2,Tags,Settings,Plus,ChevronLeft,ChevronRight,GripVertical,ArrowDownLeft,ArrowUpRight,ArrowLeftRight,Download,Upload,Sun,Moon,X,Trash2,Edit3,Check,CloudUpload,Search,CalendarDays,ShieldCheck,RefreshCcw,Coffee,UtensilsCrossed,Bus,Car,Home,ShoppingBag,HeartPulse,Gamepad2,Plane,GraduationCap,Gift,BriefcaseBusiness,Coins,WalletCards,Music,Smartphone,Receipt,BookOpen,Cat,Dog,Shirt,Dumbbell,TrainFront,Film,Landmark as BankIcon,House,Paintbrush,Apple,Hospital,Package,Smile,Camera,Clapperboard,Users,HandCoins,Building2,ArrowRightLeft,Pizza,Sandwich,Soup,CakeSlice,IceCreamCone,Wine,Beer,CookingPot,Fish,Beef,Milk,CupSoda,ShoppingCart,Store,CreditCard,PiggyBank,CircleDollarSign,BadgeDollarSign,Banknote,ChartPie,ChartLine,Briefcase,Laptop,Monitor,Wifi,Tv,Headphones,Speaker,Bike,BusFront,Train,TramFront,Ship,Fuel,ParkingCircle,MapPin,Map as MapIcon,Tickets,Ticket,Hotel,BedDouble,Sofa,Lightbulb,PlugZap,Droplets,WashingMachine,Wrench,Hammer,Scissors,Flower2,Leaf,TreePine,PawPrint,Baby,School,NotebookPen,Pencil,PenLine,Library,Stethoscope,Pill as PillIcon,Syringe,Activity,Heart,HandHeart,SmilePlus,PartyPopper,Popcorn,Drama,Trophy,Medal,Brush,Palette,Globe,AlarmClock,Clock3,Newspaper,Mail,Printer,Shield,Lock,KeyRound,Tag,Bookmark,BookMarked,MoreHorizontal,Umbrella,Cloud,Snowflake}from'lucide-react';
import{PieChart,Pie,Cell,Tooltip,ResponsiveContainer,BarChart,Bar,XAxis,CartesianGrid}from'recharts';
import{classifySecurity}from'./stockType';
import{lookupSecurity,refreshSecurityCatalog}from'./securityCatalog';
import{db,ensureDefaults,ensureInvestmentSchema,defaultCategories,today,uid,snapshot,restore,accountBalance,holdings,isDemoMode}from'./db';
import {initializeDemoOnLaunch,switchDemoMode} from './demoData.js';
import {analyzeStockPerformance} from './stockPerformance.js';
import {calculateLots,buyLotsForSale} from './stockLots.js';
import StockPerformanceView from './StockPerformanceView.jsx';
import NetWorthBreakdown from './NetWorthBreakdown.jsx';
import {useNetWorthHistory} from './useNetWorthHistory.js';
import SummaryHero from './SummaryHero.jsx';
import NetWorthGoal from './NetWorthGoal.jsx';
import AnimatedNumber from './AnimatedNumber.jsx';
import {runDueRecurring} from './recurringAutomation.js';
import {diaryTransactionTitle} from './recurringDisplay.js';
import {weekDatesFor} from './weekCalendar.js';
import {matchesDiaryAccount,filterDiaryByAccount} from './diaryAccountFilter.js';
import {availableDiaryFilters,matchesDiaryType} from './diaryFilterOptions.js';
import InstallHint from './InstallHint.jsx';
import {pwaBuildInfo,requestPwaUpdateCheck} from './PwaUpdateManager.jsx';
import {normalizeTemplates,applyTransactionTemplate,templatePayload} from './transactionTemplates.js';
import {useConfirmDialog} from './ConfirmDialog.jsx';
import {computeNetWorth,ASSET_GROUPS,assetGroupForType} from './netWorth.js';
import InvestmentAssets from './InvestmentAssets.jsx';
import InvestmentProducts from './InvestmentProducts.jsx';
import {investmentProductPosition,investmentProductValue} from './investmentProducts.js';
import NativeDatePicker from './NativeDatePicker.jsx';
import SwipeableDiaryRow from './SwipeableDiaryRow.jsx';
import { accountRefs, categoryRefs, accountTypeRefs, projectRefs, stockBuyRefs } from './deletionGuards.js';

const SUPPORTED_LANGUAGES=[['zh-TW','繁體中文'],['zh-CN','简体中文'],['en','English'],['ja','日本語']];
const CURRENCIES=[['TWD','新台幣 TWD'],['USD','美元 USD'],['JPY','日圓 JPY'],['EUR','歐元 EUR'],['CNY','人民幣 CNY'],['HKD','港幣 HKD'],['GBP','英鎊 GBP'],['AUD','澳幣 AUD'],['SGD','新加坡幣 SGD'],['KRW','韓元 KRW'],['CAD','加幣 CAD'],['CHF','瑞士法郎 CHF']];
const DICT={
 'zh-CN':{'日記帳':'日记账','總覽':'总览','股票':'股票','投資':'投资','設定':'设置','帳戶':'账户','帳戶管理':'账户管理','帳戶類型管理':'账户类型管理','定期交易':'定期交易','分類管理':'分类管理','主要貨幣':'主要货币','語言':'语言','金額顏色':'金额颜色','收入／獲利顯示綠色':'收入／获利显示绿色','收入／獲利顯示紅色':'收入／获利显示红色','外觀與使用':'外观与使用','財務概況':'财务概况','目前持股':'目前持股','持有成本':'持有成本','估算市值':'估算市值','未實現損益':'未实现损益','帳戶資產總額（不含股票）':'账户资产总额（不含股票）','總淨資產':'总净资产','本月支出':'本月支出','本月收入':'本月收入','當日支出':'当日支出','當日收入':'当日收入','當日淨額':'当日净额','記帳管理':'记账管理','iCloud Drive 備份':'iCloud Drive 备份','立即備份':'立即备份','立即還原':'立即还原','外觀主題':'外观主题','字體大小':'字体大小','我的帳戶':'我的账户','最後更新':'最后更新','新增股票交易':'新增股票交易','儲存':'保存','取消':'取消','期初餘額':'期初余额','小數位數':'小数位数','浮動按鈕位置':'悬浮按钮位置','選擇浮動操作按鈕靠左或靠右':'选择悬浮操作按钮靠左或靠右','左側':'左侧','右側':'右侧'},
 'en':{'日記帳':'Diary','總覽':'Overview','股票':'Stocks','投資':'Investments','設定':'Settings','帳戶':'Accounts','帳戶管理':'Account management','帳戶類型管理':'Account types','定期交易':'Recurring transactions','分類管理':'Categories','主要貨幣':'Primary currency','語言':'Language','金額顏色':'Amount colors','收入／獲利顯示綠色':'Income / profit green','收入／獲利顯示紅色':'Income / profit red','外觀與使用':'Appearance & preferences','財務概況':'Financial overview','目前持股':'Current holdings','持有成本':'Cost basis','估算市值':'Estimated market value','未實現損益':'Unrealized P/L','帳戶資產總額（不含股票）':'Account assets (excluding stocks)','總淨資產':'Net worth','本月支出':'Monthly expenses','本月收入':'Monthly income','當日支出':'Daily expenses','當日收入':'Daily income','當日淨額':'Daily net','記帳管理':'Manage finances','iCloud Drive 備份':'iCloud Drive backup','立即備份':'Back up now','立即還原':'Restore now','外觀主題':'Theme','字體大小':'Font size','我的帳戶':'My accounts','最後更新':'Last updated','新增股票交易':'New stock transaction','儲存':'Save','取消':'Cancel','期初餘額':'Opening balance','小數位數':'Decimal places','浮動按鈕位置':'Floating button position','選擇浮動操作按鈕靠左或靠右':'Choose left or right for floating actions','左側':'Left','右側':'Right'},
 'ja':{'日記帳':'家計簿','總覽':'概要','股票':'株式','投資':'投資','設定':'設定','帳戶':'口座','帳戶管理':'口座管理','帳戶類型管理':'口座種別','定期交易':'定期取引','分類管理':'カテゴリ管理','主要貨幣':'基準通貨','語言':'言語','金額顏色':'金額の色','收入／獲利顯示綠色':'収入・利益を緑で表示','收入／獲利顯示紅色':'収入・利益を赤で表示','外觀與使用':'表示と設定','財務概況':'資産概要','目前持股':'保有銘柄','持有成本':'取得原価','估算市值':'時価評価額','未實現損益':'含み損益','帳戶資產總額（不含股票）':'口座資産（株式除く）','總淨資產':'純資産','本月支出':'月間支出','本月收入':'月間収入','當日支出':'当日支出','當日收入':'当日収入','當日淨額':'当日収支','記帳管理':'家計管理','iCloud Drive 備份':'iCloud Drive バックアップ','立即備份':'今すぐバックアップ','立即還原':'今すぐ復元','外觀主題':'テーマ','字體大小':'文字サイズ','我的帳戶':'口座一覧','最後更新':'最終更新','新增股票交易':'株式取引を追加','儲存':'保存','取消':'キャンセル','期初餘額':'開始残高','小數位數':'小数桁数','浮動按鈕位置':'フローティングボタンの位置','選擇浮動操作按鈕靠左或靠右':'フローティング操作ボタンを左右に配置','左側':'左側','右側':'右側'}
};
const trText=(value,language)=>{const found=i18n(value,language);return found!==value?found:(DICT[language]?.[value]||value)};
// v182: Localized short weekday labels (Sunday-first). This never changes the ISO date stored in IndexedDB.
const weekdayLabels={
 'zh-TW':['日','一','二','三','四','五','六'],
 'zh-CN':['日','一','二','三','四','五','六'],
 en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
 ja:['日','月','火','水','木','金','土']
};
const weekdayFullLabels={
 'zh-TW':['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
 'zh-CN':['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
 en:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
 ja:['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日']
};

const precisionFor=account=>Number.isInteger(Number(account?.decimalPlaces))&&account?.decimalPlaces!==undefined?Number(account.decimalPlaces):(['JPY','KRW'].includes(account?.currency)?0:2);
const withinPrecision=(value,places)=>{const n=Number(value);return Number.isFinite(n)&&Math.abs(n-Number(n.toFixed(places)))<1e-8};
const renderCurrency=(amount,currency,places=2)=>new Intl.NumberFormat('zh-TW',{style:'currency',currency:currency||'TWD',minimumFractionDigits:0,maximumFractionDigits:places}).format(Number(amount)||0);

const defaultAccountTypes=[{id:'bank',name:'銀行帳戶'},{id:'cash',name:'現金'},{id:'credit',name:'信用卡'},{id:'ewallet',name:'電子支付'},{id:'brokerage',name:'證券交割戶'}];
// Investment assets are managed exclusively in the investment module. Legacy
// records still use type=trust/policy internally to preserve all existing links.
const isInvestmentAssetType=type=>type==='trust'||type==='policy';
const ordinaryAccountTypes=types=>(Array.isArray(types)?types:defaultAccountTypes).filter(t=>!isInvestmentAssetType(t.id));
const themeChoices=[{id:'dark',name:'經典深色',colors:['#151820','#20242e','#4da7d5']},{id:'light',name:'純淨淺色',colors:['#f3f5f9','#ffffff','#3577b8']},{id:'ocean',name:'海洋藍',colors:['#eaf4fa','#ffffff','#177caa']},{id:'sage',name:'鼠尾草綠',colors:['#eef4ef','#ffffff','#477c68']},{id:'rose',name:'暖霧玫瑰',colors:['#faf0f0','#fffaf9','#ab6278']},{id:'portfolio',name:'香檳投資',colors:['#f8f4e9','#fffdf7','#184e40']},{id:'folio',name:'資產手帳',colors:['#f6f3eb','#ffffff','#186c55']},{id:'coffee',name:'奶霜咖啡',colors:['#f6f0e9','#fffaf5','#93664b']},{id:'orange',name:'暖陽橘杏',colors:['#fff4e9','#fffbf6','#d66a2c']},{id:'cyber',name:'賽博霓虹',colors:['#080f1e','#14253b','#12dcf5']},{id:'matrix',name:'矩陣綠光',colors:['#080f0c','#13251a','#5cf29b']},{id:'violet',name:'量子紫光',colors:['#130d22','#241735','#ba8cff']},{id:'titanium',name:'鈦金科技',colors:['#111a25','#222d39','#8dd3ef']},{id:'aurora',name:'極光介面',colors:['#e9f5ff','#ffffff','#3478d8']},{id:'ember',name:'熔岩橘光',colors:['#19100e','#2b1c19','#ff9a58']}];
// 圖示與類別名稱分開儲存，避免改動既有分類及歷史記帳資料。
const CATEGORY_ICONS={coffee:Coffee,food:UtensilsCrossed,bus:Bus,car:Car,home:Home,shopping:ShoppingBag,health:HeartPulse,game:Gamepad2,travel:Plane,education:GraduationCap,gift:Gift,work:BriefcaseBusiness,money:Coins,wallet:WalletCards,music:Music,phone:Smartphone,bill:Receipt,book:BookOpen,cat:Cat,dog:Dog,clothes:Shirt,fitness:Dumbbell,train:TrainFront,movie:Film,bank:BankIcon,house:House,art:Paintbrush,grocery:Apple,hospital:Hospital,package:Package,smile:Smile,camera:Camera,cinema:Clapperboard,people:Users,salary:HandCoins,business:Building2,transfer:ArrowRightLeft,tags:Tags};
const ICON_OPTIONS=[['food','餐飲'],['coffee','咖啡'],['bus','交通'],['train','捷運'],['car','汽車'],['home','居家'],['shopping','購物'],['health','健康'],['hospital','醫療'],['game','遊戲'],['travel','旅行'],['education','教育'],['gift','禮物'],['work','工作'],['salary','薪資'],['money','金錢'],['wallet','錢包'],['bill','帳單'],['phone','手機'],['book','書籍'],['clothes','服飾'],['fitness','健身'],['movie','電影'],['music','音樂'],['people','聚會'],['grocery','食材'],['bank','銀行'],['business','公司'],['camera','攝影'],['art','藝術'],['pet','寵物'],['transfer','轉帳'],['tags','其他']];
ICON_OPTIONS.push(...[['pizza','披薩'],['sandwich','三明治'],['soup','湯品'],['cake','甜點'],['icecream','冰品'],['wine','酒水'],['beer','啤酒'],['cooking','料理'],['fish','海鮮'],['beef','肉類'],['milk','牛奶'],['drink','飲料'],['cart','超市'],['store','商店'],['credit','信用卡'],['save','儲蓄'],['dollar','貨幣'],['bonus','獎金'],['cash','現金'],['pie','分析'],['trend','趨勢'],['office','辦公'],['laptop','筆電'],['monitor','螢幕'],['wifi','網路'],['tv','電視'],['headphones','耳機'],['speaker','音響'],['bike','單車'],['busfront','公車'],['rail','鐵路'],['tram','電車'],['ship','船舶'],['fuel','加油'],['parking','停車'],['location','地點'],['map','地圖'],['tickets','票券'],['ticket','門票'],['hotel','飯店'],['bed','住宿'],['sofa','家具'],['light','電費'],['plug','電器'],['water','水費'],['washing','洗衣'],['repair','維修'],['tools','工具'],['hair','剪髮'],['flower','花卉'],['leaf','植物'],['tree','樹木'],['paw','寵物'],['baby','育兒'],['school','學校'],['notes','筆記'],['pencil','文具'],['pen','寫作'],['library','圖書館'],['doctor','醫師'],['medicine','藥品'],['vaccine','疫苗'],['dental','牙科'],['activity','運動'],['heart','愛心'],['donate','捐款'],['happy','休閒'],['party','派對'],['popcorn','零食'],['drama','表演'],['trophy','獎盃'],['medal','獎牌'],['brush','刷具'],['palette','設計'],['globe','國際'],['calendar','行事曆'],['alarm','鬧鐘'],['clock','時間'],['news','新聞'],['mail','郵件'],['printer','印表機'],['shield','保險'],['lock','安全'],['key','鑰匙'],['tag','標籤'],['bookmark','收藏'],['more','更多'],['umbrella','雨具'],['sun','陽光'],['cloud','雲端'],['moon','夜晚'],['snow','冷氣']]);
CATEGORY_ICONS.pet=Cat;
CATEGORY_ICONS.pizza=Pizza;
CATEGORY_ICONS.sandwich=Sandwich;
CATEGORY_ICONS.soup=Soup;
CATEGORY_ICONS.cake=CakeSlice;
CATEGORY_ICONS.icecream=IceCreamCone;
CATEGORY_ICONS.wine=Wine;
CATEGORY_ICONS.beer=Beer;
CATEGORY_ICONS.cooking=CookingPot;
CATEGORY_ICONS.fish=Fish;
CATEGORY_ICONS.beef=Beef;
CATEGORY_ICONS.milk=Milk;
CATEGORY_ICONS.drink=CupSoda;
CATEGORY_ICONS.cart=ShoppingCart;
CATEGORY_ICONS.store=Store;
CATEGORY_ICONS.credit=CreditCard;
CATEGORY_ICONS.save=PiggyBank;
CATEGORY_ICONS.dollar=CircleDollarSign;
CATEGORY_ICONS.bonus=BadgeDollarSign;
CATEGORY_ICONS.cash=Banknote;
CATEGORY_ICONS.pie=ChartPie;
CATEGORY_ICONS.trend=ChartLine;
CATEGORY_ICONS.office=Briefcase;
CATEGORY_ICONS.laptop=Laptop;
CATEGORY_ICONS.monitor=Monitor;
CATEGORY_ICONS.wifi=Wifi;
CATEGORY_ICONS.tv=Tv;
CATEGORY_ICONS.headphones=Headphones;
CATEGORY_ICONS.speaker=Speaker;
CATEGORY_ICONS.bike=Bike;
CATEGORY_ICONS.busfront=BusFront;
CATEGORY_ICONS.rail=Train;
CATEGORY_ICONS.tram=TramFront;
CATEGORY_ICONS.ship=Ship;
CATEGORY_ICONS.fuel=Fuel;
CATEGORY_ICONS.parking=ParkingCircle;
CATEGORY_ICONS.location=MapPin;
CATEGORY_ICONS.map=MapIcon;
CATEGORY_ICONS.tickets=Tickets;
CATEGORY_ICONS.ticket=Ticket;
CATEGORY_ICONS.hotel=Hotel;
CATEGORY_ICONS.bed=BedDouble;
CATEGORY_ICONS.sofa=Sofa;
CATEGORY_ICONS.light=Lightbulb;
CATEGORY_ICONS.plug=PlugZap;
CATEGORY_ICONS.water=Droplets;
CATEGORY_ICONS.washing=WashingMachine;
CATEGORY_ICONS.repair=Wrench;
CATEGORY_ICONS.tools=Hammer;
CATEGORY_ICONS.hair=Scissors;
CATEGORY_ICONS.flower=Flower2;
CATEGORY_ICONS.leaf=Leaf;
CATEGORY_ICONS.tree=TreePine;
CATEGORY_ICONS.paw=PawPrint;
CATEGORY_ICONS.baby=Baby;
CATEGORY_ICONS.school=School;
CATEGORY_ICONS.notes=NotebookPen;
CATEGORY_ICONS.pencil=Pencil;
CATEGORY_ICONS.pen=PenLine;
CATEGORY_ICONS.library=Library;
CATEGORY_ICONS.doctor=Stethoscope;
CATEGORY_ICONS.medicine=PillIcon;
CATEGORY_ICONS.vaccine=Syringe;
CATEGORY_ICONS.dental=Stethoscope;
CATEGORY_ICONS.activity=Activity;
CATEGORY_ICONS.heart=Heart;
CATEGORY_ICONS.donate=HandHeart;
CATEGORY_ICONS.happy=SmilePlus;
CATEGORY_ICONS.party=PartyPopper;
CATEGORY_ICONS.popcorn=Popcorn;
CATEGORY_ICONS.drama=Drama;
CATEGORY_ICONS.trophy=Trophy;
CATEGORY_ICONS.medal=Medal;
CATEGORY_ICONS.brush=Brush;
CATEGORY_ICONS.palette=Palette;
CATEGORY_ICONS.globe=Globe;
CATEGORY_ICONS.calendar=CalendarDays;
CATEGORY_ICONS.alarm=AlarmClock;
CATEGORY_ICONS.clock=Clock3;
CATEGORY_ICONS.news=Newspaper;
CATEGORY_ICONS.mail=Mail;
CATEGORY_ICONS.printer=Printer;
CATEGORY_ICONS.shield=Shield;
CATEGORY_ICONS.lock=Lock;
CATEGORY_ICONS.key=KeyRound;
CATEGORY_ICONS.tag=Tag;
CATEGORY_ICONS.bookmark=Bookmark;
CATEGORY_ICONS.more=MoreHorizontal;
CATEGORY_ICONS.umbrella=Umbrella;
CATEGORY_ICONS.sun=Sun;
CATEGORY_ICONS.cloud=Cloud;
CATEGORY_ICONS.moon=Moon;
CATEGORY_ICONS.snow=Snowflake;

const suggestedIcon=name=>{if(/餐|食|飯|早餐|午餐|晚餐/.test(name))return 'food';if(/咖啡|飲料|茶/.test(name))return 'coffee';if(/交通|捷運|公車/.test(name))return 'bus';if(/房|家|居住|水電/.test(name))return 'home';if(/購物|消費/.test(name))return 'shopping';if(/醫|健康|看診/.test(name))return 'health';if(/薪|工作|獎金/.test(name))return 'salary';if(/投資|股|理財/.test(name))return 'money';if(/旅行|旅遊/.test(name))return 'travel';if(/娛樂|電影/.test(name))return 'movie';return 'tags'};
const mobileNav=[['daily','日記帳',Wallet],['stocks','投資',TrendingUp],['dashboard','總覽',ChartNoAxesCombined],['settings','設定',Settings]];
const settingsPages=['accounts','accountTypes','projects','recurring','categories'];
const nav=[['daily','日記帳',Wallet],['dashboard','總覽',ChartNoAxesCombined],['accounts','帳戶',Landmark],['projects','專案管理',Tags],['stocks','投資',TrendingUp],['recurring','定期',Repeat2],['categories','分類',Tags],['settings','設定',Settings]];
const fmt=n=>'NT$ '+Math.round(Number(n)||0).toLocaleString('zh-TW');const fmtUnit=n=>'NT$ '+Number(n||0).toLocaleString('zh-TW',{minimumFractionDigits:2,maximumFractionDigits:4});const fmtCurrency=(amount,currency='TWD')=>new Intl.NumberFormat('zh-TW',{style:'currency',currency,maximumFractionDigits:currency==='TWD'||currency==='JPY'?0:2}).format(Number(amount)||0);const fmtSigned=n=>(n<0?'-':'+')+fmt(Math.abs(n));const picker={expense:'支出',income:'收入',transfer:'轉帳'};const stockNames={buy:'買進',sell:'賣出',dividend:'配息'};const parseDate=s=>new Date(s+'T12:00:00');const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
// Taiwan exchange-traded shares / ETF fee estimates. Real settlement may differ by broker.
const SECURITY_TYPES=[{id:'stock',label:'一般股票'},{id:'etf',label:'一般 ETF'},{id:'bondEtf',label:'債券 ETF'}];
const asAmount=n=>Math.round(Number(n)||0);
function estimateStockCharges(f){
 const gross=Number(f.shares)*Number(f.price);
 if(!Number.isFinite(gross)||gross<=0)return {gross:0,fee:0,tax:0,rate:0};
 const pct=Number(f.feeRate??0.1425);
 const discount=Number(f.feeDiscount??60);
 const minimum=Number(f.feeMinimum??20);
 const fee= Math.max(minimum, Math.round(gross*(pct/100)*(discount/100)));
 const type=f.securityType||'stock';
 const day=f.dayTrade===true;
 const taxRate=type==='stock'?(day?0.0015:0.003):type==='bondEtf'&&String(f.date||'').slice(0,10)<='2026-12-31'?0:0.001;
 const tax=f.action==='sell'?Math.round(gross*taxRate):0;
 return {gross:Math.round(gross),fee,tax,rate:taxRate};
}
const Field=({label,children})=><label className="field"><span>{label}</span>{children}</label>;
const Pill=({children,onClick,active})=><button type="button" className={'pill '+(active?'active':'')} onClick={onClick}>{children}</button>;
const Blank=({text='還沒有記錄',sub='按右下方的 + 開始新增'})=><div className="empty"><div className="empty-icon">✧</div><b>{i18n(text)}</b><small>{i18n(sub)}</small></div>;

// iPhone-style selection sheet: avoids native Safari select popups.
function SmartSelect({value,onChange,children,className='',...props}){
 const[shown,setShown]=useState(false);
 const flatten=(nodes)=>React.Children.toArray(nodes).flatMap(n=>Array.isArray(n)?flatten(n):n?.type===React.Fragment?flatten(n.props.children):[n]).filter(n=>React.isValidElement(n)&&n.type==='option');
 const options=flatten(children).map(x=>({value:String(x.props.value??x.props.children),label:i18n(String(x.props.children??'')),disabled:!!x.props.disabled}));
 const selected=options.find(o=>o.value===String(value));
 return <><button type="button" className={'smart-select '+className} onClick={()=>setShown(true)} disabled={props.disabled}><span>{selected?.label||i18n("請選擇")}</span><ChevronRight size={18}/></button>{shown&&createPortal(<div className="picker-backdrop" onClick={()=>setShown(false)}><div className="picker-sheet" onClick={e=>e.stopPropagation()}><div className="picker-handle"/><div className="picker-heading"><b>{i18n("請選擇")}</b><button type="button" className="sheet-close-button" aria-label={i18n("關閉選擇面板")} onClick={()=>setShown(false)}><X size={21}/></button></div><div className="picker-options">{options.map((o,i)=><button type="button" key={i} disabled={o.disabled} className={'picker-option '+(String(value)===o.value?'picked':'')} onClick={()=>{onChange?.({target:{value:o.value}});setShown(false)}}><span>{o.label}</span>{String(value)===o.value&&<Check size={19}/>}</button>)}</div></div></div>,document.body)}</>;
}
// Currency picker with a real two-column layout: names left, relative rates right.
// Use separate elements instead of aligning a long string with whitespace.
function CurrencyRateSelect({value,onChange,rates,mainRate,loading=false}){
 const [shown,setShown]=useState(false);
 const baseRate=value==='TWD'?1:(Number(mainRate)>0?Number(mainRate):Number(rates[value]?.rate));
 const currencyLabel=(code,label)=>`${code} · ${i18n(label).replace(new RegExp(`\\s+${code}$`),'')}`;
 const formattedRate=(code)=>{
  if(code===value)return `1 ${value}`;
  const twdRate=code==='TWD'?1:Number(rates[code]?.rate);
  if(!Number.isFinite(baseRate)||baseRate<=0||!Number.isFinite(twdRate)||twdRate<=0)return loading?'更新中':'—';
  const converted=twdRate/baseRate;
  return `${new Intl.NumberFormat('zh-TW',{maximumFractionDigits:6}).format(converted)} ${value}`;
 };
 const selected=CURRENCIES.find(([code])=>code===value);
 return <>
  <button type="button" className="smart-select currency-rate-select" aria-haspopup="dialog" aria-expanded={shown} onClick={()=>setShown(true)}>
   <span className="currency-rate-option-label">{selected?currencyLabel(...selected):value}</span>
   <span className="currency-rate-option-value">{formattedRate(value)}</span>
   <ChevronRight size={18} className="currency-rate-arrow" aria-hidden="true"/>
  </button>
  {shown&&createPortal(<div className="picker-backdrop" onClick={()=>setShown(false)}><div className="picker-sheet currency-rate-sheet" role="dialog" aria-modal="true" aria-label={i18n('主要貨幣')} onClick={e=>e.stopPropagation()}>
   <div className="picker-handle"/><div className="picker-heading"><b>{i18n('主要貨幣')}</b><button type="button" className="sheet-close-button" aria-label={i18n('關閉選擇面板')} onClick={()=>setShown(false)}><X size={21}/></button></div>
   <div className="picker-options currency-rate-options">{CURRENCIES.map(([code,label])=><button type="button" key={code} className={'picker-option currency-rate-option'+(value===code?' picked':'')} onClick={()=>{onChange(code);setShown(false)}}>
    <span className="currency-rate-option-label">{currencyLabel(code,label)}</span><span className="currency-rate-option-value">{formattedRate(code)}</span>{value===code&&<Check size={19} className="currency-rate-check" aria-hidden="true"/>}
   </button>)}</div>
  </div></div>,document.body)}
 </>;
}
// Compact diary filters: keep the search row single-line on mobile, open the existing selection sheet.
function DiaryFilterIcon({Icon,label,value,defaultValue='all',options,onChange}){
 const [shown,setShown]=useState(false);
 return <>
  <button type="button" className={'diary-filter-icon'+(String(value)!==String(defaultValue)?' is-filtered':'')} title={label} aria-label={label} aria-haspopup="dialog" aria-expanded={shown} onClick={()=>setShown(true)}>
   <Icon size={19}/>{String(value)!==String(defaultValue)&&<span className="diary-filter-indicator" aria-hidden="true"/>}
  </button>
  {shown&&createPortal(<div className="picker-backdrop" onClick={()=>setShown(false)}><div className="picker-sheet" role="dialog" aria-modal="true" aria-label={label} onClick={e=>e.stopPropagation()}>
   <div className="picker-handle"/><div className="picker-heading"><b>{label}</b><button type="button" className="sheet-close-button" aria-label={i18n('關閉選擇面板')} onClick={()=>setShown(false)}><X size={21}/></button></div>
   <div className="picker-options">{options.map(o=><button type="button" key={o.value} className={'picker-option '+(String(value)===String(o.value)?'picked':'')} onClick={()=>{onChange(o.value);setShown(false)}}><span>{o.label}</span>{String(value)===String(o.value)&&<Check size={19}/>}</button>)}</div>
  </div></div>,document.body)}
 </>;
}
// Palette-aware selection sheet: preserves each theme's original preview colors.
function ThemePreview({colors}){
 return <span className="theme-palette-preview" aria-hidden="true" style={{background:colors[0],borderColor:colors[1]}}>
  <i style={{background:colors[1]}}/><i style={{background:colors[2]}}/>
 </span>;
}
function ThemePicker({value,onChange}){
 const [shown,setShown]=useState(false);
 const current=themeChoices.find(item=>item.id===value)||themeChoices[0];
 return <>
  <button type="button" className="smart-select theme-picker compact theme-picker-trigger" aria-haspopup="dialog" aria-expanded={shown} aria-label={i18n("選擇外觀主題")} onClick={()=>setShown(true)}>
   <ThemePreview colors={current.colors}/><span>{i18n(current.name)}</span><ChevronRight size={18}/>
  </button>
  {shown&&createPortal(<div className="picker-backdrop theme-preview-backdrop" onClick={()=>setShown(false)}>
   <div className="picker-sheet theme-preview-sheet" role="dialog" aria-modal="true" aria-label={i18n("選擇外觀主題")} onClick={e=>e.stopPropagation()}>
    <div className="picker-handle"/>
    <div className="picker-heading"><b>{i18n("選擇外觀主題")}</b><button type="button" aria-label={i18n("關閉選擇面板")} onClick={()=>setShown(false)}><X size={21}/></button></div>
    <div className="picker-options theme-preview-options">
     {themeChoices.map(item=><button type="button" key={item.id} className={'picker-option theme-preview-option'+(value===item.id?' picked':'')} aria-pressed={value===item.id} onClick={()=>{onChange(item.id);setShown(false)}}>
       <ThemePreview colors={item.colors}/><span>{i18n(item.name)}</span>{value===item.id&&<Check size={19}/>}
     </button>)}
    </div>
   </div>
  </div>,document.body)}
 </>;
}
function calculate(expression){
 const parts=String(expression).replace(/×/g,'*').replace(/÷/g,'/').match(/(?:\d+\.?\d*|\.\d+)|[+*/-]/g)||[];
 if(!parts.length)return 0;
 let values=[],ops=[];const priority=o=>o==='+'||o==='-'?1:2;
 const apply=()=>{const b=values.pop(),a=values.pop(),o=ops.pop();if(a===undefined||b===undefined)throw Error(i18n("算式不完整"));const n=o==='+'?a+b:o==='-'?a-b:o==='*'?a*b:a/b;if(!Number.isFinite(n))throw Error(i18n("無法除以零"));values.push(n)};
 for(let i=0;i<parts.length;i++){const t=parts[i];if(/^\d|^\./.test(t))values.push(Number(t));else if(t==='-'&&(i===0||/[+*/-]/.test(parts[i-1])))values.push(0),ops.push('-');else{while(ops.length&&priority(ops.at(-1))>=priority(t))apply();ops.push(t)}}while(ops.length)apply();if(values.length!==1)throw Error(i18n("算式有誤"));return Math.round(values[0]*1000000)/1000000;
}
function Calculator(props){return <AmountCalculator {...props}/>;}

// Local PWA application lock: PBKDF2 protects the passphrase verifier. This is
// an interface lock, not encryption of IndexedDB or protection against devtools.
const toHex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const fromHex=hex=>new Uint8Array(hex.match(/.{2}/g).map(x=>parseInt(x,16)));
async function hashAppPassword(password,saltHex=null){
 if(!globalThis.crypto?.subtle)throw Error(i18n("密碼功能需要 HTTPS 或 localhost 的安全環境"));
 const salt=saltHex?fromHex(saltHex):crypto.getRandomValues(new Uint8Array(16));
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},key,256);
 return {salt:toHex(salt),hash:toHex(new Uint8Array(bits)),iterations:250000};
}
async function verifyAppPassword(password,verifier){
 const result=await hashAppPassword(password,verifier.salt);
 const a=fromHex(result.hash),b=fromHex(verifier.hash);
 if(a.length!==b.length)return false;
 let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}

// Built-in six-digit keypad: works in Safari PWA and desktop without relying
// on the browser choosing to show its own password keyboard.
function PinPad({value,onChange,onDone,closeLabel='完成',embedded=false}){
 const add=(digit)=>onChange((value+digit).replace(/\D/g,'').slice(0,6));
 return <div className={'cp-pin-pad'+(embedded?' cp-pin-pad-embedded':'')} role="group" aria-label={i18n("六碼數字鍵盤")}>
   <div className="cp-pin-dots" aria-label={`${i18n("已輸入")} ${value.length} ${i18n("位，共六位")}`}>{Array.from({length:6},(_,i)=><span key={i} className={i<value.length?'filled':''}/>)}</div>
   <div className="cp-pin-grid">{['1','2','3','4','5','6','7','8','9','clear','0','back'].map(k=><button key={k} type="button" className={'cp-pin-key '+(k==='clear'||k==='back'?'cp-pin-key-tool':'')} onClick={()=>k==='clear'?onChange(''):k==='back'?onChange(value.slice(0,-1)):add(k)} aria-label={k==='clear'?i18n("清除全部"):k==='back'?i18n("退格"):k}>{k==='clear'?i18n("清除"):k==='back'?'⌫':k}</button>)}</div>
   {onDone&&<button type="button" className="cp-pin-done" onClick={onDone} disabled={value.length!==6}>{closeLabel}</button>}
 </div>
}
function PinField({label,value,onChange,required=false}){
 const[open,setOpen]=useState(false);
 const root=typeof document==='undefined'?null:document.body;
 return <div className="field cp-pin-field"><span>{label}</span><button type="button" className="cp-pin-field-button" onClick={()=>setOpen(true)} aria-label={`${label}，${i18n("開啟六碼數字鍵盤")}`} aria-haspopup="dialog"><span className="cp-pin-field-digits">{value?'●'.repeat(value.length):'—'}</span><span className="cp-pin-field-action">⌗</span></button>
  {required&&<input className="cp-pin-validation" type="text" value={value} onChange={()=>{}} required readOnly tabIndex={-1} aria-hidden="true"/>}
  {open&&root&&createPortal(<div className="cp-pin-backdrop" onClick={()=>setOpen(false)}><div className="cp-pin-sheet" role="dialog" aria-modal="true" aria-label={`${label} ${i18n("數字鍵盤")}`} onClick={e=>e.stopPropagation()}><div className="picker-handle"/><div className="cp-pin-sheet-title"><strong>{label}</strong><button type="button" onClick={()=>setOpen(false)} aria-label={i18n("關閉數字鍵盤")}><X size={22}/></button></div><PinPad value={value} onChange={onChange} onDone={()=>setOpen(false)}/></div></div>,root)}
 </div>;
}
function AppLockScreen({onUnlock,onSuccess,numeric=false}){
 const [value,setValue]=useState('');const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);const [attempts,setAttempts]=useState(0);
 const [feedback,setFeedback]=useState('');
 const [blockedUntil,setBlockedUntil]=useState(0);
 const inFlight=useRef(false);
 const submit=async e=>{e?.preventDefault();if(inFlight.current||busy||Date.now()<blockedUntil)return;inFlight.current=true;
  setBusy(true);setError('');setFeedback('');try{const ok=await onUnlock(value);
   if(ok){setFeedback('success');await new Promise(resolve=>setTimeout(resolve,400));onSuccess?.();}
   if(!ok){setFeedback('failure');const n=attempts+1;setAttempts(n);setValue('');
    if(n%5===0){setBlockedUntil(Date.now()+30000);setError(i18n("密碼錯誤次數過多，請 30 秒後再試"));}
    else setError(i18n("密碼不正確"));}
  }catch(err){setFeedback('failure');setError(err.message||'解鎖失敗');}finally{inFlight.current=false;setBusy(false)}
 };
 useEffect(()=>{if(numeric&&value.length===6){void submit();}},[numeric,value]);
 return <div className="app-lock-screen"><form className={'app-lock-card'+(feedback?' app-lock-'+feedback:'')} onSubmit={submit}>
  <h1>{i18n('請輸入密碼')}</h1>{numeric?<PinPad embedded value={value} onChange={setValue}/>:<input aria-label={i18n("App 密碼")} type="password" value={value}
   autoComplete="off" autoFocus onChange={e=>setValue(e.target.value)} placeholder={i18n("輸入舊密碼")} required/>}
  {error&&<div className="app-lock-error" role="alert">{error}</div>}
  {!numeric&&<button type="submit" disabled={busy||!value||Date.now()<blockedUntil}>{busy?i18n('驗證中…'):i18n('解鎖')}</button>}
 </form></div>;
}
function AppPasswordSettings({hasPassword,onSet,onRemove,onVerify,numericPassword=false}){
 // Password fields only exist inside the step-by-step modal, never on settings page.
 const [mode,setMode]=useState(''); // enable | change | disable
 const [step,setStep]=useState(''); // verify | new | confirm
 const [old,setOld]=useState(''),[next,setNext]=useState(''),[confirmation,setConfirmation]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const [attempts,setAttempts]=useState(0);
 const inFlight=useRef(false);
 const open=action=>{setMode(action);setStep(action==='enable'?'new':'verify');setOld('');setNext('');setConfirmation('');setBusy(false);setError('');setAttempts(0);};
 const close=()=>{if(inFlight.current)return;setMode('');setOld('');setNext('');setConfirmation('');setError('');};
 const verify=async()=>{
  if(inFlight.current||!old||numericPassword&&old.length!==6)return;
  inFlight.current=true;setBusy(true);setError('');
  try{
   if(!(await onVerify(old))){setAttempts(n=>n+1);setOld('');setError(i18n('目前密碼不正確'));return;}
   if(mode==='disable'){await onRemove(old);closeAfterSuccess();}
   else{setStep('new');setError('');}
  }catch(err){setError(err.message||i18n('密碼驗證失敗'));}
  finally{setBusy(false);inFlight.current=false;}
 };
 const closeAfterSuccess=()=>{setMode('');setOld('');setNext('');setConfirmation('');setError('');};
 const submit=async()=>{
  if(inFlight.current)return;
  if(step==='new'){
   if(!/^[0-9]{6}$/.test(next)){setError(i18n('請設定剛好 6 碼的數字密碼'));return;}
   setConfirmation('');setError('');setStep('confirm');return;
  }
  if(step!=='confirm')return;
  if(!/^[0-9]{6}$/.test(confirmation)){setError(i18n('請設定剛好 6 碼的數字密碼'));return;}
  if(next!==confirmation){setError(i18n('兩次輸入的新密碼不同'));setConfirmation('');return;}
  inFlight.current=true;setBusy(true);setError('');
  try{await onSet(mode==='change'?old:'',next);closeAfterSuccess();}
  catch(err){setError(err.message||i18n('密碼設定失敗'));}
  finally{setBusy(false);inFlight.current=false;}
 };
 const title=step==='verify'?i18n('請輸入原密碼'):step==='new'?i18n('設定 6 碼數字密碼'):i18n('再次輸入新密碼');
 const value=step==='verify'?old:step==='new'?next:confirmation;
 const update=step==='verify'?setOld:step==='new'?setNext:setConfirmation;
 return <section className="glass panel app-password-settings">
  <h2>{i18n('啟用密碼')}</h2>
  <p className="hint">{hasPassword?i18n('已啟用：下次重新開啟 App 需輸入密碼'):i18n('目前未設定：開啟 App 時直接進入')}</p>
  <div className="app-password-actions">
   {hasPassword?<>
    <button type="button" className="primary-btn" onClick={()=>open('change')}>{i18n('變更密碼')}</button>
    <button type="button" className="soft-btn" onClick={()=>open('disable')}>{i18n('停用密碼')}</button>
   </>:<button type="button" className="primary-btn" onClick={()=>open('enable')}>{i18n('啟用密碼')}</button>}
  </div>
  {mode&&createPortal(<div className="app-pin-wizard-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}>
   <div className="app-pin-wizard" role="dialog" aria-modal="true" aria-labelledby="app-pin-wizard-title" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();close();}}}>
    <div className="app-pin-wizard-heading"><h3 id="app-pin-wizard-title">{title}</h3><button type="button" aria-label={i18n('取消')} onClick={close} disabled={busy}><X size={20}/></button></div>
    <p className="app-pin-wizard-subtitle">{mode==='disable'?i18n('驗證成功後將停用密碼'):mode==='change'&&step==='verify'?i18n('請先驗證目前密碼'):step==='confirm'?i18n('請再次輸入相同的六碼密碼'):i18n('請輸入六位數字')}</p>
    {step==='verify'&&!numericPassword?<input className="app-pin-wizard-legacy" type="password" autoComplete="current-password" value={old} autoFocus onChange={e=>{setOld(e.target.value);setError('')}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void verify()}}}/>:<PinPad embedded value={value} onChange={v=>{update(v);setError('')}}/>}
    {error&&<p className="app-lock-error" role="alert">{error}</p>}
    <div className="app-pin-wizard-actions"><button type="button" className="soft-btn" disabled={busy} onClick={close}>{i18n('取消')}</button><button type="button" className="primary-btn" disabled={busy||(step==='verify'?!old||(numericPassword&&old.length!==6):value.length!==6)} onClick={()=>void (step==='verify'?verify():submit())}>{busy?i18n('驗證中…'):step==='verify'?i18n('驗證密碼'):step==='new'?i18n('下一步'):step==='confirm'?i18n('確認設定'):i18n('確認')}</button></div>
   </div>
  </div>,document.body)}
 </section>;
}

export default function App(){
 const {askConfirm,confirmationDialog}=useConfirmDialog();
 const[language,setLanguage]=useState('zh-TW'),[colorScheme,setColorScheme]=useState('normal'),[primaryCurrency,setPrimaryCurrency]=useState('TWD'),[primaryTwdRate,setPrimaryTwdRate]=useState(1),[primaryRateDate,setPrimaryRateDate]=useState(''),[primaryRateLoading,setPrimaryRateLoading]=useState(false);const tr=value=>trText(value,language);setLocale(language);
 const [netWorthGoalTwd,setNetWorthGoalTwd]=useState(null);
 const [currencyMenuRates,setCurrencyMenuRates]=useState({TWD:{rate:1,date:''}});
 const [currencyMenuLoading,setCurrencyMenuLoading]=useState(false);
 const activePrimaryCurrencyRef=useRef('TWD');

 const autoRecurringBusy=useRef(false);
 const [passwordConfig,setPasswordConfig]=useState(null),[unlocked,setUnlocked]=useState(false);
 const lockInitialized=useRef(false);
 const [weekSlideDirection,setWeekSlideDirection]=useState('left');
 const[tab,setTab]=useState('daily'),[records,setRecords]=useState([]),[accounts,setAccounts]=useState([]),[stocks,setStocks]=useState([]),[recurring,setRecurring]=useState([]),[categories,setCategories]=useState(defaultCategories),[categoryIcons,setCategoryIcons]=useState({}),[accountTypes,setAccountTypes]=useState(defaultAccountTypes),[projects,setProjects]=useState([]),[transactionTemplates,setTransactionTemplates]=useState([]),[templateTab,setTemplateTab]=useState(false),[templateName,setTemplateName]=useState(''),[templateEditorId,setTemplateEditorId]=useState(''),[templateNaming,setTemplateNaming]=useState(false),[selectedTemplateId,setSelectedTemplateId]=useState(''),[date,setDate]=useState(today()),[diaryView,setDiaryView]=useState('day'),[theme,setTheme]=useState('folio'),[fontScale,setFontScale]=useState(1),[fabPosition,setFabPosition]=useState('right'),[weekStartsOn,setWeekStartsOn]=useState(0),[ready,setReady]=useState(false),[dialog,setDialog]=useState(''),[editing,setEditing]=useState(null),[notice,setNotice]=useState(''),[filter,setFilter]=useState('all'),[accountFilter,setAccountFilter]=useState('all'),[categoryFlow,setCategoryFlow]=useState('expense'),[query,setQuery]=useState('');const fileInput=useRef(null);const datePickerRef=useRef(null);const monthPickerRef=useRef(null);const weekSwipe=useRef(null);
 // Touch/mouse/pen drag sorting: only the handle captures gestures.
 const dragCategoryRef=useRef(null);
 const [categoryDrag,setCategoryDrag]=useState(null);
 const accountTypeDragRef=useRef(null);
 const [accountTypeDrag,setAccountTypeDrag]=useState(null);
 const [expandedAccountStack,setExpandedAccountStack]=useState(null); // v91: tap again to collapse
 const [accountOrder,setAccountOrder]=useState([]);
 const accountStackDragRef=useRef(null);
 const [accountStackDrag,setAccountStackDrag]=useState(null);
 const [expandedCategoryStack,setExpandedCategoryStack]=useState(null);
 const [selectedStockSymbol,setSelectedStockSymbol]=useState(null);
 const [investSection,setInvestSection]=useState('list'),[investmentAddMenu,setInvestmentAddMenu]=useState(false),[investmentCreate,setInvestmentCreate]=useState(null),[pendingProductCreate,setPendingProductCreate]=useState(null);
 const [investmentAssetDetailOpen,setInvestmentAssetDetailOpen]=useState(false);
 const [investmentBackToListSignal,setInvestmentBackToListSignal]=useState(0);
 const onInvestmentDetailChange=React.useCallback(open=>setInvestmentAssetDetailOpen(open),[]);
 const [investmentValuations,setInvestmentValuations]=useState([]),[investmentFlows,setInvestmentFlows]=useState([]),[investmentProducts,setInvestmentProducts]=useState([]);
 const [investmentCategoryColors,setInvestmentCategoryColors]=useState({});
 const updateInvestmentCategoryColor=async(category,color)=>{if(!/^#[0-9a-f]{6}$/i.test(color))return;const stored=(await db.settings.get('investmentCategoryColors'))?.value||{};const updated={...stored,[category]:color};await db.settings.put({key:'investmentCategoryColors',value:updated});setInvestmentCategoryColors(updated);};
 const [stockTypeStatus,setStockTypeStatus]=useState('');const [catalogAutoName,setCatalogAutoName]=useState('');const [brokerFees,setBrokerFees]=useState({discount:60,minimum:20});
 const [quotes,setQuotes]=useState({});const [quoteLoading,setQuoteLoading]=useState(false);const [quoteStatus,setQuoteStatus]=useState('');
 const quoteRequest=useRef({busy:false,last:0,pendingCodes:new Set()});
 const startupRatesRequested=useRef(false);
 const mainRate=primaryCurrency==='TWD'?1:Number(primaryTwdRate);const baseAvailable=Number.isFinite(mainRate)&&mainRate>0;const crossRateToPrimary=(currency,twdRate)=>{if(currency===primaryCurrency)return 1;if(!baseAvailable)return NaN;const base=currency==='TWD'?1:Number(twdRate);return Number.isFinite(base)&&base>0?base/mainRate:NaN};const formatFxRate=rate=>Number.isFinite(rate)&&rate>0?Number(rate.toPrecision(9)).toLocaleString('zh-TW',{maximumFractionDigits:8}):'匯率尚未取得';const inPrimary=n=>baseAvailable?Number(n)/mainRate:NaN;const fmtPrimary=n=>baseAvailable?renderCurrency(inPrimary(n),primaryCurrency,['JPY','KRW'].includes(primaryCurrency)?0:2):'匯率尚未取得';
 // v53: Currency codes below an entry only identify balances NOT denominated in the primary currency.
 const nonPrimaryCode=currency=>{const c=currency||'TWD';return c===primaryCurrency?'':c};
 const accountCurrencyCode=id=>nonPrimaryCode(accounts.find(a=>a.id===id)?.currency);
 // v54: The account currency label is shown only when different from the primary currency.
 // Per-entry figures remain in their native currency; group totals and net worth retain explicit primary currency.
 const fmtEntryNumber=(amount,account)=>new Intl.NumberFormat('zh-TW',{minimumFractionDigits:0,maximumFractionDigits:precisionFor(account)}).format(Number(amount)||0);
 const fmtPrimaryNumber=n=>baseAvailable?new Intl.NumberFormat('zh-TW',{minimumFractionDigits:0,maximumFractionDigits:['JPY','KRW'].includes(primaryCurrency)?0:2}).format(inPrimary(n)):'匯率尚未取得';
 // v150: Only investment summary figures are rounded. Detailed amounts preserve cents.
 const fmtInvestmentMoney=n=>baseAvailable?new Intl.NumberFormat('zh-TW',{maximumFractionDigits:0,minimumFractionDigits:0}).format(inPrimary(n)):'匯率尚未取得';
 const fmtInvestmentDetail=n=>baseAvailable?new Intl.NumberFormat('zh-TW',{minimumFractionDigits:0,maximumFractionDigits:2}).format(inPrimary(n)):'匯率尚未取得';
 const fmtAccountFigure=(amount,account)=>`${nonPrimaryCode(account?.currency)?nonPrimaryCode(account?.currency)+' ':''}${fmtEntryNumber(amount,account)}`;
 const fmtStockUnit=n=>`${primaryCurrency==='TWD'?'':'TWD '}${new Intl.NumberFormat('zh-TW',{minimumFractionDigits:0,maximumFractionDigits:4}).format(Number(n)||0)}`;
 const fmtStockTradeAmount=n=>`${primaryCurrency==='TWD'?'':'TWD '}${new Intl.NumberFormat('zh-TW',{minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(n)||0)}`;

 const [rateLoading,setRateLoading]=useState(false);const [calculator,setCalculator]=useState(null);const [form,setForm]=useState({});const patch=(key,value)=>setForm(f=>({...f,[key]:value}));
 const [categoryPickerOpen,setCategoryPickerOpen]=useState(false);
 const [categoryPickerMain,setCategoryPickerMain]=useState('');
 const showCategoryPicker=()=>{setCategoryPickerMain(form.mainCategory&&categories[form.type]?.[form.mainCategory]?form.mainCategory:Object.keys(categories[form.type]||{})[0]||'');setCategoryPickerOpen(true)};
 useEffect(()=>{if(!categoryPickerOpen)return;const onKey=e=>{if(e.key==='Escape'){e.preventDefault();setCategoryPickerOpen(false)}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[categoryPickerOpen]);
 useEffect(()=>{if(dialog!=='stock'||form.action==='dividend'||form.feeMode!=='auto')return;
 const calc=estimateStockCharges(form);
 setForm(old=>{
  if(old.feeMode!=='auto')return old;
  const fee=String(calc.fee),tax=String(calc.tax);
  return old.fee===fee&&old.tax===tax?old:{...old,fee,tax};
 });
},[dialog,form.action,form.shares,form.price,form.securityType,form.dayTrade,form.date,form.feeRate,form.feeDiscount,form.feeMinimum,form.feeMode]);
 // ISIN lookup is debounced; it only supplies metadata, never blocks saving a trade.
 useEffect(()=>{
  if(dialog!=='stock')return;
  const code=String(form.symbol||'').trim().toUpperCase();
  if(!/^[0-9A-Z]{4,8}$/.test(code))return;
  let cancelled=false;
  const timer=setTimeout(async()=>{
   try{
    const sec=await lookupSecurity(code);
    if(cancelled)return;
    if(!sec){setStockTypeStatus('官方名冊查無此代號；可手動填入股票名稱與選擇證券類型');return;}
    setForm(f=>{
     if(String(f.symbol||'').trim().toUpperCase()!==code)return f;
     const canFill=!String(f.securityName||'').trim()||f.securityName===catalogAutoName;
     return {...f,...(canFill?{securityName:sec.name}:{}),securityType:sec.kind||f.securityType,dayTrade:sec.kind==='stock'?f.dayTrade:false};
    });
    setCatalogAutoName(sec.name);
    setStockTypeStatus(`已辨識 ${sec.market==='twse'?'上市':'上櫃'}：${sec.name} · ${sec.kind==='bondEtf'?'債券 ETF':sec.kind==='etf'?'ETF':'一般股票'}`);
   }catch(e){if(!cancelled)setStockTypeStatus(`官方名冊暫時無法取得：${e.message}；可自行輸入名稱`);}
  },450);
  return()=>{cancelled=true;clearTimeout(timer)};
 },[dialog,form.symbol]);
 // 只依代號分類，不查詢或填入股票名稱。
 const inferStockType=code=>{
  const result=classifySecurity(code);
  setStockTypeStatus(result.message);
  if(result.type)setForm(f=>({...f,securityType:result.type,dayTrade:result.type==='stock'?f.dayTrade:false}));
 };
 const saveBrokerFees=async()=>{
  const discount=Number(form.feeDiscount),minimum=Number(form.feeMinimum);
  if(!Number.isFinite(discount)||discount<0||discount>100||!Number.isFinite(minimum)||minimum<0)throw Error(i18n("折扣須介於 0～100%，最低手續費不得為負數"));
  await db.settings.put({key:'stockBrokerFees',value:{discount,minimum}});
  setBrokerFees({discount,minimum});toast(i18n("券商手續費設定已儲存"));
 };
 const refreshQuotes=async({force=false,codesOverride=[]}={})=>{
  if(isDemoMode){setQuoteStatus(i18n('演示報價為虛構資料'));return;}
  const codes=new Set([...holdings(stocks).map(h=>String(h.symbol||'').trim().toUpperCase()),...accounts.filter(a=>a.type==='trust').map(a=>String(a.trustSymbol||'').trim().toUpperCase()),...codesOverride.map(code=>String(code||'').trim().toUpperCase())].filter(Boolean));
  if(!codes.size){setQuoteStatus('目前沒有持股需要更新');return;}
  if(quoteRequest.current.busy){
   if(force)codes.forEach(code=>quoteRequest.current.pendingCodes.add(code));
   return;
  }
  // Switching rapidly between tabs must not repeatedly download the entire market.
  if(!force&&Date.now()-quoteRequest.current.last<5*60*1000)return;
  quoteRequest.current.busy=true;setQuoteLoading(true);
  setQuoteStatus('正在讀取上市與上櫃收盤價…');
  try{
   const urls=import.meta.env.DEV
    ?['/api/quotes/twse','/api/quotes/tpex']
    :[`${import.meta.env.BASE_URL}market-quotes.json`];
   let publishedMarkets={};
   const results=await Promise.allSettled(urls.map(async url=>{
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),18000);
    try{
     const response=await fetch(`${url}${url.includes('?')?'&':'?'}_=${Date.now()}`,{cache:'no-store',signal:controller.signal});
     if(!response.ok)throw Error(`${url}: HTTP ${response.status}（請確認 GitHub Actions 已產生 public/market-quotes.json 並重新部署完整專案）`);
     const json=await response.json();
     if(!import.meta.env.DEV)publishedMarkets=quoteMarketStatus(json);
     return import.meta.env.DEV
      ?normalizeQuoteRows(json,url.includes('twse')?'twse':'tpex')
      :validateQuoteBundle(json);
    }finally{clearTimeout(timer)}
   }));
   const got={},errors=[];
   for(const r of results){
    if(r.status==='rejected'){errors.push(r.reason?.message||'資料來源讀取失敗');continue;}
    for(const [code,q] of Object.entries(r.value)){
     if(!codes.has(code))continue;
     if(!got[code]||q.date>got[code].date)got[code]=q;
    }
   }
   // Read persisted quotes right before merge: avoids overwriting newer app state.
   const previous=(await db.settings.get('stockClosingQuotes'))?.value||{};
   const merged={...previous};let updated=0;
   for(const [code,q] of Object.entries(got)){
    if(!merged[code]||!merged[code].date||q.date>=merged[code].date){merged[code]=q;updated++;}
   }
   if(updated){await db.settings.put({key:'stockClosingQuotes',value:merged});setQuotes(merged);}
   else setQuotes(merged);
   quoteRequest.current.last=Date.now();
   const missing=[...codes].filter(code=>!(Number(merged[code]?.price)>0));
   if(Object.keys(got).length){
    const latest=Object.values(got).map(q=>q.date).sort().at(-1);
    const label=Object.entries(publishedMarkets).map(([market,detail])=>`${market==='twse'?'上市':'上櫃'}${detail.status==='cached'?'沿用舊資料':'已更新'}${detail.date?`（${detail.date}）`:''}`).join('、');
    const unchanged=updated===0?'；本機已有相同或較新的報價':'';
    const unavailable=[...codes].filter(code=>!got[code]);
    setQuoteStatus(`${label||`行情日期 ${latest}`}${unchanged}${unavailable.length?`；${unavailable.length} 檔持股未出現在此次行情檔`:''}${errors.length?`；${errors.join('；')}`:''}`);
   }else{
    setQuoteStatus(`尚未取得持股行情${errors.length?`：${errors.join('；')}`:'（資料未包含持有代號）'}；保留既有報價`);
   }
  }catch(e){setQuoteStatus(`收盤價更新失敗：${e.message}；保留既有報價`);}
  finally{
   quoteRequest.current.busy=false;setQuoteLoading(false);
   if(quoteRequest.current.pendingCodes.size){
    const pending=[...quoteRequest.current.pendingCodes];
    quoteRequest.current.pendingCodes.clear();
    // Fetch a just-saved stock even if startup's earlier refresh was in flight.
    setTimeout(()=>refreshQuotes({force:true,codesOverride:pending}),0);
   }
  }
 };
 const toast=s=>{setNotice(i18n(s));setTimeout(()=>setNotice(''),3300)};
 async function reload(){const[r,a,s,rr,c,t,fs,ci,at,bf,sq,langSetting,colorSetting,baseSetting,baseRateSetting,projectSetting,investHistory,investFlows,investProducts,appLockSetting,fabSetting,accountOrderSetting,netWorthGoalSetting,transactionTemplateSetting,weekStartSetting]=await Promise.all([db.records.toArray(),db.accounts.toArray(),db.stocks.toArray(),db.recurring.toArray(),db.settings.get('categories'),db.settings.get('theme'),db.settings.get('fontScale'),db.settings.get('categoryIcons'),db.settings.get('accountTypes'),db.settings.get('stockBrokerFees'),db.settings.get('stockClosingQuotes'),db.settings.get('language'),db.settings.get('amountColors'),db.settings.get('primaryCurrency'),db.settings.get('primaryTwdRate'),db.settings.get('projects'),db.investmentValuations.toArray(),db.investmentFlows.toArray(),db.investmentProducts.toArray(),db.settings.get('appLock'),db.settings.get('fabPosition'),db.settings.get('accountOrder'),db.settings.get('netWorthGoalTwd'),db.settings.get('transactionTemplates'),db.settings.get('weekStartsOn')]);setWeekStartsOn(weekStartSetting?.value===1?1:0);setTransactionTemplates(normalizeTemplates(transactionTemplateSetting?.value));setNetWorthGoalTwd(Number(netWorthGoalSetting?.value)>0?Number(netWorthGoalSetting.value):null);setAccountOrder(Array.isArray(accountOrderSetting?.value)?accountOrderSetting.value:[]);setFabPosition(fabSetting?.value==='left'?'left':'right');setPasswordConfig(appLockSetting?.value||null);if(!lockInitialized.current){setUnlocked(!appLockSetting?.value);lockInitialized.current=true;}setInvestmentValuations(investHistory);setInvestmentFlows(investFlows);setInvestmentProducts(investProducts);setProjects(projectSetting?.value||[]);setLanguage(langSetting?.value||'zh-TW');setColorScheme(colorSetting?.value||'normal');setPrimaryCurrency(baseSetting?.value||'TWD');setPrimaryTwdRate(Number(baseRateSetting?.value?.rate)||((baseSetting?.value||'TWD')==='TWD'?1:0));setPrimaryRateDate(baseRateSetting?.value?.date||'');setQuotes(sq?.value||{});setBrokerFees(bf?.value||{discount:60,minimum:20});setAccountTypes(ordinaryAccountTypes(at?.value));setRecords(r);setAccounts(a);setStocks(s);setRecurring(rr);setCategories(c?.value||defaultCategories);setTheme(isDemoMode?'dark':(t?.value||'folio'));setFontScale((()=>{const f=Number(fs?.value)||1;return f<=0.96?0.94:f>=1.05?1.14:1})());setCategoryIcons(ci?.value||{});setInvestmentCategoryColors((await db.settings.get('investmentCategoryColors'))?.value||{});}
 useEffect(()=>{ensureInvestmentSchema().then(()=>isDemoMode?initializeDemoOnLaunch():ensureDefaults()).then(reload).then(()=>setReady(true)).catch(e=>toast(e.message))},[]);
 // Every schedule is caught up automatically on startup and on foreground return.
 // IndexedDB transactions enforce exactly-once per schedule/date, including multi-tab races.
 useEffect(()=>{
  if(!ready)return;
  let inactive=false;
  const run=async()=>{
   if(inactive||document.visibilityState==='hidden'||autoRecurringBusy.current)return;
   autoRecurringBusy.current=true;
   try{
    // Process bounded batches to avoid blocking the interface. Large backlogs
    // continue automatically while the app remains visible; never create duplicate occurrences.
    let totalPosted=0,remaining=false,batches=0;
    do {
     const outcome=await runDueRecurring({maximum:200});
     totalPosted+=outcome.posted;
     remaining=outcome.remaining;
     batches++;
     if(inactive||document.visibilityState==='hidden')break;
     if(remaining)await new Promise(resolve=>setTimeout(resolve,100));
    } while(remaining&&batches<20);
    if(inactive)return;
    if(totalPosted){await reload();toast(`${i18n('已自動入帳')} ${totalPosted} ${i18n('筆定期交易')}`);}
    if(remaining)toast('待補入的排程較多，將於下次開啟或回到前景時繼續執行');
   }catch(e){if(!inactive)toast('自動排程失敗：'+e.message)}
   finally{autoRecurringBusy.current=false;}
  };
  void run();
  document.addEventListener('visibilitychange',run);
  window.addEventListener('focus',run);
  return()=>{inactive=true;document.removeEventListener('visibilitychange',run);window.removeEventListener('focus',run)};
 },[ready]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;document.documentElement.style.setProperty('--app-font-scale',String(fontScale));},[theme,fontScale]);
 // On app launch, silently refresh the official securities catalog (at most once daily).
 // UI stays responsive and the IndexedDB catalog remains usable without internet.
 useEffect(()=>{if(!ready)return;refreshSecurityCatalog().catch(e=>console.info('已保留本機股票名冊：',e.message));},[ready]);
 // Refresh official closing prices on startup when there are holdings, not only after
 // opening the Stock tab. Existing five-minute throttle prevents repeated downloads.
 // Launch refresh uses the existing official quotes pipeline; no history is fabricated.
 useEffect(()=>{if(ready&&(holdings(stocks).length||accounts.some(a=>a.type==='trust')))refreshQuotes();},[ready,tab,stocks,accounts]);
 // Settings currency choices display the latest available Frankfurter close (not an intraday quote).
 // Refresh once on entering settings. On failure retain the last successfully fetched values.
 useEffect(()=>{
  if(!ready||tab!=='settings')return;
  const controller=new AbortController();
  let active=true;
  setCurrencyMenuLoading(true);
  (async()=>{
   const codes=CURRENCIES.map(([code])=>code).filter(code=>code!=='TWD');
   const results=await Promise.allSettled(codes.map(async currency=>{
    const res=await fetch(`https://api.frankfurter.dev/v2/rate/${encodeURIComponent(currency)}/TWD`,{cache:'no-store',signal:controller.signal});
    if(!res.ok)throw Error(`HTTP ${res.status}`);
    const value=await res.json();
    const rate=Number(value.rate),date=String(value.date||'');
    if(!(rate>0)||!Number.isFinite(rate)||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('匯率資料無效');
    return {currency,rate,date};
   }));
   if(!active)return;
   setCurrencyMenuRates(previous=>{
    const next={...previous};
    results.forEach(result=>{if(result.status==='fulfilled'){
     const {currency,rate,date}=result.value;
     if(!next[currency]?.date||date>=next[currency].date)next[currency]={rate,date};
    }});
    return next;
   });
  })().catch(e=>{if(active)console.info('貨幣選單匯率暫不可用：',e.message)})
   .finally(()=>{if(active)setCurrencyMenuLoading(false)});
  return()=>{active=false;controller.abort()};
 },[ready,tab,primaryCurrency]);
 // v153: update the exchange rates actually used by existing accounts and the
 // configured primary currency when the app opens. Keep last good values offline.
 useEffect(()=>{
  if(!ready||startupRatesRequested.current)return;
  startupRatesRequested.current=true;
  const currencies=[...new Set([...accounts.map(a=>a.currency||'TWD'),...investmentProducts.map(p=>p.currency||'TWD'),primaryCurrency].filter(c=>c&&c!=='TWD'))];
  if(!currencies.length)return;
  let cancelled=false;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),14000);
  (async()=>{
   const results=await Promise.allSettled(currencies.map(async currency=>{
    const res=await fetch(`https://api.frankfurter.dev/v2/rate/${encodeURIComponent(currency)}/TWD`,{cache:'no-store',signal:controller.signal});
    if(!res.ok)throw Error(`匯率 ${currency}: HTTP ${res.status}`);
    const data=await res.json();
    const rate=Number(data.rate);
    if(!Number.isFinite(rate)||rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(String(data.date||'')))throw Error(`匯率 ${currency} 格式錯誤`);
    return {currency,rate,date:data.date};
   }));
   if(cancelled)return;
   const valid=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
   const previousPrimary=(await db.settings.get('primaryTwdRate'))?.value;
   // Ignore older feeds: otherwise an older quote can replace a recent manual refresh.
   const updates=valid.filter(r=>{
    if(r.currency===primaryCurrency)return !previousPrimary?.date||r.date>=previousPrimary.date;
    return accounts.some(a=>a.currency===r.currency&&(!a.fxDate||r.date>=a.fxDate))||investmentProducts.some(p=>p.currency===r.currency&&(!p.currentFxDate||r.date>=p.currentFxDate));
   });
   if(cancelled||!updates.length)return;
   const accountRates=new Map(updates.map(x=>[x.currency,x]));
   await db.transaction('rw',db.accounts,db.settings,db.investmentProducts,async()=>{
    for(const a of accounts){
     const r=accountRates.get(a.currency);
     if(r&&(!a.fxDate||r.date>=a.fxDate))await db.accounts.update(a.id,{fxRate:r.rate,fxDate:r.date,fxSource:'Frankfurter'});
    }
    for(const p of investmentProducts){const r=accountRates.get(p.currency);if(r&&(!p.currentFxDate||r.date>=p.currentFxDate))await db.investmentProducts.update(p.id,{currentFxRate:r.rate,currentFxDate:r.date});}
    const current=accountRates.get(primaryCurrency);
    if(current)await db.settings.put({key:'primaryTwdRate',value:{rate:current.rate,date:current.date,source:'Frankfurter'}});
   });
   if(cancelled)return;
   setAccounts(old=>old.map(a=>{const r=accountRates.get(a.currency);return r&&(!a.fxDate||r.date>=a.fxDate)?{...a,fxRate:r.rate,fxDate:r.date,fxSource:'Frankfurter'}:a}));
   setInvestmentProducts(old=>old.map(p=>{const r=accountRates.get(p.currency);return r&&(!p.currentFxDate||r.date>=p.currentFxDate)?{...p,currentFxRate:r.rate,currentFxDate:r.date}:p}));
   const primary=accountRates.get(primaryCurrency);
   if(primary){setPrimaryTwdRate(primary.rate);setPrimaryRateDate(primary.date)}
   const failures=results.filter(r=>r.status==='rejected');
   if(failures.length)console.info(`部分匯率更新失敗 (${failures.length}/${results.length})，保留快取`);
  })().catch(e=>console.info('啟動匯率更新失敗，保留本機匯率：',e.message)).finally(()=>clearTimeout(timer));
  return()=>{cancelled=true;controller.abort();clearTimeout(timer)};
 },[ready]);
 // v146: first level follows the account-type order; second level follows
 // persisted account IDs. New/unsorted accounts fall back to natural name order.
 const accountNameCollator=new Intl.Collator('zh-Hant-TW',{numeric:true,sensitivity:'base'});
 const accountTypePositions=new Map(accountTypes.map((t,index)=>[t.id,index]));
 const accountPositions=new Map(accountOrder.map((id,index)=>[id,index]));
 const compareAccountNames=(a,b)=>accountNameCollator.compare(String(a.name||''),String(b.name||''))||String(a.id||'').localeCompare(String(b.id||''));
 const compareAccountsWithinType=(a,b)=>{
  const aPos=accountPositions.get(a.id),bPos=accountPositions.get(b.id);
  if(aPos!==undefined&&bPos!==undefined)return aPos-bPos;
  if(aPos!==undefined)return -1;
  if(bPos!==undefined)return 1;
  return compareAccountNames(a,b);
 };
 const transactionAccountOptions=accounts.filter(a=>!['trust','policy'].includes(a.type)).slice().sort((a,b)=>
  (accountTypePositions.get(a.type)??9999)-(accountTypePositions.get(b.type)??9999)||
  compareAccountsWithinType(a,b)
 );
 const transactionAccountChoices=transactionAccountOptions.map(a=><option key={a.id} value={a.id}>{a.name}</option>);
 const open=(kind,item=null,investmentSource=null)=>{setInvestmentCreate(kind==='account'&&!item&&['trust','policy'].includes(investmentSource)?investmentSource:null);setEditing(item);if(kind==='transaction'){setSelectedTemplateId('');setTemplateTab(false);setTemplateName('');setTemplateEditorId('');setTemplateNaming(false);}const eligibleAccounts=accounts.filter(a=>!['trust','policy'].includes(a.type));const preferredAccount=eligibleAccounts.find(a=>a.isDefault===true)||eligibleAccounts[0];const alternativeAccount=eligibleAccounts.find(a=>a.id!==preferredAccount?.id);const base={date:date,type:'expense',amount:'',account:preferredAccount?.id||'',fromAccount:preferredAccount?.id||'',toAccount:alternativeAccount?.id||preferredAccount?.id||'',mainCategory:Object.keys(categories.expense)[0]||'',subCategory:(categories.expense[Object.keys(categories.expense)[0]]||[])[0]||'',note:'',name:'',projectId:'',includeInAssets:true,isDefault:false,openingBalance:'0',investmentCost:'',trustSymbol:'',trustShares:'',policyValue:'',policyValueDate:today(),currency:'TWD',decimalPlaces:2,fxRate:1,fxDate:'',fxSource:'',symbol:'',securityName:'',matchedBuyId:'',action:'buy',shares:'',price:'',fee:'0',tax:'0',securityType:'stock',dayTrade:false,feeRate:'0.1425',feeDiscount:String(brokerFees.discount),feeMinimum:String(brokerFees.minimum),feeMode:'auto',freq:'monthly',nextDate:today(),parent:'',categoryType:'expense',mode:'main',icon:'tags'};const initial=item?{...base,...item,...(item.type==='trust'?{trustShares:String(initialTrustShares(item))}:{}),decimalPlaces:item.decimalPlaces??precisionFor(item),amount:item.amount??'',openingBalance:item.openingBalance??0}:{...base,isDefault:kind==='account'&&!eligibleAccounts.length,type:kind==='account'?(investmentSource||accountTypes.find(t=>!['trust','policy'].includes(t.id))?.id||'bank'):'expense',...(kind==='transaction'?{date}:{} )};if(kind==='stock'){initial.feeMode='auto';setStockTypeStatus('');setCatalogAutoName('');if(item){initial.feeDiscount=String(brokerFees.discount);initial.feeMinimum=String(brokerFees.minimum)}}if(kind==='accountType'||kind==='project'){initial.name=item?.name||'';initial.id=item?.id||'';if(kind==='accountType')initial.assetGroup=item?assetGroupForType(item.id,accountTypes):'other'}if(kind==='category'){const flow=initial.categoryType||'expense';const key=initial.mode==='sub'?`${flow}/sub/${initial.parent}/${initial.name}`:`${flow}/main/${initial.name}`;initial.icon=categoryIcons[key]||suggestedIcon(initial.name||initial.parent||'')}if(kind==='recurring'&&initial.type==='transfer'){initial.mainCategory='帳戶互轉';initial.subCategory='內部轉帳'}setForm(initial);setDialog(kind);if(kind==='transaction'&&!item){setCalculator({field:'amount',value:''})}};
 const openBalanceAudit=(account,entry=null)=>{
  if(!account||['trust','policy'].includes(account.type))return;
  // Exclude this record when editing it; otherwise the prior difference would be applied twice.
  const prior=entry&&isBalanceAudit(entry)?Number(entry.amount)||0:0;
  const current=accountBalance(account,records,stocks,investmentFlows)-prior;
  setEditing(entry&&isBalanceAudit(entry)?entry:null);
  setForm({account:account.id,date:entry?.date||today(),actualBalance:String(Math.round((current+prior)*10**precisionFor(account))/10**precisionFor(account)),note:entry?.auditNote||'',type:'adjustment'});
  setDialog('balanceAudit');
 };
 const close=()=>{setCategoryPickerOpen(false);setTemplateTab(false);setTemplateNaming(false);setDialog('');setEditing(null);setInvestmentCreate(null)};
 const saveTransactionTemplate=async template=>{
  const next=template.id?transactionTemplates.map(t=>t.id===template.id?template:t):[...transactionTemplates,{...template,id:uid()}];
  await db.settings.put({key:'transactionTemplates',value:next});setTransactionTemplates(next);
  toast(i18n('交易範本已儲存'));
 };
 const deleteTransactionTemplate=async id=>{
  const next=transactionTemplates.filter(t=>t.id!==id);
  await db.settings.put({key:'transactionTemplates',value:next});setTransactionTemplates(next);
  if(selectedTemplateId===id)setSelectedTemplateId('');toast(i18n('交易範本已刪除'));
 };
 const applyTemplate=template=>{
  setForm(f=>applyTransactionTemplate(f,template,accounts,categories,projects));
  setSelectedTemplateId(template.id);setTemplateEditorId('');setTemplateNaming(false);
  setTemplateTab(false);setCalculator(null);
 };
 const prepareTemplateEdit=template=>{
  setForm(f=>applyTransactionTemplate(f,template,accounts,categories,projects));
  setSelectedTemplateId(template.id);setTemplateEditorId(template.id);
  setTemplateName(template.name);setTemplateNaming(false);
  setTemplateTab(false);setCalculator(null);
 };
 const checkTemplateFields=()=>{
  // Match ordinary transaction validation before asking the user to name a template.
  const amountString=String(form.amount??'').trim();
  const amount=Number(amountString);
  if(!amountString||!Number.isFinite(amount)||amount<=0)return i18n('請先輸入有效且大於零的金額');
  if(!form.date||!/^\d{4}-\d{2}-\d{2}$/.test(form.date))return i18n('請選擇交易日期');
  const eligible=accounts.filter(a=>!['trust','policy'].includes(a.type));
  let used=[];
  if(form.type==='transfer'){
   const from=eligible.find(a=>a.id===form.fromAccount),to=eligible.find(a=>a.id===form.toAccount);
   if(!from)return i18n('請選擇有效的轉出帳戶');
   if(!to)return i18n('請選擇有效的轉入帳戶');
   if(from.id===to.id)return i18n('轉出與轉入帳戶不可相同');
   if((from.currency||'TWD')!==(to.currency||'TWD'))return i18n('跨幣別轉帳尚未支援，請分別以支出與收入記錄換匯');
   used=[from,to];
  }else if(form.type==='expense'||form.type==='income'){
   const account=eligible.find(a=>a.id===form.account);
   if(!account)return i18n('請選擇有效的資產帳戶');
   const main=categories[form.type]||{};
   if(!form.mainCategory||!Object.prototype.hasOwnProperty.call(main,form.mainCategory))return i18n('請選擇主分類');
   if(!form.subCategory||!main[form.mainCategory]?.includes(form.subCategory))return i18n('請選擇子分類');
   used=[account];
  }else return i18n('請選擇交易類型');
  if(used.some(a=>!withinPrecision(amount,precisionFor(a))))return i18n('交易金額小數位超過帳戶允許位數');
  if(form.projectId&&!projects.some(p=>p.id===form.projectId))return i18n('所選專案不存在，請重新選擇');
  return '';
 };
 const openTemplateNameDialog=()=>{
  const error=checkTemplateFields();
  if(error){toast(error);return;}
  if(!templateEditorId)setTemplateName('');
  setTemplateNaming(true);
 };
 const persistInlineTemplate=async()=>{
  const error=checkTemplateFields();
  if(error){setTemplateNaming(false);toast(error);return;}
  const name=templateName.trim();
  if(!name){toast(i18n('請輸入範本名稱'));return;}
  if(transactionTemplates.some(t=>t.name===name&&t.id!==templateEditorId)){toast(i18n('範本名稱已存在'));return;}
  try{
   await saveTransactionTemplate({...(templateEditorId?{id:templateEditorId}:{}),name,...templatePayload(form)});
   setTemplateNaming(false);setTemplateEditorId('');setTemplateName('');
  }catch(err){toast(err.message||i18n('範本儲存失敗'));}
 };

 const save=async e=>{e.preventDefault();if(dialog==='transaction'&&templateTab)return;let savedStockSymbol='';try{if(dialog==='transaction'){
   // Do not silently coerce an empty amount into zero, or round an invalid decimal.
   const amountInput=String(form.amount??'').trim();
   const rawAmount=Number(amountInput);
   if(!amountInput||!Number.isFinite(rawAmount)||rawAmount<=0)throw Error(i18n("請先輸入有效且大於零的金額"));
   const amount=rawAmount;
   if(!form.date||!/^\d{4}-\d{2}-\d{2}$/.test(form.date))throw Error(i18n("請選擇交易日期"));
   if(form.type==='transfer'){
     const from=accounts.find(a=>a.id===form.fromAccount);
     const to=accounts.find(a=>a.id===form.toAccount);
     if(!from)throw Error(i18n("請選擇有效的轉出帳戶"));
     if(!to)throw Error(i18n("請選擇有效的轉入帳戶"));
     if(from.id===to.id)throw Error(i18n("轉出與轉入帳戶不可相同"));
     if((from.currency||'TWD')!==(to.currency||'TWD'))throw Error(i18n("跨幣別轉帳尚未支援，請分別以支出與收入記錄換匯"));
   }else if(form.type==='expense'||form.type==='income'){
     if(!accounts.some(a=>a.id===form.account))throw Error(i18n("請選擇有效的資產帳戶"));
     const mains=categories[form.type]||{};
     if(!form.mainCategory||!Object.prototype.hasOwnProperty.call(mains,form.mainCategory))throw Error(i18n("請選擇主分類"));
     if(!form.subCategory||!Array.isArray(mains[form.mainCategory])||!mains[form.mainCategory].includes(form.subCategory))throw Error(i18n("請選擇子分類"));
   }else throw Error(i18n("請選擇交易類型"));
   const usedAccounts=form.type==='transfer'?[accounts.find(a=>a.id===form.fromAccount),accounts.find(a=>a.id===form.toAccount)]:[accounts.find(a=>a.id===form.account)];
   if(usedAccounts.some(a=>!withinPrecision(amount,precisionFor(a))))throw Error(i18n("交易金額小數位超過帳戶允許位數"));
   if(form.projectId&&!projects.some(p=>p.id===form.projectId))throw Error(i18n("所選專案不存在，請重新選擇"));
   await db.records.put({...form,projectId:form.projectId||'',id:editing?.id||uid(),amount,date:form.date,mainCategory:form.type==='transfer'?'帳戶互轉':form.mainCategory,subCategory:form.type==='transfer'?'內部轉帳':form.subCategory});
 }
 if(dialog==='balanceAudit'){
  const account=accounts.find(a=>a.id===form.account);
  if(!account||['trust','policy'].includes(account.type))throw Error('盤點帳戶不存在或不支援盤點');
  const old=editing&&isBalanceAudit(editing)?editing:null;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(form.date||''))throw Error('請選擇有效日期');
  await db.transaction('rw',db.records,db.accounts,db.stocks,db.investmentFlows,async()=>{
   const [liveAccount,liveRecords,liveStocks,liveFlows]=await Promise.all([
    db.accounts.get(account.id),db.records.toArray(),db.stocks.toArray(),db.investmentFlows.toArray()
   ]);
   if(!liveAccount)throw Error('盤點帳戶已不存在');
   const previous=old?liveRecords.find(r=>r.id===old.id):null;
   if(old&&!previous)throw Error('原盤點紀錄已不存在');
   if(previous&&(!isBalanceAudit(previous)||previous.account!==account.id))throw Error('盤點紀錄關聯錯誤');
   const remaining=previous?liveRecords.filter(r=>r.id!==previous.id):liveRecords;
   const balance=accountBalance(liveAccount,remaining,liveStocks,liveFlows);
   const delta=balanceAuditDelta(form.actualBalance,balance,precisionFor(liveAccount));
   if(delta===0){
    if(previous)await db.records.delete(previous.id);
    return;
   }
   await db.records.put({id:previous?.id||uid(),type:'adjustment',isBalanceAdjustment:true,
    date:form.date,account:account.id,amount:delta,mainCategory:'帳戶校正',subCategory:'餘額校正',
    note:'餘額校正',auditNote:String(form.note||'').trim(),actualBalance:Number(form.actualBalance),
    beforeBalance:balance,updatedAt:new Date().toISOString()});
  });
 }
 if(dialog==='account'){if(!editing&&['trust','policy'].includes(form.type)&&investmentCreate!==form.type)throw Error('持股信託與投資保單請由投資頁新增');if(!isInvestmentAssetType(form.type)&&!accountTypes.some(t=>t.id===form.type))throw Error(i18n("請選擇有效的帳戶類型"));if(!form.name.trim())throw Error(i18n("請輸入帳戶名稱"));const currency=form.currency||'TWD';const balance=Number(form.openingBalance);const fxRate=currency==='TWD'?1:Number(form.fxRate);if(!Number.isFinite(balance)||!Number.isFinite(fxRate)||fxRate<=0)throw Error(i18n("請輸入有效期初餘額及匯率"));const decimalPlaces=Number(form.decimalPlaces);if(!Number.isInteger(decimalPlaces)||decimalPlaces<0||decimalPlaces>6)throw Error(i18n("帳戶小數位數請選擇 0～6"));if(!withinPrecision(balance,decimalPlaces))throw Error(`${i18n('期初餘額最多允許')} ${decimalPlaces} ${i18n('位小數')}`);const investmentType=['trust','policy'].includes(form.type);
 const cost=Number(form.investmentCost),policyValue=Number(form.policyValue),trustShares=Number(form.trustShares);
 if(investmentType&&(!Number.isFinite(cost)||cost<0||String(form.investmentCost).trim()===''))throw Error(i18n("請填寫有效的累計取得成本"));
 if(form.type==='trust'&&(!/^[0-9]{4,6}[A-Z]?$/.test(String(form.trustSymbol||'').trim().toUpperCase())||!Number.isFinite(trustShares)||trustShares<0))throw Error(i18n("請輸入有效的股票代號及初始持有股數（可為 0）"));
 if(form.type==='trust'&&currency!=='TWD')throw Error(i18n("台灣持股信託帳戶請使用 TWD"));
 if(form.type==='policy'&&(!Number.isFinite(policyValue)||policyValue<0||String(form.policyValue).trim()===''))throw Error(i18n("請輸入有效的保單現值"));
 const id=editing?.id||uid();const existing=editing?.id?await db.accounts.get(editing.id):null;
 if(existing&&['trust','policy'].includes(existing.type)){const linked=await db.investmentFlows.where('assetId').equals(id).count();if(linked&&(cost!==Number(existing.investmentCost)||form.type!==existing.type||String(form.trustSymbol||'').toUpperCase()!==String(existing.trustSymbol||'').toUpperCase()||trustShares!==initialTrustShares(existing)))throw Error(i18n("此投資帳戶已有投入或贖回紀錄，初始成本、股票代號及初始股數不可直接修改；請從投資頁記錄資金異動"));}
 await db.transaction('rw',db.accounts,db.investmentValuations,async()=>{
  const setAsDefault=!investmentType&&form.isDefault===true;
  if(setAsDefault){await db.accounts.toCollection().modify(a=>{if(a.id!==id&&a.isDefault)a.isDefault=false;});}
  await db.accounts.put({id,name:form.name.trim(),type:form.type||'bank',openingBalance:investmentType?0:balance,includeInAssets:form.includeInAssets!==false,isDefault:setAsDefault,currency,decimalPlaces,fxRate,fxDate:currency==='TWD'?'':form.fxDate||'',fxSource:currency==='TWD'?'':form.fxSource||'manual',...(investmentType?{investmentCost:cost}:{}),...(form.type==='trust'?{trustSymbol:String(form.trustSymbol||'').trim().toUpperCase(),trustShares}:{}),...(form.type==='policy'?{policyValue,policyValueDate:form.policyValueDate||today()}:{} )});
 if(form.type==='policy'&&(!existing||Number(existing.policyValue)!==policyValue||existing.policyValueDate!==(form.policyValueDate||today())))await db.investmentValuations.add({assetId:id,date:form.policyValueDate||today(),value:policyValue,createdAt:new Date().toISOString()});
 });}
 if(dialog==='accountType'){
  const name=String(form.name||'').trim();
  if(!name)throw Error(i18n("請輸入帳戶類型名稱"));
  if(accountTypes.some(t=>t.name===name&&t.id!==editing?.id))throw Error(i18n("帳戶類型名稱已存在"));
  const id=editing?.id||uid();
  const assetGroup=ASSET_GROUPS.some(g=>g.id===form.assetGroup)?form.assetGroup:'other';
  const next=editing?accountTypes.map(t=>t.id===id?{...t,name,assetGroup}:t):[...accountTypes,{id,name,assetGroup}];
  await db.settings.put({key:'accountTypes',value:next});
 }
 if(dialog==='project'){
  const name=String(form.name||'').trim();
  if(!name)throw Error(i18n("請輸入專案名稱"));
  if(name.length>48)throw Error(i18n("專案名稱不可超過 48 字"));
  if(projects.some(p=>p.name===name&&p.id!==editing?.id))throw Error(i18n("專案名稱已存在"));
  const id=editing?.id||uid();
  const next=editing?projects.map(p=>p.id===id?{...p,name}:p):[...projects,{id,name}];
  await db.settings.put({key:'projects',value:next});
 }
 if(dialog==='stock'){if(accounts.find(a=>a.id===form.account)?.currency!=='TWD'&&accounts.find(a=>a.id===form.account)?.currency)throw Error(i18n("目前股票交割僅支援新台幣帳戶"));if(!form.account)throw Error(i18n("請先新增交割帳戶"));if(!form.symbol.trim())throw Error(i18n("請輸入股票代號"));const action=form.action;const shares=Math.round(Number(form.shares)),price=Number(form.price),fee=estimateStockCharges(form).fee,tax=estimateStockCharges(form).tax,amount=Math.round(Number(form.amount));if(action==='dividend'&&!(amount>0))throw Error(i18n("請輸入股利金額"));if(action!=='dividend'&&(!(shares>0)||!(price>0)||!Number.isFinite(fee)||!Number.isFinite(tax)||fee<0||tax<0))throw Error(i18n("請檢查交易股數、股價及費稅"));
 if(action!=='dividend'&&(!SECURITY_TYPES.some(t=>t.id===(form.securityType||'stock'))||Number(form.feeDiscount)<0||Number(form.feeDiscount)>100||Number(form.feeRate)<0||Number(form.feeMinimum)<0))throw Error(i18n("請檢查證券類型與手續費設定"));
 if(action!=='dividend'&&form.dayTrade&&form.securityType==='stock'&&action==='sell'&&!(await askConfirm({kind:'warning',title:i18n('確認當沖交易資格'),description:i18n('當沖 0.15% 僅適用符合法規的現股當日沖銷，請確認確實符合當沖條件。'),confirmText:i18n('已確認，繼續')})))return;if(action==='sell'){
  const h=holdings(stocks.filter(s=>s.id!==editing?.id)).find(h=>h.symbol===form.symbol.trim().toUpperCase());
  if(!h||h.shares<shares)throw Error(`可賣股數不足：${h?h.shares.toLocaleString('zh-TW'):0} 股`);
  if(!form.matchedBuyId)throw Error(i18n("請先選擇要沖銷的買進紀錄"));
  const lot=buyLotsForSale(stocks,form.symbol.trim(),form.date,editing?.id).find(l=>l.id===form.matchedBuyId);
  if(!lot)throw Error(i18n("所選買進紀錄已無可沖銷股數，請重新選擇"));
  if(shares>Math.floor(lot.remaining))throw Error(`此筆買進最多可沖銷 ${Math.floor(lot.remaining)} 股`);
}
const stockCandidate={id:editing?.id||uid(),date:form.date,action,symbol:form.symbol.trim().toUpperCase(),securityName:String(form.securityName||'').trim(),account:form.account,note:form.note||'',securityType:form.securityType||'stock',dayTrade:!!form.dayTrade,feeRate:Number(form.feeRate??0.1425),feeDiscount:Number(form.feeDiscount??60),feeMinimum:Number(form.feeMinimum??20),feeMode:'auto',shares:action==='dividend'?0:shares,price:action==='dividend'?0:price,fee:action==='dividend'?0:fee,tax:action==='dividend'?0:tax,amount:action==='dividend'?amount:0,totalAmount:action==='dividend'?0:Math.round(shares*price)+(action==='buy'?fee+tax:-fee-tax),matchedBuyId:action==='sell'?(form.matchedBuyId||null):null};
 const before=calculateLots(stocks);
 const after=calculateLots([...stocks.filter(x=>x.id!==editing?.id),stockCandidate]);
 const priorIssues=new Set(before.issues.map(i=>String(i.id)+':'+i.message));
 const newIssues=after.issues.filter(i=>!priorIssues.has(String(i.id)+':'+i.message));
 if(newIssues.length)throw Error('沖銷後股數不一致：'+newIssues[0].message);
 await db.stocks.put(stockCandidate);savedStockSymbol=form.symbol.trim().toUpperCase();}
 if(dialog==='recurring'){
  const amount=Number(form.amount);
  if(!form.name.trim()||!Number.isFinite(amount)||!(amount>0))throw Error(i18n("請完成排程名稱與金額"));
  const relevant=form.type==='transfer'?[accounts.find(a=>a.id===form.fromAccount),accounts.find(a=>a.id===form.toAccount)]:[accounts.find(a=>a.id===form.account)];if(relevant.some(a=>!a||!withinPrecision(amount,precisionFor(a))))throw Error(i18n("排程金額小數位超過帳戶允許位數"));
  const isTransfer=form.type==='transfer', id=editing?.id||uid();
  let updated;
  if(isTransfer){
    if(!form.fromAccount||!form.toAccount)throw Error(i18n("請選擇轉出及轉入帳戶"));
    if(form.fromAccount===form.toAccount)throw Error(i18n("轉出與轉入帳戶不可相同"));
    if(accounts.find(a=>a.id===form.fromAccount)?.currency!==accounts.find(a=>a.id===form.toAccount)?.currency)throw Error(i18n("跨幣別定期轉帳尚未支援"));
    updated={id,name:form.name.trim(),type:'transfer',amount,fromAccount:form.fromAccount,toAccount:form.toAccount,mainCategory:'帳戶互轉',subCategory:'內部轉帳',freq:form.freq,nextDate:form.nextDate};
  }else{
    if(!form.account)throw Error(i18n("請選擇帳戶"));
    const available=categories[form.type]?.[form.mainCategory]||[];
    const subCategory=available.includes(form.subCategory)?form.subCategory:available[0]||'';
    updated={id,name:form.name.trim(),type:form.type,amount,account:form.account,mainCategory:form.mainCategory,subCategory,freq:form.freq,nextDate:form.nextDate};
  }
  await db.transaction('rw',db.recurring,db.records,async()=>{
    // Keep past amounts/dates untouched. Only sync category labels for proven linked records.
    // For legacy entries without recurringId, exact note/name/account/type matches
    // are linked only if the old schedule name is unique.
    if(editing){
      const allSchedules=await db.recurring.toArray();
      const uniqueName=allSchedules.filter(x=>x.name===editing.name).length===1;
      await db.records.toCollection().modify(r=>{
        const linked=r.recurringId===id;
        const legacy=!r.recurringId&&uniqueName&&r.note==='定期交易：'+editing.name&&
          r.type===editing.type&&
          (editing.type==='transfer'?r.fromAccount===editing.fromAccount&&r.toAccount===editing.toAccount:r.account===editing.account);
        if(!linked&&!legacy)return;
        // An existing transaction represents a completed financial event; do not
        // silently change the transaction type or accounts when editing the schedule.
        if(r.type!==updated.type||
           (r.type==='transfer'?(r.fromAccount!==updated.fromAccount||r.toAccount!==updated.toAccount):r.account!==updated.account))return;
        r.mainCategory=updated.mainCategory;
        r.subCategory=updated.subCategory;
        if(legacy)r.recurringId=id;
      });
    }
    await db.recurring.put(updated);
  });
}
 if(dialog==='category'){
  const name=form.name?.trim();if(!name)throw Error(i18n("請輸入分類名稱"));
  const n=structuredClone(categories),flow=editing?.categoryType||form.categoryType;
  const mode=editing?.mode||form.mode;
  const parent=editing?.parent||form.parent;
  const old=editing?.name?.trim();
  if(mode==='main'){
   if(old){if(name!==old&&Object.prototype.hasOwnProperty.call(n[flow],name))throw Error(i18n("主分類名稱已存在"));if(name!==old){const replacement={};for(const [key,subs] of Object.entries(n[flow]))replacement[key===old?name:key]=subs;n[flow]=replacement;}}
   else {if(Object.prototype.hasOwnProperty.call(n[flow],name))throw Error(i18n("主分類名稱已存在"));n[flow][name]=[];}
  }else{
   if(!parent||!n[flow][parent])throw Error(i18n("請選擇所屬主分類"));
   if(n[flow][parent].includes(name)&&name!==old)throw Error(i18n("子分類名稱已存在"));
   if(old){n[flow][parent]=n[flow][parent].map(v=>v===old?name:v)}else n[flow][parent].push(name);
  }
  await db.transaction('rw',db.settings,db.records,db.recurring,async()=>{
   if(old&&name!==old){
    await db.records.where('type').equals(flow).modify(r=>{if(mode==='main'&&r.mainCategory===old)r.mainCategory=name;if(mode==='sub'&&r.mainCategory===parent&&r.subCategory===old)r.subCategory=name});
    await db.recurring.toCollection().modify(r=>{if(r.type!==flow)return;if(mode==='main'&&r.mainCategory===old)r.mainCategory=name;if(mode==='sub'&&r.mainCategory===parent&&r.subCategory===old)r.subCategory=name});
   }
   await db.settings.put({key:'categories',value:n});
   const iconData={...categoryIcons};
   const oldKey=mode==='main'?`${flow}/main/${old}`:`${flow}/sub/${parent}/${old}`;
   const newKey=mode==='main'?`${flow}/main/${name}`:`${flow}/sub/${parent}/${name}`;
   if(old&&oldKey!==newKey)delete iconData[oldKey];
   iconData[newKey]=CATEGORY_ICONS[form.icon]?form.icon:'tags';
   if(mode==='main'&&old&&old!==name){for(const [key,value] of Object.entries(iconData)){const prefix=`${flow}/sub/${old}/`;if(key.startsWith(prefix)){iconData[`${flow}/sub/${name}/${key.slice(prefix.length)}`]=value;delete iconData[key]}}}
   await db.settings.put({key:'categoryIcons',value:iconData});
  });
 }
 await reload();close();toast(i18n("儲存完成"));
 if(savedStockSymbol)void refreshQuotes({force:true,codesOverride:[savedStockSymbol]});
 }catch(err){toast(err.message)}};
 async function reorderAccountType(sourceId,targetId){
  if(!sourceId||!targetId||sourceId===targetId)return;
  try{
   await db.transaction('rw',db.settings,async()=>{
    const setting=await db.settings.get('accountTypes');
    const list=[...ordinaryAccountTypes(setting?.value)];
    const from=list.findIndex(item=>item.id===sourceId);
    const to=list.findIndex(item=>item.id===targetId);
    if(from<0||to<0)throw Error(i18n("帳戶類型清單已變動，請重新排序"));
    const [moving]=list.splice(from,1);
    list.splice(to,0,moving);
    await db.settings.put({key:'accountTypes',value:list});
   });
   await reload();
  }catch(e){toast(e.message)}
 }
 function finishAccountTypeDrag(){accountTypeDragRef.current=null;setAccountTypeDrag(null)}
 function accountTypeDragStart(e,id){
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();e.stopPropagation();
  accountTypeDragRef.current={id,pointerId:e.pointerId,target:null};
  e.currentTarget.setPointerCapture?.(e.pointerId);
  setAccountTypeDrag({id,target:null});
 }
 function accountTypeDragMove(e){
  const drag=accountTypeDragRef.current;
  if(!drag||drag.pointerId!==e.pointerId)return;
  e.preventDefault();
  const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-account-type-sort-row]');
  const target=hit?.dataset.accountTypeId||null;
  if(drag.target!==target){drag.target=target;setAccountTypeDrag({id:drag.id,target})}
 }
 function accountTypeDragEnd(e){
  const drag=accountTypeDragRef.current;
  if(!drag||drag.pointerId!==e.pointerId)return;
  const target=drag.target;finishAccountTypeDrag();
  if(target)void reorderAccountType(drag.id,target);
 }
 function accountTypeDragKey(e,id){
  if(!['ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();
  const index=accountTypes.findIndex(t=>t.id===id);
  const neighbour=accountTypes[index+(e.key==='ArrowUp'?-1:1)];
  if(neighbour)void reorderAccountType(id,neighbour.id);
 }
 // v146: reusable drag handles for My Accounts, with keyboard reordering.
 // Type order stays in accountTypes; account ID order is kept in settings so
 // backups/restores preserve it without altering any transaction references.
 function stopAccountStackDrag(){accountStackDragRef.current=null;setAccountStackDrag(null)}
 function accountStackPointerDown(e,kind,id){
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();e.stopPropagation();
  accountStackDragRef.current={kind,id,pointerId:e.pointerId,target:null};
  e.currentTarget.setPointerCapture?.(e.pointerId);
  setAccountStackDrag({kind,id,target:null});
 }
 function accountStackPointerMove(e){
  const drag=accountStackDragRef.current;
  if(!drag||drag.pointerId!==e.pointerId)return;
  e.preventDefault();
  const match=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-account-sort-kind]');
  const target=match?.dataset.accountSortKind===drag.kind?match.dataset.accountSortId:null;
  if(drag.target!==target){drag.target=target;setAccountStackDrag({kind:drag.kind,id:drag.id,target})}
 }
 function accountStackPointerUp(e){
  const drag=accountStackDragRef.current;
  if(!drag||drag.pointerId!==e.pointerId)return;
  const target=drag.target;
  stopAccountStackDrag();
  if(target&&target!==drag.id)void (drag.kind==='group'?reorderAccountType(drag.id,target):reorderAccountEntry(drag.id,target));
 }
 async function reorderAccountEntry(sourceId,targetId){
  const source=accounts.find(a=>a.id===sourceId),target=accounts.find(a=>a.id===targetId);
  if(!source||!target||source.type!==target.type||source.id===target.id)return;
  try{
   const current=accounts.filter(a=>a.type===source.type).slice().sort(compareAccountsWithinType).map(a=>a.id);
   const from=current.indexOf(sourceId),to=current.indexOf(targetId);
   if(from<0||to<0)return;
   current.splice(from,1);current.splice(to,0,sourceId);
   const revised=[...accountOrder.filter(id=>!current.includes(id)),...current];
   await db.settings.put({key:'accountOrder',value:revised});
   setAccountOrder(revised);
  }catch(err){toast(err.message)}
 }
 function accountStackKey(e,kind,id){
  if(!['ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();e.stopPropagation();
  const list=kind==='group'?accountTypes.filter(t=>accounts.some(a=>a.type===t.id)):
   accounts.filter(a=>a.type===accounts.find(x=>x.id===id)?.type).slice().sort(compareAccountsWithinType);
  const next=list[list.findIndex(a=>a.id===id)+(e.key==='ArrowUp'?-1:1)];
  if(next)void (kind==='group'?reorderAccountType(id,next.id):reorderAccountEntry(id,next.id));
 }
 async function deleteAccountType(type){
  try{
   let deleted=false;
   if(!(await askConfirm({kind:'delete',title:`${i18n('刪除帳戶類型')}「${i18n(type.name)}」？`,description:i18n('刪除後無法直接復原。請確認此類型已沒有帳戶使用。')})))return false;
   await db.transaction('rw',db.accounts,db.settings,async()=>{
    const allAccounts=await db.accounts.toArray();
    const refs=accountTypeRefs(type.id,allAccounts);
    if(refs>0)throw Error(`此帳戶類型仍有 ${refs} 個帳戶使用，請先調整帳戶類型`);
    const row=await db.settings.get('accountTypes');const list=ordinaryAccountTypes(row?.value);
    if(list.length<=1)throw Error(i18n("至少需要保留一個帳戶類型"));
    if(!list.some(t=>t.id===type.id))throw Error(i18n("此帳戶類型已不存在"));

    deleted=true;
    await db.settings.put({key:'accountTypes',value:list.filter(t=>t.id!==type.id)});
   });if(deleted){await reload();return true;}return false;
  }catch(e){toast(e.message);return false;}
 }
 async function deleteProject(project){
  try{
   let deleted=false;
   if(!(await askConfirm({kind:'delete',title:`${i18n('刪除專案')}「${project.name}」？`,description:i18n('刪除後無法直接復原，請確認此專案沒有關聯交易或排程。')})))return false;
   await db.transaction('rw',db.records,db.recurring,db.settings,async()=>{
    const [rr,rs,pr]=await Promise.all([db.records.toArray(),db.recurring.toArray(),db.settings.get('projects')]);
    const refs=projectRefs(project.id,rr,rs);
    if(refs>0)throw Error(`此專案仍被 ${refs} 筆交易／排程使用，請先修改關聯資料`);
    const list=pr?.value||[];
    if(!list.some(p=>p.id===project.id))throw Error(i18n("此專案已不存在"));

    deleted=true;
    await db.settings.put({key:'projects',value:list.filter(p=>p.id!==project.id)});
   });if(deleted){await reload();return true;}return false;
  }catch(e){toast(e.message);return false;}
 }
 async function remove(kind,id){
  if(!kind||!id)return;
  try{
   if(kind==='accounts'){
    if(!(await askConfirm({kind:'delete',title:i18n('刪除此帳戶？'),description:i18n('帳戶刪除後無法直接復原，且將重新檢查所有關聯交易。')})))return;
    await db.transaction('rw',db.accounts,db.records,db.stocks,db.recurring,db.investmentFlows,db.investmentValuations,async()=>{
     const [rr,ss,rs]=await Promise.all([db.records.toArray(),db.stocks.toArray(),db.recurring.toArray()]);
     const refs=accountRefs(id,rr,ss,rs);
     const flows=await db.investmentFlows.toArray();const valuations=await db.investmentValuations.where('assetId').equals(id).count();
     if(flows.some(f=>f.assetId===id||f.sourceAccount===id)||valuations)throw Error(i18n("此帳戶已有投資投入／估值歷史或被指定為投入資金來源，請先處理關聯紀錄"));
     if(refs.total)throw Error(`此帳戶仍有關聯資料：一般／轉帳交易 ${refs.records} 筆、股票交易 ${refs.stocks} 筆、定期排程 ${refs.recurring} 筆，請先處理後再刪除`);

     const deleted=await db.accounts.get(id);
      await db.accounts.delete(id);
      if(deleted?.isDefault){const remaining=(await db.accounts.toArray()).filter(a=>!['trust','policy'].includes(a.type));if(remaining.length&&!remaining.some(a=>a.isDefault)){await db.accounts.update(remaining[0].id,{isDefault:true});}}
     });
   }else if(kind==='stocks'){
    if(!(await askConfirm({kind:'delete',title:i18n('刪除此筆股票交易？'),description:i18n('交易刪除後無法直接復原，相關持股與損益將重新計算。')})))return;
    await db.transaction('rw',db.stocks,async()=>{
     const all=await db.stocks.toArray();
     if(stockBuyRefs(id,all))throw Error(i18n("這筆買進已被賣出交易指定沖銷，請先修改或刪除相關賣出紀錄"));

     await db.stocks.delete(id);
    });
   }else{
    if(!(await askConfirm({kind:'delete',title:i18n(kind==='recurring'?'刪除此定期排程？':'刪除此筆交易？'),description:i18n(kind==='recurring'?'刪除後不再產生新的到期交易；已入帳的歷史紀錄仍會保留。':'這筆紀錄刪除後無法直接復原。')})))return;
    await db[kind].delete(id);
   }
   await reload();close();
  }catch(e){toast(e.message)}
 }
 // 拖曳後將來源分類插入目標分類位置；僅改寫順序，不影響交易 ID 與分類關聯。
 async function reorderCategory(main,sub,targetName,flow){
  if(!targetName || (sub===null?main===targetName:sub===targetName))return;
  try{
   await db.transaction('rw',db.settings,async()=>{
    const row=await db.settings.get('categories');
    const next=structuredClone(row?.value||defaultCategories);
    if(!next[flow])throw Error(i18n("找不到分類資料"));
    if(sub===null){
     const entries=Object.entries(next[flow]);
     const from=entries.findIndex(([key])=>key===main);
     const to=entries.findIndex(([key])=>key===targetName);
     if(from<0||to<0)throw Error(i18n("主分類已變動，請重新操作"));
     const [moving]=entries.splice(from,1);
     entries.splice(to,0,moving);
     next[flow]=Object.fromEntries(entries);
    }else{
     const list=next[flow][main];
     if(!Array.isArray(list))throw Error(i18n("找不到主分類"));
     const from=list.indexOf(sub),to=list.indexOf(targetName);
     if(from<0||to<0)throw Error(i18n("子分類已變動，請重新操作"));
     const [moving]=list.splice(from,1);
     list.splice(to,0,moving);
    }
    await db.settings.put({key:'categories',value:next});
   });
   await reload();
  }catch(e){toast(e.message)}
 }
 function endCategoryDrag(){dragCategoryRef.current=null;setCategoryDrag(null)}
 function categoryHandleDown(e,kind,main,sub){
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();e.stopPropagation();
  dragCategoryRef.current={kind,main,sub,flow:categoryFlow,pointerId:e.pointerId,target:null};
  e.currentTarget.setPointerCapture?.(e.pointerId);
  setCategoryDrag({kind,main,sub,target:null});
 }
 function categoryHandleMove(e){
  const drag=dragCategoryRef.current;
  if(!drag||drag.pointerId!==e.pointerId)return;
  e.preventDefault();
  const row=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-category-sort-row]');
  let target=null;
  if(row?.dataset.categoryKind===drag.kind&&row.dataset.categoryFlow===drag.flow){
   if(drag.kind==='main')target=row.dataset.categoryMain;
   else if(row.dataset.categoryMain===drag.main)target=row.dataset.categorySub;
  }
  if(target!==drag.target){
   drag.target=target;
   setCategoryDrag({kind:drag.kind,main:drag.main,sub:drag.sub,target});
  }
 }
 function categoryHandleUp(e){
  const drag=dragCategoryRef.current;
  if(!drag||drag.pointerId!==e.pointerId)return;
  const target=drag.target;
  endCategoryDrag();
  if(target)void reorderCategory(drag.main,drag.sub,target,drag.flow);
 }
 function categoryHandleKey(e,kind,main,sub){
  if(!['ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();
  const names=kind==='main'?Object.keys(categories[categoryFlow]||{}):(categories[categoryFlow]?.[main]||[]);
  const current=kind==='main'?main:sub;
  const next=names[names.indexOf(current)+(e.key==='ArrowUp'?-1:1)];
  if(next)void reorderCategory(main,sub,next,categoryFlow);
 }
 async function delCategory(main,sub,flow=categoryFlow){
  try{
   let deleted=false;
   if(!(await askConfirm({kind:'delete',title:`${i18n(sub?'刪除子分類':'刪除主分類')}「${i18n(sub||main)}」？`,description:i18n('刪除後無法直接復原，並將確認是否仍有交易使用此分類。')})))return false;
   await db.transaction('rw',db.settings,db.records,db.recurring,db.stocks,async()=>{
    const [rr,rs,ss,catSetting,iconSetting]=await Promise.all([db.records.toArray(),db.recurring.toArray(),db.stocks.toArray(),db.settings.get('categories'),db.settings.get('categoryIcons')]);
    const refs=categoryRefs(flow,main,sub,rr,rs,ss);
    if(refs.total)throw Error(`此${sub?'子':'主'}分類仍被使用：一般交易 ${refs.records} 筆、定期排程 ${refs.recurring} 筆${refs.stocks?', 股票股利 '+refs.stocks+' 筆':''}。請先調整關聯資料`);
    const current=catSetting?.value||defaultCategories;
    if(!Object.prototype.hasOwnProperty.call(current[flow]||{},main)||sub&&!(current[flow][main]||[]).includes(sub))throw Error(i18n("分類已不存在"));

    deleted=true;
    const n=structuredClone(current);
    if(sub)n[flow][main]=n[flow][main].filter(v=>v!==sub);else delete n[flow][main];
    const iconData={...(iconSetting?.value||{})};
    if(sub)delete iconData[`${flow}/sub/${main}/${sub}`];
    else for(const k of Object.keys(iconData))if(k===`${flow}/main/${main}`||k.startsWith(`${flow}/sub/${main}/`))delete iconData[k];
    await db.settings.put({key:'categories',value:n});await db.settings.put({key:'categoryIcons',value:iconData});
   });if(deleted){await reload();return true;}return false;
  }catch(e){toast(e.message);return false;}
 }
 const fxOf=a=>a?.currency==='TWD'||!a?.currency?1:Number(a?.fxRate)||1;
 const toTWD=(amount,accountId)=>Number(amount||0)*fxOf(accounts.find(a=>a.id===accountId));
 const changeCurrency=async currency=>{setForm(f=>({...f,currency,decimalPlaces:['JPY','KRW'].includes(currency)?0:2,fxRate:currency==='TWD'?1:'',fxDate:'',fxSource:''}));if(currency==='TWD')return;await fetchRate(currency)};
 const fetchRate=async currency=>{setRateLoading(true);try{const res=await fetch(`https://api.frankfurter.dev/v2/rate/${encodeURIComponent(currency)}/TWD`,{cache:'no-store'});if(!res.ok)throw Error(i18n('匯率服務回應')+' '+res.status);const data=await res.json();if(!(Number(data.rate)>0))throw Error(i18n("匯率資料無效"));setForm(f=>f.currency===currency?{...f,fxRate:Number(data.rate),fxDate:data.date||'',fxSource:'Frankfurter'}:f);toast(i18n('已更新匯率')+' '+currency+' → TWD')}catch(err){toast(i18n('無法取得匯率，可手動輸入：')+err.message)}finally{setRateLoading(false)}};
 const sellableHoldings=holdings(stocks.filter(x=>x.id!==editing?.id));
 const availableBuyLots=form.action==='sell'&&form.symbol?buyLotsForSale(stocks,form.symbol,form.date||date,editing?.id):[];
 const chosenBuyLot=availableBuyLots.find(l=>l.id===form.matchedBuyId);
 const stockPerformance=useMemo(()=>analyzeStockPerformance(stocks),[stocks]);
 const bal=a=>a.type==='trust'?(Number(quotes[String(a.trustSymbol||'').toUpperCase()]?.price)>0?trustMarketValue(a,investmentFlows.filter(f=>f.assetId===a.id),Number(quotes[String(a.trustSymbol||'').toUpperCase()].price)):0):a.type==='policy'?Number(a.policyValue||0):accountBalance(a,records,stocks,investmentFlows);const includedAccounts=accounts.filter(a=>a.includeInAssets!==false);const includedIds=new Set(includedAccounts.map(a=>a.id));const hs=holdings(stocks);const netHoldings=holdings(stocks.filter(x=>includedIds.has(x.account)));const pricedHs=hs.filter(h=>Number(quotes[h.symbol]?.price)>0);const unpricedHs=hs.filter(h=>!(Number(quotes[h.symbol]?.price)>0));const stockVal=pricedHs.reduce((s,h)=>s+h.shares*Number(quotes[h.symbol].price),0);const stockCost=hs.reduce((s,h)=>s+h.cost,0);const pricedCost=pricedHs.reduce((s,h)=>s+h.cost,0);const netStockVal=netHoldings.reduce((sum,h)=>sum+h.shares*(Number(quotes[h.symbol]?.price)||0),0);const totalNet=includedAccounts.reduce((s,a)=>s+bal(a)*fxOf(a),0)+netStockVal;const netWorthData=computeNetWorth({accounts,records,stocks,investmentFlows,quotes,includedHoldings:netHoldings,accountTypes,investmentProducts});const netWorthHistory=useNetWorthHistory(ready,netWorthData);
 // v65: Investment overview: three category summaries, without tabs.
 // Values are aggregated through the established TWD internal basis; unknown quotes are not valued at cost.
 const investmentOverview=[
  {id:'stocks',title:'股票',count:hs.length,costTwd:stockCost,valueTwd:unpricedHs.length?null:stockVal},
  ...(['trust','policy'].map(type=>{
   const assets=accounts.filter(a=>a.type===type);
   const amounts=assets.map(a=>{
    const {cost,shares}=investmentPosition(a,investmentFlows);
    const quote=quotes[String(a.trustSymbol||'').trim().toUpperCase()];
    const value=type==='trust'?(Number(quote?.price)>0?shares*Number(quote.price):null):(Number(a.policyValue)||0)*fxOf(a);
    return {costTwd:cost*fxOf(a),valueTwd:value};
   });
   return {id:type,title:type==='trust'?'持股信託':'投資保單',count:assets.length,
    costTwd:amounts.reduce((v,a)=>v+a.costTwd,0),
    valueTwd:amounts.some(a=>a.valueTwd===null)?null:amounts.reduce((v,a)=>v+a.valueTwd,0)};
  })),
  ...(['fund','bond','savings','termDeposit'].map(type=>{
   const products=investmentProducts.filter(p=>p.type===type);
   const amounts=products.map(p=>{const pos=investmentProductPosition(p,investmentFlows);const rate=productTwdRate(p);return {costTwd:rate>0?pos.cost*rate:0,valueTwd:pos.units>0&&(!(rate>0)||(type!=='termDeposit'&&!(Number(p.price)>0)))?null:investmentProductValue(p,pos)*(rate>0?rate:0)};});
   return {id:type,title:({fund:'基金',bond:'債券',savings:'儲蓄險',termDeposit:'定存'})[type],count:products.length,costTwd:amounts.reduce((v,p)=>v+p.costTwd,0),valueTwd:amounts.some(p=>!Number.isFinite(p.valueTwd))?null:amounts.reduce((v,p)=>v+p.valueTwd,0)};
  }))
 ];
 const populatedInvestmentOverview=investmentOverview.filter(item=>item.id==='stocks'?stocks.length>0:item.count>0);
 // 股票股利已列入 accountBalance 的 stocks 計算，僅投影到日記帳與收支統計；
 // 不再新增 records，避免帳戶餘額及股利重複計算。股票交易仍是唯一資料來源。
 const dividendDiaryRows=stocks.filter(x=>x.action==='dividend').map(x=>({id:`stock-dividend:${x.id}`,stockId:x.id,isStockDividend:true,date:x.date,type:'income',amount:Number(x.amount)||0,account:x.account,mainCategory:'投資收益',subCategory:'股票股利',note:x.note?.trim()||`${x.symbol} · 股票股利`}));
 // Trading principal is a movement between cash and securities, NOT daily income/expense.
 // Render a virtual ledger entry only; accountBalance continues to rely on stocks once.
 const tradeDiaryRows=stocks.filter(x=>x.action==='buy'||x.action==='sell').map(x=>({
  id:`stock-trade:${x.id}`,stockId:x.id,isStockTrade:true,date:x.date,type:'stock',
  stockAction:x.action,amount:Number(x.totalAmount)||0,account:x.account,
  mainCategory:'股票交易',subCategory:x.action==='buy'?'股票買進':'股票賣出',
  note:`${x.symbol} · ${x.action==='buy'?'買進':'賣出'}${x.securityName?`（${x.securityName}）`:''}`
 }));
 // 投資贖回及投入款使用 investmentFlows 做唯一帳務來源；這裡僅投影到日記帳。
 // 不新增 records，否則會與 accountBalance 中的 flows 重複入帳。
 const projectedInvestmentDiaryRows=investmentDiaryRows(investmentFlows,accounts,investmentProducts);
 const diaryRecords=[...records,...dividendDiaryRows,...tradeDiaryRows,...projectedInvestmentDiaryRows];
 const month=date.slice(0,7);
 const selectedYear=date.slice(0,4);
 const yearTx=diaryRecords.filter(r=>r.date?.startsWith(`${selectedYear}-`));
 const yearOptions=Array.from(new Set([Number(selectedYear),new Date().getFullYear(),...diaryRecords.map(r=>Number(String(r.date||'').slice(0,4))).filter(y=>Number.isInteger(y)&&y>=1900&&y<=2100)])).sort((a,b)=>b-a);
 const monthTx=diaryRecords.filter(r=>r.date?.startsWith(month));
 const monthExpense=monthTx.filter(r=>r.type==='expense').reduce((sum,r)=>sum+toTWD(r.amount,r.account),0);
 const monthIncome=monthTx.filter(r=>r.type==='income').reduce((sum,r)=>sum+toTWD(r.amount,r.account),0);
 const visibleDiaryRecords=diaryView==='year'?yearTx:diaryView==='month'?monthTx:diaryRecords.filter(r=>r.date===date);
  // 搜尋可比對文字及交易金額；金額允許千分位、貨幣符號與空白。
  const searchTerm=query.trim().toLocaleLowerCase();
  const amountSearchTerm=searchTerm.replace(/^(?:nt\$?|twd|ntd|\$|＄)\s*/i,'').replace(/[\s,，$＄\u00a0]/g,'');
  const isAmountQuery=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(amountSearchTerm);
  const matchesDiarySearch=r=>{
    if(!searchTerm)return true;
    const text=`${r.note||''} ${r.mainCategory||''} ${r.subCategory||''} ${r.stockSymbol||''} ${projects.find(p=>p.id===r.projectId)?.name||''}`.toLocaleLowerCase();
    if(text.includes(searchTerm))return true;
    if(!isAmountQuery)return false;
    const amount=Number(r.amount);
    if(!Number.isFinite(amount))return false;
    const numericValue=String(amount);
    const normalizedNeedle=amountSearchTerm.replace(/^\+/,'');
    return numericValue.includes(normalizedNeedle)||
      (amountSearchTerm[0]!=='-'&&Math.abs(amount).toString().includes(normalizedNeedle));
  };
  // Search and selected date range define the current diary list universe.
  // Each menu also respects the *other* facet, so it never offers an option
  // with no matching transaction. 'All' always remains available to clear it.
  const searchableDiaryRecords=visibleDiaryRecords.filter(matchesDiarySearch);
  const diaryFilterOptions=availableDiaryFilters(searchableDiaryRecords,accounts,filter,accountFilter);
  const dayTx=searchableDiaryRecords.filter(r=>
    matchesDiaryType(r,filter)&&matchesDiaryAccount(r,accountFilter,accounts)
  ).sort((a,b)=>{
    const dateOrder=(b.date||'').localeCompare(a.date||'');
    return dateOrder||String(b.id||'').localeCompare(String(a.id||''));
  });
  // Date/search changes can invalidate a previously selected facet. Clear it
  // instead of leaving a hidden selection that makes the diary look empty.
  useEffect(()=>{
    if(filter!=='all'&&!diaryFilterOptions.types.includes(filter))setFilter('all');
    if(accountFilter!=='all'&&!diaryFilterOptions.accounts.some(a=>String(a.id)===String(accountFilter)))setAccountFilter('all');
  },[date,diaryView,query,filter,accountFilter,accounts,records,stocks,investmentFlows]);
 const periodSummaryRecords=filterDiaryByAccount(visibleDiaryRecords,accountFilter,accounts);
 const dayIncome=periodSummaryRecords.filter(r=>r.type==='income').reduce((sum,r)=>sum+toTWD(r.amount,r.account),0);
 const dayExpense=periodSummaryRecords.filter(r=>r.type==='expense').reduce((sum,r)=>sum+toTWD(r.amount,r.account),0);
 const week=useMemo(()=>weekDatesFor(date,weekStartsOn),[date,weekStartsOn]);const shift=n=>{let d=parseDate(date);d.setDate(d.getDate()+n);setDate(iso(d))};const openDatePicker=()=>{const el=datePickerRef.current;if(!el)return;try{if(typeof el.showPicker==='function')el.showPicker();else{el.focus();el.click()}}catch{el.focus();el.click()}};
 const shiftYear=n=>{const y=Number(date.slice(0,4))+n;setDate(`${y}${date.slice(4)}`)};
 const shiftMonth=n=>{const [year,mon]=date.slice(0,7).split('-').map(Number);const d=new Date(year,mon-1+n,1);setDate(iso(d))};const openMonthPicker=()=>{const el=monthPickerRef.current;if(!el)return;try{if(typeof el.showPicker==='function')el.showPicker();else{el.focus();el.click()}}catch{el.focus();el.click()}};
 const onWeekTouchStart=e=>{if(e.touches.length!==1)return;weekSwipe.current={x:e.touches[0].clientX,y:e.touches[0].clientY,time:Date.now()}};
 const onWeekTouchEnd=e=>{const start=weekSwipe.current;weekSwipe.current=null;if(!start||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)<48||Math.abs(dx)<Math.abs(dy)*1.25)return;setWeekSlideDirection(dx<0?'left':'right');shift(dx<0?7:-7)};
 const expenseGroups=Object.entries(monthTx.filter(r=>r.type==='expense').reduce((o,r)=>(o[r.mainCategory]=(o[r.mainCategory]||0)+toTWD(r.amount,r.account),o),{})).map(([name,value])=>({name,value}));const colors=['#627bfa','#b58af7','#ff9f81','#65c7ba','#f4c76c','#ff82ba'];
 const download=async()=>{if(isDemoMode){toast(i18n('演示資料僅供體驗，無法匯出'));return;}
  try{
   const data=await snapshot();
   const name=`NEXPEN_${today()}.json`;
   const file=new File([JSON.stringify(data,null,2)],name,{type:'application/json'});
   const saveDownload=()=>{
    const url=URL.createObjectURL(file);
    const a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
   };
   // Desktop Chrome may support navigator.share but deny permission for file sharing.
   // Use the native share sheet only on iOS; fall back to a direct download on errors.
   const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||
    (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
   if(ios&&navigator.share&&navigator.canShare?.({files:[file]})){
    try{
     await navigator.share({files:[file],title:'NEXPEN 備份'});
     toast(i18n("備份已分享，請確認已儲存到 iCloud Drive"));
     return;
    }catch(err){
     if(err?.name==='AbortError')return; // User cancelled share sheet.
     // Permission denied, NotAllowedError, etc.: download is still available.
     console.warn('分享備份失敗，改用下載：',err);
    }
   }
   saveDownload();
   toast(i18n("已下載備份 JSON；如需 iCloud Drive，請將檔案移至 iCloud Drive"));
  }catch(e){toast('備份失敗：'+(e?.message||String(e)))}
 };
 const importFile=async e=>{if(isDemoMode){toast(i18n('演示模式無法還原個人備份'));e.target.value='';return;}const file=e.target.files[0];e.target.value='';if(!file)return;try{const obj=JSON.parse(await file.text());if(obj?.app!=='cyberpulse-liquid'||![1,2,3].includes(obj.version)||!['records','accounts','stocks','recurring','settings'].every(k=>Array.isArray(obj[k])))throw Error(i18n("備份格式或版本不正確"));if(!(await askConfirm({kind:'restore',title:i18n('還原本機備份？'),subtitle:file.name,description:i18n('還原將覆蓋目前所有本機資料。請先確認已備份現有資料。'),details:`備份時間：${obj.exportedAt?new Date(obj.exportedAt).toLocaleString('zh-TW'):i18n('未記錄')}\n交易 ${obj.records.length} 筆 · 帳戶 ${obj.accounts.length} 個\n股票 ${obj.stocks.length} 筆 · 保單估值 ${(obj.investmentValuations||[]).length} 筆\n定期排程 ${obj.recurring.length} 筆` })))return;await restore(obj);await reload();toast(i18n("備份還原完成"))}catch(err){toast(i18n('匯入失敗：')+err.message)}};
 const chooseLanguage=async value=>{await db.settings.put({key:'language',value});setLanguage(value)};
 const saveNetWorthGoal=async amountTwd=>{const valid=amountTwd===null?null:Number(amountTwd);if(valid!==null&&(!Number.isFinite(valid)||valid<=0))throw Error('目標金額必須大於零');await db.settings.put({key:'netWorthGoalTwd',value:valid});setNetWorthGoalTwd(valid);};
 const chooseColors=async value=>{await db.settings.put({key:'amountColors',value});setColorScheme(value)};
 // Prevent an earlier network request overwriting a newer currency selection.
 activePrimaryCurrencyRef.current=primaryCurrency;
 const changePrimaryCurrency=async value=>{
  if(!CURRENCIES.some(([code])=>code===value))return;
  activePrimaryCurrencyRef.current=value;
  setPrimaryCurrency(value);
  if(value==='TWD'){setPrimaryTwdRate(1);setPrimaryRateDate('');setPrimaryRateLoading(false);await db.settings.put({key:'primaryCurrency',value});return;}
  // Show cached rate only when it belongs to the same selected currency.
  const saved=(await db.settings.get('primaryTwdRate'))?.value;
  if(activePrimaryCurrencyRef.current!==value)return;
  if(saved?.currency===value&&Number(saved.rate)>0){setPrimaryTwdRate(Number(saved.rate));setPrimaryRateDate(saved.date||'')}
  else {setPrimaryTwdRate(0);setPrimaryRateDate('')}
  await db.settings.put({key:'primaryCurrency',value});
  if(activePrimaryCurrencyRef.current===value)await updatePrimaryRate(value);
 };
 const updatePrimaryRate=async currency=>{
  if(currency==='TWD')return;
  setPrimaryRateLoading(true);
  try{
   const res=await fetch(`https://api.frankfurter.dev/v2/rate/${encodeURIComponent(currency)}/TWD`,{cache:'no-store'});
   if(!res.ok)throw Error(`HTTP ${res.status}`);
   const data=await res.json();
   const rate=Number(data.rate),date=String(data.date||'');
   if(!Number.isFinite(rate)||rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error(i18n('無效匯率'));
   setCurrencyMenuRates(old=>({...old,[currency]:!old[currency]?.date||date>=old[currency].date?{rate,date}:old[currency]}));
   // Do not let a slow request from the previous selection replace the current currency.
   if(activePrimaryCurrencyRef.current!==currency)return;
   const stored=(await db.settings.get('primaryTwdRate'))?.value;
   if(activePrimaryCurrencyRef.current!==currency)return;
   if(stored?.currency===currency&&stored.date&&date<stored.date){
    setPrimaryTwdRate(Number(stored.rate));setPrimaryRateDate(stored.date);return;
   }
   await db.settings.put({key:'primaryTwdRate',value:{currency,rate,date,source:'Frankfurter'}});
   if(activePrimaryCurrencyRef.current!==currency)return;
   setPrimaryTwdRate(rate);setPrimaryRateDate(date);
   toast(`${i18n('主要貨幣匯率已更新')}：1 ${currency} = ${rate} TWD (${date})`);
  }catch(e){if(activePrimaryCurrencyRef.current===currency)toast(`${i18n('無法更新主要貨幣匯率')}：${e.message}，${i18n('請連線後重試')}`)}
  finally{if(activePrimaryCurrencyRef.current===currency)setPrimaryRateLoading(false)}
 };
 const chooseTheme=async value=>{if(isDemoMode)return;await db.settings.put({key:'theme',value});setTheme(value)};const toggleTheme=async()=>chooseTheme(theme==='dark'?'light':'dark');const updateFabPosition=async value=>{if(!['left','right'].includes(value))return;await db.settings.put({key:'fabPosition',value});setFabPosition(value)};const chooseWeekStart=async value=>{const next=value===1?1:0;await db.settings.put({key:'weekStartsOn',value:next});setWeekStartsOn(next)};const updateFontScale=async value=>{const n=Number(value)||1;await db.settings.put({key:'fontScale',value:n});setFontScale(n)};
 const verifyLock=async password=>verifyAppPassword(password,passwordConfig);
 const changeLock=async(oldPassword,newPassword)=>{if(passwordConfig&&!(await verifyAppPassword(oldPassword,passwordConfig)))throw Error(i18n("目前密碼不正確"));
  const config={...(await hashAppPassword(newPassword)),kind:'pin6'};await db.settings.put({key:'appLock',value:config});setPasswordConfig(config);toast(i18n("App 密碼已設定，下次開啟需要解鎖"));};
 const removeLock=async oldPassword=>{if(passwordConfig&&!(await verifyAppPassword(oldPassword,passwordConfig)))throw Error(i18n("目前密碼不正確"));
  await db.settings.delete('appLock');setPasswordConfig(null);setUnlocked(true);toast(i18n("已停用 App 密碼"));};
 if(!ready)return <div className="loading">{i18n("載入本機資料庫中…")}</div>;
 if(passwordConfig&&!unlocked)return <AppLockScreen onUnlock={verifyLock} onSuccess={()=>setUnlocked(true)} numeric={passwordConfig.kind==='pin6'}/>;
 return <div className="app-shell" data-fab-position={fabPosition} lang={language} data-color-scheme={colorScheme} style={{'--user-income':colorScheme==='reverse'?'#e75365':'#26ab7d','--user-expense':colorScheme==='reverse'?'#26ab7d':'#e75365'}}><InstallHint language={language}/>{confirmationDialog}<div className="ambient ambient-a"/><div className="ambient ambient-b"/><header className="topbar glass"><div className="brand"><div className="brand-icon"><Wallet size={22}/></div><div><strong>NEX<span>PEN</span></strong><small>LIQUID · PRIVATE LEDGER</small></div></div><div className="top-actions"><span className="offline-pill"><ShieldCheck size={13}/> {i18n("本機資料")}</span><button className="circle-button desktop-theme-toggle" onClick={toggleTheme}>{theme==='light'?<Moon size={20}/>:<Sun size={20}/>}</button></div></header>
 <div className="layout"><aside className="sidebar glass"><div className="side-caption">{i18n("個人財務")}</div>{nav.map(([key,label,Icon])=><button key={key} onClick={()=>setTab(key)} className={'side-link '+(tab===key?'selected':'')}><Icon size={19}/>{tr(label)}</button>)}</aside>
 <main key={tab} className={"main page-enter "+(tab==='daily'?'daily-compact':'')}>{!isDemoMode&&tab==='daily'&&accounts.length===0&&records.length===0&&<section className="demo-welcome"><strong>{i18n('先體驗 NEXPEN 完整功能')}</strong><p>{i18n('不用輸入真實財務資料，也可以使用虛構交易探索所有頁面。')}</p><button type="button" className="demo-entry-button" onClick={()=>switchDemoMode(true)}>{i18n('試用演示資料')}</button></section>}{isDemoMode&&<section className="demo-banner" role="status"><div><strong>{i18n('演示模式')}</strong><small>{i18n('所有金額與交易皆為虛構資料，與個人資料完全隔離。')}</small></div><div className="demo-banner-actions"><button type="button" onClick={()=>switchDemoMode(false)}>{i18n('退出演示')}</button></div></section>}{settingsPages.includes(tab)&&<button className="mobile-back" onClick={()=>setTab(tab==='accountTypes'?'accounts':'settings')}><ChevronLeft size={19}/> {i18n("返回")}{tab==='accountTypes'?i18n("帳戶管理"):i18n("設定")}</button>}{tab!=='daily'&&<div className="page-head"><div><div className="eyebrow">{i18n("你的金錢，你的空間")}</div><h1>{tr(nav.find(n=>n[0]===tab)?.[1])}</h1></div>{tab==='daily'?<span className="page-context">{month.replace('-',' 年 ')} {i18n("月")}</span>:<span className="page-context">{tab==='categories'?i18n("自訂收支分類"):tab==='settings'?i18n("本機資料管理"):tab==='dashboard'?i18n("財務概況"):tab==='stocks'?i18n("投資管理"):tab==='accounts'?i18n("帳戶管理"):tab==='accountTypes'?i18n("類型設定"):tab==='projects'?i18n("專案管理"):i18n("交易設定")}</span>}</div>}
 {tab==='daily'&&<><section className="glass panel calendar-panel">
 <div className="calendar-header">

  <div className={"week-nav "+(diaryView==='month'?'month-nav':diaryView==='year'?'year-nav':'')}>
   <button type="button" className="mini-btn" aria-label={diaryView==='year'?i18n('上一年'):diaryView==='month'?i18n("上一個月"):i18n("上一週")} onClick={()=>diaryView==='year'?shiftYear(-1):diaryView==='month'?shiftMonth(-1):shift(-7)}><ChevronLeft size={20}/></button>
   {diaryView==='year'?<div className="calendar-date-control diary-year-control"><select aria-label={i18n('選擇年份')} value={selectedYear} onChange={e=>setDate(`${e.target.value}${date.slice(4)}`)}>{yearOptions.map(y=><option key={y} value={String(y)}>{y}</option>)}</select></div>:diaryView==='month'?<div className="calendar-date-control"><NativeDatePicker mode="month" value={month} aria-label={i18n("選擇月份")} onChange={e=>{if(e.target.value)setDate(`${e.target.value}-01`)}}/></div>:<div className="calendar-date-control"><NativeDatePicker value={date} aria-label={i18n("選擇日期")} onChange={e=>{if(e.target.value)setDate(e.target.value)}}/></div>}
   <button type="button" className="mini-btn" aria-label={diaryView==='year'?i18n('下一年'):diaryView==='month'?i18n("下一個月"):i18n("下一週")} onClick={()=>diaryView==='year'?shiftYear(1):diaryView==='month'?shiftMonth(1):shift(7)}><ChevronRight size={20}/></button>
  </div>
  <div className="diary-view-switch" role="group" aria-label={i18n("日記帳查詢範圍")}>
   <button type="button" className={diaryView==='day'?'active':''} aria-pressed={diaryView==='day'} onClick={()=>setDiaryView('day')}>{i18n("日")}</button>
   <button type="button" className={diaryView==='month'?'active':''} aria-pressed={diaryView==='month'} onClick={()=>setDiaryView('month')}>{i18n("月")}</button>
   <button type="button" className={diaryView==='year'?'active':''} aria-pressed={diaryView==='year'} onClick={()=>setDiaryView('year')}>{i18n("年")}</button>
  </div>
  <div className="calendar-header-controls"><button type="button" className="soft-btn" onClick={()=>setDate(today())}><CalendarDays size={16}/> {diaryView==='year'?i18n('今年'):diaryView==='month'?i18n("本月"):i18n("今天")}</button></div>
 </div>
 <div className="stats-three diary-finance-summary" aria-label={i18n('收支統計')}><div className="glass stat diary-stat-out"><small>{diaryView==='year'?i18n('本年支出'):diaryView==='month'?tr('本月支出'):tr('當日支出')}</small><strong className="expense"><AnimatedNumber value={fmtPrimaryNumber(dayExpense)}/></strong></div><div className="glass stat diary-stat-in"><small>{diaryView==='year'?i18n('本年收入'):diaryView==='month'?tr('本月收入'):tr('當日收入')}</small><strong className="income"><AnimatedNumber value={fmtPrimaryNumber(dayIncome)}/></strong></div><div className="glass stat diary-stat-net"><small>{diaryView==='year'?i18n('本年淨額'):diaryView==='month'?i18n('本月淨額'):tr('當日淨額')}</small><strong className={dayIncome-dayExpense>=0?'income':'expense'}><AnimatedNumber value={fmtPrimaryNumber(dayIncome-dayExpense)}/></strong></div></div>
 {diaryView==='day'&&<div key={week[0]} className={`week-strip week-strip-slide-${weekSlideDirection}`} role="group" aria-label={i18n("選擇一週中的日期；左右滑動切換週別")} onTouchStart={onWeekTouchStart} onTouchEnd={onWeekTouchEnd}>{week.map((d,i)=><button type="button" key={d} aria-label={`${d} ${weekdayFullLabels[language]?.[parseDate(d).getDay()]||weekdayFullLabels['zh-TW'][parseDate(d).getDay()]}`} aria-pressed={d===date} className={'week-day '+(d===date?'active':'')+(d===today()?' is-today':'')+([0,6].includes(parseDate(d).getDay())?' is-weekend':'')} onClick={()=>setDate(d)}><small>{weekdayLabels[language]?.[parseDate(d).getDay()]||weekdayLabels['zh-TW'][parseDate(d).getDay()]}</small><b>{Number(d.slice(-2))}</b><i className={diaryRecords.some(x=>x.date===d)?'dot visible':'dot'}/></button>)}</div>}
</section><section className="daily-transactions diary-listview" aria-label={i18n("交易明細")}><div className="diary-search-filter"><div className="searchbox"><Search size={17}/><MarqueeInput placeholder={i18n("搜尋備註、分類、金額")} aria-label={i18n("搜尋交易")} value={query} onChange={e=>setQuery(e.target.value)}/></div><DiaryFilterIcon Icon={Tags} label={i18n('交易類型')} value={filter} options={[{value:'all',label:i18n('全部')},...diaryFilterOptions.types.map(type=>({value:type,label:i18n(({expense:'支出',income:'收入',transfer:'轉帳',stock:'股票交易',investment:'投資異動',adjustment:'餘額校正'})[type])}))]} onChange={setFilter}/><DiaryFilterIcon Icon={Wallet} label={accountFilter==='all'?i18n('篩選帳戶'):`${i18n('篩選帳戶')}：${accounts.find(a=>String(a.id)===String(accountFilter))?.name||i18n('未知帳戶')}`} value={accountFilter} options={[{value:'all',label:i18n('全部帳戶')},...diaryFilterOptions.accounts.map(a=>({value:String(a.id),label:a.name}))]} onChange={setAccountFilter}/></div><div className="diary-transaction-list" role="list" aria-label={i18n('交易明細')}>
{dayTx.length?dayTx.map((x,i)=>{
  const account=accounts.find(a=>a.id===x.account);
  const accountLabel=x.type==='transfer'?`${accounts.find(a=>a.id===x.fromAccount)?.name||i18n('未指定轉出帳戶')} → ${accounts.find(a=>a.id===x.toAccount)?.name||i18n('未指定轉入帳戶')}`:(account?.name||i18n('未指定帳戶'));
  const rawTitle=diaryTransactionTitle(x,picker[x.type]);
  const displayTitle=(rawTitle===x.subCategory||rawTitle===x.mainCategory)?i18n(rawTitle):rawTitle;
  const signedAmount=`${x.type==='adjustment'?(Number(x.amount)>=0?'+':'−'):x.type==='expense'||(x.isStockTrade&&x.stockAction==='buy')||(x.isInvestmentFlow&&x.investmentAction==='contribution')?'-':x.type==='income'||(x.isStockTrade&&x.stockAction==='sell')||(x.isInvestmentFlow&&x.investmentAction==='redemption')?'+':''}${fmtAccountFigure(x.type==='adjustment'?Math.abs(Number(x.amount)):x.amount,accounts.find(a=>a.id===(x.type==='transfer'?x.fromAccount:x.account)))}`;
  const Icon=CATEGORY_ICONS[x.isInvestmentFlow?'trend':x.type==='stock'?'trend':x.type==='transfer'?'transfer':categoryIcons[`${x.type}/sub/${x.mainCategory}/${x.subCategory}`]||categoryIcons[`${x.type}/main/${x.mainCategory}`]||suggestedIcon(x.mainCategory||'')]||Tags;
  const editDiaryRow=()=>{if(isBalanceAudit(x)){openBalanceAudit(accounts.find(a=>a.id===x.account),x);return;}if(x.isInvestmentFlow){const f=investmentFlows.find(f=>f.id===x.investmentFlowId);const asset=accounts.find(a=>a.id===f?.assetId);setTab('stocks');setInvestSection(asset?.type==='policy'?'policy':asset?.type==='trust'?'trust':investmentProducts.find(p=>p.id===f?.assetId)?.type||'fund');setSelectedStockSymbol(null);return;}if(x.isStockDividend||x.isStockTrade)open('stock',stocks.find(s=>s.id===x.stockId));else open('transaction',x)};
  const deleteDiaryRow=()=>{if(x.isInvestmentFlow){editDiaryRow();toast('請在投資資產的資金異動紀錄中編輯或刪除此筆交易');return;}remove(x.isStockDividend||x.isStockTrade?'stocks':'records',x.isStockDividend||x.isStockTrade?x.stockId:x.id)};
  return <React.Fragment key={x.id}>
    {diaryView!=='day'&&(i===0||dayTx[i-1].date!==x.date)&&<div className="diary-month-date-heading">{x.date} <small>{weekdayLabels[language]?.[parseDate(x.date).getDay()]||weekdayLabels['zh-TW'][parseDate(x.date).getDay()]}</small></div>}
    <article role="listitem" className={`diary-list-row diary-type-${x.type}`}>
      <SwipeableDiaryRow id={x.id} editLabel={i18n('編輯')} deleteLabel={i18n('刪除')}
        onEdit={editDiaryRow}
        onDelete={deleteDiaryRow}>
      <button type="button" className="diary-list-action" aria-label={`${displayTitle} · ${signedAmount} · ${accountLabel} · ${i18n('編輯')}`} onClick={editDiaryRow}>
        <span className="diary-list-main">
          <span className={'transaction-icon '+x.type}><Icon size={20}/></span>
          <span className="diary-list-name"><b>{displayTitle}</b><small>{x.type==='adjustment'?'帳戶餘額盤點':x.type==='transfer'?i18n('帳戶轉帳'):i18n(x.mainCategory)||picker[x.type]}{x.projectId&&projects.some(p=>p.id===x.projectId)?' · '+projects.find(p=>p.id===x.projectId).name:''}</small></span>
          <span className="diary-list-amount"><strong className={x.type==='adjustment'?(Number(x.amount)>=0?'income':'expense'):x.type==='expense'?'expense':x.type==='income'||(x.isInvestmentFlow&&x.investmentAction==='redemption')?'income':''}>{signedAmount}</strong><small>{accountLabel}</small></span>
          <ChevronRight size={18} className="diary-list-chevron" aria-hidden="true"/>
        </span>
      </button>
      </SwipeableDiaryRow>
    </article>
  </React.Fragment>;
}):<Blank text={diaryView==='year'?i18n('這一年沒有符合條件的交易'):diaryView==='month'?i18n('這個月沒有符合條件的交易'):i18n('這一天沒有符合條件的交易')}/>}
</div></section></>}
 {tab==='dashboard'&&<NetWorthBreakdown data={netWorthData} history={netWorthHistory} goalTwd={netWorthGoalTwd} mainRate={mainRate} onSaveGoal={saveNetWorthGoal} format={n=>baseAvailable?new Intl.NumberFormat('zh-TW',{maximumFractionDigits:0,minimumFractionDigits:0}).format(Math.round(inPrimary(n))):'匯率尚未取得'} language={language} currency={primaryCurrency}/>}
 {tab==='accounts'&&<><div className="hero glass compact-hero"><span>{tr('帳戶資產總額（不含股票）')}</span><strong>{fmtPrimaryNumber(includedAccounts.filter(a=>!isInvestmentAssetType(a.type)).reduce((s,a)=>s+bal(a)*fxOf(a),0))}</strong><small>{i18n("依各帳戶匯率換算為")} {primaryCurrency}{i18n("，僅供估值")}</small></div><section className="accounts-group-section"><div className="section-header account-list-header"><h2>{tr('我的帳戶')}</h2><div className="account-list-toolbar"><button className="soft-btn small" type="button" onClick={()=>setTab('accountTypes')}><Tags size={15}/>{i18n("帳戶類型管理")}</button></div></div>{accounts.length?(()=>{
  const groups=accountTypes.filter(t=>!isInvestmentAssetType(t.id)&&accounts.some(a=>a.type===t.id));
  const current=groups.some(g=>g.id===expandedAccountStack)?expandedAccountStack:null;
  return <div className="account-stack" aria-label={i18n("堆疊帳戶清單")}>{groups.map((group,index)=>{
    const type=group.id,label=group.name,list=accounts.filter(a=>a.type===type).slice().sort(compareAccountsWithinType);
    const converted=list.filter(a=>a.includeInAssets!==false).reduce((sum,a)=>sum+bal(a)*fxOf(a),0);
    const expanded=current===type;
    return <section className={'account-stack-card stack-kind-'+type+(expanded?' is-expanded':'')+(accountStackDrag?.id===type?' account-sort-dragging':'')+(accountStackDrag?.target===type?' account-sort-target':'')} data-account-sort-kind="group" data-account-sort-id={type} style={{'--stack-layer':index}} key={type}>
      <button type="button" className="account-stack-sort-handle" aria-label={`${i18n('拖曳排序帳戶類型')}：${label}`} title={`${i18n('拖曳排序')} ${label}`} onPointerDown={e=>accountStackPointerDown(e,'group',type)} onPointerMove={accountStackPointerMove} onPointerUp={accountStackPointerUp} onPointerCancel={stopAccountStackDrag} onKeyDown={e=>accountStackKey(e,'group',type)}><GripVertical size={19}/></button>
      <button type="button" className="account-stack-peek" aria-expanded={expanded} aria-controls={'account-stack-details-'+type} onClick={()=>setExpandedAccountStack(previous=>previous===type?null:type)}>
        <span className="account-stack-peek-top"><span className={'account-stack-heading-icon type-'+type} aria-hidden="true">{type==='cash'?<Wallet size={21}/>:type==='credit'?<CreditCard size={21}/>:type==='ewallet'?<Smartphone size={21}/>:type==='brokerage'?<ChartNoAxesCombined size={21}/>:type==='trust'?<Layers3 size={21}/>:type==='policy'?<Shield size={21}/>:<Landmark size={21}/>}</span><strong>{i18n(label)}</strong><ChevronRight size={19} className={expanded?'stack-open-chevron':''}/></span>
        <span className="account-stack-peek-bottom"><b>{fmtPrimaryNumber(converted)}</b></span>
      </button>
      <div id={'account-stack-details-'+type} className={"account-stack-details"+(expanded?" is-open":"")} aria-hidden={!expanded} inert={!expanded}><div className="account-stack-details-inner">
        <div className="account-stack-details-heading"><span>{i18n("帳戶明細")}</span><span>{primaryCurrency}</span></div>
        {list.map(a=><div className={'list-row account-row account-sort-row'+(accountStackDrag?.id===a.id?' account-sort-dragging':'')+(accountStackDrag?.target===a.id?' account-sort-target':'')} data-account-sort-kind="account" data-account-sort-id={a.id} key={a.id} role="button" tabIndex={0} onClick={()=>open('account',a)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open('account',a)}}}><button type="button" className="account-entry-sort-handle" aria-label={`${i18n('拖曳排序帳戶')}：${a.name}`} title={`${i18n('拖曳排序')} ${a.name}`} onClick={e=>e.stopPropagation()} onPointerDown={e=>accountStackPointerDown(e,'account',a.id)} onPointerMove={accountStackPointerMove} onPointerUp={accountStackPointerUp} onPointerCancel={stopAccountStackDrag} onKeyDown={e=>accountStackKey(e,'account',a.id)}><GripVertical size={17}/></button><div className="row-main"><b>{a.name}</b>{a.includeInAssets===false&&<small className="asset-excluded-label">{i18n("未計入總資產")}</small>}</div><div className="account-figures"><strong>{fmtAccountFigure(bal(a),a)}</strong>{a.currency&&a.currency!==primaryCurrency&&<small>{baseAvailable?`${formatFxRate(crossRateToPrimary(a.currency,fxOf(a)))} ${primaryCurrency}`:i18n("主要貨幣匯率尚未取得")}</small>}</div><ChevronRight className="faint" size={16}/></div>)}
      </div></div>
    </section>
  })}</div>
})():<Blank text={i18n("尚未建立帳戶")} sub={i18n("新增現金、銀行或信用卡帳戶")}/>}
</section></>}
 {tab==='accountTypes'&&<section className="glass panel account-type-page"><div className="section-header"><div><h2>{i18n("帳戶類型管理")}</h2><p className="hint">{i18n("拖曳把手可調整順序。未被帳戶使用的類型均可刪除，至少須保留一種類型。")}</p></div></div><div className="account-type-list">{accountTypes.map(t=><div className={'account-type-item'+(accountTypeDrag?.id===t.id?' account-type-dragging':'')+(accountTypeDrag?.target===t.id?' account-type-drop-target':'')} data-account-type-sort-row="" data-account-type-id={t.id} key={t.id}><button type="button" className="account-type-drag-handle" title={`${i18n('拖曳排序')} ${i18n(t.name)}`} aria-label={`${i18n('拖曳排序')} ${i18n(t.name)}`} onPointerDown={e=>accountTypeDragStart(e,t.id)} onPointerMove={accountTypeDragMove} onPointerUp={accountTypeDragEnd} onPointerCancel={finishAccountTypeDrag} onKeyDown={e=>accountTypeDragKey(e,t.id)}><GripVertical size={19}/></button><div className="row-main"><b>{i18n(t.name)}</b><span className="account-type-subtitles"><small>{accounts.filter(a=>a.type===t.id).length} {i18n("個帳戶使用")}</small><small>{i18n("資產配置")}：{i18n(ASSET_GROUPS.find(g=>g.id===assetGroupForType(t.id,accountTypes))?.label||'其他資產')}</small></span></div><button type="button" className="type-action" title={`${i18n('修改')} ${i18n(t.name)}`} aria-label={`${i18n('修改')} ${i18n(t.name)}`} onClick={()=>open('accountType',t)}><Edit3 size={18}/></button>{<button type="button" className="type-action delete" title={`${i18n('刪除')} ${i18n(t.name)}`} aria-label={`${i18n('刪除')} ${i18n(t.name)}`} onClick={()=>deleteAccountType(t)}><Trash2 size={18}/></button>}</div>)}</div></section>}
 {tab==='stocks'&&<>
 {investSection==='stocks'&&<div className="investment-product-header investment-legacy-product-header"><button type="button" className="stock-back investment-upper-back investment-nav-back" onClick={()=>{if(selectedStockSymbol){setSelectedStockSymbol(null)}else{setInvestSection('list');setInvestmentAssetDetailOpen(false)}}}><ChevronLeft size={18}/>{i18n(selectedStockSymbol?'返回股票清單':'返回投資總覽')}</button><button type="button" className="soft-btn small" onClick={()=>open('stock')}><Plus size={17}/>{i18n('新增股票交易')}</button></div>}
 {investSection==='list'?<>
  <section className="glass panel investment-combined investment-dashboard" aria-label={i18n("投資分類與績效")}>
   {(()=>{
     const quoteComplete=investmentOverview.every(x=>x.valueTwd!==null);
     const cost=investmentOverview.reduce((sum,x)=>sum+(Number(x.costTwd)||0),0);
     const valuation=quoteComplete?investmentOverview.reduce((sum,x)=>sum+(Number(x.valueTwd)||0),0):null;
     const gain=valuation===null?null:valuation-cost;
     const rate=gain!==null&&cost>0?gain/cost*100:null;
     return <SummaryHero className="investment-dashboard-hero" eyebrow="NEXPEN · PORTFOLIO" title={i18n("投資總覽")} label={i18n("估算現值")} value={valuation===null?i18n("尚無完整報價"):fmtInvestmentMoney(valuation)} detailId="investment-hero-details">
       <div className="summary-hero-metrics">
         <div><small>{i18n("持有成本")}</small><strong>{fmtInvestmentMoney(cost)}</strong></div>
         <div><small>{i18n("未實現損益")}</small><strong className={gain===null?'':gain>=0?'income':'expense'}>{gain===null?'—':`${gain>=0?'+':''}${fmtInvestmentMoney(gain)}`}</strong><em className={gain===null?'':gain>=0?'income':'expense'}>{rate===null?'—':`${rate>=0?'+':''}${rate.toFixed(2)}%`}</em></div>
       </div>
     </SummaryHero>;
   })()}
   <div className="investment-dashboard-section-title"><div><h3>{i18n("投資分類與績效")}</h3><small>{i18n("點選類別查看資產及交易紀錄")}</small></div><span aria-hidden="true">{String(populatedInvestmentOverview.length).padStart(2,"0")}</span></div>
   <div className="investment-combined-list investment-peek-stack investment-reference-stack investment-first-level-stack" role="group" aria-label={i18n("投資分類與績效")}>{populatedInvestmentOverview.length===0&&<p className="hint">尚未建立投資資產，請使用新增投資建立第一筆資料。</p>}{populatedInvestmentOverview.map(item=>{
    const pnl=item.valueTwd===null?null:item.valueTwd-item.costTwd;
    const pct=pnl!==null&&item.costTwd>0?pnl/item.costTwd*100:null;
    const detail={stocks:'股票持股、買賣與股利',trust:'持股信託與追加投入',policy:'投資保單與現值紀錄',fund:'基金申購、贖回與配息',bond:'債券交易、票息與到期日',savings:'保費、解約金與滿期領回',termDeposit:'定存本金、利息與到期領回'}[item.id];
    return <div className={'investment-reference-layer invest-stack-'+item.id} style={{'--peek':categoryColor(item.id,investmentCategoryColors),'--stack-accent':categoryColor(item.id,investmentCategoryColors)}} key={item.id}>
      <button type="button" className="investment-reference-card" style={{'--stack-accent':categoryColor(item.id,investmentCategoryColors)}} onClick={()=>{setInvestSection(item.id);setSelectedStockSymbol(null)}} aria-label={`${i18n(item.title)}，${i18n('目前現值')} ${item.valueTwd===null?i18n('尚無報價'):fmtInvestmentMoney(item.valueTwd)}`}>
       <div className="investment-reference-main">
        <div className="investment-reference-copy"><b>{i18n(item.title)}</b><span className="investment-reference-type">{String(item.count).padStart(2,"0")} {i18n("筆資產")}</span></div>
        <div className="investment-reference-meta">{i18n(detail)} · {item.count} {i18n("筆")}</div>
        <div className="investment-reference-amount" aria-label={`${i18n('目前現值')}、${i18n('未實現損益')}、${i18n('損益百分比')}`}>
         <strong className="investment-reference-net">{item.valueTwd===null?i18n("尚無報價"):fmtInvestmentMoney(item.valueTwd)}</strong>
         <span className="investment-performance-badges investment-reference-badges" aria-label={i18n('未實現損益')}>
          <small className={'investment-reference-profit '+(pnl===null?'':pnl>=0?'income':'expense')}>{pnl===null?'—':`${pnl>=0?'+':''}${fmtInvestmentMoney(pnl)}`}</small>
          <small className={'investment-reference-rate '+(pct===null?'':pct>=0?'income':'expense')}>{pct===null?'—':`${pct>=0?'+':''}${pct.toFixed(2)}%`}</small>
         </span>
        </div>
       </div>
       <div className="investment-reference-footer"><span className="investment-reference-dots" aria-hidden="true"><i/><i/><i/></span></div>
      </button>
    </div>;
   })}</div>
  </section>
 </>:null}
 {investSection==='stocks'&&<StockPerformanceView
   groups={stockPerformance} holdings={hs} quotes={quotes} accounts={accounts} selectedSymbol={selectedStockSymbol}
   onSelect={setSelectedStockSymbol} onBack={()=>setSelectedStockSymbol(null)} onEdit={item=>open('stock',item)}
   fmt={fmtInvestmentDetail} fmtSummary={fmtInvestmentMoney} fmtUnit={fmtStockUnit} fmtTradeNative={fmtStockTradeAmount} language={language} baseAvailable={baseAvailable} nativeStockCurrency={primaryCurrency==='TWD'?'':'TWD'}
   quoteLoading={quoteLoading} onRefresh={()=>refreshQuotes({force:true})} RefreshIcon={RefreshCcw} categoryColors={investmentCategoryColors}
 />}{['trust','policy'].includes(investSection)&&<InvestmentAssets askConfirm={askConfirm} categoryColors={investmentCategoryColors} key={investSection} onBackOverview={()=>{setInvestSection('list');setSelectedStockSymbol(null);setInvestmentAssetDetailOpen(false)}} onDetailChange={onInvestmentDetailChange} backToListSignal={investmentBackToListSignal} type={investSection} items={accounts.filter(a=>a.type===investSection)} valuations={investmentValuations} flows={investmentFlows} cashAccounts={accounts.filter(a=>!['trust','policy'].includes(a.type))} quotes={quotes} primaryCurrency={primaryCurrency} onChanged={reload} onEditAccount={a=>open('account',a)} onCreateAsset={()=>open('account',null,investSection)} />}{['fund','bond','savings','termDeposit'].includes(investSection)&&<InvestmentProducts askConfirm={askConfirm} key={investSection} type={investSection} categoryColors={investmentCategoryColors} onCategoryColorChange={updateInvestmentCategoryColor} items={investmentProducts.filter(p=>p.type===investSection)} flows={investmentFlows} initialCreate={pendingProductCreate===investSection} onCreateHandled={()=>setPendingProductCreate(null)} backToListSignal={investmentBackToListSignal} cashAccounts={accounts.filter(a=>!['trust','policy'].includes(a.type))} primaryCurrency={primaryCurrency} primaryTwdRate={mainRate} onChanged={reload} onDetailChange={onInvestmentDetailChange} onBackOverview={()=>{setInvestSection('list');setInvestmentAssetDetailOpen(false)}} />}</>}

 {tab==='recurring'&&<section className="glass panel"><h2>{i18n("定期交易排程")}</h2>{recurring.length?recurring.map(x=><div className="recurring-row" key={x.id}><div className="list-row" onClick={()=>open('recurring',x)}><div className={'transaction-icon '+x.type}><Repeat2 size={18}/></div><div className="row-main"><b>{x.name}</b><small>{i18n("下次")} {x.nextDate} · {i18n({weekly:'每週',monthly:'每月',yearly:'每年'}[x.freq])}</small></div><div className="recurring-amount"><strong>{fmtAccountFigure(x.amount,accounts.find(a=>a.id===(x.type==='transfer'?x.fromAccount:x.account)))}</strong></div><ChevronRight className="faint" size={16}/></div></div>):<Blank text={i18n("尚未設定定期交易")}/>}</section>}
 {tab==='projects'&&<section className="glass panel project-management-page"><div className="section-header"><div><h2>{i18n("專案管理")}</h2><p className="hint">{i18n("交易可自由指定專案，不選擇也能正常記帳。重新命名不影響歷史交易。")}</p></div></div>{projects.length?<div className="project-management-list">{projects.map(project=><div className="project-management-row" key={project.id}><div className="row-main"><b>{project.name}</b><small>{records.filter(r=>r.projectId===project.id).length} {i18n("筆關聯交易")}</small></div><button type="button" className="type-action" title={`${i18n('修改')} ${project.name}`} aria-label={`${i18n('修改')} ${project.name}`} onClick={()=>open('project',project)}><Edit3 size={18}/></button><button type="button" className="type-action delete" title={`${i18n('刪除')} ${project.name}`} aria-label={`${i18n('刪除')} ${project.name}`} onClick={()=>deleteProject(project)}><Trash2 size={18}/></button></div>)}</div>:<Blank text={i18n("尚未建立專案")} sub={i18n("點擊右下角＋建立專案，之後在新增交易時可選擇")}/>}</section>}
 {tab==='categories'&&<section className="category-section"><div className="section-header category-section-head"><div><h2>{i18n("分類管理")}</h2><p className="hint">{i18n("按住左側拖曳把手調整主分類或子分類順序，放開後自動儲存；也可聚焦把手按方向鍵排序。")}</p></div><div className="segmented"><Pill active={categoryFlow==='expense'} onClick={()=>setCategoryFlow('expense')}>{i18n("支出")}</Pill><Pill active={categoryFlow==='income'} onClick={()=>setCategoryFlow('income')}>{i18n("收入")}</Pill></div></div><div className="category-list category-card-stack">{Object.entries(categories[categoryFlow]).map(([main,subs])=><div className={'category-group category-stack-card'+(expandedCategoryStack===`${categoryFlow}/${main}`?' category-stack-expanded':' category-stack-collapsed')+(categoryDrag?.kind==='main'&&categoryDrag.main===main?' category-dragging':'')+(categoryDrag?.kind==='main'&&categoryDrag.target===main?' category-drop-target':'')} key={main} data-category-sort-row="" data-category-kind="main" data-category-flow={categoryFlow} data-category-main={main}><div className="category-group-head category-stack-peek"><button type="button" className="category-drag-handle" title={i18n("拖曳排序主分類")} aria-label={`${i18n('拖曳排序主分類')} ${main}`} onPointerDown={e=>categoryHandleDown(e,'main',main,null)} onPointerMove={categoryHandleMove} onPointerUp={categoryHandleUp} onPointerCancel={endCategoryDrag} onKeyDown={e=>categoryHandleKey(e,'main',main,null)}><GripVertical size={19}/></button><button type="button" className="category-main-label category-stack-toggle" aria-expanded={expandedCategoryStack===`${categoryFlow}/${main}`} onClick={()=>setExpandedCategoryStack(prev=>prev===`${categoryFlow}/${main}`?null:`${categoryFlow}/${main}`)}>{(()=>{const Icon=CATEGORY_ICONS[categoryIcons[`${categoryFlow}/main/${main}`]||suggestedIcon(main)]||Tags;return <Icon size={20}/>})()}<strong>{i18n(main)}</strong><ChevronRight className={expandedCategoryStack===`${categoryFlow}/${main}`?'stack-open-chevron':''} size={16}/></button><div className="category-tools"><button type="button" className="category-action" title={i18n("修改主分類")} aria-label={`${i18n('修改')} ${main}`} onClick={()=>open('category',{name:main,mode:'main',categoryType:categoryFlow})}><Edit3 size={17}/></button><button type="button" className="category-action delete" title={i18n("刪除主分類")} aria-label={`${i18n('刪除')} ${main}`} onClick={()=>delCategory(main)}><Trash2 size={16}/></button></div></div><div className={"category-subs category-stack-details"+(expandedCategoryStack===`${categoryFlow}/${main}`?" is-open":"")} aria-hidden={expandedCategoryStack!==`${categoryFlow}/${main}`} inert={expandedCategoryStack!==`${categoryFlow}/${main}`}><div className="category-stack-details-inner">{subs.map(sub=><div className={'category-sub'+(categoryDrag?.kind==='sub'&&categoryDrag.main===main&&categoryDrag.sub===sub?' category-dragging':'')+(categoryDrag?.kind==='sub'&&categoryDrag.main===main&&categoryDrag.target===sub?' category-drop-target':'')} key={sub} data-category-sort-row="" data-category-kind="sub" data-category-flow={categoryFlow} data-category-main={main} data-category-sub={sub}><button type="button" className="category-drag-handle" title={i18n("拖曳排序子分類")} aria-label={`${i18n('拖曳排序子分類')} ${sub}`} onPointerDown={e=>categoryHandleDown(e,'sub',main,sub)} onPointerMove={categoryHandleMove} onPointerUp={categoryHandleUp} onPointerCancel={endCategoryDrag} onKeyDown={e=>categoryHandleKey(e,'sub',main,sub)}><GripVertical size={16}/></button>{(()=>{const Icon=CATEGORY_ICONS[categoryIcons[`${categoryFlow}/sub/${main}/${sub}`]||categoryIcons[`${categoryFlow}/main/${main}`]||suggestedIcon(main)]||Tags;return <Icon size={16} className="category-sub-icon"/>})()}<span>{i18n(sub)}</span><div className="category-tools"><button type="button" title={i18n("修改子分類")} aria-label={`${i18n('修改')} ${sub}`} onClick={()=>open('category',{name:sub,mode:'sub',parent:main,categoryType:categoryFlow})}><Edit3 size={15}/></button><button type="button" className="delete" title={i18n("刪除子分類")} aria-label={`${i18n('刪除')} ${sub}`} onClick={()=>delCategory(main,sub)}><X size={16}/></button></div></div>)}<button type="button" className="category-add-sub" onClick={()=>open('category',{name:'',mode:'sub',parent:main,categoryType:categoryFlow})}><Plus size={15}/> {i18n("新增子分類")}</button></div></div></div>)}</div></section>}
 {tab==='settings'&&<><section className="glass panel pwa-version-settings"><h2>{i18n('程式版本與更新')}</h2><p className="hint">{i18n('目前版本')}：{pwaBuildInfo.version} · {pwaBuildInfo.buildId}</p><button type="button" className="action-row" onClick={requestPwaUpdateCheck}><RefreshCcw size={20}/><span><b>{i18n('檢查更新')}</b></span><ChevronRight size={18}/></button></section>{(isDemoMode||accounts.length>0||records.length>0)&&<section className="glass panel demo-entry-panel"><h2>{i18n('功能體驗')}</h2><p className="hint">{i18n('用一套虛構資料試用記帳、帳戶、投資、報表與排程。演示與個人帳本完全分開。')}</p><button type="button" className="demo-entry-button" onClick={()=>switchDemoMode(!isDemoMode)}>{isDemoMode?i18n('返回個人帳本'):i18n('進入演示模式')}</button></section>}<section className="glass panel settings-menu"><h2>{tr('記帳管理')}</h2><p className="hint">{i18n("管理帳戶、定期交易與收支分類")}</p>{[['accounts','帳戶管理','新增與修改銀行、現金、信用卡帳戶',Landmark],['projects','專案管理','建立與管理交易所屬專案',Tags],['recurring','定期交易','管理薪資、訂閱與週期性支出',Repeat2],['categories','分類管理','設定收入、支出主分類與子分類',Tags]].map(([key,label,desc,Icon])=><button className="action-row" key={key} onClick={()=>setTab(key)}><Icon size={20}/><span><b>{i18n(label)}</b><small>{i18n(desc)}</small></span><ChevronRight size={18}/></button>)}</section><section className="glass panel preferences-panel"><h2>{tr('主要貨幣')} / {tr('語言')} / {tr('金額顏色')}</h2>
 <Field label={tr('主要貨幣')}><CurrencyRateSelect value={primaryCurrency} onChange={changePrimaryCurrency} rates={currencyMenuRates} mainRate={mainRate} loading={currencyMenuLoading}/></Field>

 <p className="hint">{i18n("主要貨幣只影響總覽、持股與帳戶分組的換算顯示；帳戶餘額及交易紀錄仍以各自原幣保存。匯率僅供估算。")}</p>
 <Field label={tr('語言')}><SmartSelect value={language} onChange={e=>chooseLanguage(e.target.value)}>{SUPPORTED_LANGUAGES.map(([code,name])=><option key={code} value={code}>{name}</option>)}</SmartSelect></Field>
 <p className="hint">{i18n("介面文字依語言設定切換；使用者自行建立的帳戶、分類、專案及備註名稱不會被改寫。")}</p>
 <Field label={tr('金額顏色')}><SmartSelect value={colorScheme} onChange={e=>chooseColors(e.target.value)}><option value="normal">{tr('收入／獲利顯示綠色')} {i18n("· 支出／損失紅色")}</option><option value="reverse">{tr('收入／獲利顯示紅色')} {i18n("· 支出／損失綠色")}</option></SmartSelect></Field>
 <div className="color-preview"><span className="income">+ 1,200</span><span className="expense">− 500</span></div>
 </section><section className="glass panel"><h2>{i18n("iCloud Drive 備份")}</h2><p className="hint">{i18n("資料保存在這台裝置。按「立即備份」產生 JSON，再透過 iPhone 的分享選單儲存至「檔案 → iCloud Drive」；還原時從檔案 App 手動選取備份。")}</p><button className="action-row" onClick={download}><Download size={20}/><span><b>{tr('立即備份')}</b><small>{i18n("匯出完整 JSON，儲存到 iCloud Drive")}</small></span><ChevronRight size={18}/></button><button className="action-row" onClick={()=>fileInput.current?.click()}><Upload size={20}/><span><b>{tr('立即還原')}</b><small>{i18n("從 iCloud Drive 選擇備份檔，確認後覆蓋本機")}</small></span><ChevronRight size={18}/></button><input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={importFile}/><p className="hint">{i18n("iPhone PWA 無法自動找到 iCloud Drive 最新檔案，還原時須自行選取；建議以檔名日期辨識最新備份。")}</p></section><section className="glass panel"><h2>{tr('外觀與使用')}</h2><div className="theme-heading"><b>{tr('外觀主題')}</b><small>{i18n("選擇配色，立即套用並儲存於本機")}</small></div>{isDemoMode?<div className="demo-fixed-theme"><span>{i18n('經典深色')}</span><small>{i18n('演示模式固定使用經典深色主題')}</small></div>:<ThemePicker value={theme} onChange={chooseTheme}/>} <div className="font-scale-block"><div><b>{tr('字體大小')}</b><small>{i18n("依你的閱讀習慣調整")}</small></div><SmartSelect value={String(fontScale)} onChange={e=>updateFontScale(Number(e.target.value))} className="preferences-select" aria-label={i18n('字體大小')}>{[[0.94,'小'],[1,'中'],[1.14,'大']].map(([v,label])=><option key={label} value={String(v)}>{i18n(label)}</option>)}</SmartSelect></div><div className="font-scale-block fab-position-setting"><div><b>{i18n('浮動按鈕位置')}</b><small>{i18n('選擇浮動操作按鈕靠左或靠右')}</small></div><SmartSelect value={fabPosition} onChange={e=>updateFabPosition(e.target.value)} className="preferences-select" aria-label={i18n('浮動按鈕位置')}>{[['left','左側'],['right','右側']].map(([value,label])=><option key={value} value={value}>{tr(label)}</option>)}</SmartSelect></div><div className="font-scale-block week-start-setting"><div><b>{i18n('一週開始日')}</b><small>{i18n('日記帳週曆的第一天')}</small></div><SmartSelect value={String(weekStartsOn)} onChange={e=>chooseWeekStart(Number(e.target.value))} className="preferences-select" aria-label={i18n('一週開始日')}>{[[0,'星期日'],[1,'星期一']].map(([value,label])=><option key={value} value={String(value)}>{i18n(label)}</option>)}</SmartSelect></div></section><AppPasswordSettings hasPassword={!!passwordConfig} onSet={changeLock} onRemove={removeLock} onVerify={verifyLock} numericPassword={passwordConfig?.kind==='pin6'}/></>}
 </main></div>
 
 {tab==='daily'&&<div className="diary-bottom-geometry" aria-hidden="true"/>}
 <nav className="bottom-nav glass">{mobileNav.map(([key,label,Icon])=><button key={key} onClick={()=>setTab(key)} className={(tab===key||(key==='settings'&&settingsPages.includes(tab)))?'active':''}><Icon size={20} strokeWidth={tab===key?2.6:1.9}/><span>{tr(label)}</span></button>)}</nav>
  {tab==='stocks'&&investSection!=='list'?<button type="button" className="fab fab-back" aria-label={i18n((investSection==='stocks'&&selectedStockSymbol)||(['trust','policy','fund','bond','savings','termDeposit'].includes(investSection)&&investmentAssetDetailOpen)?'返回上一層':'返回投資總覽')} title={i18n((investSection==='stocks'&&selectedStockSymbol)||(['trust','policy','fund','bond','savings','termDeposit'].includes(investSection)&&investmentAssetDetailOpen)?'返回上一層':'返回投資總覽')} onClick={()=>{if(investSection==='stocks'&&selectedStockSymbol){setSelectedStockSymbol(null)}else if(['trust','policy','fund','bond','savings','termDeposit'].includes(investSection)&&investmentAssetDetailOpen){setInvestmentBackToListSignal(v=>v+1)}else{setInvestSection('list');setSelectedStockSymbol(null);setInvestmentAssetDetailOpen(false)}}}><ChevronLeft size={29}/></button>
  :!['dashboard','settings'].includes(tab)&&<button type="button" className="fab" aria-label={i18n(tab==='accountTypes'?'新增類型':'新增')} title={i18n(tab==='accountTypes'?'新增類型':'新增')} onClick={()=>tab==='stocks'?setInvestmentAddMenu(true):tab==='categories'?open('category',{name:'',mode:'main',categoryType:categoryFlow}):open(({daily:'transaction',accounts:'account',accountTypes:'accountType',recurring:'recurring',projects:'project'})[tab])}><Plus size={28}/></button>}

 {investmentAddMenu&&tab==='stocks'&&createPortal(<div className="investment-action-backdrop" onClick={()=>setInvestmentAddMenu(false)}><div className="investment-action-sheet" role="dialog" aria-modal="true" aria-label={i18n("新增投資")} onClick={e=>e.stopPropagation()}><div className="investment-action-header"><h3>{i18n("新增投資")}</h3><button type="button" className="circle-button investment-action-close" title={i18n("取消")} aria-label={i18n("取消")} onClick={()=>setInvestmentAddMenu(false)}><X size={21}/></button></div>{[['stocks','股票交易'],['trust','持股信託'],['policy','投資保單'],['fund','基金'],['bond','債券'],['savings','儲蓄險'],['termDeposit','定存']].map(([type,label])=><button key={type} type="button" className={`investment-action-option investment-action-option-${type}`} onClick={()=>{setInvestmentAddMenu(false);setInvestSection(type);if(type==='stocks')open('stock');else if(type==='trust'||type==='policy'){open('account',null,type);}else{setPendingProductCreate(type)}}}><Plus size={19}/><span>{i18n(label)}</span><ChevronRight size={17}/></button>)}</div></div>,document.body)}
 {notice&&createPortal(<div className="toast glass cp-notice" role="alert" aria-live="assertive">{notice}</div>,document.body)}
 {templateNaming&&dialog==='transaction'&&createPortal(<div className="nexpen-confirm-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setTemplateNaming(false)}}>
  <section className="nexpen-confirm-dialog transaction-template-name-dialog" role="dialog" aria-modal="true" aria-labelledby="transaction-template-name-heading" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();setTemplateNaming(false)}}}>
   <div className="nexpen-confirm-heading"><span className="nexpen-confirm-icon"><BookMarked size={22}/></span><div className="nexpen-confirm-title-wrap"><h2 id="transaction-template-name-heading">{i18n(templateEditorId?'修改範本':'新增範本')}</h2></div><button type="button" className="nexpen-confirm-close" aria-label={i18n('取消')} onClick={()=>setTemplateNaming(false)}><X size={18}/></button></div>
   <form onSubmit={e=>{e.preventDefault();void persistInlineTemplate()}}>
    <label className="transaction-template-name-field" htmlFor="transaction-template-name">{i18n('範本名稱')}</label>
    <MarqueeInput id="transaction-template-name" autoFocus required type="text" maxLength={48} value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder={i18n('例如：每日午餐、固定交通費')}/>
    <div className="nexpen-confirm-actions"><button type="button" className="nexpen-confirm-cancel" onClick={()=>setTemplateNaming(false)}>{i18n('取消')}</button><button type="submit" className="nexpen-confirm-submit" disabled={!templateName.trim()}>{i18n('儲存範本')}</button></div>
   </form>
  </section>
 </div>,document.body)}
 {calculator&&<Calculator initial={calculator.value} allowNegative={calculator.field==='openingBalance'||calculator.field==='actualBalance'} onDone={v=>{if(calculator.field==='fxPrimaryRate'){const entered=Number(v);if(!baseAvailable||!Number.isFinite(entered)||entered<=0){toast(i18n("主要貨幣匯率尚未取得或輸入匯率無效"));return;}setForm(f=>({...f,fxRate:entered*mainRate,fxSource:'manual',fxDate:today()}));}else{patch(calculator.field,v);if(calculator.field==='fxRate')patch('fxSource','manual')}}} onClose={()=>setCalculator(null)}/>}
 {!!dialog&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="sheet glass"><div className="grabber"/><div className="sheet-head"><h2>{dialog==='balanceAudit'?'餘額盤點／校正':i18n((editing?.id||editing?.name?'編輯':'新增')+({transaction:'交易',account:'帳戶',stock:'股票交易',project:'專案',recurring:'定期排程',category:'分類',accountType:'帳戶類型'}[dialog]||''))}</h2><div className="sheet-head-actions">
{(dialog==='stock'||(dialog==='account'&&isInvestmentAssetType(form.type)))&&<InvestmentCategoryColorPicker iconOnly type={dialog==='stock'?'stocks':form.type} colors={investmentCategoryColors} onChange={updateInvestmentCategoryColor}/>}
{dialog==='transaction'&&!templateTab&&<button type="button" className="circle-button sheet-action-template sheet-head-template-btn" title={i18n(templateEditorId?'儲存範本':'加入範本')} aria-label={i18n(templateEditorId?'儲存範本':'加入範本')} onClick={openTemplateNameDialog}><BookMarked size={20}/></button>}
<button type="button" className="circle-button sheet-close-btn" title={i18n("取消")} aria-label={i18n("取消")} onClick={close}><X size={21}/></button></div></div><form id="nexpen-sheet-form" onSubmit={save} className="sheet-body">
 {dialog==='transaction'&&<>
  <div className="segmented stretch transaction-four-tabs" role="tablist" aria-label={i18n('交易類型')}>
   {Object.entries(picker).map(([k,v])=><Pill key={k} active={!templateTab&&form.type===k} onClick={()=>{setTemplateTab(false);setTemplateEditorId('');setTemplateNaming(false);setSelectedTemplateId('');setForm(f=>({...f,type:k,mainCategory:Object.keys(categories[k]||{})[0]||'',subCategory:(categories[k]?.[Object.keys(categories[k]||{})[0]]||[])[0]||''}))}}>{i18n(v)}</Pill>)}
   <Pill active={templateTab} onClick={()=>{setTemplateTab(true);setTemplateNaming(false);setTemplateEditorId('');setCalculator(null)}}>{i18n('範本')}</Pill>
  </div>
  {templateTab?<div className="transaction-inline-templates" role="tabpanel">
   {transactionTemplates.length?transactionTemplates.map(template=><div className="transaction-inline-template" key={template.id}>
    <button type="button" className="transaction-template-choice" onClick={()=>applyTemplate(template)} aria-label={`${i18n('套用範本')} ${template.name}`}>
     <span className="transaction-template-title">{template.name}</span>
     <small>{i18n(picker[template.type]||template.type)} · {template.type==='transfer'?i18n('內部轉帳'):i18n(template.subCategory||template.mainCategory)}{template.amount?` · ${Number(template.amount).toLocaleString(language||'zh-TW')}`:''}</small>
     <small className="transaction-template-account">{i18n('帳戶')}：{template.type==='transfer'
      ?`${accounts.find(a=>a.id===template.fromAccount)?.name||i18n('未指定轉出帳戶')} → ${accounts.find(a=>a.id===template.toAccount)?.name||i18n('未指定轉入帳戶')}`
      :(accounts.find(a=>a.id===template.account)?.name||i18n('未指定帳戶'))}</small>
    </button>
    <div className="transaction-template-row-actions">
     <button type="button" className="transaction-template-icon-button" title={i18n('編輯範本')} aria-label={`${i18n('編輯範本')}：${template.name}`} onClick={()=>prepareTemplateEdit(template)}><Edit3 size={18}/></button>
     <button type="button" className="transaction-template-icon-button danger" title={i18n('刪除範本')} aria-label={`${i18n('刪除範本')}：${template.name}`} onClick={async()=>{if(await askConfirm({kind:'delete',title:i18n('刪除範本')+'「'+template.name+'」？',description:i18n('刪除範本不會影響已建立的交易。')}))await deleteTransactionTemplate(template.id)}}><Trash2 size={18}/></button>
    </div>
   </div>):<div className="transaction-templates-empty">{i18n('尚未建立交易範本')}</div>}
   <p className="hint">{i18n('選擇範本後可修改金額與日期，再儲存交易。')}</p>
  </div>:<>
   {selectedTemplateId&&<p className="transaction-template-applied-hint">{i18n('已套用範本')}{templateEditorId?` · ${i18n('修改範本')}`:''}</p>}
   <div className="form-grid transaction-date-money-row"><Field label={i18n("交易日期")}><NativeDatePicker required value={form.date||''} onChange={e=>patch('date',e.target.value)}/></Field><Field label={i18n("金額")}><button type="button" className="money-trigger" onClick={()=>setCalculator({field:"amount",value:form.amount})}><span>{form.amount!==""&&form.amount!==undefined?form.amount:'—'}</span><span className="calc-mini">⌗</span></button></Field></div>
   {form.type==='transfer'?<div className="form-grid"><Field label={i18n("轉出帳戶")}><SmartSelect value={form.fromAccount} onChange={e=>patch('fromAccount',e.target.value)}>{transactionAccountChoices}</SmartSelect></Field><Field label={i18n("轉入帳戶")}><SmartSelect value={form.toAccount} onChange={e=>patch('toAccount',e.target.value)}>{transactionAccountChoices}</SmartSelect></Field></div>:<>
    <Field label={i18n('選擇分類')}><button type="button" className="transaction-category-trigger" onClick={showCategoryPicker} aria-haspopup="dialog" aria-label={i18n('選擇分類')}><span className="transaction-category-trigger-values"><strong>{i18n(form.mainCategory||'主分類')}</strong><ChevronRight size={15}/><span>{i18n(form.subCategory||'子分類')}</span></span><ChevronRight size={19}/></button></Field>
    <Field label={i18n("資產帳戶")}><SmartSelect value={form.account} onChange={e=>patch('account',e.target.value)}>{transactionAccountChoices}</SmartSelect></Field>
   </>}
   <Field label={i18n("備註")}><MarqueeInput placeholder={i18n("例如：拿鐵咖啡")} value={form.note||''} onChange={e=>patch('note',e.target.value)}/></Field><Field label={i18n("專案（選填）")}><SmartSelect value={form.projectId||''} onChange={e=>patch('projectId',e.target.value)}><option value="">{i18n("不指定專案")}</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</SmartSelect></Field></>}
 </>}
 {dialog==='balanceAudit'&&(()=>{
  const account=accounts.find(a=>a.id===form.account);
  if(!account)return <p className="hint">找不到盤點帳戶</p>;
  const previous=editing&&isBalanceAudit(editing)?Number(editing.amount)||0:0;
  const computed=accountBalance(account,records,stocks,investmentFlows)-previous;
  const actual=String(form.actualBalance??'').trim();
  let delta=null;
  try{delta=balanceAuditDelta(actual,computed,precisionFor(account));}catch{}
  const formatValue=n=>`${account.currency||'TWD'} ${Number(n).toLocaleString('zh-TW',{maximumFractionDigits:precisionFor(account)})}`;
  return <section className="balance-audit-panel">
    <p className="hint">{account.name} · 實際餘額與帳面餘額核對，差異會另外記在日記帳，不列入一般收支。</p>
    <Field label="盤點日期"><NativeDatePicker value={form.date} onChange={e=>patch('date',e.target.value)} required/></Field>
    <div className="balance-audit-stats"><span>帳面餘額</span><strong>{formatValue(computed)}</strong></div>
    <Field label="實際餘額"><button type="button" className="money-trigger" aria-label="輸入實際餘額" onClick={()=>setCalculator({field:'actualBalance',value:form.actualBalance??''})}><span>{form.actualBalance!==''&&form.actualBalance!==undefined?form.actualBalance:'—'}</span><span className="calc-mini" aria-hidden="true">⌗</span></button></Field>
    <div className="balance-audit-stats"><span>校正差額</span><strong className={delta===null?'':delta>=0?'income':'expense'}>{delta===null?'—':`${delta>0?'+':''}${formatValue(delta)}`}</strong></div>
    <Field label="盤點備註"><input value={form.note||''} onChange={e=>patch('note',e.target.value)}/></Field>
  </section>;
 })()}
 {dialog==='account'&&<>
 <Field label={i18n("帳戶名稱")}><MarqueeInput required value={form.name||''} onChange={e=>patch('name',e.target.value)} placeholder={i18n("例如：中國信託活存")}/></Field>
 {!isInvestmentAssetType(form.type)?<Field label={i18n("帳戶類型")}><SmartSelect value={form.type||''} onChange={e=>setForm(f=>{
  const nextType=e.target.value;
  const investment=['trust','policy'].includes(nextType);
  return {...f,type:nextType,...(investment?{isDefault:false,openingBalance:'0',currency:nextType==='trust'?'TWD':f.currency||'TWD',fxRate:nextType==='trust'?1:f.fxRate}:{} )};
 })}>{accountTypes.map(t=><option key={t.id} value={t.id}>{i18n(t.name)}</option>)}</SmartSelect></Field>:<Field label={i18n('投資資產類別')}><div className="investment-fixed-asset-type">{i18n(form.type==='trust'?'持股信託':'投資保單')}</div></Field>}
 {['trust','policy'].includes(form.type)?<>
  <div className="account-setup-section" role="group" aria-label={i18n('投資資產建檔')}>
   <strong className="account-setup-heading">{form.type==='trust'?i18n('持股信託建檔'):i18n('投資保單建檔')}</strong>
   <p className="hint account-setup-intro">{form.type==='trust'
     ?i18n('請填入建立此信託時已持有的股數及累計取得成本；現值會依股票收盤價自動估算，不需要填期初餘額。')
     :i18n('累計投入成本與目前保單現值是不同欄位：前者用來計算損益，後者才是計入淨資產的估值；不需要填期初餘額。')}</p>
   {form.type==='trust'?<>
    <div className="account-setup-readonly"><span>{i18n('計價幣別')}</span><strong>TWD · {i18n('新台幣')}</strong></div>
    <Field label={i18n('股票代號')}><MarqueeInput autoCapitalize="characters" required value={form.trustSymbol||''} placeholder={i18n('例如 2330')} onChange={e=>patch('trustSymbol',e.target.value.toUpperCase())}/></Field>
    <Field label={i18n('初始持有股數')}><button type="button" className="money-trigger" onClick={()=>setCalculator({field:'trustShares',value:form.trustShares||''})}><span>{String(form.trustShares??'')||'—'}</span><span className="calc-mini">⌗</span></button></Field>
   </>:<>
    <Field label={i18n('保單幣別')}><SmartSelect value={form.currency||'TWD'} onChange={e=>changeCurrency(e.target.value)}>{[['TWD','新台幣 TWD'],['USD','美元 USD'],['JPY','日圓 JPY'],['EUR','歐元 EUR'],['CNY','人民幣 CNY'],['HKD','港幣 HKD'],['GBP','英鎊 GBP'],['AUD','澳幣 AUD'],['SGD','新加坡幣 SGD'],['KRW','韓元 KRW'],['CAD','加拿大幣 CAD'],['CHF','瑞士法郎 CHF']].map(([code,label])=><option key={code} value={code}>{i18n(label)}</option>)}</SmartSelect></Field>
   </>}
   <Field label={i18n('累計取得成本（已投入的總金額）')}><button type="button" className="money-trigger" onClick={()=>setCalculator({field:'investmentCost',value:form.investmentCost||''})}><span>{String(form.investmentCost??'')||'—'}</span><span className="calc-mini">⌗</span></button></Field>
   {form.type==='trust'?<p className="hint">{i18n('信託現值＝持有股數 × 最近收盤價。後續追加投入請在投資頁登記，不會重複建立一般股票交易。')}</p>:<>
    <Field label={i18n('目前保單現值（保險公司提供）')}><button type="button" className="money-trigger" onClick={()=>setCalculator({field:'policyValue',value:form.policyValue??''})}><span>{form.policyValue!==''&&form.policyValue!==undefined?form.policyValue:'—'}</span><span className="calc-mini">⌗</span></button></Field>
    <Field label={i18n('現值日期')}><NativeDatePicker value={form.policyValueDate||today()} onChange={e=>patch('policyValueDate',e.target.value)}/></Field>
    <p className="hint">{i18n('未實現損益＝目前保單現值－累計投入成本；未來可在投資頁更新現值或追加投入。')}</p>
    {form.currency!=='TWD'&&<div className="account-investment-fx"><Field label={`${primaryCurrency} ${i18n('換算匯率')}`}><button type="button" className="money-trigger" disabled={form.currency===primaryCurrency||!baseAvailable} onClick={()=>setCalculator({field:'fxPrimaryRate',value:Number.isFinite(crossRateToPrimary(form.currency,form.fxRate))?String(Number(crossRateToPrimary(form.currency,form.fxRate).toPrecision(9))):''})}><span>{formatFxRate(crossRateToPrimary(form.currency,form.fxRate))}</span><span className="calc-mini">{form.currency===primaryCurrency?'':'⌗'}</span></button></Field><div className="fx-tools"><small>1 {form.currency} = {formatFxRate(crossRateToPrimary(form.currency,form.fxRate))} {primaryCurrency}</small><button type="button" className="soft-btn small" disabled={rateLoading} onClick={()=>fetchRate(form.currency)}><RefreshCcw size={14}/>{rateLoading?i18n('更新中…'):i18n('更新匯率')}</button></div></div>}
   </>}
  </div>
 </>:<>
  <div className="account-setup-section" role="group" aria-label={i18n('一般帳戶餘額設定')}>
   <Field label={i18n('帳戶幣別')}><SmartSelect value={form.currency||'TWD'} onChange={e=>changeCurrency(e.target.value)}>{[['TWD','新台幣 TWD'],['USD','美元 USD'],['JPY','日圓 JPY'],['EUR','歐元 EUR'],['CNY','人民幣 CNY'],['HKD','港幣 HKD'],['GBP','英鎊 GBP'],['AUD','澳幣 AUD'],['SGD','新加坡幣 SGD'],['KRW','韓元 KRW'],['CAD','加拿大幣 CAD'],['CHF','瑞士法郎 CHF']].map(([code,label])=><option key={code} value={code}>{i18n(label)}</option>)}</SmartSelect></Field>
   {form.currency!=='TWD'&&<><Field label={`${primaryCurrency} ${i18n('換算匯率')}`}><button type="button" className="money-trigger" disabled={form.currency===primaryCurrency||!baseAvailable} onClick={()=>setCalculator({field:'fxPrimaryRate',value:Number.isFinite(crossRateToPrimary(form.currency,form.fxRate))?String(Number(crossRateToPrimary(form.currency,form.fxRate).toPrecision(9))):''})}><span>{formatFxRate(crossRateToPrimary(form.currency,form.fxRate))}</span><span className="calc-mini">{form.currency===primaryCurrency?'':'⌗'}</span></button></Field><div className="fx-tools"><small>1 {form.currency} = {formatFxRate(crossRateToPrimary(form.currency,form.fxRate))} {primaryCurrency}</small><button type="button" className="soft-btn small" disabled={rateLoading} onClick={()=>fetchRate(form.currency)}><RefreshCcw size={14}/>{rateLoading?i18n('更新中…'):i18n('更新匯率')}</button></div></>}
   <Field label={i18n('帳戶金額小數位數')}><SmartSelect value={String(form.decimalPlaces??2)} onChange={e=>patch('decimalPlaces',Number(e.target.value))}>{[0,1,2,3,4,5,6].map(n=><option key={n} value={String(n)}>{n} {i18n('位')}</option>)}</SmartSelect></Field>
   <Field label={`${i18n('期初餘額')}（${form.currency||'TWD'}）`}><button type="button" className="money-trigger" onClick={()=>setCalculator({field:'openingBalance',value:form.openingBalance})}><span>{form.openingBalance!==''&&form.openingBalance!==undefined?form.openingBalance:'—'}</span><span className="calc-mini">⌗</span></button></Field>
   <p className="hint">{i18n('期初餘額是開始記帳時帳戶已有的金額，可輸入負數表示欠款或透支。')}</p>
   {editing?.id&&<button type="button" className="soft-btn balance-audit-open" onClick={()=>openBalanceAudit(accounts.find(a=>a.id===editing.id))}>餘額盤點／校正</button>}
   <label className="account-asset-toggle"><input type="checkbox" checked={form.isDefault===true} onChange={e=>patch('isDefault',e.target.checked)}/><span><b>{i18n('預設帳戶')}</b><small>{i18n('新增交易時自動帶入此帳戶；同一時間只能設定一個預設帳戶。')}</small></span></label>
  </div>
 </>}
 <label className="account-asset-toggle"><input type="checkbox" checked={form.includeInAssets!==false} onChange={e=>patch('includeInAssets',e.target.checked)}/><span><b>{i18n('計入總資產')}</b><small>{i18n('關閉後不計入總資產與淨資產，但資料仍保留。')}</small></span></label>
 <p className="hint">{i18n('帳戶以原幣記錄，總覽依主要貨幣換算。')}</p>
 
 
  </>}
 {dialog==='stock'&&<>
 <div className="stock-trade-tabs" role="group" aria-label={i18n("股票交易方式")}><button type="button" className={form.securityType==='stock'&&!form.dayTrade?'active':''} onClick={()=>setForm(f=>({...f,securityType:'stock',dayTrade:false}))}>{i18n("一般")}</button><button type="button" className={form.securityType==='stock'&&form.dayTrade?'active':''} onClick={()=>setForm(f=>({...f,securityType:'stock',dayTrade:true}))}>{i18n("當沖")}</button><button type="button" className={form.securityType==='etf'||form.securityType==='bondEtf'?'active':''} onClick={()=>setForm(f=>({...f,securityType:f.securityType==='bondEtf'?'bondEtf':'etf',dayTrade:false}))}>ETF</button></div><div className="form-grid stock-action-date-grid"><Field label={i18n("日期")}><NativeDatePicker value={form.date||''} required onChange={e=>patch('date',e.target.value)}/></Field><Field label={i18n("動作")}><SmartSelect value={form.action} onChange={e=>{const action=e.target.value;setForm(f=>{if(action!=='sell')return {...f,action};const available=holdings(stocks.filter(x=>x.id!==editing?.id));return {...f,action,symbol:'',securityName:'',shares:'',matchedBuyId:''};});}}><option value="buy">{i18n("買進")}</option><option value="sell">{i18n("賣出")}</option><option value="dividend">{i18n("現金股利")}</option></SmartSelect></Field></div><div className="form-grid stock-symbol-name-grid"><Field label={i18n("股票代號")}>{form.action==='sell'?<SmartSelect value={form.symbol||''} onChange={e=>{const symbol=e.target.value;const matching=stocks.find(x=>x.symbol===symbol&&x.securityName);setForm(f=>({...f,symbol,securityName:matching?.securityName||'',shares:'',matchedBuyId:''}));inferStockType(symbol)}}>{sellableHoldings.map(h=><option key={h.symbol} value={h.symbol}>{h.symbol} {i18n("· 可賣")} {h.shares.toLocaleString('zh-TW')} {i18n("股")}</option>)}</SmartSelect>:<MarqueeInput required autoCapitalize="characters" value={form.symbol||''} onChange={e=>{const code=e.target.value.toUpperCase();setForm(f=>({...f,symbol:code,securityName:''}));setCatalogAutoName('');inferStockType(code)}} placeholder={i18n("例如 0050、2330、00679B")}/>}</Field><Field label={i18n("股票名稱")}><MarqueeInput value={form.securityName||''} onChange={e=>patch('securityName',e.target.value)} placeholder={i18n("輸入代號後自動帶入；也可自行修改")}/></Field></div>{stockTypeStatus&&<p className="hint stock-lookup-status" role="status">{stockTypeStatus}</p>}{form.action==='dividend'?<Field label={i18n("現金股利金額")}><button type="button" className="money-trigger" onClick={()=>setCalculator({field:"amount",value:form.amount})}><span>{form.amount!==""&&form.amount!==undefined?form.amount:'—'}</span><span className="calc-mini">⌗</span></button></Field>:<>{(form.securityType==='etf'||form.securityType==='bondEtf')&&<Field label={i18n("ETF 稅別")}><SmartSelect value={form.securityType} onChange={e=>patch('securityType',e.target.value)}><option value="etf">{i18n("一般 ETF（賣出稅 0.1%）")}</option><option value="bondEtf">{i18n("債券 ETF（依日期適用稅率）")}</option></SmartSelect></Field>}{form.action==='sell'&&<Field label={i18n("沖銷買進紀錄（指定成本批次）")}><SmartSelect value={form.matchedBuyId||''} onChange={e=>setForm(f=>({...f,matchedBuyId:e.target.value,shares:''}))}>{availableBuyLots.map(l=><option key={l.id} value={l.id}>{l.date} · {l.price.toLocaleString('zh-TW',{maximumFractionDigits:4})} {i18n("元 · 可沖銷")} {Math.floor(l.remaining).toLocaleString('zh-TW')} {i18n("股")}</option>)}</SmartSelect><p className="hint">{i18n("請先選擇要沖銷的買進紀錄，再輸入賣出股數。單筆賣出對應一筆買進，可部分沖銷；要沖銷多筆買進請分開登記賣出。")}</p>{chosenBuyLot&&<p className="stock-lot-preview">{i18n("本批次可沖銷：")}{Math.floor(chosenBuyLot.remaining).toLocaleString('zh-TW')} {i18n("股 · 含費均價 NT$")} {(chosenBuyLot.remainingCost/chosenBuyLot.remaining).toLocaleString('zh-TW',{minimumFractionDigits:2,maximumFractionDigits:4})}</p>}</Field>}<div className="form-grid"><Field label={i18n("股數")}><button type="button" className="money-trigger" onClick={()=>setCalculator({field:"shares",value:form.shares})}><span>{String(form.shares)||'—'}</span><span className="calc-mini">⌗</span></button></Field><Field label={i18n("每股單價")}><button type="button" className="money-trigger" onClick={()=>setCalculator({field:"price",value:form.price})}><span>{form.price!==""&&form.price!==undefined?form.price:'—'}</span><span className="calc-mini">⌗</span></button></Field></div><div className="form-grid"><Field label={i18n("券商手續費折扣（%）")}><button type="button" className="money-trigger" onClick={()=>setCalculator({field:"feeDiscount",value:form.feeDiscount??'60'})}><span>{String(form.feeDiscount??'60')||'—'}</span><span className="calc-mini">⌗</span></button></Field><Field label={i18n("最低手續費（元）")}><button type="button" className="money-trigger" onClick={()=>setCalculator({field:"feeMinimum",value:form.feeMinimum??'20'})}><span>{String(form.feeMinimum??'20')||'—'}</span><span className="calc-mini">⌗</span></button></Field></div><button type="button" className="stock-fee-save" onClick={async()=>{try{await saveBrokerFees()}catch(e){toast(e.message)}}}>{i18n("儲存券商費率設定")}</button><div className="form-grid"><Field label={i18n("手續費率（%）")}><input type="text" readOnly value={Number(form.feeRate??0.1425).toFixed(4)} className="stock-fee-readonly"/></Field><Field label={i18n("成交金額")}><input type="text" readOnly value={'NT$ '+estimateStockCharges(form).gross.toLocaleString('zh-TW')} className="stock-fee-readonly"/></Field></div><p className="hint">{i18n("手續費及證交稅依證券類型、成交金額、折扣自動計算；實際金額請以券商對帳單為準。")}</p>{form.securityType==='bondEtf'&&<p className="hint">{i18n("債券 ETF 免徵證交稅的已公告期間至 2026/12/31；之後以一般 ETF 稅率預估，請核對最新公告。")}</p>}{form.dayTrade&&<p className="hint">{i18n("當沖 0.15% 需符合當日同一券商、同一帳戶、同種類與數量沖銷資格；系統無法自動認定。")}</p>}<div className="form-grid"><Field label={i18n("手續費")}><input className="stock-fee-readonly" readOnly value={'NT$ '+estimateStockCharges(form).fee.toLocaleString('zh-TW')}/></Field><Field label={i18n("交易稅")}><input className="stock-fee-readonly" readOnly value={'NT$ '+estimateStockCharges(form).tax.toLocaleString('zh-TW')}/></Field></div></>}<Field label={i18n("交割／股利入帳帳戶")}><SmartSelect value={form.account||''} onChange={e=>patch('account',e.target.value)}>{transactionAccountChoices}</SmartSelect></Field><Field label={i18n("備註")}><input value={form.note||''} onChange={e=>patch('note',e.target.value)}/></Field></>}
 
 {dialog==='recurring'&&<><Field label={i18n("排程名稱")}><input value={form.name||''} required onChange={e=>patch('name',e.target.value)}/></Field><div className="form-grid"><Field label={i18n("交易類型")}><SmartSelect value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value,account:(accounts.find(a=>a.isDefault===true&&!['trust','policy'].includes(a.type))||accounts.find(a=>!['trust','policy'].includes(a.type)))?.id||'',fromAccount:(accounts.find(a=>a.isDefault===true&&!['trust','policy'].includes(a.type))||accounts.find(a=>!['trust','policy'].includes(a.type)))?.id||'',toAccount:accounts.find(a=>!['trust','policy'].includes(a.type)&&a.id!==(accounts.find(x=>x.isDefault===true&&!['trust','policy'].includes(x.type))||accounts.find(x=>!['trust','policy'].includes(x.type)))?.id)?.id||'',mainCategory:e.target.value==='transfer'?i18n("帳戶互轉"):Object.keys(categories[e.target.value]||{})[0]||'',subCategory:e.target.value==='transfer'?i18n("內部轉帳"):((categories[e.target.value]?.[Object.keys(categories[e.target.value]||{})[0]]||[])[0]||'')}))}><option value="expense">{i18n("支出")}</option><option value="income">{i18n("收入")}</option><option value="transfer">{i18n("轉帳")}</option></SmartSelect></Field><Field label={i18n("執行週期")}><SmartSelect value={form.freq} onChange={e=>patch('freq',e.target.value)}><option value="weekly">{i18n("每週")}</option><option value="monthly">{i18n("每月")}</option><option value="yearly">{i18n("每年")}</option></SmartSelect></Field></div><div className="form-grid"><Field label={i18n("下次日期")}><NativeDatePicker value={form.nextDate||''} required onChange={e=>patch('nextDate',e.target.value)}/></Field><Field label={i18n("金額")}><button type="button" className="money-trigger" onClick={()=>setCalculator({field:"amount",value:form.amount})}><span>{form.amount!==""&&form.amount!==undefined?form.amount:'—'}</span><span className="calc-mini">⌗</span></button></Field></div>{form.type==='transfer'?<div className="form-grid"><Field label={i18n("轉出帳戶")}><SmartSelect value={form.fromAccount} onChange={e=>patch('fromAccount',e.target.value)}>{transactionAccountChoices}</SmartSelect></Field><Field label={i18n("轉入帳戶")}><SmartSelect value={form.toAccount} onChange={e=>patch('toAccount',e.target.value)}>{transactionAccountChoices}</SmartSelect></Field></div>:<><Field label={i18n("帳戶")}><SmartSelect value={form.account} onChange={e=>patch('account',e.target.value)}>{transactionAccountChoices}</SmartSelect></Field><div className="form-grid"><Field label={i18n("主分類")}><SmartSelect value={form.mainCategory||''} onChange={e=>setForm(f=>({...f,mainCategory:e.target.value,subCategory:(categories[f.type]?.[e.target.value]||[])[0]||''}))}>{Object.keys(categories[form.type]||{}).map(c=><option key={c}>{c}</option>)}</SmartSelect></Field><Field label={i18n("子分類")}><SmartSelect value={form.subCategory||''} onChange={e=>patch('subCategory',e.target.value)}>{(categories[form.type]?.[form.mainCategory]||[]).map(c=><option key={c}>{c}</option>)}</SmartSelect></Field></div></>}<p className="hint">{form.type==='transfer'?i18n("定期建立同幣別帳戶間的自動轉帳。"):i18n("可用於薪資、訂閱、固定支出或固定收入。")}</p></>}
 {dialog==='project'&&<><Field label={i18n("專案名稱")}><MarqueeInput required maxLength={48} value={form.name||''} onChange={e=>patch('name',e.target.value)} placeholder={i18n("例如：日本旅行、房屋裝潢、家庭生活")}/></Field><p className="hint">{i18n("專案名稱可隨時修改；已被交易使用的專案不能直接刪除。")}</p></>}
 {dialog==='accountType'&&<><Field label={i18n("帳戶類型名稱")}><MarqueeInput required maxLength={32} value={form.name||''} onChange={e=>patch('name',e.target.value)} placeholder={i18n("例如：數位銀行、投資帳戶")}/></Field><Field label={i18n('總覽資產配置分類')}><SmartSelect value={form.assetGroup||'other'} onChange={e=>patch('assetGroup',e.target.value)}>{ASSET_GROUPS.map(g=><option key={g.id} value={g.id}>{i18n(g.label)}</option>)}</SmartSelect></Field><p className="hint">{i18n('總覽分類名稱固定，一般帳戶類型可指定資產配置歸屬；持股信託與投資保單在投資頁獨立管理。')}</p></>}
 {dialog==='category'&&<><div className="form-grid category-type-level-grid"><Field label={i18n("類別類型")}><SmartSelect disabled={!!editing?.name} value={form.categoryType} onChange={e=>patch('categoryType',e.target.value)}><option value="expense">{i18n("支出")}</option><option value="income">{i18n("收入")}</option></SmartSelect></Field><Field label={i18n("分類層級")}><SmartSelect disabled={!!editing?.name} value={form.mode} onChange={e=>patch('mode',e.target.value)}><option value="main">{i18n("主分類")}</option><option value="sub">{i18n("子分類")}</option></SmartSelect></Field></div>{form.mode==='sub'&&<Field label={i18n("所屬主分類")}><SmartSelect disabled={!!editing?.name} value={form.parent||''} onChange={e=>patch('parent',e.target.value)}><option value="">{i18n("請選擇")}</option>{Object.keys(categories[form.categoryType]||{}).map(c=><option key={c}>{c}</option>)}</SmartSelect></Field>}<Field label={i18n("類別名稱")}><MarqueeInput required value={form.name||''} onChange={e=>patch('name',e.target.value)} placeholder={i18n("輸入名稱")}/></Field><div className="icon-picker"><div className="icon-picker-heading"><strong>{i18n("選擇圖示")}</strong><small>{i18n("將顯示在分類清單與記帳明細")}</small></div><div className="icon-grid">{ICON_OPTIONS.map(([key,label])=>{const Icon=CATEGORY_ICONS[key]||Tags;return <button type="button" key={key} title={i18n(label)} aria-label={`${i18n('選擇圖示')}: ${i18n(label)}`} aria-pressed={form.icon===key} className={'icon-option '+(form.icon===key?'selected':'')} onClick={()=>patch('icon',key)}><Icon size={21}/><span>{i18n(label)}</span></button>})}</div></div></>}
  </form><div className="sheet-floating-actions" role="group" aria-label={i18n("表單操作")}>

{!(dialog==='transaction'&&templateTab)&&!templateEditorId&&<button type="submit" form="nexpen-sheet-form" className="fab sheet-action-fab sheet-action-save" title={i18n("儲存")} aria-label={i18n("儲存")}><Check size={25}/></button>}
{!templateEditorId&&editing&&( ['transaction','account','stock','recurring'].includes(dialog)||dialog==='category'&&!!editing.name||dialog==='project'&&!!editing.id||dialog==='accountType'&&!!editing.id)&&<button type="button" className="fab sheet-action-fab sheet-action-delete" title={i18n("刪除")} aria-label={i18n("刪除")} onClick={()=>{if(dialog==='category'){const flow=editing.categoryType||form.categoryType;const main=editing.mode==='sub'?editing.parent:editing.name;const sub=editing.mode==='sub'?editing.name:undefined;void delCategory(main,sub,flow).then(deleted=>{if(deleted)close()});}else if(dialog==='project'){void deleteProject(editing).then(deleted=>{if(deleted)close()});}else if(dialog==='accountType'){void deleteAccountType(editing).then(deleted=>{if(deleted)close()});}else{void remove(({transaction:'records',account:'accounts',stock:'stocks',recurring:'recurring'})[dialog],editing.id)}}}><Trash2 size={19}/></button>}
 </div></div></div>}
 {categoryPickerOpen&&dialog==='transaction'&&createPortal(<div className="transaction-category-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)setCategoryPickerOpen(false)}}><section role="dialog" aria-modal="true" aria-label={i18n('選擇分類')} className="transaction-category-dialog"><div className="transaction-category-dialog-head"><h3>{i18n('選擇分類')}</h3><button type="button" className="transaction-category-close" title={i18n('取消')} aria-label={i18n('取消')} onClick={()=>setCategoryPickerOpen(false)}><X size={22}/></button></div><div className="transaction-category-columns"><div className="transaction-category-column transaction-category-mains" aria-label={i18n('主分類')}><div className="transaction-category-column-title">{i18n('主分類')}</div>{Object.keys(categories[form.type]||{}).map(main=>{const Icon=CATEGORY_ICONS[categoryIcons[`${form.type}/main/${main}`]||suggestedIcon(main)]||Tags;return <button type="button" key={main} className={'transaction-category-choice'+(categoryPickerMain===main?' is-selected':'')} onClick={()=>setCategoryPickerMain(main)} aria-pressed={categoryPickerMain===main}><span className="transaction-category-icon"><Icon size={17}/></span><span>{i18n(main)}</span></button>})}</div><div className="transaction-category-column transaction-category-subs" aria-label={i18n('子分類')}><div className="transaction-category-column-title">{i18n('子分類')}</div>{(categories[form.type]?.[categoryPickerMain]||[]).map(sub=>{const Icon=CATEGORY_ICONS[categoryIcons[`${form.type}/sub/${categoryPickerMain}/${sub}`]||categoryIcons[`${form.type}/main/${categoryPickerMain}`]||suggestedIcon(categoryPickerMain)]||Tags;return <button type="button" key={sub} className={'transaction-category-choice'+(form.mainCategory===categoryPickerMain&&form.subCategory===sub?' is-selected':'')} onClick={()=>{setForm(f=>({...f,mainCategory:categoryPickerMain,subCategory:sub}));setCategoryPickerOpen(false)}}><span className="transaction-category-icon"><Icon size={16}/></span><span>{i18n(sub)}</span></button>})}</div></div></section></div>,document.body)}
 </div>;
}
