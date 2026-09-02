# ProjectOS — 給下一個開發對話的必讀注意事項

**先讀這段,再動手。** 這個專案是**多人共用**的排程工具,資料不是純本機玩具。

## ⛔ 【最高優先】絕對不要重置 `data.json`

- **絕不可以**把 `data.json`「重置回種子 / 清空 / rev 歸 0 / 用 seed 覆寫」。
- 這是**共享伺服器正在用的正式資料**,所有使用者的排程都在裡面。重置 = 大家辛苦加的資料全部消失(已經出過一次事故)。
- 測試要乾淨資料時,**改用備份檔或複製一份到別處**(例如 `data.json.test`),**絕不能動正式 `data.json`**。
- 同理:不要亂刪 `assets/js/data.js` 的種子、不要改資料結構不遷移。

## 🚀 怎麼跑(一定要用共享模式)

```bash
node server.js 8090
# 瀏覽器開 http://你的IP:8090 → 同事在各自電腦開同一網址共享
```

- **用 Node,不是 python http.server**(python 是純本機單機模式)。
- 資料存伺服器端 `data.json`,所有使用者共享、即時同步(4 秒輪詢)。
- 兩人同時編輯衝突 => 回 409,前端會彈提示(保留自己的 / 載入對方最新)。

## 🛡️ 已有備份機制(別以為沒備份就亂動)

- 伺服器每次覆寫前自動備份 `data.json.bak`。
- 前端每次儲存會多存 `localStorage` 的 `-bak` 副本。
- 恢復:把 `.bak` 複製回 `data.json` 即可(會失去那次覆寫,但總比全丟好)。

## 🔍 怎麼查目前線上資料

```bash
curl -s http://localhost:8090/api/data
# 回傳 { rev, data } — data 是完整排程
```

## ⚙️ 測試時的安全做法

- 需要乾淨/假資料 → **先備份正式 data.json**,測完**原樣還原**,不要「reset」。
- 用 Playwright 測試時,若會寫入資料,**測完務必把 data.json 還原成測試前的狀態**。
- 若真的需要獨立的乾淨環境,另起 port 或複製整個資料夾,別動正在跑的那份。

## 📁 專案結構

```
server.js        # Node 共享後端:靜態檔案 + GET/POST /api/data(rev 衝突偵測)
data.json        # 共享資料(正式,勿動、勿重置)
assets/js/app.js # 前端:render / 甘特圖 / 同步邏輯(syncToServer / pullFromServer)
assets/js/data.js# PROJECTS 種子資料(首次本地載入用,勿刪)
index.html       # 含 window.PROJ_SERVER_URL = '/api/data'
```

## ✏️ 已實作(別重做)

- 色彩欄(取代狀態下拉)、色票 popover、自訂色
- 任務行整行可拖排序 + 中間插入(拖曳有黃色插入線)
- 甘特圖 bar 註解文字與依賴虛線文字同為 10px
- 移除甘特圖 legend
- Node 共享伺服器 + 多人同步 + 衝突 409
