/* ============================================================
   ProjectOS — mock data (single source of truth).
   In real use, replace with: monday API GraphQL, CSV import,
   or a backend endpoint.
   ============================================================ */

const STATUS_META = {
  todo:   { label: '尚未開始', color: '#5d6b7e', bg: 'rgba(93,107,126,.18)' },
  doing:  { label: '進行中',   color: '#60a5fa', bg: 'rgba(96,165,250,.15)' },
  block:  { label: '卡關',     color: '#f87171', bg: 'rgba(248,113,113,.14)' },
  done:   { label: '已完成',   color: '#34d399', bg: 'rgba(52,211,153,.14)' },
};

const OWNERS = {
  alan: { name: 'Alan',  color: '#60a5fa' },
  may:  { name: 'May',   color: '#f472b6' },
  john: { name: 'John',  color: '#34d399' },
  soph: { name: 'Soph',  color: '#fbbf24' },
  tom:  { name: 'Tom',   color: '#a78bfa' },
};

// helper: build ISO date from y,m,d
const D = (y,m,d) => `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const daySpan = (a,b) => Math.round((new Date(b)-new Date(a))/86400000);

const PROJECTS = [
  {
    id: 'web',
    name: '官網改版',
    color: '#ffb224',
    status: 'doing',
    budget: 480000,
    spent: 312000,
    manager: 'alan',
    tasks: [
      { id:'w1', name:'需求訪談與競品分析', status:'done',  owner:'alan', start:D(2026,7,1),  end:D(2026,7,14),  progress:100 },
      { id:'w2', name:'資訊架構與線框圖',   status:'done',  owner:'may',  start:D(2026,7,15), end:D(2026,7,31),  progress:100 },
      { id:'w3', name:'視覺設計(首頁/內頁)', status:'doing', owner:'may',  start:D(2026,8,1),  end:D(2026,8,21),  progress:55 },
      { id:'w4', name:'前端開發與 RWD',     status:'doing', owner:'john', start:D(2026,8,15), end:D(2026,9,12),  progress:30 },
      { id:'w5', name:'CMS 串接與測試',     status:'todo',  owner:'tom',  start:D(2026,9,1),  end:D(2026,9,18),  progress:0 },
      { id:'w6', name:'上線部署與驗收',     status:'todo',  owner:'alan', start:D(2026,9,19), end:D(2026,9,30),  progress:0 },
    ],
    deps: [ ['w1','w2'],['w2','w3'],['w3','w4'],['w4','w5'],['w5','w6'] ],
  },
  {
    id: 'app',
    name: '會員 App',
    color: '#60a5fa',
    status: 'doing',
    budget: 650000,
    spent: 208000,
    manager: 'john',
    tasks: [
      { id:'a1', name:'需求定義與功能清單',   status:'done',  owner:'alan', start:D(2026,7,10), end:D(2026,7,24),  progress:100 },
      { id:'a2', name:'UI/UX 流程設計',       status:'done',  owner:'soph', start:D(2026,7,25), end:D(2026,8,14),  progress:100 },
      { id:'a3', name:'後端 API 開發',        status:'doing', owner:'tom',  start:D(2026,8,10), end:D(2026,9,5),   progress:40 },
      { id:'a4', name:'App 開發(iOS/Android)',status:'doing', owner:'john', start:D(2026,8,20), end:D(2026,9,25),  progress:15 },
      { id:'a5', name:'測試與商店上架',       status:'todo',  owner:'may',  start:D(2026,9,26), end:D(2026,10,10), progress:0 },
    ],
    deps: [ ['a1','a2'],['a2','a3'],['a2','a4'],['a3','a5'],['a4','a5'] ],
  },
  {
    id: 'mkt',
    name: 'Q3 行銷活動',
    color: '#f472b6',
    status: 'doing',
    budget: 380000,
    spent: 145000,
    manager: 'soph',
    tasks: [
      { id:'m1', name:'活動策略與預算分配',   status:'done',  owner:'soph', start:D(2026,7,1),  end:D(2026,7,10),  progress:100 },
      { id:'m2', name:'素材製作(圖/影片)',    status:'done',  owner:'may',  start:D(2026,7,11), end:D(2026,7,30),  progress:100 },
      { id:'m3', name:'廣告投放與測試',       status:'doing', owner:'soph', start:D(2026,8,1),  end:D(2026,8,25),  progress:62 },
      { id:'m4', name:'社群媒體曝光',         status:'todo',  owner:'may',  start:D(2026,8,20), end:D(2026,9,10),  progress:0 },
      { id:'m5', name:'成效結算與優化',       status:'todo',  owner:'alan', start:D(2026,9,11), end:D(2026,9,20),  progress:0 },
    ],
    deps: [ ['m1','m2'],['m1','m3'],['m2','m4'],['m3','m5'],['m4','m5'] ],
  },
  {
    id: 'sys',
    name: '內部系統升級',
    color: '#34d399',
    status: 'block',
    budget: 720000,
    spent: 540000,
    manager: 'tom',
    tasks: [
      { id:'s1', name:'現況盤點與需求訪談',   status:'done',  owner:'tom',  start:D(2026,7,1),  end:D(2026,7,20),  progress:100 },
      { id:'s2', name:'系統架構設計',         status:'done',  owner:'tom',  start:D(2026,7,21), end:D(2026,8,9),   progress:100 },
      { id:'s3', name:'資料庫遷移',           status:'block', owner:'john', start:D(2026,8,10), end:D(2026,8,28),  progress:45 },
      { id:'s4', name:'核心模組開發',         status:'todo',  owner:'tom',  start:D(2026,8,29), end:D(2026,10,2),  progress:0 },
      { id:'s5', name:'切換與教育訓練',       status:'todo',  owner:'alan', start:D(2026,10,3), end:D(2026,10,15), progress:0 },
    ],
    deps: [ ['s1','s2'],['s2','s3'],['s3','s4'],['s4','s5'] ],
  },
  {
    id: 'evt',
    name: '年度客戶年會',
    color: '#a78bfa',
    status: 'todo',
    budget: 260000,
    spent: 38000,
    manager: 'may',
    tasks: [
      { id:'e1', name:'主題與流程規劃',       status:'done',  owner:'may',  start:D(2026,8,1),  end:D(2026,8,15),  progress:100 },
      { id:'e2', name:'場地與廠商接洽',       status:'doing', owner:'soph', start:D(2026,8,10), end:D(2026,8,24),  progress:35 },
      { id:'e3', name:'邀請名單與報名系統',   status:'todo',  owner:'alan', start:D(2026,8,25), end:D(2026,9,10),  progress:0 },
      { id:'e4', name:'現場執行與主持',       status:'todo',  owner:'may',  start:D(2026,11,1), end:D(2026,11,3),   progress:0 },
      { id:'e5', name:'會後回饋與結案',       status:'todo',  owner:'soph', start:D(2026,11,4), end:D(2026,11,8),   progress:0 },
    ],
    deps: [ ['e1','e2'],['e1','e3'],['e2','e4'],['e3','e4'],['e4','e5'] ],
  },
];

// ---- derived helpers (kept here for any consumer) ----
const projById = id => PROJECTS.find(p => p.id === id);
const taskById = id => {
  for (const p of PROJECTS) {
    const t = p.tasks.find(t => t.id === id);
    if (t) return t;
  }
  return null;
};
function projProgress(p){
  if (!p.tasks.length) return 0;
  return Math.round(p.tasks.reduce((s,t)=>s+t.progress,0)/p.tasks.length);
}
