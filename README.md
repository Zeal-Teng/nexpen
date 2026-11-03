# NEXPEN Liquid — iPhone React PWA

以使用者提供的 NEXPEN HTML 邏輯為基礎，改寫成 React + Vite + Dexie (IndexedDB) 的 iPhone Liquid Glass 風格記帳 App。

## 已有功能
- 日記帳：按日／週切換、收入／支出／轉帳、篩選、新增／編輯／刪除
- 資產帳戶：現金、銀行、證券交割、信用卡、電子錢包；依期初餘額與帳目即時計算餘額
- 總覽：淨資產、月份收支、支出圓餅圖、帳戶餘額圖
- 股票：買進、賣出、股利、持股成本、以最後記錄價估算市值，連動交割帳戶
- 定期交易：新增、編輯、手動執行並推進下一日期
- 收入／支出主分類與子分類
- 亮色／暗色主題、JSON 完整備份／還原
- iPhone 主畫面安裝、Service Worker 離線快取

## 啟動
需要 Node.js 20.19+ 或 22.12+。

```bash
npm install
npm run dev
```

## 部署 GitHub Pages
1. 建立公開 repo，例如 `cyberpulse-liquid`。
2. 建置時設定 `VITE_BASE_PATH=/cyberpulse-liquid/ npm run build`。
3. 將 `dist/` 以 GitHub Actions 部署到 Pages；建議正式 repo 設 GitHub Pages / Actions 為來源。
4. 用 iPhone Safari 開啟 Pages 網址 → 分享 → 加入主畫面。

建議 GitHub Actions 中使用 `npm ci` (有 package-lock.json 時) 、`npm run build`、`actions/upload-pages-artifact`、`actions/deploy-pages`。

## 本次修正
- iPhone 底部導覽列顯示全部七個分頁，避免「分類」功能在手機上無入口。
- 本環境已檢查原始碼與部署設定，但缺少 npm 依賴快取，無法在此完成 Vite build；請在可連 npm 的 Mac 上執行 `npm install && npm run build` 驗證。

## 重要注意事項
- PWA 程式檔案公開，但使用者記帳內容只存在使用中的裝置／網站來源 IndexedDB，不會自動傳到 GitHub。
- iOS 網頁資料可能因裝置清除網站資料、儲存空間管理或重裝而遺失，請定期備份。
- 匯出備份為明文 JSON，含財務資訊。若需高隱私，應先加入備份加密，不要直接把明文分享到不受信任位置。
- 此版為功能原型，尚無 Google Drive OAuth 自動備份；iCloud Drive / Google Drive 手動備份使用 iPhone 系統分享與 Files。
- 股票以最後記錄的交易價估值，非即時股價；不包含完整稅務、手續費折讓、多幣別、除權息及精確成本會計。
- 原範例的餘額屬示意值，本版本**不載入示例金額**，避免誤認為實際資產。
- 定期交易不使用背景定時排程，必須手動執行一次。

## 2026-11-02 修正：區域網路 Safari 儲存錯誤
修正 `crypto.randomUUID is not a function`：`src/db.js` 的 `uid()` 現已兼容非 HTTPS 區域網路瀏覽情境。
如已在本機啟動 Vite，儲存檔案後重新整理頁面；若使用舊 ZIP，請改用修正版覆蓋專案檔案。

## Mobile navigation update
- On screens up to 800px, the top glass header is hidden.
- Bottom bar: 日記帳 / 總覽 / 股票 / 設定.
- Inside 設定 → 記帳管理, open 帳戶管理 / 定期交易 / 分類管理. A 返回設定 control appears on those subpages.
- Desktop sidebar and existing IndexedDB data are unchanged.

## v3 — Neon Liquid iPhone 介面
- 手機版隱藏頂端 Topbar，底部保留日記帳／總覽／股票／設定。
- 帳戶、定期、分類集中在設定。
- 全站以深色霓虹科技感玻璃樣式呈現（不影響本機資料庫）。
- 所有原生 `<select>` 換成 React 點選面板，避免 iPhone Safari 原生滾輪/下拉選單。
- 交易金額、期初餘額、股票金額／費用使用內建計算鍵盤；支援 +、−、×、÷、小數、清除與退格。
- 新增交易時子分類預設為主分類第一項；切換主分類或交易類型會同步選第一項。
- 使用原 IndexedDB `cyberpulse_liquid_v1`，不改資料庫版本，既有資料不需清除。
- 這是原始碼版本；尚未在 iPhone Safari 完成實機驗證，建議先備份重要資料。


### v4 日記帳緊湊模式
- 交易列表次要資訊只顯示「子分類 · 帳戶」，不再顯示主分類。轉帳維持「帳戶轉帳」。
- iPhone 日記帳縮小日期卡片，將三張收支卡改為無背景的分隔摘要列，交易清單取消外框卡片並縮減留白。桌面版與其他頁面原樣保留。
- 不變更 IndexedDB schema；無須清除現有資料。


## v5 更新
- 日記帳交易明細的標題區移除重複日期，顯示筆數。
- 頁首右側不再重複顯示當日日期，改顯示當月／模組情境。
- 分類頁改為清晰的深色高對比清單，可編輯主分類和子分類名稱、增刪分類。
- 分類改名時，使用 Dexie 資料庫交易同步更新舊記帳交易及定期排程的名稱引用。
- 更新程式不會清空原有 IndexedDB，建議更新前先匯出 JSON 備份。


## v6 外幣帳戶
- 帳戶可選 TWD/USD/JPY/EUR/CNY/HKD/GBP/AUD/SGD/KRW/CAD/CHF。原幣餘額保留在 IndexedDB；總資產與收支統計以帳戶儲存的匯率折算 TWD。
- 1 外幣 = x 新台幣。帳戶編輯可連網向 Frankfurter API v2 自動取得參考匯率，也可手動輸入。離線時使用已存的匯率。參考匯率並非銀行成交價。
- 現階段避免跨幣別轉帳被錯誤記為等額；跨幣別轉帳尚未實作換匯交易模型，會提示限制。證券交割限 TWD 帳戶。
- 既有帳戶預設 TWD，不刪除資料庫；建議升級前先匯出 JSON 備份。


## v7 更新
- 帳戶依銀行、現金、信用卡、電子支付及證券交割戶分群；各群顯示台幣換算合計。
- 保留各帳戶原幣餘額、即時/儲存匯率與本機 IndexedDB 結構，不更改資料庫版本。
- 全 App 採 MOZE 氣質參考的原創深灰色扁平財務介面，卡片圓角縮小至 10–15px，降低玻璃反光及大面積漸層。
- 更新前請匯出 JSON 備份；此版本未進行實體 iPhone 驗證。


## v23 — Google Drive 加密自動備份（Beta）

- 在「設定 → Google Drive 加密備份」貼上 Google OAuth 2.0 **Web client ID**（不是 client secret）。
- Google Cloud Console 建立或選擇專案、啟用 Google Drive API、設定 OAuth consent screen（測試模式需把自己加入 Test users）。
- 在 Authorized JavaScript origins 新增 **真正的 HTTPS GitHub Pages origin**，例如 `https://youraccount.github.io`。不要帶路徑 `/cyberpulse-liquid/`。Localhost 開發時可加 `http://localhost:5173`。區域網路 `http://192.168.x.x:5173` 不是安全來源，無法正式測試 Web Crypto。
- 在設定中選「啟用自動備份」並儲存，按「連結 Google Drive」，以 Google Identity Services 授權 `drive.appdata`。
- 輸入 **至少 12 字元** 的備份密碼，按「解鎖備份」，然後按「立即備份」完成首次驗證。備份密碼只保存在執行中的 JavaScript 記憶體，關閉 App 或重新整理後需要重輸。
- 開啟 App 且已解鎖並授權時，會在進入前景、網路恢復、每 60 秒檢查本機快照內容差異；短時間內的修改會合併。iPhone 關閉 App 後不能保證背景執行。授權過期需要使用者再次授權。
- 在「查看雲端備份版本」點選版本，輸入備份時使用的密碼。系統會下載、解密和驗證備份，顯示帳戶／交易筆數，要求二次確認；也會先觸發目前資料的 JSON 安全副本下載。**必須確認安全副本真的已保存後再按確認**。
- 備份存於 Google Drive 隱藏的 `appDataFolder`，不能直接在一般 Drive 網頁瀏覽。僅保留最新 30 個成功備份（舊版清理為 best-effort）；另外請手動保留本機可攜式備份。
- 純前端不包含 Refresh Token；Token、密碼均不永久儲存。設定只儲存公開 OAuth Client ID、備份狀態與最近成功紀錄。
- 若 Google API 被瀏覽器阻擋、OAuth 驗證未完成，或離線，App 仍然可本機記帳。
- 從舊版升級時請先匯出既有 JSON 備份；無需清除 IndexedDB。

**安全限制**：本功能為個人使用的 Beta，未經第三方安全稽核。Chrome/Safari 的瀏覽器環境與憑證安全性不等於原生 iOS Keychain。請使用密碼管理器保存加密密碼。



## v25 iCloud Drive 手動備份／還原
設定 → iCloud Drive 備份 → 立即備份（分享或下載 JSON，手動存入 iCloud Drive）／立即還原（iOS 檔案選擇器選取 JSON，再確認覆寫）。不需要 Google OAuth、密碼或網路空間 URL。資料仍保留在 IndexedDB。
限制：PWA 無權背景讀寫 iCloud Drive 指定資料夾，也無法自動找出最新檔案。還原必須由使用者自行選擇。

## v26 自動本機備份
- IndexedDB schema v2 adds localBackups table independent from data restore.
- Dexie liveQuery observes original records/accounts/stocks/recurring/settings; debounces snapshots by 2.2 seconds.
- Stores last 30 local JSON snapshots, only saves changed content unless manual.
- Settings provides one-click newest restore and historical selection.
- Restore creates pre-restore backup; cloud JSON workflow remains available.
- IMPORTANT local backups reside in the same browser storage and do not protect against device loss, browser clearing or storage eviction.


## v29 — 僅保留 iCloud Drive 手動備份與還原
- 基於 v28：保留帳戶類型獨立管理與四個主頁的 padding 調整。
- 移除自動本機備份、30 份歷史快照、設定頁相關按鈕及自動監聽。
- Dexie 升級至 v3，刪除舊版 `localBackups` 表，不動交易、帳戶、股票、排程、設定等資料表。
- 設定頁僅保留 iCloud Drive「立即備份／立即還原」。備份產生 JSON 並使用 iOS 分享／檔案選擇器；還原前顯示筆數並請使用者確認。
- 注意：iPhone PWA 不支援直接寫入指定 iCloud 資料夾，這仍是手動檔案備份；JSON 包含明文財務資料，請保護 iCloud 帳號。
- 升級前請先用 v28 的「立即備份」匯出一份 JSON，以防誤操作。

## v30 備份分享修正
- macOS / Windows 瀏覽器直接下載 JSON，不再先執行 `navigator.share`，避免 Chrome `Permission denied`。
- iOS Safari / PWA 可使用系統分享表單；若分享權限遭拒，改為下載 JSON。
- 取消分享不會顯示錯誤。


## v31 股票股利顯示修正
股票現金股利由 stocks 投影到日記帳、每日與每月收入統計；不寫入 records，避免 accountBalance 已經納入 stocks 後造成重複計算。點選日記帳內的股利會開啟對應股票交易以編輯。股票交易歷史顯示交割／入帳帳戶。


### v33 股票費稅試算
新增一般股票、一般 ETF、債券 ETF 選項；股票現股當沖（僅在符合法規情況下使用）；預估買賣手續費為成交金額 × 手續費率 × 折扣，另依設定最低手續費；賣出依證券類型估算證交稅。稅率依截至 2026-11-03 已公告規則，債券 ETF 暫停課稅至 2026-12-31，之後先以一般 ETF 稅率預估，實際以券商交割單為準。既有交易保留手動費稅。


## v36 官方 ETF 代號分類規則
依據證交所「ETF 證券代號編碼原則」（2025-05-05）調整 `src/stockType.js`。
* `B/C` 為債券型 ETF、`D` 為債券主動式 ETF。
* `A/T/L/M/R/S/U/V/K` 為特殊 ETF，介面提示人工核對稅率。
* 六碼數字與既有 `00` ETF 依編碼範圍推定；不推定「已上市」。
* 不查詢股票名稱、無需網路；無法確認的代號不強迫分類。

修改此檔即可更新 v35；不更動 IndexedDB、帳戶或手續費設定。


## v37 股票成本、行情與數字鍵盤
- 含買進手續費之持股平均成本顯示 2~4 位小數。
- 手動按「更新最近收盤價」讀取證交所 STOCK_DAY_ALL（受瀏覽器 CORS 和交易所更新時間限制），失敗時不把成交價格冒充市價。也可為個別持股填寫參考價格。
- 總覽有任何未取得行情的持股時，損益顯示待取得報價；已取得行情的持股另在列上顯示估算損益（未扣未來賣出費稅）。
- 股票股數、券商折扣、最低手續費、外幣匯率等原本 number 欄位改用內建計算鍵盤。
- 股票行情是參考估值，並不代表即時行情，也不保證全部上市上櫃商品能取得。


## v38 官方收盤價
使用證交所 `STOCK_DAY_ALL` 與櫃買中心 `tpex_mainboard_quotes` 兩份官方資料更新上市、上櫃持股的收盤價格。兩市場獨立請求、以 ROC 日期轉換 ISO 日曆日期、保留較新的有效報價；未取得時不顯示虛構價格。移除個股「填寫價格」按鈕。瀏覽器需允許官方 API 的 CORS。


## v39: 股票頁自動更新，跨網域修正
- **本機 `npm run dev`**：Vite 以同網域 `/api/quotes/twse`、`/api/quotes/tpex` 代理請求到 TWSE／TPEx，避免 Chrome CORS 錯誤。
- **GitHub Pages**：GitHub Actions 於平日台灣時間 15:35、19:30 及每次部署，透過 `scripts/fetch_market_quotes.py` 下載官方資料，產生 `public/market-quotes.json` 後一起部署。PWA 從同一 GitHub Pages 網域讀取。
- 每次進入「股票」頁籤自動檢查收盤價；5 分鐘內切換回來不重複請求；另提供手動「更新上市／上櫃收盤價」。
- 官方資料取得失敗不會用 0 覆寫持股報價，並保留上次成功價格。
- GitHub Actions 的 schedule 不是精準定時器，且官方站台可能阻擋雲端 IP (403)。某一市場失敗時會保留使用者裝置裡舊的有效資料；兩市場皆失敗時此次 deployment 會失敗，避免用空白行情覆蓋前次網站。
- 此版本不需要 Cloudflare Worker 或自行部署後端；但需要啟用 GitHub Actions Pages 工作流程。上市、上櫃只抓到最近交易日收盤，不是即時行情。


## v40 上市／上櫃官方 ISIN 名稱自動辨識

- 股票交易輸入代號後約 450ms，自動帶入 ISIN 官方名冊中的證券名稱、上市／上櫃市場及股票／ETF 稅別。
- GitHub Pages 的部署工作流程會抓取兩個 ISIN 公開表格並產生 `public/security-catalog.json`；前端只讀取同網域 JSON，避免 CORS。
- `npm run dev` 則經由 Vite 代理讀取 ISIN 頁面，瀏覽器用 `TextDecoder('big5')` 解碼。
- 遇到官方來源無回應或查無代號，保持手動編輯，不阻止交易儲存。
- ISIN 官方資料含多種有價證券，僅保留明確的股票／ETF 分類；稅率仍需核對個別產品。
- GitHub Actions 的定時部署若抓不到名冊會失敗以防發布空資料；已成功上線的舊版網站不會因此被清除。


### v41 開啟 App 背景更新股票資訊
- 開啟 App 時，背景更新上市/上櫃 ISIN 股票名冊（24 小時內已成功更新則使用快取），並存入 IndexedDB `marketCache`。
- 股票名稱與類型辨識優先使用本機名冊；離線時保留最近一次成功的名冊。不把完整公開名冊加入財務 JSON 備份。
- 若有持股，App 開啟後立即檢查上市/上櫃收盤行情，保留原本每五分鐘防重複機制；最新有效價格保存在 IndexedDB 設定 `stockClosingQuotes`。
- GitHub Pages 的名冊及行情 JSON 仍由 GitHub Actions 定期更新。PWA 開啟時讀取本站檔案，不直接跨網域讀取官方網站。
- 公開資料更新失敗不會中斷記帳，不會以空白資料覆蓋已有價格或名冊。


## v43 更新
- 賣出時只能從仍有持股的清單選擇代號，且驗證不超賣；編輯時排除當筆交易重算可賣量。
- 股票摘要改成成本、市值雙欄 + 損益獨立列，適合手機窄螢幕。
- 最近收盤更新日期移至目前持股標題右側。
- 所有買賣和股利都投影在日記帳。買賣是資產配置變動，不計入日常收支；股利仍屬收入。這些虛擬交易不會再寫入 records，防止帳戶資產重複扣加。

## v44 修正版本
重新正確寫入 App.jsx；v43 壓縮包曾遺漏修改。開發者工具 Console 可看到 NEXPEN v44 的載入標示。


## v45 UI
- 賣出時股票代號維持空白，需點開 SmartSelect 才能挑選持股；保存時仍檢查可賣股數。
- 目前持股「含費均價」改「均價」（仍含手續費）。
- 股票右下角獨立收盤價更新浮動按鈕，與新增交易按鈕上下分開。
- 日記帳移除上方 page-head、交易明細 section-header；日曆面板移除背景與邊框，分類篩選移到 calendar-header。

## v48 股票已實現／未實現損益
- 股票頁「目前持股」點進單檔買賣及股利歷史；「已實現交易」彙總所有發生賣出的股票（含已清倉與部分賣出）；只有股利的代號列於「其他股票紀錄」。
- 未實現：官方最近收盤價 × 持股股數 − 含買進手續費的剩餘成本；報酬率 = 未實現損益 ÷ 剩餘成本 × 100%。缺少報價則不顯示百分比。
- 已實現：賣出淨收入（含扣除手續費與交易稅）− 依移動平均成本分攤的賣出成本；報酬率 = 已實現買賣損益 ÷ 已售成本 × 100%。股利獨立顯示，不混入價差報酬率。
- 成交日期相同的多筆交易如無時間戳，仍依本機資料列舉順序計算，建議核對券商實際成交與交割紀錄；不含除權息成本調整及複雜公司行動。原資料庫不更動。
- `node scripts/test_stock_performance.mjs` 可測試純績效演算法。


## v49：指定買進批次沖銷
賣出時需選擇一筆已有剩餘股數的買進交易，並依該批次含手續費成本計算實現損益。
單筆賣出僅能沖銷一筆買進；若需沖銷多筆買進，請拆成多筆賣出紀錄。
既有未指定 `matchedBuyId` 的舊賣出交易沿用移動平均成本法。
指定沖銷的交易將 `matchedBuyId` 儲存於現有股票交易資料；JSON 備份自然包含此欄位。
測試：`node tests/stockLots.test.mjs`。


## v50 UI
新增六款科技配色（賽博霓虹／矩陣綠光／量子紫光／鈦金科技／極光介面／熔岩橘光），沿用設定頁主題持久化。日記帳交易篩選移至搜尋框右側；日期列保留今天按鈕。


## v51 手機介面微調
手機版所有分頁隱藏 page-head；日記帳交易篩選 smart-select 與日曆「今天」控制區同寬（84px），搜尋框自動填滿剩餘空間。桌面版不變。


## v53 幣別標示與定期交易說明
設定主要貨幣後，帳戶、日記帳及排程的單筆資料，僅在原幣別不同於主要貨幣時顯示 ISO 幣別代碼；總額仍按主要貨幣換算，交易不會改寫。股票買賣原幣為 TWD，主要貨幣非 TWD 時，在每股單價附上 TWD 提示。
定期交易仍為手動執行：iOS PWA 關閉後不能可靠在背景排程寫入 IndexedDB。若要自動執行，應另外實作「重新開啟／回到前景時補登到期交易」並採用可重試的唯一執行鍵防重。


## v54 帳戶金額幣別顯示一致性
將帳戶與日記帳單筆金額改為數值本身；若單筆帳戶幣別不同於設定的主要貨幣，才在帳戶名稱下方（或交易帳戶標籤）顯示 ISO 幣別碼，如 TWD。相同幣別不顯示多餘代碼或 US$/NT$ 前綴。總額仍以主要貨幣標示。此更動僅涉及 UI，不修改帳戶、匯率、持股或交易資料。


## v55 帳戶貨幣與摘要顯示
帳戶列表中：若帳戶幣別與主要貨幣相同，金額僅顯示數值；不同時在該筆原幣金額前顯示 ISO 幣別，例如 `TWD -58,051`。避免重複於名稱下方展示。帳戶頁頂端資產總額及帳戶類型小計僅顯示數值，不再帶 `US$` / `NT$` 前綴；換算仍依主要貨幣進行，介面說明文字保留換算單位。本次不改匯率與記帳資料。


## v56 主貨幣與原幣標籤一致化
- 日記帳、總覽及股票的**換算彙總**只顯示數字；依使用者的主要貨幣理解單位。
- 日記帳單筆收入／支出／股票及定期交易採**原幣金額**；原幣不同於主要貨幣時，在金額前標示 `TWD`、`USD` 等 ISO 代碼，否則不標。
- 股票均價、收盤價和歷史交易為 TWD 原幣，主貨幣非 TWD 時標示 `TWD`；持股市值及損益為主要貨幣換算結果，僅顯示數字。
- 帳戶總額及分組小計維持 v55 純數值；不修改 IndexedDB、交易計算或匯率。


## v58 關聯資料刪除保護
帳戶、帳戶類型、收入／支出主子分類、專案刪除前，會從 IndexedDB 重新讀取關聯資料並禁止刪除使用中的項目。
帳戶關聯包含一般交易、雙向轉帳、股票交易、定期排程；分類包含一般交易、定期排程及虛擬股票股利。
修改名稱功能保留，沒有關聯資料者仍可以確認後刪除。


## v61 股票損益排版與隱藏 scrollbar
- 股票未實現／已實現損益金額與百分比分行顯示。
- 持股清單個股損益金額與報酬率分行顯示。
- 全站（含內嵌滑動面板）僅隱藏 scrollbar 外觀，保留觸控、滑鼠滾輪與鍵盤捲動。


## v62 投資帳戶及每月追加投入
- 「帳戶管理」新增持股信託與投資保單帳戶，初始成本可為零；後續成本以投資資金異動 `investmentFlows` 累計。
- 「投資」頁有股票／持股信託／投資保單三個區塊。
- 持股信託的估算現值＝（初始張數＋追加張數）×1000×官方最近收盤價；若尚無有效報價則不估損益。
- 投資保單現值以手動更新的數字為準；追加保費僅增加累計成本，不會自動增加保單現值。
- 追加投入可選同幣別的銀行／現金來源，支出直接計入該帳戶餘額的資金流動（不列為生活支出），不會重複寫入一般交易。
- 目前只支援追加投入，不包含贖回、減資、股利收益等完整投資帳務；請勿以刪除或改寫初始成本替代贖回記帳。
- v5 Dexie 包含 `investmentFlows`、`investmentValuations`；JSON 備份格式 v2（可還原舊版 v1）。
- 投資帳戶有資金異動、估值紀錄，或成為其他投入的資金來源時，不允許直接刪除。


## v63：投資 ListView 與異動紀錄編輯刪除
- 投資入口改成股票／持股信託／投資保單的 ListView，點擊進入各類別。
- 持股信託與投資保單的資金異動、保單估值歷史可以點擊編輯；刪除需要確認。
- 投入修改／刪除會由 investmentFlows 重新推導成本、張數及來源帳戶餘額，避免重複入帳。
- 保單估值歷史修改／刪除會依日期及建立次序更新帳戶上的最新保單現值。若無紀錄，現值歸零。
- 既有 IndexedDB v5 不變，JSON 備份包含這些紀錄。


## v67 更新
- 投資總覽移除 glass panel 外層卡片，保留可點擊的投資績效列表。
- 日記帳增加「日檢視／月檢視」；月檢視列出該月所有交易，依日期由新到舊分組。
- 月檢視支援月份選擇、上下月切換，搜尋及交易類型篩選持續生效。
- 統計列在月模式顯示整月支出、收入及淨額，股票買賣仍不列為日常收入與支出。


## v70 GitHub Pages 官方行情／名稱部署注意
請將**完整專案**（包含 `.github/workflows/deploy.yml`、`scripts/`、`vite.config.js`）推送到 GitHub `main`，不能只複製 `src/App.jsx`。在 GitHub → Actions → Deploy GitHub Pages，確認 `Fetch official market closing quotes`、`Fetch official listed and OTC securities catalog`、`Verify official data`、`deploy-pages` 皆成功。
部署後到網站路徑 `https://<使用者>.github.io/<repo>/market-quotes.json` 與 `/security-catalog.json` 檢查是否可讀。如果 404，代表資料根本沒有生成或沒有部署，而不是瀏覽器端 CORS。
官方服務可能阻擋 GitHub runner；此版使用重試、TWSE/TPEx 行情提供的名稱做 ISIN 備援，並在 CI 明確檢查。若官方來源全部不可用，部署應失敗以避免把空資料當成成功。GitHub Pages 保留上次成功部署版本。

手機表單依兩欄最小寬度和 50px 固定輸入高度排版，日期及金額不互相覆蓋。viewport 關閉手勢縮放會影響放大閱讀需求，請用 App 內字體大小設定。


## v72 GitHub Pages 部署修正
`fetch_security_catalog.py` 不再連線 ISIN，改讀取先前 `fetch_market_quotes.py` 生成的 `public/security-market-names.json`。避免 ISIN 無回應卡住部署。名冊僅包含官方收盤行情中能取得名稱的證券，非完整 ISIN 名錄。
