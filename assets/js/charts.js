/* ============================================================
   ProjectOS — dependency-free SVG chart renderers
   (donut ring, waterfall). Gantt lives in app.js (interactive).
   ============================================================ */

const Charts = (() => {

  /* ---------- theme-aware neutral palette ---------- */
  function palette(theme) {
    return theme === 'light'
      ? { grid:'#e4e8ee', axis:'#6b7689', barText:'#0f1b2e', connector:'#9aa8ba',
          ringBase:'#e2e6ec', ringCenter:'#14181f', ringSub:'#6b7689' }
      : { grid:'#232b37', axis:'#9aa8ba', barText:'#0b0d10', connector:'#3a4454',
          ringBase:'#222a35', ringCenter:'#eaf0f8', ringSub:'#5d6b7e' };
  }

  /* ---------- Donut ring ---------- */
  function donut(svgEl, data, opts = {}) {
    const size = opts.size || 148;
    const stroke = opts.stroke || 20;
    const r = (size - stroke) / 2;
    const cx = size / 2, cy = size / 2;
    const P = palette(opts.theme || 'dark');
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
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${P.ringBase}" stroke-width="${stroke}"/>
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
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-family="Sora,sans-serif" font-size="${stroke}" font-weight="700" fill="${P.ringCenter}">${opts.center || ''}</text>
      <text x="${cx}" y="${cy + stroke - 8}" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="11" fill="${P.ringSub}">${opts.sub || ''}</text>
    `;
  }

  /* ---------- Waterfall ----------
     data: [{label, value, isTotal, color?}]
     positive = additive bars, negative = subtractive, total = final
     opts.orientation: 'v' (vertical) | 'h' (horizontal)
     opts.theme: 'dark' | 'light'
  */
  function waterfall(svgEl, data, opts = {}) {
    const orientation = opts.orientation === 'h' ? 'h' : 'v';
    const P = palette(opts.theme || 'dark');

    const VW = Math.max(600, svgEl.clientWidth || 680); // vertical canvas
    const VH = 380;
    const HW = 780;                                      // horizontal canvas
    const HH = Math.max(320, data.length * 82);

    const W = orientation === 'v' ? VW : HW;
    const H = orientation === 'v' ? VH : HH;

    // per-orientation padding
    let padL, padR, padT, padB;
    if (orientation === 'v') { padL = 56; padR = 24; padT = 34; padB = 56; }
    else { padL = 150; padR = 90; padT = 18; padB = 30; }

    const NS = 'http://www.w3.org/2000/svg';

    // compute running totals so total bars can be drawn at the real running value
    const rVals = [];           // each bar's *endpoint* value
    let run = 0;
    for (const d of data) {
      if (d.isTotal) {
        rVals.push(run);
      } else {
        run += d.value || 0;
        rVals.push(run);
      }
    }
    const yVals = data.map((d, i) => d.isTotal ? rVals[i] : (d.value || 0));
    const min = Math.min(0, ...rVals);
    const max = Math.max(0, ...rVals);
    const range = (max - min) || 1;
    const n = data.length;

    const spanW = W - padL - padR;
    const spanH = H - padT - padB;
    const slot = (orientation === 'v' ? spanW / n : spanH / n);
    const barMain = Math.min(slot * 0.6, orientation === 'v' ? 74 : 44);

    // mapping value -> pixel offset from min
    const pixFor = v => ((v - min) / range);   // 0..1

    svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // ------- gridlines + axis labels -------
    let grid = '';
    for (let g = 0; g <= 4; g++) {
      const val = max - (range * g / 4);
      if (orientation === 'v') {
        const gy = padT + spanH * g / 4;
        grid += `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="${P.grid}" stroke-width="1"/>`;
        grid += `<text x="${padL - 10}" y="${gy + 4}" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="11" fill="${P.axis}">${Math.round(val).toLocaleString()}</text>`;
      } else {
        const gx = padL + spanW * (1 - g / 4);
        grid += `<line x1="${gx}" y1="${padT}" x2="${gx}" y2="${H - padB}" stroke="${P.grid}" stroke-width="1"/>`;
        grid += `<text x="${gx}" y="${H - padB + 18}" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="11" fill="${P.axis}">${Math.round(val).toLocaleString()}</text>`;
      }
    }

    // ------- bars -------
    let bars = '';
    let running = 0;
    for (let i = 0; i < n; i++) {
      const d = data[i];
      const isTotal = !!d.isTotal;
      const cur = isTotal ? rVals[i] : running;
      const nxt = isTotal ? cur : (running + (d.value || 0));
      const c0 = pixFor(cur);
      const c1 = pixFor(nxt);
      running = isTotal ? running : nxt;

      let rectAttrs, mainLabel, valueLabel;
      const val = d.value || 0;

      if (orientation === 'v') {
        const x = padL + i * slot + (slot - barMain) / 2;
        const yFrom = padT + spanH * (1 - c0);
        const yTo = padT + spanH * (1 - c1);
        const top = Math.min(yFrom, yTo);
        const h = Math.max(Math.abs(yTo - yFrom), 3);
        if (isTotal) {
          const z0 = padT + spanH;                 // zero baseline y
          const tTop = Math.min(yFrom, z0);
          const tH = Math.max(Math.abs(z0 - yFrom), 3);
          rectAttrs = `x="${x}" y="${tTop}" width="${barMain}" height="${tH}" rx="5" class="wf-bar wf-total" fill="url(#wfGrad)" stroke="#ffb224" stroke-width="1.5"`;
          valueLabel = `<text x="${x + barMain / 2}" y="${tTop - 8}" text-anchor="middle" class="wf-count" fill="#ffb224" font-size="15">${Math.round(cur).toLocaleString()}</text>`;
        } else {
          rectAttrs = `x="${x}" y="${top}" width="${barMain}" height="${h}" rx="5" class="wf-bar" fill="${d.color}" opacity="${isTotal ? 1 : 0.92}"`;
          const mid = h > 26 ? (top + h / 2) : (val >= 0 ? top + h + 15 : top - 7);
          valueLabel = `<text x="${x + barMain / 2}" y="${mid}" text-anchor="middle" class="wf-label" fill="${P.barText}" font-weight="600">${val > 0 ? '+' : val < 0 ? '−' : ''}${Math.round(Math.abs(val)).toLocaleString()}</text>`;
          if (i < n - 1) {
            const nx = padL + (i + 1) * slot + slot / 2;
            bars += `<line x1="${x + barMain / 2}" y1="${yTo}" x2="${nx}" y2="${yTo}" stroke="${P.connector}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
          }
        }
        mainLabel = `<text x="${x + barMain / 2}" y="${H - padB + 24}" text-anchor="middle" class="wf-label" fill="${P.axis}">${d.label}</text>`;
      } else {
        const y = padT + i * slot + (slot - barMain) / 2;
        const xFrom = padL + spanW * c0;
        const xTo = padL + spanW * c1;
        const left = Math.min(xFrom, xTo);
        const w = Math.max(Math.abs(xTo - xFrom), 3);
        if (isTotal) {
          const z0 = padL;                        // zero baseline x
          const tLeft = Math.min(xFrom, z0);
          const tW = Math.max(Math.abs(xFrom - z0), 3);
          rectAttrs = `x="${tLeft}" y="${y}" width="${tW}" height="${barMain}" rx="5" class="wf-bar wf-total" fill="url(#wfGrad)" stroke="#ffb224" stroke-width="1.5"`;
          valueLabel = `<text x="${tLeft + tW + 10}" y="${y + barMain / 2 + 5}" text-anchor="start" class="wf-count" fill="#ffb224" font-size="14">${Math.round(cur).toLocaleString()}</text>`;
        } else {
          rectAttrs = `x="${left}" y="${y}" width="${w}" height="${barMain}" rx="5" class="wf-bar" fill="${d.color}" opacity="0.92"`;
          const mid = w > 34 ? (left + w / 2) : (val >= 0 ? left + w + 8 : left - 8);
          const anchor = w > 34 ? 'middle' : (val >= 0 ? 'start' : 'end');
          valueLabel = `<text x="${mid}" y="${y + barMain / 2 + 4}" text-anchor="${anchor}" class="wf-label" fill="${P.barText}" font-weight="600">${val > 0 ? '+' : val < 0 ? '−' : ''}${Math.round(Math.abs(val)).toLocaleString()}</text>`;
          if (i < n - 1) {
            const ny = padT + (i + 1) * slot + slot / 2;
            bars += `<line x1="${xTo}" y1="${y + barMain / 2}" x2="${xTo}" y2="${ny}" stroke="${P.connector}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
          }
        }
        mainLabel = `<text x="${padL - 12}" y="${y + barMain / 2 + 4}" text-anchor="end" class="wf-label" fill="${P.axis}">${d.label}</text>`;
      }

      bars += `<rect ${rectAttrs}/>${valueLabel}${mainLabel}`;
    }

    const grad = `<defs><linearGradient id="wfGrad" x1="0" y1="0" x2="${orientation === 'v' ? 0 : 1}" y2="${orientation === 'v' ? 1 : 0}">
        <stop offset="0" stop-color="#ffc64f"/><stop offset="1" stop-color="#ff9829"/></linearGradient></defs>`;
    svgEl.innerHTML = `<g>${grad}${grid}${bars}</g>`;
  }

  return { donut, waterfall };

})();
