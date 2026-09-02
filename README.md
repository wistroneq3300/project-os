# ProjectOS — 測試排程規劃工具

一個**純前端、完全可編輯**的測試排程規劃 Web App,用來規劃專案的硬體
Bring-up / 驗證測試時程。資料存於瀏覽器 `localStorage`,全部可自行編輯。

## 怎麼跑

```
python3 -m http.server 8090
# 瀏覽器開 http://localhost:8090
```

## 功能

- **總覽 Dashboard** — 專案數、平均進度、測試項目統計、待辦項目、狀態環形圖。
- **排程規劃** — 三層結構:專案 → 階段 → 測試項目,全部可新增/編輯/刪除:
  | 專案 | 階段(如 EB1 / EB2 / TS1 / TS2)| 測試項目(欄位同 Excel) |
  |------|------|------|
  | `neutrino` | EB1 / TS1 / TS2 | PCBA/Function · Task · Validation · Start · End · Remark · 狀態 |
- **甘特圖** — 依階段切換;**拖曳橫條**移動時程、**拖曳左右兩端**調整天數;月份表頭 + 週格線 + 群組區隔。

所有編輯即時存進 `localStorage`;右上角「↻ 還原匯入資料」可回到 Excel 匯入的原始內容。

## 資料來源

起始資料由 **`Daily Schedule.xlsx`**(硬體 Bring-up 排程表)經 `tools/import_schedule.py`
匯入產生 `assets/js/data.js`:

- 單一專案 `neutrino`,3 個階段(EB1 / TS1 / TS2),33 個測試項目。
- EB2 區塊在 Excel 中無任務,故略過。
- 重新產生:`python3 tools/import_schedule.py`(需 openpyxl)。

> 因為網頁可編輯,實際使用的資料存在瀏覽器 `localStorage`,
> `data.js` 只是「初始匯入資料」。要重置時按「還原匯入資料」。

## 檔案結構

```
index.html              主畫面與各視圖容器
assets/css/styles.css   基礎樣式(深色/亮色主題,品牌色 #ffb224)
assets/css/planner.css  排程表格 + 可編輯甘特圖樣式
assets/js/data.js       初始匯入資料(PROJECTS 常數)
assets/js/charts.js     手刻 SVG 圖表(環形圖)
assets/js/app.js        資料層(localStorage)＋路由＋排程表格＋可拖曳甘特圖
tools/import_schedule.py  Excel 匯入程式(→ data.js)
Daily Schedule.xlsx     原始排程表
```

## 資料結構

```js
PROJECTS = [{
  id: 'neutrino',
  name: 'neutrino',
  color: '#ffb224',
  stages: [{
    id: 'eb1',
    name: 'EB1',
    color: '#ffb224',
    items: [{
      id: 'eb1-1',
      group: 'Baseboard',        // PCBA / Function 欄位
      task: 'Early Bring up...',
      validation: '',
      start: '2026-09-06',
      end:   '2026-09-06',
      remark: '',
      status: 'todo',            // todo | doing | block | done
    }],
  }],
}]
```
