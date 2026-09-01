# ProjectOS — 專案管理工作台 (monday.com 風格原型)

一個**純前端**、無任何依賴(不用 CDN 套件,連圖表都用原生 SVG 手刻)的專案管理 Web App 原型。
靈感來自 monday.com,功能聚焦在「**專案**」:總覽、任務、甘特圖、預算 Waterfall。

## 怎麼跑

```
# 方式一:直接用瀏覽器開 (較建議用方式二,避免 fetch 限制)
open index.html

# 方式二:起個靜態 server
python3 -m http.server 8090
# 然後瀏覽器開 http://localhost:8090
```

## 功能總覽

| 視圖 | 對應 monday | 說明 |
|------|------------|------|
| **總覽 Dashboard** | Dashboards + 儀表板 widget | 4 個指標卡、各專案進度條、任務狀態環形圖、最近待辦任務 |
| **專案 & 任務** | Board + Table view | 專案 Tab 切換、任務打勾/改狀態、進度、負責人、期間 |
| **甘特圖** | Timeline view + Dependency | 時間軸任務色條 + 任務相依性箭頭 + 月份格線 + 里程碑 |
| **預算 Waterfall** | 成本分析 widget | 預算 → 已投入 → 剩餘 的增減拆解,附預算摘要 |

## 資料怎麼換成你自己的

所有假資料都集中在 **`assets/js/data.js`**,是一個結構清楚的常數 `PROJECTS`。
之後要接真實資料,有三條路:

1. **接 monday API** — 在你的後端用 Monday GraphQL `boards` query,
   把回傳轉成下面的結構。
2. **匯入 CSV** — 前端加一個 `<input type=file>` 讀 CSV 轉成結構。
3. **後端 API** — 把 `data.js` 改成 `fetch('/api/projects')`。

### 資料結構

```js
{
  id: 'web',            // 唯一 id
  name: '官網改版',      // 專案名
  color: '#ffb224',     // 專案代表色
  status: 'doing',      // todo | doing | block | done
  budget: 480000,       // 總預算(數字)
  spent: 312000,        // 已投入成本
  manager: 'alan',      // 負責人 id
  tasks: [{
    id: 'w1',
    name: '需求訪談',     // 任務名
    status: 'done',      // 同上
    owner: 'alan',       // 負責人 id
    start: '2026-07-01', // ISO 開始日期
    end:   '2026-07-14', // 結束日期
    progress: 100,       // 0-100
  }],
  deps: [[ 'w1','w2']],  // 任務相依性:前必須完成,才能開始 'w2'
}
```

## 檔案結構

```
index.html          主畫面與各視圖容器
assets/css/styles.css  全部樣式(深色主題,品牌色 #ffb224)
assets/js/data.js      假資料(單一事實來源)
assets/js/charts.js    手刻 SVG 圖表(donut 環形圖、waterfall)
assets/js/app.js       路由、互動、甘特圖、圖表驅動
```

## 下一步(尚未做)

- 新增/編輯專案與任務的 modal 表單
- 拖曳式甘特圖(可改日期/狀態)
- 多專案瀑布圖(全部專案同圖比較)
- 接 monday API / CSV 匯入
- 登入與團隊成員管理
