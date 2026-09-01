/* ============================================================
   ProjectOS — app controller: navigation, dashboard, tasks,
   interactive Gantt (SVG timeline + dependency connectors),
   waterfall wiring.
   ============================================================ */
(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const VIEWS = { dashboard: '專案總覽', tasks: '專案 & 任務', gantt: '甘特圖', waterfall: '預算 Waterfall' };
  let currentView = 'dashboard';
  let activeProj = null;
  let theme = localStorage.getItem('pos-theme') || 'dark';     // 'dark' | 'light'
  let wfOrient = localStorage.getItem('pos-orient') || 'v';    // 'v' | 'h'

  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* =====================================================
     ROUTER
  ===================================================== */
  function go(view){
    currentView = view;
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
    $('#view-title').textContent = VIEWS[view];
    render(view);
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */
  function renderDashboard(){
    const active = PROJECTS.filter(p => p.status !== 'done');
    const blocked = PROJECTS.filter(p => p.status === 'block');
    const totalBudget = PROJECTS.reduce((s,p)=>s+p.budget,0);
    const totalSpent = PROJECTS.reduce((s,p)=>s+p.spent,0);
    const avg = Math.round(PROJECTS.reduce((s,p)=>s+projProgress(p),0)/PROJECTS.length);
    const tasksDue = PROJECTS.flatMap(p=>p.tasks).filter(t=>t.status!=='done').length;
    const today = new Date();
    const todayStr = today.toLocaleDateString('zh-TW',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
    $('#today-line').textContent = todayStr;

    const metrics = [
      { l:'進行中專案', v: active.length, u:' 個', d:'共 '+PROJECTS.length+' 項', cls:'m-flat' },
      { l:'平均完成度', v: avg, u:' %', d: avg>70?'超前':avg>40?'穩定':'需關注', cls: avg>70?'m-up':avg>40?'m-flat':'m-down' },
      { l:'已用預算', v: Math.round(totalSpent/10000)/100, u:' 萬', d:'/ '+Math.round(totalBudget/10000)+' 萬', cls:'m-flat' },
      { l:'剩餘任務', v: tasksDue, u:' 件', d: blocked.length?'含 '+blocked.length+' 個卡關':'一切順利', cls: blocked.length?'m-down':'m-up' },
    ];
    $('#metric-grid').innerHTML = metrics.map(m => `
      <div class="metric">
        <div class="m-label">${m.l}</div>
        <div class="m-value">${m.v}<small>${m.u}</small></div>
        <div class="m-delta ${m.cls}">${m.d}</div>
      </div>`).join('');

    // project progress bars
    const sorted = [...PROJECTS].sort((a,b)=>projProgress(b)-projProgress(a));
    $('#proj-bars').innerHTML = sorted.map(p => `
      <div class="proj-bar" data-proj="${p.id}" style="cursor:pointer">
        <span class="pb-dot" style="background:${p.color}"></span>
        <div class="pb-name">${esc(p.name)}<small>${esc(OWNERS[p.manager].name)} 負責</small></div>
        <div class="pb-track"><div class="pb-fill" style="width:${projProgress(p)}%;background:linear-gradient(90deg,${p.color},#fff2)"></div></div>
        <span class="pb-pct">${projProgress(p)}%</span>
      </div>`).join('');
    $$('#proj-bars .proj-bar').forEach(el => el.onclick = () => openProj(el.dataset.proj));

    // status donut
    renderDonut('status-ring');

    // recent tasks
    const now = new Date();
    const recents = PROJECTS.flatMap(p=>p.tasks.map(t=>({t,p})))
      .filter(x=>x.t.status!=='done')
      .sort((a,b)=>new Date(a.t.end)-new Date(b.t.end)).slice(0,5);
    $('#recent-tasks').innerHTML = recents.map(({t,p}) => {
      const over = new Date(t.end) < now;
      return `
      <div class="rt-row">
        <div class="rt-check" data-mark="${t.id}" style="cursor:pointer">✓</div>
        <div class="rt-name">${esc(t.name)}</div>
        <span class="rt-proj" style="color:${p.color}">${esc(p.name)}</span>
        <span class="rt-owner"><span class="av" style="width:22px;height:22px;background:${OWNERS[t.owner].color}">${OWNERS[t.owner].name[0]}</span>${OWNERS[t.owner].name}</span>
        <span class="rt-due ${over?'over':''}">${over?'過期 ':''}${t.end.slice(5)}</span>
      </div>`;
    }).join('');
    $$('#recent-tasks .rt-check').forEach(el => el.onclick = () => toggleTaskDone(el.dataset.mark));
  }

  function renderDonut(id){
    const counts = { todo:0, doing:0, block:0, done:0 };
    PROJECTS.forEach(p=>p.tasks.forEach(t=>counts[t.status]++));
    const arr = [
      { key:'todo',  value:counts.todo },
      { key:'doing', value:counts.doing },
      { key:'block', value:counts.block },
      { key:'done',  value:counts.done },
    ];
    const total = PROJECTS.flatMap(p=>p.tasks).length;
    $('#'+id).innerHTML = `
      <div class="ring-wrap">
        <div id="ring-svg"></div>
        <div class="ring-legend">
          ${arr.map(c=>`
            <div class="rl-item"><span class="rl-dot" style="background:${STATUS_META[c.key].color}"></span>${STATUS_META[c.key].label}<span class="rl-count">${c.value}</span></div>
          `).join('')}
        </div>
      </div>`;
    Charts.donut($('#ring-svg'), arr.map(c=>({value:c.value,color:STATUS_META[c.key].color})), { center:String(total), sub:'全部任務', size:150, stroke:21, theme });
  }

  /* =====================================================
     TASKS / PROJECT DETAIL
  ===================================================== */
  function renderTasks(){
    $('#proj-tabs').innerHTML = PROJECTS.map(p => `
      <button class="ptab ${p.id===activeProj?'active':''}" data-proj="${p.id}">
        <span class="pt-dot" style="background:${p.color}"></span>
        <span class="pt-name">${esc(p.name)}</span>
        <span class="pt-pct">${projProgress(p)}%</span>
      </button>`).join('');
    $$('#proj-tabs .ptab').forEach(b => b.onclick = () => { activeProj=b.dataset.proj; renderTasks(); });
    openProj(activeProj || PROJECTS[0].id, false);
  }

  function openProj(id, switchView=true){
    activeProj = id;
    const p = projById(id);
    if (switchView) { go('tasks'); return; }

    $('#proj-detail-title').textContent = p.name;
    $('#proj-meta').innerHTML = `
      <span>預算<b>${p.budget.toLocaleString()}</b></span>
      <span>已花<b>${p.spent.toLocaleString()}</b></span>
      <span>負責人<b>${OWNERS[p.manager].name}</b></span>`;
    $('#proj-detail-progress').style.width = projProgress(p) + '%';

    $('#task-list').innerHTML = p.tasks.map(t => `
      <div class="task-row ${t.status==='done'?'done':''}" data-task="${t.id}">
        <div class="t-name">
          <span class="t-check" data-mark="${t.id}" style="cursor:pointer">✓</span>
          ${esc(t.name)}
        </div>
        <div>
          <span class="badge ${'b-'+t.status}" style="background:${STATUS_META[t.status].bg};color:${STATUS_META[t.status].color}">${STATUS_META[t.status].label}</span>
        </div>
        <div class="owner"><span class="av" style="background:${OWNERS[t.owner].color}">${OWNERS[t.owner].name[0]}</span>${OWNERS[t.owner].name}</div>
        <div class="dates">${t.start.slice(5)} → ${t.end.slice(5)}</div>
        <div class="mini-pct">
          <div class="mp-track"><div class="mp-fill" style="width:${t.progress}%"></div></div>
          <span>${t.progress}%</span>
        </div>
      </div>`).join('');

    $$('#task-list .t-check, #task-list .rt-check').forEach(el => el.onclick = () => toggleTaskDone(el.dataset.mark));
  }

  function toggleTaskDone(taskId){
    const t = taskById(taskId);
    if (!t) return;
    t.status = (t.status === 'done') ? 'doing' : 'done';
    t.progress = (t.status === 'done') ? 100 : 0;
    // keep the currently visible view in sync
    if (currentView === 'dashboard') renderDashboard();
    if (currentView === 'tasks') renderTasks();
    if (currentView === 'gantt') renderGantt();
    if (currentView === 'waterfall') renderWaterfall();
  }

  /* =====================================================
     GANTT
  ===================================================== */
  function renderGantt(){
    const proj = projById(activeProj) || PROJECTS[0];
    if (!activeProj) activeProj = proj.id;

    // legend
    $('#gantt-legend').innerHTML = ['todo','doing','block','done'].map(s => `
      <span><span class="lg" style="background:${STATUS_META[s].color}"></span>${STATUS_META[s].label}</span>`).join('')
      + `<span><span class="lg" style="background:transparent;border:2px dashed #5d6b7e"></span>裡程碑</span>`;

    // timeline span
    const dates = proj.tasks.flatMap(t => [t.start, t.end]);
    const minD = dates.reduce((a,b)=>new Date(a)<new Date(b)?a:b);
    const maxD = new Date(Math.max(...proj.tasks.map(t=>new Date(t.end))));
    const totalDays = Math.max(daySpan(minD, maxD.toISOString().slice(0,10)), 1);
    const dayW = Math.max(Math.floor(860 / totalDays), 3);

    // column markers (month-ish) -> every Sunday
    const cols = [];
    const step = totalDays > 90 ? 14 : totalDays > 40 ? 7 : 5;
    for (let i = 0; i <= totalDays; i += step) {
      const d = new Date(new Date(minD).getTime() + i * 86400000);
      const day = d.toISOString().slice(0,10);
      // skip if beyond range
      if (day > maxD.toISOString().slice(0,10)) break;
      cols.push({ day, x: i * dayW, label: day.slice(5) });
    }
    const gridW = (totalDays + 1) * dayW;

    const xFor = date => daySpan(minD, date) * dayW;
    const wFor = t => Math.max(daySpan(t.start, t.end) * dayW, 14);

    let headCells = '';
    cols.forEach((c,i) => {
      headCells += `<div class="g-col ${i===0?'has-line':''}" style="position:relative">
        <span class="g-col-label" style="left:${c.x}px;transform:translateX(-50%)">${c.label}</span></div>`;
    });

    const groupStyle = s => `background:${s.color}26;border-left:3px solid ${s.color}`;

    let rows = '';
    // summary row
    rows += `<div class="gantt-row g-group">
      <div class="gantt-label-cell"><b>${esc(proj.name)}</b></div>
      <div class="gantt-timeline-cell">
        <div class="gantt-grid" style="width:${gridW}px"></div>
      </div></div>`;

    // task rows
    proj.tasks.forEach(t => {
      const left = xFor(t.start);
      const w = wFor(t);
      const color = STATUS_META[t.status].color;
      const isMilestone = w < 20;
      rows += `<div class="gantt-row">
        <div class="gantt-label-cell"><span class="pb-dot" style="background:${color}"></span>${esc(t.name)}</div>
        <div class="gantt-timeline-cell">
          <div class="gantt-grid" style="width:${gridW}px">
            ${cols.map((c,i)=>`<div class="g-col ${i===0?'has-line':''}"></div>`).join('')}
          </div>
          ${isMilestone
            ? `<div class="g-milestone" style="left:${left + w/2}px"></div>`
            : `<div class="g-bar ${t.status}" style="left:${left}px;width:${w}px;background:${color};${t.status==='done'?'background:linear-gradient(90deg,#34d399,#34d399)':''}">
                ${w > 70 ? esc(t.name) : ''}</div>`}
        </div>
      </div>`;
    });

    // dependency connectors (SVG overlay, absolutely positioned)
    const DEP = { ROW:44, LABELW:240, BARH:24 };
    let deps = '';
    if (proj.deps) {
      proj.deps.forEach(([fromId,toId]) => {
        const from = proj.tasks.find(t=>t.id===fromId);
        const to = proj.tasks.find(t=>t.id===toId);
        if (!from || !to) return;
        const fi = proj.tasks.indexOf(from), ti = proj.tasks.indexOf(to);
        const x1 = DEP.LABELW + xFor(from.end) + wFor(from);
        const y1 = 54 + (DEP.ROW * (fi + 1)) + DEP.BARH/2;
        const x2 = DEP.LABELW + xFor(to.start);
        const y2 = 54 + (DEP.ROW * (ti + 1)) + DEP.BARH/2;
        const midX = (x1 + x2) / 2;
        deps += `<path d="M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}"
          class="g-dep" marker-end="url(#arrow)" ${(fromId===toId)?'':''}/>`;
      });
    }

    const headW = gridW;
    $('#gantt-card').innerHTML = `
      <div class="gantt">
        <div class="gantt-inner">
          <div class="gantt-head">
            <div class="gantt-labels">
              <span class="g-hint">任務</span>
            </div>
            <div class="gantt-timeline" style="height:54px">
              ${headCells}
            </div>
          </div>
          <div style="position:relative">
            ${rows}
            <svg width="${headW + DEP.LABELW}" height="${54 + proj.tasks.length * 44 + 44}" style="position:absolute;top:0;left:0;pointer-events:none;z-index:3;overflow:visible">
              <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#5d6b7e"/></marker></defs>
              ${deps}
            </svg>
          </div>
        </div>
      </div>`;
  }

  /* =====================================================
     WATERFALL
  ===================================================== */
  function renderWaterfall(){
    const p = projById(activeProj) || PROJECTS[0];
    if (!activeProj) activeProj = p.id;

    const waterData = [
      { label:'起始',     isTotal:true, color:'#ffb224' },
      { label:'總預算',   value: +p.budget, color:'#6ee7b7' },
      { label:'已投入',   value: -p.spent,  color:'#f87171' },
      { label:'剩餘(總)', isTotal:true, color:'#fbbf24' },
    ];
    Charts.waterfall($('#waterfall-card svg'), waterData, { orientation: wfOrient, theme });

    // keep orientation segmented control in sync
    $$('#wf-orient button').forEach(b => b.classList.toggle('on', b.dataset.orient === wfOrient));

    $('#budget-summary').innerHTML = `
      <div class="budget-sum">
        <div class="bs-row"><span>總預算</span><b>${p.budget.toLocaleString()}</b></div>
        <div class="bs-row"><span>已投入</span><b>${p.spent.toLocaleString()}</b></div>
        <div class="bs-row"><span>使用率</span><b>${Math.round(p.spent/p.budget*100)}%</b></div>
        <div class="bs-row"><span>預估剩餘</span><b>${(p.budget-p.spent).toLocaleString()}</b></div>
        <div class="bs-row total"><span>專案 ${esc(p.name)}</span><b>${p.budget.toLocaleString()}</b></div>
      </div>`;
  }

  /* =====================================================
     BOOT
  ===================================================== */
  function render(view){
    if (view==='dashboard') renderDashboard();
    if (view==='tasks') renderTasks();
    if (view==='gantt') renderGantt();
    if (view==='waterfall') renderWaterfall();
  }

  $$('.nav-item[data-view]').forEach(b => b.onclick = () => go(b.dataset.view));
  $('#btn-demo').onclick = () => { go('dashboard'); };
  $('#btn-add').onclick = () => alert('新增專案（示範）— 可擴充 modal 表單。');
  $('#hamburger').onclick = () => $('.sidebar').classList.toggle('open');
  document.addEventListener('click', e => {
    if (!$('.sidebar').classList.contains('open')) return;
    if (!$('.sidebar').contains(e.target)) $('.sidebar').classList.remove('open');
  });

  // ---- theme switch ----
  const themeToggle = $('#theme-toggle');
  function applyTheme(){
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.title = theme === 'dark' ? '切換到亮色' : '切換到暗色';
  }
  themeToggle.onclick = () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('pos-theme', theme);
    applyTheme();
    render(currentView);   // re-render current view so SVG charts pick up the new palette
  };

  // ---- waterfall orientation ----
  $('#wf-orient').addEventListener('click', e => {
    const btn = e.target.closest('button[data-orient]');
    if (!btn) return;
    wfOrient = btn.dataset.orient;
    localStorage.setItem('pos-orient', wfOrient);
    renderWaterfall();
  });

  // init
  activeProj = PROJECTS[0].id;
  applyTheme();
  go('dashboard');
  window.addEventListener('resize', () => { if (currentView==='waterfall') renderWaterfall(); });
})();
