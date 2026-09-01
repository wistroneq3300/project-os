/* ============================================================
   ProjectOS — 資料來源:Daily Schedule.xlsx(硬體 Bring-up 排程)
   由 tools/import_schedule.py 自動產生(單一專案 + 多階段)。
   手動改資料請重跑:python3 tools/import_schedule.py
   ============================================================ */

const STATUS_META = {
  todo:   { label: '尚未開始', color: '#5d6b7e', bg: 'rgba(93,107,126,.18)' },
  doing:  { label: '進行中',   color: '#60a5fa', bg: 'rgba(96,165,250,.15)' },
  block:  { label: '卡關',     color: '#f87171', bg: 'rgba(248,113,113,.14)' },
  done:   { label: '已完成',   color: '#34d399', bg: 'rgba(52,211,153,.14)' },
};

const PROJECTS = [
  {
    "id": "neutrino",
    "name": "neutrino",
    "color": "#ffb224",
    "stages": [
      {
        "id": "eb1",
        "name": "EB1",
        "color": "#ffb224",
        "items": [
          {
            "id": "eb1-1",
            "group": "Baseboard",
            "task": "Early Bring up in factory",
            "validation": "",
            "start": "2026-09-06",
            "end": "2026-09-06",
            "remark": "",
            "status": "done",
            "equip": 2
          },
          {
            "id": "eb1-2",
            "group": "Baseboard",
            "task": "Phase1 w/o Module Bring up in LAB",
            "validation": "",
            "start": "2026-08-31",
            "end": "2026-09-04",
            "remark": "",
            "status": "todo",
            "equip": 2
          },
          {
            "id": "eb1-3",
            "group": "Baseboard",
            "task": "Bring up in SC",
            "validation": "",
            "start": "2026-09-10",
            "end": "2026-09-10",
            "remark": "",
            "status": "doing",
            "equip": 2
          },
          {
            "id": "eb1-4",
            "group": "Baseboard",
            "task": "EB1 full qual",
            "validation": "",
            "start": "2026-08-31",
            "end": "2026-09-04",
            "remark": "",
            "status": "doing",
            "equip": 3
          },
          {
            "id": "eb1-5",
            "group": "BayC board",
            "task": "Early Bring up in factory",
            "validation": "",
            "start": "2026-09-06",
            "end": "2026-09-06",
            "remark": "",
            "status": "done",
            "equip": 2
          },
          {
            "id": "eb1-6",
            "group": "BayC board",
            "task": "Bring up in LAB",
            "validation": "",
            "start": "2026-09-08",
            "end": "2026-09-12",
            "remark": "",
            "status": "todo",
            "equip": 2
          },
          {
            "id": "eb1-7",
            "group": "BayC board",
            "task": "EB1 full qual",
            "validation": "",
            "start": "2026-09-08",
            "end": "2026-09-12",
            "remark": "",
            "status": "doing",
            "equip": 3
          },
          {
            "id": "eb1-8",
            "group": "Tester",
            "task": "Early w/o module Bring up in factory",
            "validation": "",
            "start": "2026-09-16",
            "end": "2026-09-20",
            "remark": "",
            "status": "done",
            "equip": 2
          },
          {
            "id": "eb1-9",
            "group": "Tester",
            "task": "Bring up in LAB",
            "validation": "",
            "start": "2026-09-16",
            "end": "2026-09-20",
            "remark": "",
            "status": "todo",
            "equip": 2
          },
          {
            "id": "eb1-10",
            "group": "Tester",
            "task": "Bring up in SC",
            "validation": "",
            "start": "2026-09-16",
            "end": "2026-09-20",
            "remark": "",
            "status": "doing",
            "equip": 2
          },
          {
            "id": "eb1-11",
            "group": "Tester",
            "task": "w/ module Bring up in SC",
            "validation": "",
            "start": "2026-09-16",
            "end": "2026-09-20",
            "remark": "",
            "status": "doing",
            "equip": 2
          },
          {
            "id": "eb1-12",
            "group": "CPU module",
            "task": "Early LB bring up in factory",
            "validation": "",
            "start": "2026-09-20",
            "end": "2026-09-24",
            "remark": "",
            "status": "done",
            "equip": 2
          },
          {
            "id": "eb1-13",
            "group": "CPU module",
            "task": "Bring up in LAB",
            "validation": "",
            "start": "2026-09-23",
            "end": "2026-09-27",
            "remark": "",
            "status": "todo",
            "equip": 2
          },
          {
            "id": "eb1-14",
            "group": "CPU module",
            "task": "Bring up in SC",
            "validation": "",
            "start": "2026-09-24",
            "end": "2026-09-28",
            "remark": "",
            "status": "doing",
            "equip": 2
          },
          {
            "id": "eb1-15",
            "group": "CPU module",
            "task": "Early Chip bring up in factory",
            "validation": "",
            "start": "2026-09-24",
            "end": "2026-09-28",
            "remark": "",
            "status": "done",
            "equip": 2
          },
          {
            "id": "eb1-16",
            "group": "CPU module",
            "task": "Bring up in LAB",
            "validation": "",
            "start": "2026-09-24",
            "end": "2026-09-28",
            "remark": "",
            "status": "todo",
            "equip": 2
          },
          {
            "id": "eb1-17",
            "group": "CPU module",
            "task": "Bring up in SC",
            "validation": "",
            "start": "2026-09-24",
            "end": "2026-09-28",
            "remark": "",
            "status": "doing",
            "equip": 2
          },
          {
            "id": "eb1-18",
            "group": "CPU module",
            "task": "EB1 full qual",
            "validation": "",
            "start": "2026-09-24",
            "end": "2026-09-28",
            "remark": "",
            "status": "doing",
            "equip": 3
          },
          {
            "id": "eb1-19",
            "group": "L10",
            "task": "Phase1 w/o Module Bring up in SC",
            "validation": "",
            "start": "2026-10-02",
            "end": "2026-10-06",
            "remark": "",
            "status": "doing",
            "equip": 2
          },
          {
            "id": "eb1-20",
            "group": "L10",
            "task": "Phase2 w/ Module Bring up in SC",
            "validation": "",
            "start": "2026-10-02",
            "end": "2026-10-06",
            "remark": "",
            "status": "doing",
            "equip": 2
          }
        ]
      },
      {
        "id": "ts1",
        "name": "TS1",
        "color": "#60a5fa",
        "items": [
          {
            "id": "ts1-1",
            "group": "Reliability",
            "task": "Structure test",
            "validation": "",
            "start": "2026-09-06",
            "end": "2026-10-06",
            "remark": "",
            "status": "todo",
            "equip": 2
          },
          {
            "id": "ts1-2",
            "group": "Reliability",
            "task": "Reliability",
            "validation": "",
            "start": "2026-09-06",
            "end": "2026-10-24",
            "remark": "",
            "status": "todo",
            "equip": 1
          },
          {
            "id": "ts1-3",
            "group": "Reliability",
            "task": "Packing",
            "validation": "",
            "start": "2026-09-06",
            "end": "2026-09-19",
            "remark": "",
            "status": "todo",
            "equip": 1
          },
          {
            "id": "ts1-4",
            "group": "EMC",
            "task": "Validation",
            "validation": "",
            "start": "2026-09-14",
            "end": "2026-09-18",
            "remark": "",
            "status": "todo",
            "equip": 1
          },
          {
            "id": "ts1-5",
            "group": "EMC",
            "task": "Cert",
            "validation": "",
            "start": "2026-09-14",
            "end": "2026-09-18",
            "remark": "",
            "status": "doing",
            "equip": 2
          },
          {
            "id": "ts1-6",
            "group": "Safety",
            "task": "Validation",
            "validation": "",
            "start": "2026-09-22",
            "end": "2026-09-26",
            "remark": "",
            "status": "todo",
            "equip": 1
          },
          {
            "id": "ts1-7",
            "group": "Safety",
            "task": "Cert",
            "validation": "",
            "start": "2026-09-22",
            "end": "2026-09-26",
            "remark": "",
            "status": "doing",
            "equip": 2
          }
        ]
      },
      {
        "id": "ts2",
        "name": "TS2",
        "color": "#34d399",
        "items": [
          {
            "id": "ts2-1",
            "group": "Reliability",
            "task": "Structure test",
            "validation": "",
            "start": "2026-10-10",
            "end": "2026-10-14",
            "remark": "",
            "status": "todo",
            "equip": 2
          },
          {
            "id": "ts2-2",
            "group": "Reliability",
            "task": "Reliability",
            "validation": "",
            "start": "2026-10-10",
            "end": "2026-10-14",
            "remark": "",
            "status": "todo",
            "equip": 1
          },
          {
            "id": "ts2-3",
            "group": "EMC",
            "task": "Validation",
            "validation": "",
            "start": "2026-10-18",
            "end": "2026-10-22",
            "remark": "",
            "status": "todo",
            "equip": 1
          },
          {
            "id": "ts2-4",
            "group": "EMC",
            "task": "Cert",
            "validation": "",
            "start": "2026-10-18",
            "end": "2026-10-22",
            "remark": "",
            "status": "doing",
            "equip": 2
          },
          {
            "id": "ts2-5",
            "group": "Safety",
            "task": "Validation",
            "validation": "",
            "start": "2026-10-26",
            "end": "2026-10-30",
            "remark": "",
            "status": "todo",
            "equip": 1
          },
          {
            "id": "ts2-6",
            "group": "Safety",
            "task": "Cert",
            "validation": "",
            "start": "2026-10-26",
            "end": "2026-10-30",
            "remark": "",
            "status": "doing",
            "equip": 2
          }
        ]
      }
    ]
  }
];

const projById = id => PROJECTS.find(p => p.id === id);
