/* ============================================================
   ProjectOS — dependency-free SVG chart renderers
   (donut ring, waterfall). Gantt lives in app.js (interactive).
   ============================================================ */

const Charts = (() => {

  /* ---------- Donut ring ---------- */
  function donut(svgEl, data, opts = {}) {
    const size = opts.size || 148;
    const stroke = opts.stroke || 20;
    const r = (size - stroke) / 2;
    const cx = size / 2, cy = size / 2;
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const circ = 2 * Math.PI * r;

    const NS = 'http://www.w3.org/2000/svg';
    svgEl.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svgEl.setAttribute('width', size);
    svgEl.setAttribute('height', size);

    const tpl = `
      <defs>
        <filter id="ringShade"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity=".45"/></filter>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#222a35" stroke-width="${stroke}"/>
    `;
    svgEl.innerHTML = tpl;

    let acc = 0;
    for (const d of data) {
      const frac = d.value / total;
      const len = frac * circ;
      const off = acc * circ;
      const seg = document.createElementNS(NS, 'circle');
      seg.setAttribute('cx', cx); seg.setAttribute('cy', cy); seg.setAttribute('r', r);
      seg.setAttribute('fill', 'none');
      seg.setAttribute('stroke', d.color);
      seg.setAttribute('stroke-width', stroke);
      seg.setAttribute('stroke-dasharray', `${Math.max(len - 2.5, 0.5)} ${circ}`);
      seg.setAttribute('stroke-dashoffset', -off - 1.25);
      seg.setAttribute('transform', 'rotate(-90 ' + cx + ' ' + cy + ')');
      seg.style.filter = 'url(#ringShade)';
      svgEl.appendChild(seg);
      acc += frac;
    }

    svgEl.innerHTML += `
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-family="Sora,sans-serif" font-size="${stroke}" font-weight="700" fill="#eaf0f8">${opts.center || ''}</text>
      <text x="${cx}" y="${cy + stroke - 8}" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="11" fill="#5d6b7e">${opts.sub || ''}</text>
    `;
  }

  /* ---------- Waterfall ----------
     data: [{label, value, isTotal, color?}]
     positive = additive bars, negative = subtractive, total = final
  */
  function waterfall(svgEl, data) {
    const W = Math.max(600, svgEl.clientWidth || 680);
    const H = 380;
    const padL = 52, padR = 24, padT = 26, padB = 56;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const NS = 'http://www.w3.org/2000/svg';

    // compute running totals so total bars can be drawn at the real running value
    const rTotals = [];
    let run = 0;
    for (const d of data) {
      if (d.isTotal) {
        rTotals.push(run);          // total bar sits at current running value
      } else {
        run += d.value || 0;
        rTotals.push(run);
      }
    }
    const yVals = data.map((d, i) => d.isTotal ? rTotals[i] : (d.value || 0));
    const min = Math.min(0, ...yVals);
    const max = Math.max(0, ...yVals);
    const range = (max - min) || 1;
    const n = data.length;
    const colW = chartW / n;
    const barW = Math.min(colW * 0.6, 74);

    const xFor = i => padL + i * colW + (colW - barW) / 2;
    const yFor = v => padT + chartH - ((v - min) / range) * chartH;

    svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // gridlines
    let grid = '';
    for (let g = 0; g <= 4; g++) {
      const gy = padT + (chartH / 4) * g;
      const val = max - (range * g / 4);
      grid += `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="#232b37" stroke-width="1"/>`;
      grid += `<text x="${padL - 10}" y="${gy + 4}" text-anchor="end" class="wf-label">${Math.round(val).toLocaleString()}</text>`;
    }

    // build bars using precomputed running totals
    let running = 0;
    let bars = '';
    for (let i = 0; i < n; i++) {
      const d = data[i];
      const x = xFor(i);
      const isTotal = !!d.isTotal;
      const cur = isTotal ? rTotals[i] : running;
      const next = isTotal ? cur : (running + (d.value || 0));
      const fromY = yFor(cur);
      const toY = yFor(next);
      const top = Math.min(fromY, toY);
      const bot = Math.max(fromY, toY);
      const h = Math.max(bot - top, 3);

      if (isTotal) {
        const tTop = Math.min(yFor(cur), yFor(0));
        const tBot = Math.max(yFor(cur), yFor(0));
        const tH = Math.max(tBot - tTop, 3);
        bars += `<rect x="${x}" y="${tTop}" width="${barW}" height="${tH}" rx="5"
            class="wf-bar wf-total" fill="url(#wfGrad)" stroke="#ffb224" stroke-width="1.5"/>`;
        bars += `<text x="${x + barW / 2}" y="${tTop - 9}" text-anchor="middle" class="wf-count" fill="#ffb224" font-size="15">${Math.round(cur).toLocaleString()}</text>`;
      } else {
        running += d.value || 0;
        const color = d.color || (d.value >= 0 ? '#ffb224' : '#f87171');
        bars += `<rect x="${x}" y="${top}" width="${barW}" height="${h}" rx="5" class="wf-bar" fill="${color}" opacity=".92"/>`;
        const val = d.value || 0;
        const mid = h > 26 ? (top + h / 2) : (val >= 0 ? top + h + 14 : top - 6);
        bars += `<text x="${x + barW / 2}" y="${mid}" text-anchor="middle" class="wf-label" fill="#0b0d10"
            font-weight="600">${val > 0 ? '+' : val < 0 ? '−' : ''}${Math.round(Math.abs(val)).toLocaleString()}</text>`;
        if (i < n - 1) {
          const nx = xFor(i + 1);
          bars += `<line x1="${x + barW / 2}" y1="${toY}" x2="${nx}" y2="${toY}" stroke="#3a4454" stroke-width="1.5" stroke-dasharray="4 3"/>`;
        }
      }
      bars += `<text x="${x + barW / 2}" y="${H - padB + 24}" text-anchor="middle" class="wf-label" fill="#9aa8ba">${d.label}</text>`;
    }

    const grad = `<defs><linearGradient id="wfGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffc64f"/><stop offset="1" stop-color="#ff9829"/></linearGradient></defs>`;
    svgEl.innerHTML = `<g>${grad}${grid}${bars}</g>`;
  }

  return { donut, waterfall };

})();
