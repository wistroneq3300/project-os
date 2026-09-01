/* ============================================================
   ProjectOS — 資料來源:Daily Schedule.xlsx(硬體 Bring-up 排程)
   由 tools/import_schedule.py 自動產生,請勿手動編輯。
   手動改資料請重跑:python3 tools/import_schedule.py
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

const PROJECTS = 
[
  {
    "id": "eb1",
    "name": "EB1 工程驗證",
    "color": "#ffb224",
    "status": "doing",
    "budget": 3600000,
    "spent": 1512000,
    "manager": "alan",
    "source_milestone": "EB1",
    "tasks": [
      {
        "id": "eb1-1",
        "name": "Baseboard · Early Bring up in factory",
        "grp": "Baseboard",
        "status": "done",
        "owner": "alan",
        "start": "2026-09-06",
        "end": "2026-09-06",
        "progress": 100
      },
      {
        "id": "eb1-2",
        "name": "Baseboard · Phase1 w/o Module Bring up in LAB",
        "grp": "Baseboard",
        "status": "todo",
        "owner": "may",
        "start": "2026-08-31",
        "end": "2026-09-04",
        "progress": 0
      },
      {
        "id": "eb1-3",
        "name": "Baseboard · Bring up in SC",
        "grp": "Baseboard",
        "status": "doing",
        "owner": "john",
        "start": "2026-09-10",
        "end": "2026-09-10",
        "progress": 30
      },
      {
        "id": "eb1-4",
        "name": "Baseboard · EB1 full qual",
        "grp": "Baseboard",
        "status": "doing",
        "owner": "soph",
        "start": "2026-08-31",
        "end": "2026-09-04",
        "progress": 30
      },
      {
        "id": "eb1-5",
        "name": "BayC board · Early Bring up in factory",
        "grp": "BayC board",
        "status": "done",
        "owner": "tom",
        "start": "2026-09-06",
        "end": "2026-09-06",
        "progress": 100
      },
      {
        "id": "eb1-6",
        "name": "BayC board · Bring up in LAB",
        "grp": "BayC board",
        "status": "todo",
        "owner": "alan",
        "start": "2026-09-08",
        "end": "2026-09-12",
        "progress": 0
      },
      {
        "id": "eb1-7",
        "name": "BayC board · EB1 full qual",
        "grp": "BayC board",
        "status": "doing",
        "owner": "may",
        "start": "2026-09-08",
        "end": "2026-09-12",
        "progress": 30
      },
      {
        "id": "eb1-8",
        "name": "Tester · Early w/o module Bring up in factory",
        "grp": "Tester",
        "status": "done",
        "owner": "john",
        "start": "2026-09-16",
        "end": "2026-09-20",
        "progress": 100
      },
      {
        "id": "eb1-9",
        "name": "Tester · Bring up in LAB",
        "grp": "Tester",
        "status": "todo",
        "owner": "soph",
        "start": "2026-09-16",
        "end": "2026-09-20",
        "progress": 0
      },
      {
        "id": "eb1-10",
        "name": "Tester · Bring up in SC",
        "grp": "Tester",
        "status": "doing",
        "owner": "tom",
        "start": "2026-09-16",
        "end": "2026-09-20",
        "progress": 30
      },
      {
        "id": "eb1-11",
        "name": "Tester · w/ module Bring up in SC",
        "grp": "Tester",
        "status": "doing",
        "owner": "alan",
        "start": "2026-09-16",
        "end": "2026-09-20",
        "progress": 30
      },
      {
        "id": "eb1-12",
        "name": "CPU module · Early LB bring up in factory",
        "grp": "CPU module",
        "status": "done",
        "owner": "may",
        "start": "2026-09-20",
        "end": "2026-09-24",
        "progress": 100
      },
      {
        "id": "eb1-13",
        "name": "CPU module · Bring up in LAB",
        "grp": "CPU module",
        "status": "todo",
        "owner": "john",
        "start": "2026-09-23",
        "end": "2026-09-27",
        "progress": 0
      },
      {
        "id": "eb1-14",
        "name": "CPU module · Bring up in SC",
        "grp": "CPU module",
        "status": "doing",
        "owner": "soph",
        "start": "2026-09-24",
        "end": "2026-09-28",
        "progress": 30
      },
      {
        "id": "eb1-15",
        "name": "CPU module · Early Chip bring up in factory",
        "grp": "CPU module",
        "status": "done",
        "owner": "tom",
        "start": "2026-09-24",
        "end": "2026-09-28",
        "progress": 100
      },
      {
        "id": "eb1-16",
        "name": "CPU module · Bring up in LAB",
        "grp": "CPU module",
        "status": "todo",
        "owner": "alan",
        "start": "2026-09-24",
        "end": "2026-09-28",
        "progress": 0
      },
      {
        "id": "eb1-17",
        "name": "CPU module · Bring up in SC",
        "grp": "CPU module",
        "status": "doing",
        "owner": "may",
        "start": "2026-09-24",
        "end": "2026-09-28",
        "progress": 30
      },
      {
        "id": "eb1-18",
        "name": "CPU module · EB1 full qual",
        "grp": "CPU module",
        "status": "doing",
        "owner": "john",
        "start": "2026-09-24",
        "end": "2026-09-28",
        "progress": 30
      },
      {
        "id": "eb1-19",
        "name": "L10 · Phase1 w/o Module Bring up in SC",
        "grp": "L10",
        "status": "doing",
        "owner": "soph",
        "start": "2026-10-02",
        "end": "2026-10-06",
        "progress": 30
      },
      {
        "id": "eb1-20",
        "name": "L10 · Phase2 w/ Module Bring up in SC",
        "grp": "L10",
        "status": "doing",
        "owner": "tom",
        "start": "2026-10-02",
        "end": "2026-10-06",
        "progress": 30
      }
    ],
    "deps": [
      [
        "eb1-1",
        "eb1-1"
      ],
      [
        "eb1-2",
        "eb1-2"
      ],
      [
        "eb1-3",
        "eb1-3"
      ],
      [
        "eb1-4",
        "eb1-4"
      ],
      [
        "eb1-5",
        "eb1-5"
      ],
      [
        "eb1-6",
        "eb1-6"
      ],
      [
        "eb1-7",
        "eb1-7"
      ],
      [
        "eb1-8",
        "eb1-8"
      ],
      [
        "eb1-9",
        "eb1-9"
      ],
      [
        "eb1-10",
        "eb1-10"
      ],
      [
        "eb1-11",
        "eb1-11"
      ],
      [
        "eb1-12",
        "eb1-12"
      ],
      [
        "eb1-13",
        "eb1-13"
      ],
      [
        "eb1-14",
        "eb1-14"
      ],
      [
        "eb1-15",
        "eb1-15"
      ],
      [
        "eb1-16",
        "eb1-16"
      ],
      [
        "eb1-17",
        "eb1-17"
      ],
      [
        "eb1-18",
        "eb1-18"
      ],
      [
        "eb1-19",
        "eb1-19"
      ],
      [
        "eb1-20",
        "eb1-20"
      ]
    ]
  },
  {
    "id": "ts1",
    "name": "TS1 機種測試",
    "color": "#60a5fa",
    "status": "doing",
    "budget": 1820000,
    "spent": 764400,
    "manager": "soph",
    "source_milestone": "TS1",
    "tasks": [
      {
        "id": "ts1-1",
        "name": "Reliability · Structure test",
        "grp": "Reliability",
        "status": "todo",
        "owner": "may",
        "start": "2026-09-06",
        "end": "2026-10-06",
        "progress": 0
      },
      {
        "id": "ts1-2",
        "name": "Reliability · Reliability",
        "grp": "Reliability",
        "status": "todo",
        "owner": "john",
        "start": "2026-09-06",
        "end": "2026-10-24",
        "progress": 0
      },
      {
        "id": "ts1-3",
        "name": "Reliability · Packing",
        "grp": "Reliability",
        "status": "todo",
        "owner": "soph",
        "start": "2026-09-06",
        "end": "2026-09-19",
        "progress": 0
      },
      {
        "id": "ts1-4",
        "name": "EMC · Validation",
        "grp": "EMC",
        "status": "todo",
        "owner": "tom",
        "start": "2026-09-14",
        "end": "2026-09-18",
        "progress": 0
      },
      {
        "id": "ts1-5",
        "name": "EMC · Cert",
        "grp": "EMC",
        "status": "doing",
        "owner": "alan",
        "start": "2026-09-14",
        "end": "2026-09-18",
        "progress": 30
      },
      {
        "id": "ts1-6",
        "name": "Safety · Validation",
        "grp": "Safety",
        "status": "todo",
        "owner": "may",
        "start": "2026-09-22",
        "end": "2026-09-26",
        "progress": 0
      },
      {
        "id": "ts1-7",
        "name": "Safety · Cert",
        "grp": "Safety",
        "status": "doing",
        "owner": "john",
        "start": "2026-09-22",
        "end": "2026-09-26",
        "progress": 30
      }
    ],
    "deps": [
      [
        "ts1-1",
        "ts1-1"
      ],
      [
        "ts1-2",
        "ts1-2"
      ],
      [
        "ts1-3",
        "ts1-3"
      ],
      [
        "ts1-4",
        "ts1-4"
      ],
      [
        "ts1-5",
        "ts1-5"
      ],
      [
        "ts1-6",
        "ts1-6"
      ],
      [
        "ts1-7",
        "ts1-7"
      ]
    ]
  },
  {
    "id": "ts2",
    "name": "TS2 機種測試",
    "color": "#34d399",
    "status": "doing",
    "budget": 1560000,
    "spent": 655200,
    "manager": "alan",
    "source_milestone": "TS2",
    "tasks": [
      {
        "id": "ts2-1",
        "name": "Reliability · Structure test",
        "grp": "Reliability",
        "status": "todo",
        "owner": "tom",
        "start": "2026-10-10",
        "end": "2026-10-14",
        "progress": 0
      },
      {
        "id": "ts2-2",
        "name": "Reliability · Reliability",
        "grp": "Reliability",
        "status": "todo",
        "owner": "alan",
        "start": "2026-10-10",
        "end": "2026-10-14",
        "progress": 0
      },
      {
        "id": "ts2-3",
        "name": "EMC · Validation",
        "grp": "EMC",
        "status": "todo",
        "owner": "may",
        "start": "2026-10-18",
        "end": "2026-10-22",
        "progress": 0
      },
      {
        "id": "ts2-4",
        "name": "EMC · Cert",
        "grp": "EMC",
        "status": "doing",
        "owner": "john",
        "start": "2026-10-18",
        "end": "2026-10-22",
        "progress": 30
      },
      {
        "id": "ts2-5",
        "name": "Safety · Validation",
        "grp": "Safety",
        "status": "todo",
        "owner": "soph",
        "start": "2026-10-26",
        "end": "2026-10-30",
        "progress": 0
      },
      {
        "id": "ts2-6",
        "name": "Safety · Cert",
        "grp": "Safety",
        "status": "doing",
        "owner": "tom",
        "start": "2026-10-26",
        "end": "2026-10-30",
        "progress": 30
      }
    ],
    "deps": [
      [
        "ts2-1",
        "ts2-1"
      ],
      [
        "ts2-2",
        "ts2-2"
      ],
      [
        "ts2-3",
        "ts2-3"
      ],
      [
        "ts2-4",
        "ts2-4"
      ],
      [
        "ts2-5",
        "ts2-5"
      ],
      [
        "ts2-6",
        "ts2-6"
      ]
    ]
  }
];

const projById = id => PROJECTS.find(p => p.id === id);
const taskById = id => { for (const p of PROJECTS) { const t = p.tasks.find(t => t.id === id); if (t) return t; } return null; };
function projProgress(p){ if (!p.tasks.length) return 0; return Math.round(p.tasks.reduce((s,t)=>s+t.progress,0)/p.tasks.length); }
const daySpan = (a,b) => Math.round((new Date(b)-new Date(a))/86400000);
