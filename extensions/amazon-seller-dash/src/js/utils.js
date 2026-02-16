/* Amazon Seller Dashboard — Utilities */
ASD.utils = {
  formatCurrency(n) {
    return '$' + Number(n).toFixed(2);
  },
  formatNumber(n) {
    return Number(n).toLocaleString();
  },
  formatPercent(n) {
    return Number(n).toFixed(1) + '%';
  },
  dayKey(date) {
    const d = date || new Date();
    return d.toISOString().slice(0, 10);
  },
  weekKey(date) {
    const d = date || new Date();
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    return start.toISOString().slice(0, 10);
  },
  monthKey(date) {
    const d = date || new Date();
    return d.toISOString().slice(0, 7);
  },
  el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className') e.className = v;
      else if (k === 'textContent') e.textContent = v;
      else if (k === 'innerHTML') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v);
    }
    for (const c of children) {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    }
    return e;
  },
  toCsv(headers, rows) {
    const escape = v => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [headers.map(escape).join(',')];
    for (const row of rows) lines.push(row.map(escape).join(','));
    return lines.join('\n');
  },
  downloadCsv(filename, headers, rows) {
    const csv = this.toCsv(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },
  miniChart(canvas, data, color = '#ff9900') {
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth * 2;
    const h = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const dw = canvas.offsetWidth;
    const dh = canvas.offsetHeight;
    if (!data.length) return;
    const max = Math.max(...data) || 1;
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = dw / (data.length - 1 || 1);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    data.forEach((v, i) => {
      const x = i * step;
      const y = dh - ((v - min) / range) * (dh - 8) - 4;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    // fill
    const last = data.length - 1;
    ctx.lineTo(last * step, dh);
    ctx.lineTo(0, dh);
    ctx.closePath();
    ctx.fillStyle = color + '20';
    ctx.fill();
  },
  parsePrice(text) {
    if (!text) return 0;
    const m = text.replace(/[^0-9.]/g, '');
    return parseFloat(m) || 0;
  },
  debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }
};
