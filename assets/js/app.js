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

  const VIEWS = { dashboard: '總覽', planner: '排程規劃', gantt: '甘特圖', waterfall: '機台瀑布' };
  let currentView = 'dashboard';
  let activeProj = null;    // project id
  let activeStage = null;   // stage id
  let theme = localStorage.getItem('pos-theme') || 'dark';
  let wfOrient = localStorage.getItem('pos-orient') || 'v';

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
      ? `共有 ${DATA.length} 個專案、${DATA.reduce((a,p)=>a+p.stages.length,0)} 個階段、${items.length} 個測試項目。`
      : '還沒有專案,點右上角「＋ 新增專案」開始。';
    $('#today-line').textContent = new Date().toLocaleDateString('zh-TW',{year:'numeric',month:'long',day:'numeric',weekday:'long'});

    $('#metric-grid').innerHTML = [
      { l:'專案數', v: DATA.length, u:' 個', d: DATA.reduce((a,p)=>a+p.stages.length,0)+' 個階段', cls:'m-flat' },
      { l:'平均進度', v: avg, u:' %', d: avg>70?'超前':avg>40?'穩定':'需關注', cls: avg>70?'m-up':avg>40?'m-flat':'m-down' },
      { l:'測試項目', v: items.length, u:' 件', d: `${done} 完成 / ${doing} 進行`, cls:'m-flat' },
      { l:'待辦項目', v: items.length - done, u:' 件', d: block?'含 '+block+' 個卡關':'一切順利', cls: block?'m-down':'m-up' },
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
        <div class="pb-name">${esc(p.name)}<small>${p.stages.length} 個階段 · ${p.stages.reduce((a,s)=>a+s.items.length,0)} 個項目</small></div>
        <div class="pb-track"><div class="pb-fill" style="width:${projectProgress(p)}%;background:linear-gradient(90deg,${p.color},#fff2)"></div></div>
        <span class="pb-pct">${projectProgress(p)}%</span>
      </div>`).join('');
    $$('#proj-bars .proj-bar').forEach(el => el.onclick = () => { activeProj = el.dataset.proj; go('planner'); });

    renderDonut('status-ring');

    $('#recent-tasks').innerHTML = dueSoon.length ? dueSoon.map(({p,s,it}) => `
      <div class="rt-row">
        <div class="rt-check" data-item="${it.id}" data-stage="${s.id}" style="cursor:pointer">✓</div>
        <div class="rt-name">${esc(it.task)||'(未命名)'}</div>
        <span class="rt-proj" style="color:${p.color}">${esc(p.name)} / ${esc(s.name)}</span>
        <span class="rt-owner">${esc(it.group)}</span>
        <span class="rt-due">${fmt(it.start)} → ${fmt(it.end)}</span>
      </div>`).join('') : '<div class="rt-empty">目前沒有待辦項目 🎉</div>';
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
    if (Charts.donut) Charts.donut($('#ring-svg'), arr.map(c=>({value:c.value,color:STATUS_META[c.key].color})), { center:String(items.length)||'0', sub:'全部項目', size:150, stroke:21, theme });
  }

  /* =====================================================
     PLANNER — 專案/階段/測試項目管理(全可編輯)
  ===================================================== */
  function renderPlanner(){
    if (!DATA.length) {
      $('#planner-proj-tabs').innerHTML = '';
      $('#stage-tabs').innerHTML = '';
      $('#item-list').innerHTML = '<div class="rt-empty">先點右上角新增專案。</div>';
      return;
    }
    if (!activeProj || !findProject(activeProj)) activeProj = DATA[0].id;

    // project tabs (in hero)
    $('#planner-proj-tabs').innerHTML = DATA.map(p => `
      <button class="ptab ${p.id===activeProj?'active':''}" data-proj="${p.id}">
        <span class="pt-dot" style="background:${p.color}"></span>
        <span class="pt-name">${esc(p.name)}</span>
        <span class="pt-pct">${projectProgress(p)}%</span>
        <span class="pt-del" data-delproj="${p.id}" title="刪除專案">×</span>
      </button>`).join('')
      + `<button class="ptab ptab-add" id="planner-add-stage" title="新增階段">＋ 階段</button>`;

    $$('#planner-proj-tabs .ptab[data-proj]').forEach(b => b.onclick = () => {
      activeProj = b.dataset.proj; activeStage = null; renderPlanner();
    });
    $$('#planner-proj-tabs .pt-del').forEach(el => el.onclick = e => {
      e.stopPropagation();
      if (confirm('確定刪除這個專案?')) {
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
      $('#stage-tabs').innerHTML = '<div class="rt-empty">此專案還沒有階段,點 「＋ 階段」新增(如 EB1 / TS1 / EB2 / TS2)。</div>';
      $('#item-list').innerHTML = '';
      return;
    }
    const stage = findStage(activeProj, activeStage);

    // stage tabs (可拖曳排序)
    $('#stage-tabs').innerHTML = p.stages.map(s => `
      <button class="stbtn ${s.id===activeStage?'active':''}" data-stage="${s.id}" draggable="true">
        <span class="st-grip" title="拖曳排序">⠿</span>
        <span class="pt-dot" style="background:${s.color}"></span>${esc(s.name)}
        <span class="st-pct">${stageProgress(s)}%</span>
        <span class="st-del" data-delstage="${s.id}" title="刪除階段">×</span>
      </button>`).join('');
    $$('#stage-tabs .stbtn[data-stage]').forEach(b => b.onclick = () => { activeStage = b.dataset.stage; renderPlanner(); });
    $$('#stage-tabs .st-del').forEach(el => el.onclick = e => {
      e.stopPropagation();
      if (confirm('確定刪除這個階段?')) {
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
    const nm = prompt('新增階段名稱(如 EB1、EB2、TS1、TS2):', 'EB1');
    if (nm === null) return;
    const p = findProject(activeProj);
    if (!p) return;
    const name = nm.trim() || '階段';
    const colors = ['#ffb224','#60a5fa','#f472b6','#34d399','#a78bfa','#f87171'];
    const st = { id: uid('st'), name, color: colors[p.stages.length%colors.length], items: [] };
    // 插入到「目前所在階段」之後(你說 EB2 加在中間這種情形)
    const curIdx = p.stages.findIndex(s => s.id === activeStage);
    if (curIdx >= 0) p.stages.splice(curIdx + 1, 0, st);
    else p.stages.push(st);
    activeStage = st.id; saveData(); renderPlanner(); renderGantt();
  }

  function addItem(p, stage){
    stage.items.push({ id: uid('it'), group:'', task:'新項目', validation:'', start: todayStr(), end: todayStr(), remark:'', status:'todo', equip:0, deps:[] });
    saveData(); renderPlanner(); renderGantt();
  }

  function renderItemTable(p, stage){
    if (!stage || !stage.items) return;
    const rows = stage.items.map((it, i) => `
      <div class="item-row" data-item="${it.id}">
        <div class="it-check" data-check="${it.id}" title="標記完成">✓</div>
        <input class="ed-f" data-f="group" value="${esc(it.group)}" placeholder="如 Baseboard">
        <input class="ed-f ed-task" data-f="task" value="${esc(it.task)}" placeholder="Task 名稱">
        <input class="ed-f" data-f="validation" value="${esc(it.validation)}" placeholder="Validation">
        <input type="date" class="ed-date" data-f="start" value="${it.start}">
        <input type="date" class="ed-date" data-f="end" value="${it.end}">
        <input class="ed-f ed-remark" data-f="remark" value="${esc(it.remark)}" placeholder="Remark">
        <input type="number" class="ed-f ed-equip" data-f="equip" value="${it.equip||0}" min="0" step="1" title="機台數" placeholder="機台">
        <button class="ed-f ed-deps${(it.deps&&it.deps.length)?' has-dep':''}" data-deps="${it.id}" title="關聯:勾選「須等其完成的前驅任務」">${(it.deps&&it.deps.length)?it.deps.length+' ⤹':'⤹'}</button>
        <select class="ed-f ed-status" data-f="status">
          ${['todo','doing','block','done'].map(s=>`<option value="${s}" ${it.status===s?'selected':''}>${STATUS_META[s].label}</option>`).join('')}
        </select>
        <button class="task-del" data-del="${it.id}" title="刪除項目">×</button>
      </div>`).join('');

    $('#item-list').innerHTML = stage.items.length
      ? rows
      : '<div class="rt-empty">此階段還沒有測試項目,點「＋ 新增項目」。</div>';

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
      if (!confirm('刪除這個測試項目?')) return;
      stage.items = stage.items.filter(x=>x.id!==el.dataset.del);
      activeStage = stage.id;
      saveData(); renderPlanner();
    });
    // 關聯(deps)popover
    $$('#item-list .ed-deps').forEach(btn => btn.onclick = e => {
      e.stopPropagation();
      openDepsPicker(p, stage, btn);
    });
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
      <div class="deps-pop-h">前驅任務(須先完成)</div>
      ${groups.length ? groups.map(g => `
        <div class="deps-group-h">${esc(g.stage.name)}${g.stage===stage?' (本階段)':''}</div>
        ${g.items.map(x => `
          <label class="deps-opt">
            <input type="checkbox" data-depid="${x.id}" ${it.deps.includes(x.id)?'checked':''}>
            <span class="dopts-task">${esc(x.task)||'(未命名)'}</span>
            <span class="dopts-range">${fmt(x.start)}→${fmt(x.end)}</span>
          </label>`).join('')}
      `).join('')
      : '<div class="deps-empty">專案沒有其他任務可關聯。</div>'}
      <div class="deps-pop-f"><button data-dep-done>完成</button></div>`;
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
    if (!p) { $('#gantt-card').innerHTML = '<div class="gantt-empty">先新增專案。</div>'; return; }
    activeProj = p.id;
    if (!activeStage || !p.stages.find(s=>s.id===activeStage)) activeStage = p.stages[0]?.id || null;

    // stage tabs
    $('#gantt-stage-tabs').innerHTML = p.stages.map(s => `
      <button class="stbtn ${s.id===activeStage?'active':''}" data-stage="${s.id}">
        <span class="pt-dot" style="background:${s.color}"></span>${esc(s.name)}
      </button>`).join('')
      + (p.stages.length===0 ? '<span class="rt-empty">此專案還沒有階段</span>' : '');
    $$('#gantt-stage-tabs .stbtn[data-stage]').forEach(b => b.onclick = () => { activeStage = b.dataset.stage; renderGantt(); });

    const stage = findStage(activeProj, activeStage);
    if (!stage || !stage.items || !stage.items.length) {
      $('#gantt-card').innerHTML = '<div class="gantt-empty">此階段還沒有項目,到「排程規劃」新增。</div>';
      return;
    }
    const items = stage.items;

    // legend
    $('#gantt-legend').innerHTML = ['todo','doing','block','done'].map(s => `
      <span><span class="lg" style="background:${STATUS_META[s].color}"></span>${STATUS_META[s].label}</span>`).join('')
      + `<span class="lg-tip">· 拖曳橫條移動 · 拖曳左右兩端調整天數</span>`;

    // timeline span (from min start to max end, with 2-day padding)
    const allDates = items.flatMap(it => it.start && it.end ? [it.start, it.end] : []);
    if (!allDates.length) { $('#gantt-card').innerHTML = '<div class="gantt-empty">項目沒有日期。</div>'; return; }
    const minD = addDays(allDates.reduce((a,b)=>new Date(a)<new Date(b)?a:b), -2);
    const maxD = addDays(allDates.reduce((a,b)=>new Date(a)>new Date(b)?a:b), 2);
    const totalDays = Math.max(daySpan(minD, maxD), 7);
    // 軸放大模式:grid 寬 = 卡片可用寬(撐滿),dayW 按比例縮放 → bar 寬度精確對應天數
    const cardW = $('#gantt-card').clientWidth;
    const gridW = Math.max(cardW - 250 - 48, 600);
    const dayW = gridW / totalDays;

    // month header
    let monthHeader = '';
    let m = new Date(minD); m.setDate(1);
    const mEnd = new Date(maxD); mEnd.setDate(1);
    while (m <= mEnd) {
      let next = new Date(m); next.setMonth(next.getMonth()+1);
      const s0 = Math.max(0, daySpan(minD, iso(m)));
      const s1 = Math.max(0, daySpan(minD, iso(next)));
      monthHeader += `<div class="g-month" style="left:${s0*dayW}px;width:${(s1-s0)*dayW}px">${m.getFullYear()} / ${m.getMonth()+1}</div>`;
      m = next;
    }

    // week gridlines + 每日日期標籤(每天必標;格太窄時自動縮小字)
    let gridCols = '';
    let dayLabels = '';
    const dayFont = dayW >= 30 ? 10.5 : dayW >= 18 ? 9.5 : dayW >= 11 ? 8 : 7;
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
    // 寬度精確對應天數;至少 14px 避免零寬度不可見
    const wFor = it => Math.max(daySpan(it.start, it.end)*dayW, 14);

    const LABELW = 250;
    const ROWH = 38, HEADH = 46, PAD = 6, BARH = 22;

    // group rows (unique groups, in order) — 先畫群組區隔
    const groups = [];
    items.forEach(it => { if (it.group && !groups.includes(it.group)) groups.push(it.group); });
    if (!groups.includes('')) groups.push('');  // 未分組放最後

    let rows = '';
    // 摘要列
    rows += `<div class="gantt-row g-group">
      <div class="gantt-label-cell"><b>${esc(p.name)} · ${esc(stage.name)}</b><span class="g-range-info">${totalDays} 天</span></div>
      <div class="gantt-timeline-cell">
        ${gridCols}
        <div class="g-range" style="left:0;width:${gridW}px"></div>
      </div></div>`;

    // 群組標題列 + 項目列
    groups.forEach(g => {
      const gItems = items.filter(it => (it.group||'') === g);
      if (!gItems.length) return;
      const gName = g || '未分組';
      rows += `<div class="gantt-row g-sub">
        <div class="gantt-label-cell g-sub-label">${esc(gName)}</div>
        <div class="gantt-timeline-cell">${gridCols}</div>
      </div>`;
      gItems.forEach(it => {
        if (!it.start || !it.end) return;
        const left = xFor(it.start);
        const w = wFor(it);
        const color = STATUS_META[it.status]?.color || '#5d6b7e';
        rows += `<div class="gantt-row" data-item="${it.id}">
          <div class="gantt-label-cell">
            <span class="pb-dot" style="background:${color}"></span>
            <span class="g-label-text" title="${esc(it.task)}">${esc(it.task)||'項目'}</span>
            <span class="g-label-date">${fmt(it.start)}–${fmt(it.end)}</span>
          </div>
          <div class="gantt-timeline-cell">
            ${gridCols}
            <div class="g-bar ${it.status}" data-item="${it.id}"
                 style="left:${left}px;width:${w}px;background:${color}"
                 title="${esc(it.task)} · ${fmt(it.start)} → ${fmt(it.end)}">
              <span class="g-resize g-resize-l" data-r="l"></span>
              <span class="g-resize g-resize-r" data-r="r"></span>
            </div>
          </div>
        </div>`;
      });
    });

    $('#gantt-card').innerHTML = `
      <div class="gantt" id="gantt-scroll">
        <div class="gantt-inner" id="gantt-inner">
          <div class="gantt-head">
            <div class="gantt-labels"><span class="g-hint">${esc(stage.name)} 項目</span></div>
            <div class="gantt-timeline" style="height:${HEADH+20}px;position:relative">
              <div class="g-months" style="width:${gridW}px;bottom:20px;top:0">${monthHeader}</div>
              <div class="g-days" style="bottom:0;height:20px;width:${gridW}px">${dayLabels}</div>
            </div>
          </div>
          <div class="gantt-body" style="position:relative">
            ${rows}
            <svg class="dep-svg" id="gantt-deps"></svg>
          </div>
          <div class="gantt-foot" id="gantt-tip"></div>
        </div>
      </div>`;

    wireGanttDrag(p, stage, gridW, dayW, xFor, minD);
    // 用實際 DOM 位置畫 deps 箭頭(在 paintDeps 內)
    requestAnimationFrame(() => paintDeps(stage));
  }

  /* 畫 deps 箭頭:前驅任務右端 → 任務左端,依 getBoundingClientRect 計算 */
  function paintDeps(stage){
    const svg = document.getElementById('gantt-deps');
    if (!svg || !stage || !stage.items) return;
    const body = svg.parentNode; // .gantt-body
    const bodyR = body.getBoundingClientRect();
    const get = id => stage.items.find(it => it.id === id);
    const bars = {};
    body.querySelectorAll('.g-bar,.g-milestone').forEach(el => bars[el.dataset.item] = el);

    let shapes = '';
    stage.items.forEach(it => {
      if (!it.deps || !it.deps.length) return;
      const target = bars[it.id]; if (!target) return;
      const tR = target.getBoundingClientRect();
      // 目標左端(箭頭落點)
      let ex = tR.left - bodyR.left + 4;
      let ey = tR.top - bodyR.top + tR.height/2;
      it.deps.forEach(depId => {
        const dep = bars[depId]; if (!dep) return;
        const dR = dep.getBoundingClientRect();
        // 前驅右端(箭頭起點)
        let sx = dR.right - bodyR.left - 4;
        let sy = dR.top - bodyR.top + dR.height/2;
        // 避免目標在前驅左邊造成反向
        if (sx >= ex - 6) { sx = dR.right - bodyR.left; }
        const d = `M ${sx} ${sy} C ${sx + (ex-sx)*0.45} ${sy}, ${sx + (ex-sx)*0.55} ${ey}, ${ex-7} ${ey}`;
        shapes += `<path d="${d}"/>`;
        // 箭頭
        shapes += `<polygon points="${ex-7},${ey-4} ${ex-7},${ey+4} ${ex-1},${ey}"/>`;
        // 起點圓點
        shapes += `<circle cx="${sx}" cy="${sy}" r="2.5" style="fill:#fff;stroke:currentColor"/>`;
      });
    });
    svg.setAttribute('width', bodyR.width);
    svg.setAttribute('height', bodyR.height);
    svg.style.width = bodyR.width+'px';
    svg.style.height = bodyR.height+'px';
    svg.innerHTML = shapes;
  }

  function wireGanttDrag(p, stage, gridW, dayW, xFor, minD){
    const get = id => stage.items.find(it => it.id === id);
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
          tip.textContent = `${esc(it.task)}: ${fmt(it.start)} → ${fmt(it.end)}（移動 ${shift} 天）`;
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
      + `<span style="color:#ffb224;font-weight:600">📊 合計</span>`;

    // waterfall 資料: 每個 item 的 equip + 末端合計
    const data = stage.items.filter(it => (it.equip||0) > 0).map(it => ({
      label: it.task,
      value: it.equip,
      color: groupColors[it.group] || '#5d6b7e',
    }));
    data.push({ label: '合計', isTotal: true, color: '#ffb224' });

    if (data.length === 1) {
      $('#wf-svg').innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-faint)">這個階段還沒有機台配置。回到「排程規劃」填寫「機台」欄。</div>';
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
        ${Object.entries(byGroup).map(([g,v]) => `<div class="bs-row"><span>${esc(g)}</span><b>${v} 台</b></div>`).join('') || '<div class="bs-row"><span>未分群組</span><b>0 台</b></div>'}
        <div class="bs-row total"><span>合計機台</span><b>${total} 台</b></div>
      </div>`;
  }

  $$('.nav-item[data-view]').forEach(b => b.onclick = () => go(b.dataset.view));

  // 新增專案
  function addProject(){
    const nm = prompt('新專案名稱(如 neutrino):', 'neutrino');
    if (nm === null) return;
    const colors = ['#ffb224','#60a5fa','#f472b6','#34d399','#a78bfa','#f87171'];
    const id = uid('p');
    DATA.push({ id, name: nm.trim()||'新專案', color: colors[DATA.length%colors.length], stages: [] });
    saveData(); activeProj = id; activeStage = null; go('planner');
  }
  $('#btn-add').onclick = addProject;

  // 還原匯入資料
  $('#btn-reset').onclick = () => {
    if (confirm('還原成 Excel 匯入的原始資料?(會清除目前所有編輯)')) {
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
