# NEXPEN v311 — 美股收盤價取得穩定性修正

- `scripts/fetch_us_market_quotes.py`：美股標的使用最多 8 條工作執行緒並行讀取；Stooq 無法讀取時改查 Yahoo Finance；每個供應商有連線逾時控制。
- 重新部署時先嘗試保留本地或目前公開網站上仍在 14 天有效期限內的行情，避免單一來源故障將已有價格清空。
- 若連 AAPL 都無法取得有效價格，工作流程明確失敗，而非發布貌似成功、實際缺乏美股價格的版本。
- `.github/workflows/deploy.yml`：不再忽略美股下載失敗；部署前檢查 `us-market-quotes.json` 及 AAPL 價格。
- `vite.config.js`：版本編號更新 v311；保留原 React、Flask 無關的前端介面及台股行情功能。
- `tests/test_us_quotes311.py`：測試單檔失敗時既有行情仍保留、過期行情拒絕使用。

## 部署與驗證
推送整個 `nexpen` 專案到既有 GitHub 倉庫的 main 分支；Actions 通過後開啟
`https://zeal-teng.github.io/nexpen/us-market-quotes.json`，確認有 `US:AAPL`。
在 APP 點選更新行情，確認台股與美股報價、持股信託 SUMMARY 均正確。

## 限制
此專案採純靜態 GitHub Pages。未列入公開行情檔的美股仍可能受到瀏覽器端 Yahoo Finance CORS 限制，無法保證所有美股代號均有報價。即使行情缺失，原有台股信託仍應計算，並提示未取得行情。
本次環境未能安裝 npm 套件，未完成完整 Vite build；單元測試及 Python 語法檢查均通過。
