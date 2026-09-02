/* ============================================================
   ProjectOS — 測試排程規劃工具(可編輯)
   * 專案 → 階段(EB1/TS1/...) → 測試項目(PCBA/Function | Task |
     Validation | Start | End | Remark | 狀態) 全部可新增/編輯/刪除
   * 甘特圖:拖曳橫條移動、拖曳兩端調整天數
   * localStorage 持久化
   ============================================================ */
(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const VIEWS = { dashboard: 'Dashboard', planner: 'Planning', gantt: 'Gantt', waterfall: 'Machines' };
  let currentView = 'dashboard';
  let activeProj = null;    // project id
  let activeStage = null;   // stage id
  let theme = localStorage.getItem('pos-theme') || 'dark';
  let wfOrient = localStorage.getItem('pos-orient') || 'v';
  let ganttAll = false;   // 甘特圖是否顯示全部階段(All 分頁)
  let currentUnits = [];  // 目前甘特圖繪製中的 units(供註解原地更新繪製虛線)

  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const iso = d => d instanceof Date
    ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    : d;
  const daySpan = (a,b) => Math.round((new Date(b)-new Date(a))/86400000);
  const addDays = (ds, n) => { const d = new Date(ds); d.setDate(d.getDate()+n); return iso(d); };
  const fmt = d => { const x = new Date(d); return `${x.getMonth()+1}/${x.getDate()}`; };
  const uid = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const todayStr = () => { const t = new Date(); return iso(t); };

  /* =====================================================
     DATA — localStorage 持久化
  ===================================================== */
  const KEY = 'pos-schedule-v1';
  function defaultData(){ return JSON.parse(JSON.stringify(PROJECTS)); }
  function loadData(){
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const d = JSON.parse(raw); if (Array.isArray(d)) return d; }
    } catch(e){}
    return defaultData();
  }
  function saveData(){ try { localStorage.setItem(KEY, JSON.stringify(DATA)); } catch(e){} }

  let DATA = loadData();

  const findProject = id => DATA.find(p => p.id === id);
  const findStage = (pid, sid) => { const p = findProject(pid); return p ? p.stages.find(s => s.id === sid) : null; };
  const stageProgress = s => s.items.length ? Math.round(s.items.reduce((a,it)=>a+(it.status==='done'?100:it.status==='doing'?50:it.status==='block'?80:0),0)/s.items.length) : 0;
  const projectProgress = p => p.stages.length ? Math.round(p.stages.reduce((a,s)=>a+stageProgress(s),0)/p.stages.length) : 0;
  const allItems = () => DATA.flatMap(p=>p.stages.flatMap(s=>s.items.map(it=>({p,s,it}))));

  // 確保 stage 存在於專案(避免舊資料)
  function ensureStage(pid, sid){
    const p = findProject(pid);
    if (!p) return null;
    let s = p.stages.find(x => x.id === sid);
    if (!s) { s = { id: sid, name: sid, color: '#ffb224', items: [] }; p.stages.push(s); }
    return s;
  }

  /* =====================================================
     ROUTER
  ===================================================== */
  function go(view){
    currentView = view;
    $$('.nav-item[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
    $('#view-title').textContent = VIEWS[view];
    render(view);
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */
  function renderDashboard(){
    const items = allItems();
    const totalBudget = 0, spent = 0; // no budget concept
    const done = items.filter(x=>x.it.status==='done').length;
    const doing = items.filter(x=>x.it.status==='doing').length;
    const todo  = items.filter(x=>x.it.status==='todo').length;
    const block = items.filter(x=>x.it.status==='block').length;
    const avg = DATA.length ? Math.round(DATA.reduce((a,p)=>a+projectProgress(p),0)/DATA.length) : 0;
    const dueSoon = items.filter(x=>x.it.status!=='done').sort((a,b)=>new Date(a.it.start)-new Date(b.it.start)).slice(0,5);

    $('#dash-sub').textContent = DATA.length
      ? `${DATA.length} project${DATA.length===1?'':'s'}, ${DATA.reduce((a,p)=>a+p.stages.length,0)} stages, ${items.length} test items.`
      : 'No projects yet — click ＋ New Project in the top-right to begin.';
    $('#today-line').textContent = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',weekday:'long'});

    $('#metric-grid').innerHTML = [
      { l:'Projects', v: DATA.length, u:'', d: DATA.reduce((a,p)=>a+p.stages.length,0)+' stages', cls:'m-flat' },
      { l:'Avg. Progress', v: avg, u:' %', d: avg>70?'Ahead of schedule':avg>40?'On track':'Needs attention', cls: avg>70?'m-up':avg>40?'m-flat':'m-down' },
      { l:'Test Items', v: items.length, u:'', d: `${done} done / ${doing} in progress`, cls:'m-flat' },
      { l:'Pending', v: items.length - done, u:'', d: block? block+' blocked':'All good', cls: block?'m-down':'m-up' },
    ].map(m => `
      <div class="metric">
        <div class="m-label">${m.l}</div>
        <div class="m-value">${m.v}<small>${m.u}</small></div>
        <div class="m-delta ${m.cls}">${m.d}</div>
      </div>`).join('');

    // project overview
    const sorted = [...DATA].sort((a,b)=>projectProgress(b)-projectProgress(a));
    $('#proj-bars').innerHTML = sorted.map(p => `
      <div class="proj-bar" data-proj="${p.id}" style="cursor:pointer">
        <span class="pb-dot" style="background:${p.color}"></span>
        <div class="pb-name">${esc(p.name)}<small>${p.stages.length} stage${p.stages.length===1?"":"s"} · ${p.stages.reduce((a,s)=>a+s.items.length,0)} items</small></div>
        <div class="pb-track"><div class="pb-fill" style="width:${projectProgress(p)}%;background:linear-gradient(90deg,${p.color},#fff2)"></div></div>
        <span class="pb-pct">${projectProgress(p)}%</span>
      </div>`).join('');
    $$('#proj-bars .proj-bar').forEach(el => el.onclick = () => { activeProj = el.dataset.proj; go('planner'); });

    renderDonut('status-ring');

    $('#recent-tasks').innerHTML = dueSoon.length ? dueSoon.map(({p,s,it}) => `
      <div class="rt-row">
        <div class="rt-check" data-item="${it.id}" data-stage="${s.id}" style="cursor:pointer">✓</div>
        <div class="rt-name">${esc(it.task)||'(untitled)'}</div>
        <span class="rt-proj" style="color:${p.color}">${esc(p.name)} / ${esc(s.name)}</span>
        <span class="rt-owner">${esc(it.group)}</span>
        <span class="rt-due">${fmt(it.start)} → ${fmt(it.end)}</span>
      </div>`).join('') : '<div class="rt-empty">Nothing pending 🎉</div>';
    $$('#recent-tasks .rt-check').forEach(el => el.onclick = () => {
      const st = findStage(activeProj||DATA[0]?.id, el.dataset.stage) || { items: [] };
      const it = (findStage(el.dataset.stage?''.toString(): (DATA[0]?.id||''), el.dataset.stage)||{items:[]});
      // find item by id across current project
      const p = DATA.find(pp => pp.stages.some(ss => ss.items.some(x => x.id===el.dataset.item)));
      if (!p) return;
      const s2 = p.stages.find(ss => ss.items.some(x=>x.id===el.dataset.item));
      const it2 = s2.items.find(x=>x.id===el.dataset.item);
      it2.status = it2.status==='done'?'doing':'done';
      saveData(); render(currentView);
    });
  }

  function renderDonut(id){
    const items = allItems();
    const counts = { todo:0, doing:0, block:0, done:0 };
    items.forEach(x => counts[x.it.status]++);
    const arr = [
      { key:'todo',  value:counts.todo },
      { key:'doing', value:counts.doing },
      { key:'block', value:counts.block },
      { key:'done',  value:counts.done },
    ];
    $('#'+id).innerHTML = `
      <div class="ring-wrap">
        <div id="ring-svg"></div>
        <div class="ring-legend">
          ${arr.map(c=>`
            <div class="rl-item"><span class="rl-dot" style="background:${STATUS_META[c.key].color}"></span>${STATUS_META[c.key].label}<span class="rl-count">${c.value}</span></div>
          `).join('')}
        </div>
      </div>`;
    if (Charts.donut) Charts.donut($('#ring-svg'), arr.map(c=>({value:c.value,color:STATUS_META[c.key].color})), { center:String(items.length)||'0', sub:'All items', size:150, stroke:21, theme });
  }

  /* =====================================================
     PLANNER — 專案/階段/測試項目管理(全可編輯)
  ===================================================== */
  function renderPlanner(){
    if (!DATA.length) {
      $('#planner-proj-tabs').innerHTML = '';
      $('#stage-tabs').innerHTML = '';
      $('#item-list').innerHTML = '<div class="rt-empty">Add a project first (top-right ＋ New Project).</div>';
      return;
    }
    if (!activeProj || !findProject(activeProj)) activeProj = DATA[0].id;

    // project tabs (in hero)
    $('#planner-proj-tabs').innerHTML = DATA.map(p => `
      <button class="ptab ${p.id===activeProj?'active':''}" data-proj="${p.id}">
        <span class="pt-dot" style="background:${p.color}"></span>
        <span class="pt-name">${esc(p.name)}</span>
        <span class="pt-pct">${projectProgress(p)}%</span>
        <span class="pt-del" data-delproj="${p.id}" title="Delete project">×</span>
      </button>`).join('')
      + `<button class="ptab ptab-add" id="planner-add-stage" title="Add stage">＋ Stage</button>`;

    $$('#planner-proj-tabs .ptab[data-proj]').forEach(b => b.onclick = () => {
      activeProj = b.dataset.proj; activeStage = null; renderPlanner();
    });
    $$('#planner-proj-tabs .pt-del').forEach(el => el.onclick = e => {
      e.stopPropagation();
      if (confirm('Delete this project?')) {
        DATA = DATA.filter(p=>p.id!==el.dataset.delproj);
        if (activeProj===el.dataset.delproj) activeProj = DATA[0]?.id || null;
        activeStage = null; saveData(); renderPlanner();
      }
    });
    $('#planner-add-stage').onclick = addStage;

    const p = findProject(activeProj);
    if (!p) return;
    if (!activeStage || !p.stages.find(s=>s.id===activeStage)) activeStage = p.stages[0]?.id || null;
    if (!activeStage && p.stages.length===0) {
      $('#stage-tabs').innerHTML = '<div class="rt-empty">No stages in this project yet — click ＋ Stage to add one (e.g. EB1 / TS1).</div>';
      $('#item-list').innerHTML = '';
      return;
    }
    const stage = findStage(activeProj, activeStage);

    // stage tabs (可拖曳排序)
    $('#stage-tabs').innerHTML = p.stages.map(s => `
      <button class="stbtn ${s.id===activeStage?'active':''}" data-stage="${s.id}" draggable="true">
        <span class="st-grip" title="Drag to reorder">⠿</span>
        <span class="pt-dot" style="background:${s.color}"></span>${esc(s.name)}
        <span class="st-pct">${stageProgress(s)}%</span>
        <span class="st-del" data-delstage="${s.id}" title="Delete stage">×</span>
      </button>`).join('');
    $$('#stage-tabs .stbtn[data-stage]').forEach(b => b.onclick = () => { activeStage = b.dataset.stage; renderPlanner(); });
    $$('#stage-tabs .st-del').forEach(el => el.onclick = e => {
      e.stopPropagation();
      if (confirm('Delete this stage?')) {
        const st = findStage(activeProj, el.dataset.delstage);
        if (st) { p.stages = p.stages.filter(s=>s.id!==el.dataset.delstage); if (activeStage===el.dataset.delstage) activeStage = p.stages[0]?.id||null; saveData(); renderPlanner(); }
      }
    });
    makeStageTabsDraggable(p);

    renderItemTable(p, stage);
    $('#btn-add-item').onclick = () => addItem(p, stage);
  }

  /* 階段 tab 拖曳排序(用 clientX 找落點,因 tab 是橫排) */
  function makeStageTabsDraggable(p){
    const wrap = $('#stage-tabs');
    let dragged = null;
    wrap.querySelectorAll('.stbtn[data-stage]').forEach(btn => {
      btn.addEventListener('dragstart', e => {
        dragged = btn;
        btn.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', btn.dataset.stage); } catch(err){}
      });
      btn.addEventListener('dragend', () => {
        btn.classList.remove('dragging');
        dragged = null;
        // 依目前 DOM 順序改写 p.stages
        const order = Array.from(wrap.querySelectorAll('.stbtn[data-stage]')).map(b => b.dataset.stage);
        if (order.length === p.stages.length && order.length) {
          p.stages.sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id));
          saveData();
          // 同步 Gantt / Waterfall 的階段順序
          renderGantt(); renderWaterfall && renderWaterfall();
        }
      });
    });
    wrap.ondragover = e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!dragged) return;
      const after = getDragAfterX(wrap, e.clientX);
      if (after == null) wrap.appendChild(dragged);
      else wrap.insertBefore(dragged, after);
    };
    wrap.ondrop = e => { e.preventDefault(); };
  }
  function getDragAfterX(container, x){
    const els = Array.from(container.querySelectorAll('.stbtn[data-stage]:not(.dragging)'));
    return els.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width/2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: -Infinity, element: null }).element;
  }

  function addStage(){
    const nm = prompt('Stage name (e.g. EB1, TS1): ', 'EB1');
    if (nm === null) return;
    const p = findProject(activeProj);
    if (!p) return;
    const name = nm.trim() || 'Stage';
    const colors = ['#ffb224','#60a5fa','#f472b6','#34d399','#a78bfa','#f87171'];
    const st = { id: uid('st'), name, color: colors[p.stages.length%colors.length], items: [] };
    // 插入到「目前所在階段」之後(你說 EB2 加在中間這種情形)
    const curIdx = p.stages.findIndex(s => s.id === activeStage);
    if (curIdx >= 0) p.stages.splice(curIdx + 1, 0, st);
    else p.stages.push(st);
    activeStage = st.id; saveData(); renderPlanner(); renderGantt();
  }

  function addItem(p, stage){
    stage.items.push({ id: uid('it'), group:'', task:'New Item', validation:'', start: todayStr(), end: todayStr(), remark:'', status:'todo', equip:0, deps:[] });
    saveData(); renderPlanner(); renderGantt();
  }

  const PALETTE = ['#5d6b7e','#60a5fa','#34d399','#fbbf24','#f87171','#a78bfa','#fb923c','#22d3ee'];
  const STATEMETA_FALLBACK = s => (STATUS_META[s] && STATUS_META[s].color) || '#5d6b7e';

  function renderItemTable(p, stage){
    if (!stage || !stage.items) return;
    const rows = stage.items.map((it, i) => `
      <div class="item-row" data-item="${it.id}" draggable="true">
        <span class="row-grip" title="Drag to reorder"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h.01M16 6h.01M8 12h.01M16 12h.01M8 18h.01M16 18h.01"/></svg></span>
        <div class="it-check" data-check="${it.id}" title="Mark as done">✓</div>
        <input class="ed-f" data-f="group" value="${esc(it.group)}" placeholder="e.g. Baseboard">
        <input class="ed-f ed-task" data-f="task" value="${esc(it.task)}" placeholder="Task name">
        <input class="ed-f" data-f="validation" value="${esc(it.validation)}" placeholder="Validation">
        <input type="date" class="ed-date" data-f="start" value="${it.start}">
        <input type="date" class="ed-date" data-f="end" value="${it.end}">
        <input class="ed-f ed-remark" data-f="remark" value="${esc(it.remark)}" placeholder="Remark">
        <input type="number" class="ed-f ed-equip" data-f="equip" value="${it.equip||0}" min="0" step="1" title="Machine count" placeholder="Mch">
        <div class="ccol">
          <button class="csel" data-it="${it.id}" data-open="${it.id}" style="background:${it.color || STATEMETA_FALLBACK(it.status)}"><span class="carrot">▾</span></button>
          <div class="cpop" data-pop="${it.id}">
            ${PALETTE.map(c => `<button class="cs2${(it.color||'').toLowerCase()===c.toLowerCase()?' on':''}" data-color="${c}" data-it="${it.id}" style="background:${c}" title="${c}"></button>`).join('')}
            <label class="ccustom" title="Pick any colour" style="background:${it.color || STATEMETA_FALLBACK(it.status)}">＋ 自訂<input type="color" data-cust="${it.id}" value="${it.color || '#5d6b7e'}"></label>
          </div>
        </div>
        <button class="ed-f ed-deps${(it.deps&&it.deps.length)?' has-dep':''}" data-deps="${it.id}" title="Deps: check the preceding tasks this must wait for">${(it.deps&&it.deps.length)?it.deps.length+' ⤹':'⤹'}</button>
        <button class="task-del" data-del="${it.id}" title="Delete item">×</button>
      </div>`).join('');

    $('#item-list').innerHTML = stage.items.length
      ? rows
      : '<div class="rt-empty">No test items yet — click ＋ Add Item.</div>';

    // inline editing
    $('#item-list').oninput = e => {
      const row = e.target.closest('.item-row');
      if (!row) return;
      const it = stage.items.find(x => x.id === row.dataset.item);
      if (!it) return;
      const f = e.target.dataset.f;
      const v = e.target.value;
      if (f==='group') it.group = v;
      else if (f==='task') it.task = v;
      else if (f==='validation') it.validation = v;
      else if (f==='remark') it.remark = v;
      else if (f==='color') it.color = v || '#5d6b7e';
      else if (f==='status') it.status = v;
      else if (f==='equip') it.equip = Math.max(0, parseInt(v)||0);
      else if (f==='start') { if (v && new Date(v) <= new Date(it.end)) it.start = v; }
      else if (f==='end') { if (v && new Date(v) >= new Date(it.start)) it.end = v; }
      saveData(); updateTabs(p, stage);
      if (f==='equip' && currentView!=='waterfall') { /* 只在 waterfall 顯示時再刷 */ }
    };
    $$('#item-list .it-check').forEach(el => el.onclick = () => {
      const it = stage.items.find(x=>x.id===el.dataset.check);
      if (!it) return;
      it.status = it.status==='done'?'doing':'done';
      saveData(); renderPlanner();
    });
    $$('#item-list .task-del').forEach(el => el.onclick = () => {
      if (!confirm('Delete this test item?')) return;
      stage.items = stage.items.filter(x=>x.id!==el.dataset.del);
      activeStage = stage.id;
      saveData(); renderPlanner();
    });
    // 顏色下拉:點色鈕展開面板
    $$('#item-list .csel').forEach(btn => btn.onclick = e => {
      e.stopPropagation();
      const id = btn.dataset.open;
      closeColorPops();
      const pop = document.querySelector(`.cpop[data-pop="${id}"]`);
      if (pop) pop.classList.add('open');
    });
    // 選預設色
    $$('#item-list .cs2').forEach(sw => sw.onclick = () => {
      const it = stage.items.find(x => x.id === sw.dataset.it);
      if (!it) return;
      it.color = sw.dataset.color;
      saveData(); renderItemTable(p, stage); renderGantt();
    });
    // 自訂任意色
    $$('#item-list input[data-cust]').forEach(inp => inp.oninput = () => {
      const it = stage.items.find(x => x.id === inp.dataset.cust);
      if (!it) return;
      it.color = inp.value;
      saveData(); renderItemTable(p, stage); renderGantt();
    });
    // 關聯(deps)popover
    $$('#item-list .ed-deps').forEach(btn => btn.onclick = e => {
      e.stopPropagation();
      openDepsPicker(p, stage, btn);
    });
    makeRowsDraggable(p, stage);
  }

  /* 任務行拖曳排序(用 clientY 找落點,因行是縱排) */
  function makeRowsDraggable(p, stage){
    const list = $('#item-list');
    let dragged = null;
    list.querySelectorAll('.item-row').forEach(row => {
      row.addEventListener('dragstart', e => {
        if (!e.target.closest('.row-grip')) { e.preventDefault(); return; }
        dragged = row;
        row.classList.add('dragging');
        try { e.dataTransfer.setData('text/plain', row.dataset.item); } catch(err){}
      });
      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        dragged = null;
        const order = Array.from(list.querySelectorAll('.item-row')).map(r => r.dataset.item);
        if (order.length === stage.items.length && order.length) {
          stage.items.sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id));
          saveData(); renderItemTable(p, stage); renderGantt(); if (renderWaterfall) renderWaterfall();
        }
      });
    });
    list.ondragover = e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!dragged) return;
      const after = getDragAfterY(list, e.clientY);
      if (after == null) list.appendChild(dragged);
      else list.insertBefore(dragged, after);
    };
    list.ondrop = e => { e.preventDefault(); };
  }
  function getDragAfterY(container, y){
    const els = Array.from(container.querySelectorAll('.item-row:not(.dragging)'));
    return els.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height/2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: -Infinity, element: null }).element;
  }

  /* deps 勾選 popover:選「這個任務須等其完成的前驅任務」(含專案所有階段) */
  function openDepsPicker(p, stage, anchor){
    closeDepsPicker();
    const it = stage.items.find(x => x.id === anchor.dataset.deps);
    if (!it) return;
    if (!Array.isArray(it.deps)) it.deps = [];
    // 彙整專案「所有階段」的任務,依階段分群
    const groups = [];
    p.stages.forEach(st => {
      const items = st.items.filter(x => x.id !== it.id);
      if (items.length) groups.push({ stage: st, items });
    });
    const pop = document.createElement('div');
    pop.className = 'deps-pop';
    pop.innerHTML = `
      <div class="deps-pop-h">Predecessors (must finish first)</div>
      ${groups.length ? groups.map(g => `
        <div class="deps-group-h">${esc(g.stage.name)}${g.stage===stage?' (current)':''}</div>
        ${g.items.map(x => `
          <label class="deps-opt">
            <input type="checkbox" data-depid="${x.id}" ${it.deps.includes(x.id)?'checked':''}>
            <span class="dopts-task">${esc(x.task)||'(untitled)'}</span>
            <span class="dopts-range">${fmt(x.start)} → ${fmt(x.end)}</span>
          </label>`).join('')}
      `).join('')
      : '<div class="deps-empty">No other tasks to link.</div>'}
      <div class="deps-pop-f"><button data-dep-done>Done</button></div>`;
    document.body.appendChild(pop);
    // position near anchor
    const r = anchor.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 280)) + 'px';
    pop.style.top = (r.bottom + 6) + 'px';
    pop.querySelectorAll('input[data-depid]').forEach(cb => cb.onchange = () => {
      const id = cb.dataset.depid;
      if (cb.checked) { if (!it.deps.includes(id)) it.deps.push(id); }
      else it.deps = it.deps.filter(d => d !== id);
      anchor.textContent = it.deps.length ? it.deps.length + ' ⤹' : '⤹';
      anchor.classList.toggle('has-dep', !!it.deps.length);
      saveData();
      if (currentView === 'gantt') renderGantt();
    });
    pop.querySelector('[data-dep-done]').onclick = closeDepsPicker;
    setTimeout(() => {
      const onDoc = ev => { if (!pop.contains(ev.target) && ev.target !== anchor) { closeDepsPicker(); document.removeEventListener('click', onDoc); } };
      document.addEventListener('click', onDoc);
    }, 0);
  }
  function closeDepsPicker(){
    const pop = document.querySelector('.deps-pop');
    if (pop) pop.remove();
  }

  function updateTabs(p, stage){
    $$('#stage-tabs .stbtn[data-stage]').forEach(b => {
      if (b.dataset.stage===stage.id) b.querySelector('.st-pct').textContent = stageProgress(stage)+'%';
    });
    $$('#planner-proj-tabs .ptab[data-proj]').forEach(b => {
      if (b.dataset.proj===p.id) b.querySelector('.pt-pct').textContent = projectProgress(p)+'%';
    });
  }

  /* =====================================================
     GANTT — 可編輯(拖曳移動 / 拖曳邊緣調整天數)
  ===================================================== */
  function renderGantt(){
    const p = findProject(activeProj) || DATA[0];
    if (!p) { $('#gantt-card').innerHTML = '<div class="gantt-empty">Add a project first.</div>'; return; }
    activeProj = p.id;
    if (!activeStage || !p.stages.find(s=>s.id===activeStage)) activeStage = p.stages[0]?.id || null;

    // ---- 分頁:All + 各 stage ----
    const allLabel = '<span class="pt-dot" style="background:linear-gradient(135deg,#ffb224,#60a5fa);width:10px;height:10px"></span>All';
    $('#gantt-stage-tabs').innerHTML =
      `<button class="stbtn ${ganttAll?'active':''}" data-all="1">${allLabel}</button>`
      + p.stages.map(s => `
        <button class="stbtn ${(!ganttAll && s.id===activeStage)?'active':''}" data-stage="${s.id}">
          <span class="pt-dot" style="background:${s.color}"></span>${esc(s.name)}
        </button>`).join('')
      + (p.stages.length===0 ? '<span class="rt-empty">No stages yet</span>' : '');
    $$('#gantt-stage-tabs .stbtn[data-stage]').forEach(b => b.onclick = () => { ganttAll = false; activeStage = b.dataset.stage; renderGantt(); });
    $$('#gantt-stage-tabs .stbtn[data-all]').forEach(b => b.onclick = () => { ganttAll = true; renderGantt(); });

    // ---- 決定要畫的 stage 清單與 items ----
    // 每筆帶來源 stage,方便分群與顯示
    const units = [];   // { stage, it }
    if (ganttAll) {
      p.stages.forEach(s => (s.items||[]).forEach(it => units.push({ stage: s, it })));
    } else {
      const stage = findStage(activeProj, activeStage);
      if (stage && stage.items) stage.items.forEach(it => units.push({ stage, it }));
    }
    if (!units.length) {
      $('#gantt-card').innerHTML = '<div class="gantt-empty">No items yet — add them in Schedule Planning.</div>';
      return;
    }
    const items = units;

    // 圖例已整個移除;bar 與虛線註解的「新增」事件由 paintDeps 產生的元素綁定(見 paintDeps)

    // timeline span (from min start to max end, with 2-day padding)
    const allDates = items.flatMap(u => u.it.start && u.it.end ? [u.it.start, u.it.end] : []);
    if (!allDates.length) { $('#gantt-card').innerHTML = '<div class="gantt-empty">Items have no dates.</div>'; return; }
    const minD = addDays(allDates.reduce((a,b)=>new Date(a)<new Date(b)?a:b), -2);
    const maxD = addDays(allDates.reduce((a,b)=>new Date(a)>new Date(b)?a:b), 2);
    const totalDays = Math.max(daySpan(minD, maxD), 7);
    // 軸放大模式:grid 寬 = 卡片可用寬(撐滿),dayW 按比例縮放 → bar 寬度精確對應天數
    const cardW = $('#gantt-card').clientWidth;
    const gridW = Math.max(cardW - 340 - 48, 600);
    const dayW = gridW / totalDays;

    // month header
    let monthHeader = '';
    let m = new Date(minD); m.setDate(1);
    const mEnd = new Date(maxD); mEnd.setDate(1);
    while (m <= mEnd) {
      let next = new Date(m); next.setMonth(next.getMonth()+1);
      const s0 = Math.max(0, daySpan(minD, iso(m)));
      const s1 = Math.max(0, daySpan(minD, iso(next)));
      const monthW = (s1 - s0) * dayW;
      // 月份太窄、單行「2026 / 8」放不下(會超過右界)時 → 改兩行(上「2026 /」下「8」)
      if (monthW < 62) {
        monthHeader += `<div class="g-month g-month-2l" style="left:${s0*dayW}px;width:${Math.max(monthW, 30)}px"><span>${m.getFullYear()}&nbsp;/</span><span>${m.getMonth()+1}</span></div>`;
      } else {
        monthHeader += `<div class="g-month" style="left:${s0*dayW}px;width:${monthW}px"><span>${m.getFullYear()} / ${m.getMonth()+1}</span></div>`;
      }
      m = next;
    }

    // week gridlines + 每日日期標籤
    let gridCols = '';
    let dayLabels = '';
    const dayFont = dayW >= 30 ? 11.5 : dayW >= 18 ? 10.5 : dayW >= 11 ? 9 : 8;
    const dayStyle = `font-size:${dayFont}px`;
    for (let i=0; i<=totalDays; i++){
      const d = addDays(minD, i);
      const monthStart = /-01$/.test(d);
      const day = new Date(d).getDay();
      gridCols += `<div class="g-gridline ${monthStart?'g-line-strong':(day===0?'g-line-week':'')}" style="left:${i*dayW}px"></div>`;
      if (i < totalDays){
        const dow = new Date(d).getDay();
        const wend = (dow===0||dow===6);
        const txt = new Date(d).getDate();
        dayLabels += `<div class="g-day ${wend?'g-day-wkend':''}${new Date(d).getDate()===1?' g-day-m1':''}" style="left:${i*dayW}px;width:${dayW}px;${dayStyle}" title="${d}">${txt}</div>`;
      }
    }

    const xFor = date => Math.max(0, Math.min(daySpan(minD, date)*dayW, gridW));
    const wFor = u => Math.max(daySpan(u.it.start, u.it.end)*dayW, 14);

    const LABELW = 340;
    const ROWH = 38, HEADH = 46, PAD = 6, BARH = 22;

    // ---- 畫列。All 模式:先按階段分大群(每個階段一組),再在組內依 group 分小群。
    // 單一階段模式:維持原樣,只依 group 分群。 ----
    const stageNames = [];
    items.forEach(u => { if (u.stage && !stageNames.includes(u.stage.id)) stageNames.push(u.stage.id); });

    const groupsOfStage = stId => {
      const arr = [];
      items.forEach(u => {
        if (u.stage.id !== stId) return;
        const g = u.it.group || '';
        if (!arr.includes(g)) arr.push(g);
      });
      if (!arr.includes('')) arr.push('');
      return arr;
    };

    const gForItem = (u, stId, groups) => {
      // 依該 stage 的 groups 順序回傳 group 名
      return u.it.group || '';
    };

    let rows = '';
    if (ganttAll) {
      // 摘要列
      rows += `<div class="gantt-row g-group">
        <div class="gantt-label-cell"><b>${esc(p.name)} · All</b><span class="g-range-info">${totalDays} days</span></div>
        <div class="gantt-timeline-cell">${gridCols}<div class="g-range" style="left:0;width:${gridW}px"></div></div>
      </div>`;
      stageNames.forEach(stId => {
        const s = findStage(activeProj, stId);
        if (!s) return;
        const groups = groupsOfStage(stId);
        rows += `<div class="gantt-row g-mstage">
          <div class="gantt-label-cell" style="color:${s.color};font-weight:700">
            <span class="pt-dot" style="background:${s.color}"></span>${esc(s.name)}
          </div>
          <div class="gantt-timeline-cell">${gridCols}</div>
        </div>`;
        groups.forEach(g => {
          const gItems = items.filter(u => u.stage.id===stId && (u.it.group||'')===g);
          if (!gItems.length) return;
          const gName = g || 'Ungrouped';
          rows += `<div class="gantt-row g-sub">
            <div class="gantt-label-cell g-sub-label">${esc(gName)}</div>
            <div class="gantt-timeline-cell">${gridCols}</div>
          </div>`;
          gItems.forEach(u => {
            const it = u.it;
            if (!it.start || !it.end) return;
            const left = xFor(it.start);
            const w = Math.max(daySpan(it.start, it.end)*dayW, 14);
            const color = it.color || (STATUS_META[it.status]?.color || '#5d6b7e');
            rows += `<div class="gantt-row" data-item="${it.id}" data-stage="${u.stage.id}">
              <div class="gantt-label-cell">
                <div class="g-label-main">
                  <span class="pb-dot" style="background:${color}"></span>
                  <span class="g-label-text" title="${esc(it.task)}">${esc(it.task)||'Item'}</span>
                  <span class="g-label-date">${fmt(it.start)}–${fmt(it.end)}</span>
                </div>
                ${it.remark ? `<div class="g-label-note" title="${esc(it.remark)}"><span class="pn-ico">📝</span><span class="pn-txt">${esc(it.remark)}</span></div>` : ''}
              </div>
              <div class="gantt-timeline-cell">
                ${gridCols}
                <div class="g-bar ${it.status}" data-item="${it.id}"
                     style="left:${left}px;width:${w}px;background:${color}"
                     title="${esc(it.task)} · ${fmt(it.start)} → ${fmt(it.end)}">
                  <span class="g-resize g-resize-l" data-r="l"></span>
                  <span class="g-resize g-resize-r" data-r="r"></span>
                </div>
                <span class="g-bar-addannot" data-it="${it.id}" style="left:${left + Math.max(w,26) - 16}px" title="Add/edit annotation on this bar">＋</span>
                ${it.notes ? `<div class="g-bar-annot" data-it="${it.id}" style="left:${left + w/2}px"><span class="gba">📌&nbsp;${esc(it.notes)}</span></div>` : ''}
              </div>
            </div>`;
          });
        });
      });
    } else {
      const st = units[0].stage;
      const groups = groupsOfStage(st.id);
      rows += `<div class="gantt-row g-group">
        <div class="gantt-label-cell"><b>${esc(p.name)} · ${esc(st.name)}</b><span class="g-range-info">${totalDays} days</span></div>
        <div class="gantt-timeline-cell">${gridCols}<div class="g-range" style="left:0;width:${gridW}px"></div></div>
      </div>`;
      groups.forEach(g => {
        const gItems = items.filter(u => (u.it.group||'')===g);
        if (!gItems.length) return;
        const gName = g || 'Ungrouped';
        rows += `<div class="gantt-row g-sub">
          <div class="gantt-label-cell g-sub-label">${esc(gName)}</div>
          <div class="gantt-timeline-cell">${gridCols}</div>
        </div>`;
        gItems.forEach(u => {
          const it = u.it;
          if (!it.start || !it.end) return;
          const left = xFor(it.start);
          const w = wFor(u);
          const color = it.color || (STATUS_META[it.status]?.color || '#5d6b7e');
          rows += `<div class="gantt-row" data-item="${it.id}">
            <div class="gantt-label-cell">
              <div class="g-label-main">
                <span class="pb-dot" style="background:${color}"></span>
                <span class="g-label-text" title="${esc(it.task)}">${esc(it.task)||'Item'}</span>
                <span class="g-label-date">${fmt(it.start)}–${fmt(it.end)}</span>
              </div>
              ${it.remark ? `<div class="g-label-note" title="${esc(it.remark)}"><span class="pn-ico">📝</span><span class="pn-txt">${esc(it.remark)}</span></div>` : ''}
            </div>
            <div class="gantt-timeline-cell">
              ${gridCols}
              <div class="g-bar ${it.status}" data-item="${it.id}"
                   style="left:${left}px;width:${w}px;background:${color}"
                   title="${esc(it.task)} · ${fmt(it.start)} → ${fmt(it.end)}">
                <span class="g-resize g-resize-l" data-r="l"></span>
                <span class="g-resize g-resize-r" data-r="r"></span>
              </div>
              <span class="g-bar-addannot" data-it="${it.id}" style="left:${left + Math.max(w,26) - 16}px" title="Add/edit annotation on this bar">＋</span>
              ${it.notes ? `<div class="g-bar-annot" data-it="${it.id}" style="left:${left + w/2}px"><span class="gba">📌&nbsp;${esc(it.notes)}</span></div>` : ''}
            </div>
          </div>`;
        });
      });
    }

    $('#gantt-card').innerHTML = `
      <div class="gantt" id="gantt-scroll">
        <div class="gantt-inner" id="gantt-inner">
          <div class="gantt-head">
            <div class="gantt-labels"><span class="g-hint">${ganttAll?'All stages':'items'}</span></div>
            <div class="gantt-timeline" style="height:${HEADH+28}px;position:relative">
              <div class="g-months" style="width:${gridW}px;bottom:28px;top:0">${monthHeader}</div>
              <div class="g-days" style="bottom:0;height:28px;width:${gridW}px">${dayLabels}</div>
            </div>
          </div>
          <div class="gantt-body" style="position:relative">
            ${rows}
            <svg class="dep-svg" id="gantt-deps"></svg>
          </div>
          <div class="gantt-foot" id="gantt-tip"></div>
        </div>
      </div>`;

    wireGanttDrag(p, ganttAll?null:units[0].stage, gridW, dayW, xFor, minD);
    // bar 註解:「＋」新增/編輯,點註解文字也編輯
    const barNoteClick = a => {
      a.addEventListener('click', e => {
        e.stopPropagation();
        const id = a.dataset.it;
        const u = items.find(x => x.it.id === id);
        if (u) addBarNote(u.it);
      });
    };
    $$('#gantt-card .g-bar-addannot').forEach(barNoteClick);
    $$('#gantt-card .g-bar-annot').forEach(barNoteClick);
    currentUnits = items;
    requestAnimationFrame(() => paintDeps(items));
  }

  // 新增/編輯/刪除「bar 註解」與「虛線註解」(寫入 item.notes / depNotes)
  function promptNote(text, def){
    const v = prompt(text, def || '');
    if (v === null) return null;   // 使用者按「取消」
    return v.trim();               // 可能是空字串(清空 → 移除註解)
  }
  function addBarNote(it){
    const t = promptNote('Annotation on this bar (text or empty to remove):', it.notes || '');
    if (t === null) return;
    if (t === '') { delete it.notes; }
    else { it.notes = t; }
    saveData();
    // 原地更新,不重繪整個甘特圖
    const cell = document.querySelector(`.g-bar[data-item="${esc(it.id)}"]`)?.closest('.gantt-timeline-cell');
    const bar = cell && cell.querySelector('.g-bar');
    if (cell) {
      let ann = cell.querySelector('.g-bar-annot');
      if (it.notes) {
        if (!ann) {
          ann = document.createElement('div');
          ann.className = 'g-bar-annot';
          ann.dataset.it = it.id;
          const barR = bar ? bar.getBoundingClientRect() : null;
          const cellR = cell.getBoundingClientRect();
          ann.style.left = (barR ? (barR.left - cellR.left + barR.width/2) : 0) + 'px';
          cell.appendChild(ann);
          ann.addEventListener('click', e => { e.stopPropagation(); addBarNote(it); });
        }
        ann.innerHTML = `<span class="gba">📌&nbsp;${esc(it.notes)}</span>`;
      } else if (ann) {
        ann.remove();
      }
    }
  }
  function addDepNote(it, depId){
    if (!it.depNotes || typeof it.depNotes !== 'object') it.depNotes = {};
    const cur = it.depNotes[depId] || '';
    const t = promptNote('Annotation on this dependency arrow (text or empty to remove):', cur);
    if (t === null) return;
    if (t === '') delete it.depNotes[depId]; else it.depNotes[depId] = t;
    saveData();
    // 原地更新:重新繪製虛線與虛線註解(不重整整個甘特圖)
    const svg = document.getElementById('gantt-deps');
    if (svg) paintDeps(currentUnits);
  }

  /* 畫 deps 虛線+箭頭:自己的尾巴(右端) → 被依賴任務的頭(左端)
     「自己」= 有 deps 的任務;「被依賴任務」= deps 裡列的前驅。
     箭頭指進「被依賴任務」的頭(左端)。 */
  // units:  [{ stage, it }, ...] 或單一 stage(取其 .items 每項都當 it 用)
  function paintDeps(units){
    const svg = document.getElementById('gantt-deps');
    if (!svg) return;
    const body = svg.parentNode; // .gantt-body
    const bodyR = body.getBoundingClientRect();
    const bars = {};
    body.querySelectorAll('.g-bar,.g-milestone').forEach(el => bars[el.dataset.item] = el);

    // 正規化成陣列
    let list;
    if (Array.isArray(units)) list = units;
    else if (units && units.items) list = units.items.map(it => ({ it }));
    else list = [];
    if (!list.length) { svg.innerHTML = ''; return; }

    let shapes = `
      <defs><marker id="pos-dep-arrow" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M0,0 L8,4 L0,8 Z" style="fill:rgba(148,163,184,.95)"/>
      </marker></defs>`;
    list.forEach(u => {
      const it = u.it;
      if (!it.deps || !it.deps.length) return;
      const self = bars[it.id]; if (!self) return;
      const sR = self.getBoundingClientRect();
      // 自己的尾巴(右端)= 線條起點
      const sx = sR.right - bodyR.left - 4;
      const sy = sR.top - bodyR.top + sR.height/2;
      it.deps.forEach(depId => {
        const dep = bars[depId]; if (!dep) return;
        const dR = dep.getBoundingClientRect();
        // 被依賴任務的頭(左端)= 箭頭落點
        const ex = dR.left - bodyR.left + 1;
        const ey = dR.top - bodyR.top + dR.height/2;
        const mx = (sx + ex)/2;
        const my = (sy + ey)/2 - 6;
        const d = `M ${sx} ${sy} C ${sx + (ex-sx)*0.45} ${sy}, ${sx + (ex-sx)*0.55} ${ey}, ${ex} ${ey}`;
        shapes += `<path class="dep-line" data-from="${esc(it.id)}" data-to="${esc(depId)}" d="${d}" marker-end="url(#pos-dep-arrow)"/>`;
        // 起點圓點
        shapes += `<circle cx="${sx}" cy="${sy}" r="2.5" style="fill:#fff;stroke:rgba(148,163,184,.95)"/>`;
        // 虛線上的註解(若存在)
        const dn = it.depNotes && it.depNotes[depId];
        if (dn) {
          shapes += `<text class="dep-note" data-from="${esc(it.id)}" data-to="${esc(depId)}" x="${mx}" y="${my}" text-anchor="middle">📌 ${esc(dn)}</text>`;
        }
      });
    });
    svg.setAttribute('width', bodyR.width);
    svg.setAttribute('height', bodyR.height);
    svg.style.width = bodyR.width+'px';
    svg.style.height = bodyR.height+'px';
    svg.innerHTML = shapes;

    // 虛線註解:點虛線 → 編輯該依賴關係的註解
    const bindDepNote = el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', e => {
        e.stopPropagation();
        const fromId = el.dataset.from, toId = el.dataset.to;
        const u = list.find(x => x.it.id === fromId);
        if (u) addDepNote(u.it, toId);
      });
    };
    svg.querySelectorAll('.dep-line').forEach(bindDepNote);
    svg.querySelectorAll('.dep-note').forEach(bindDepNote);
  }

  function wireGanttDrag(p, stage, gridW, dayW, xFor, minD){
    // 依 item id 跨專案所有階段查詢(All 模式下也要能編輯)
    const get = id => {
      for (const st of p.stages) {
        const f = st.items.find(it => it.id === id);
        if (f) return f;
      }
      return null;
    };
    const minW = Math.max(14, dayW);   // 最小 1 天 / 14px
    const setBar = (bar, left, w) => { bar.style.left = left+'px'; bar.style.width = w+'px'; };

    $$('.gantt .g-bar').forEach(bar => {
      const itid = bar.dataset.item;
      let mode=null, startX, origLeft, origW, origStart, origEnd;

      const onDown = (e, m) => {
        mode = m; startX = e.clientX;
        origLeft = parseFloat(bar.style.left);
        origW = parseFloat(bar.style.width);
        const it = get(itid);
        origStart = it.start; origEnd = it.end;
        e.preventDefault(); e.stopPropagation();
        document.body.classList.add('g-dragging');
      };
      bar.addEventListener('mousedown', e => {
        const r = e.target.closest('.g-resize-r');
        const l = e.target.closest('.g-resize-l');
        if (r) return onDown(e,'r');
        if (l) return onDown(e,'l');
        onDown(e,'move');
      });

      document.addEventListener('mousemove', e => {
        if (!mode) return;
        const it = get(itid); if (!it) return;
        const dx = e.clientX - startX;
        const tip = $('#gantt-tip');
        if (mode==='move') {
          const left = Math.max(0, Math.min(origLeft + dx, gridW));
          bar.style.left = left+'px';
          const shift = Math.round((left-origLeft)/dayW);
          it.start = addDays(origStart, shift);
          it.end = addDays(origEnd, shift);
          tip.textContent = `${esc(it.task)}: ${fmt(it.start)} → ${fmt(it.end)} (moved ${shift} day${shift===1?'':'s'})`;
        } else if (mode==='r') {
          const w = Math.max(minW, origW + dx);
          setBar(bar, origLeft, w);
          it.end = addDays(origEnd, Math.round((w-origW)/dayW));
          tip.textContent = `${esc(it.task)}: ${fmt(it.start)} → ${fmt(it.end)}`;
        } else if (mode==='l') {
          let left = origLeft + dx, w = origW - dx;
          if (w < minW) { w = minW; left = origLeft + origW - minW; }
          setBar(bar, left, w);
          it.start = addDays(origStart, Math.round((left-origLeft)/dayW));
          tip.textContent = `${esc(it.task)}: ${fmt(it.start)} → ${fmt(it.end)}`;
        }
      });

      document.addEventListener('mouseup', () => {
        if (!mode) return;
        mode = null;
        document.body.classList.remove('g-dragging');
        saveData();
        renderGantt();
      });
    });
  }

  /* =====================================================
     BOOT
  ===================================================== */
  function render(view){
    if (view==='dashboard') renderDashboard();
    if (view==='planner') renderPlanner();
    if (view==='gantt') renderGantt();
    if (view==='waterfall') renderWaterfall();
    $('#nav-stage-count').textContent = DATA.reduce((a,p)=>a+p.stages.length,0);
  }

  /* =====================================================
     WATERFALL — 機台(設備)資源瀑布
     每個測試項目需要的機台數,由小堆到大,看總需求。
  ===================================================== */
  function renderWaterfall(){
    const p = findProject(activeProj) || DATA[0];
    if (!p) { $('#wf-svg').innerHTML = ''; return; }
    if (!activeProj) activeProj = p.id;

    // stage 分頁
    $('#wf-stage-tabs').innerHTML = p.stages.map(s => `
      <button class="stbtn ${s.id===activeStage?'active':''}" data-stage="${s.id}">
        <span class="st-dot" style="background:${s.color}"></span>${esc(s.name)}<span class="st-count">${s.items.length}</span>
      </button>`).join('');
    $$('#wf-stage-tabs .stbtn').forEach(b => b.onclick = () => { activeStage = b.dataset.stage; renderWaterfall(); });

    // legend: 依 group 上色(取前幾個)
    const stage = ensureStage(p.id, activeStage) || p.stages[0];
    const groupColors = {};
    const palette = ['#6ee7b7','#60a5fa','#f472b6','#fbbf24','#a78bfa','#f87171'];
    stage.items.forEach(it => { if (it.group && !groupColors[it.group]) groupColors[it.group] = palette[Object.keys(groupColors).length % palette.length]; });
    $('#wf-legend').innerHTML = Object.entries(groupColors).map(([g,c]) => `
      <span><span class="lg" style="background:${c}"></span>${esc(g)}</span>`).join('')
      + `<span style="color:#ffb224;font-weight:600">📊 Total</span>`;

    // waterfall 資料: 每個 item 的 equip + 末端合計
    const data = stage.items.filter(it => (it.equip||0) > 0).map(it => ({
      label: it.task,
      value: it.equip,
      color: groupColors[it.group] || '#5d6b7e',
    }));
    data.push({ label: 'Total', isTotal: true, color: '#ffb224' });

    if (data.length === 1) {
      $('#wf-svg').innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-faint)">No machine allocations yet. Back in Planning, fill in the Machines column.</div>';
      $('#wf-legend').innerHTML = '';
    } else {
      Charts.waterfall($('#wf-svg'), data, { orientation: wfOrient, theme });
    }

    $$('#wf-orient button').forEach(b => b.classList.toggle('on', b.dataset.orient === wfOrient));

    // summary
    const total = data.reduce((s,d)=>s+(d.value||0),0);
    const byGroup = {};
    stage.items.forEach(it => { if (it.group) byGroup[it.group] = (byGroup[it.group]||0) + (it.equip||0); });
    $('#wf-summary').innerHTML = `
      <div class="budget-sum">
        ${Object.entries(byGroup).map(([g,v]) => `<div class="bs-row"><span>${esc(g)}</span><b>${v} m</b></div>`).join('') || '<div class="bs-row"><span>Ungrouped</span><b>0</b></div>'}
        <div class="bs-row total"><span>Total machines</span><b>${total}</b></div>
      </div>`;
  }

  $$('.nav-item[data-view]').forEach(b => b.onclick = () => go(b.dataset.view));

  // 新增專案
  function addProject(){
    const nm = prompt('Project name (e.g. neutrino): ', 'neutrino');
    if (nm === null) return;
    const colors = ['#ffb224','#60a5fa','#f472b6','#34d399','#a78bfa','#f87171'];
    const id = uid('p');
    DATA.push({ id, name: nm.trim()||'New Project', color: colors[DATA.length%colors.length], stages: [] });
    saveData(); activeProj = id; activeStage = null; go('planner');
  }
  $('#btn-add').onclick = addProject;

  // 還原匯入資料
  $('#btn-reset').onclick = () => {
    if (confirm('Restore the original data from Excel? This will clear all your edits.')) {
      DATA = defaultData();
      saveData(); activeProj = DATA[0]?.id||null; activeStage = null;
      render(currentView);
    }
  };

  $('#hamburger').onclick = () => $('.sidebar').classList.toggle('open');
  document.addEventListener('click', e => {
    if (!$('.sidebar').classList.contains('open')) return;
    if (!$('.sidebar').contains(e.target)) $('.sidebar').classList.remove('open');
  });

  // 點面板外部 → 關閉已開啟的「顏色下拉」
  document.addEventListener('click', e => {
    if (!e.target.closest('.ccol')) closeColorPops();
  });
  function closeColorPops(){ document.querySelectorAll('.cpop.open').forEach(p => p.classList.remove('open')); }

  // theme
  const themeToggle = $('#theme-toggle');
  function applyTheme(){
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme==='dark'?'☀️':'🌙';
  }
  themeToggle.onclick = () => { theme = theme==='dark'?'light':'dark'; localStorage.setItem('pos-theme',theme); applyTheme(); render(currentView); };

  // waterfall orientation
  $('#wf-orient').addEventListener('click', e => {
    const btn = e.target.closest('button[data-orient]');
    if (!btn) return;
    wfOrient = btn.dataset.orient;
    localStorage.setItem('pos-orient', wfOrient);
    if (currentView === 'waterfall') renderWaterfall();
  });

  // init
  activeProj = DATA[0]?.id || null;
  activeStage = DATA[0]?.stages[0]?.id || null;
  applyTheme();
  go('dashboard');
})();
