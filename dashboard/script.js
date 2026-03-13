// ─── CSV PARSER ──────────────────────────────────────────────────────────────
// Handles quoted fields, trims whitespace, strips BOM

function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    vals.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').replace(/^"|"$/g, ''); });
    return obj;
  });
}

function n(v) { 
  return parseFloat(v) || 0; 
}


// ─── CHART DEFAULTS ──────────────────────────────────────────────────────────

Chart.defaults.color = '#7a7878';
Chart.defaults.font.family = "'DM Mono', monospace";
Chart.defaults.font.size = 10;

const gridColor = 'rgba(255,255,255,0.04)';
const borderColor = 'rgba(255,255,255,0.08)';

// ─── LOAD ALL CSVs ───────────────────────────────────────────────────────────
// Expected alongside the HTML at: data/raw/*.csv

const CSV_PATHS = {
  oil: '../data/raw/crude_oil_daily.csv',
  pp:  '../data/raw/petrol_prices_comparison.csv',
  tl:  '../data/raw/war_timeline.csv',
  ci:  '../data/raw/country_impact.csv',
  pc:  '../data/raw/pros_cons_analysis.csv',
};

Promise.all(
  Object.entries(CSV_PATHS).map(([key, path]) =>
    fetch(path)
      .then(r => { if (!r.ok) throw new Error(`Cannot load ${path} (${r.status})`); return r.text(); })
      .then(text => [key, parseCSV(text)])
  )
).then(entries => {
  const D = Object.fromEntries(entries);
  initDashboard(D.oil, D.pp, D.tl, D.ci, D.pc);
}).catch(err => {
  console.error('CSV load failed:', err);
  document.querySelector('.footer-right').innerHTML =
    `<span style="color:var(--danger)">⚠ ${err.message}</span>`;
});

// ─── MAIN INIT ───────────────────────────────────────────────────────────────

function initDashboard(oilRaw, ppRaw, tlRaw, ciRaw, pcRaw) {

  // ── crude_oil_daily.csv ──────────────────────────────────────────────
  // Columns: Date, Brent_USD, WTI_USD, Brent_Change_Pct, WTI_Change_Pct, Phase, Strait_Hormuz
  const oil = oilRaw
    .map(r => ({
      date:    r.Date,
      brent:   n(r.Brent_USD),
      wti:     n(r.WTI_USD),
      phase:   r.Phase || '',
      hormuz:  r.Strait_Hormuz || '',
      // use pre-computed change col if present, else derive
      brentChg: r.Brent_Change_Pct ? n(r.Brent_Change_Pct) : 0,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Derive change pct from prices for any rows where it's 0/missing
  oil.forEach((r, i) => {
    if (i > 0 && r.brentChg === 0 && oil[i-1].brent > 0) {
      r.brentChg = (r.brent - oil[i-1].brent) / oil[i-1].brent * 100;
    }
  });

  const crudeDates  = oil.map(r => r.date);
  const brentPrices = oil.map(r => r.brent);
  const wtiPrices   = oil.map(r => r.wti);

  const brentStart   = oil[0].brent;
  const brentCurrent = oil[oil.length - 1].brent;
  const brentPeak    = Math.max(...brentPrices);
  const brentPeakDay = oil.find(r => r.brent === brentPeak)?.date || '';
  const brentPctChg  = ((brentPeak - brentStart) / brentStart * 100);

  const wtiStart     = oil[0].wti;
  const wtiCurrent   = oil[oil.length - 1].wti;
  const wtiPeak      = Math.max(...wtiPrices);
  const wtiPctChg    = ((wtiPeak - wtiStart) / wtiStart * 100);

  const latestDate   = oil[oil.length - 1].date;
  const startDate    = oil[0].date;

  // Brent-WTI spread (latest)
  const spreadNow    = brentCurrent - wtiCurrent;
  const spreadStart  = brentStart - wtiStart;

  // Largest single-day brent change
  const maxDayChg    = oil.reduce((best, r) => Math.abs(r.brentChg) > Math.abs(best.brentChg) ? r : best, oil[0]);

  // Hormuz: last status
  const hormuzLast   = oil[oil.length - 1].hormuz;
  const hormuzActive = !/^open$/i.test(hormuzLast.trim());

  // Strait of Hormuz closure / restriction impact
  const closureRow = oil.find(r => /closed|restricted/i.test(r.hormuz || ''));
  const hormuzClosureDate = closureRow ? closureRow.date : null;
  const hormuzClosureBrent = closureRow ? closureRow.brent : null;
  const hormuzPctPostClosure = (hormuzClosureBrent && hormuzClosureBrent > 0)
    ? (brentCurrent - hormuzClosureBrent) / hormuzClosureBrent * 100
    : null;

  // ── petrol_prices_comparison.csv ────────────────────────────────────
  // Columns: Country, ISO, Region, Currency, Before_War_Price, Mar7_Price,
  //          Unit, Amount_Change, Pct_Increase, Trend, Before_War_USD, Mar7_USD, Oil_Import_Dep
  const ppAll = ppRaw.map(r => {
    const before    = n(r.Before_War_Price);
    const after     = n(r.Mar7_Price);
    const beforeUSD = n(r.Before_War_USD);
    const afterUSD  = n(r.Mar7_USD);
    // prefer pre-computed col, fall back to derivation
    const pctInc = r.Pct_Increase && n(r.Pct_Increase) !== 0
      ? n(r.Pct_Increase)
      : (before > 0 ? (after - before) / before * 100 : 0);
    // map Oil_Import_Dep ordinal → affordability risk tier
    const dep = (r.Oil_Import_Dep || '').toLowerCase();
    const risk = dep === 'high' ? 'critical' : dep === 'medium' ? 'high' : 'med';
    return {
      country:   r.Country,
      region:    r.Region || '',
      currency:  r.Currency || '',
      unit:      r.Unit || '',
      before,
      after,
      beforeUSD,
      afterUSD,
      pctInc,
      trend:     r.Trend || '',
      importDep: r.Oil_Import_Dep || '',
      risk,
    };
  }).sort((a, b) => b.pctInc - a.pctInc);

  const avgPetrolInc  = ppAll.reduce((s, r) => s + r.pctInc, 0) / ppAll.length;
  const topCountry    = ppAll[0];
  const maxUSD        = Math.max(...ppAll.map(r => r.afterUSD));

  // Build countryData shape (same as original hardcoded array)
  const countryData = ppAll.map(r => ({
    country: r.country,
    before:  r.beforeUSD,
    after:   r.afterUSD,
    change:  +r.pctInc.toFixed(1),
    risk:    r.pctInc >= 50 ? 'critical' : r.pctInc >= 35 ? 'high' : r.pctInc >= 20 ? 'med' : 'low',
  }));

  // Build affordData — use country_impact.csv GDP_Impact_Pct as proxy for
  // affordability pressure; fall back to pctInc-derived score if ci not matched
  const impactData = ciRaw.map(r => ({
    country:     r.Country,
    region:      r.Region,
    oilImport:   n(r.Oil_Import_Pct),
    gdpImpact:   n(r.GDP_Impact_Pct),
    inflation:   r.Inflation_Risk,
    stockImpact: n(r.Stock_Market_Change),
    currency:    r.Currency_Pressure,
    policy:      r.Policy_Response,
    vuln:        r.Vulnerability,
    population:  n(r.Population_M),
  })).sort((a, b) => a.gdpImpact - b.gdpImpact); // sort by GDP impact ascending (most negative first)

  // ── war_timeline.csv ────────────────────────────────────────────────
  // Columns: Date, Event, Description, Location, Category
  const tlRawSorted = [...tlRaw].sort((a, b) => new Date(a.Date) - new Date(b.Date));

  // Map Category → severity dot class
  const catSeverity = { Military:'critical', Strike:'critical', Attack:'critical', Energy:'high', Economic:'high', Diplomatic:'medium', Political:'medium', Naval:'high' };
  const warEvents = tlRawSorted.map(r => {
    const cat = r.Category || r.Type || '';
    const sev = catSeverity[cat] || 'medium';
    // oil_impact: use Description to detect positive/negative price language,
    // or use Brent_Change_Pct from nearest oil date if available
    const nearestOil = oil.reduce((best, o) =>
      Math.abs(new Date(o.date) - new Date(r.Date)) < Math.abs(new Date(best.date) - new Date(r.Date)) ? o : best
    , oil[0]);
    const impact = nearestOil.brentChg;
    const impactStr = (impact >= 0 ? '+' : '') + Math.abs(impact).toFixed(1) + '%';
    return {
      date:       r.Date,
      event:      r.Event || r.Title || '',
      severity:   sev,
      oil_impact: impactStr,
      _impact:    impact,
      category:   cat,
    };
  });

  // Severity counts for donut
  const sevCount = { critical: 0, high: 0, medium: 0, low: 0 };
  warEvents.forEach(e => { sevCount[e.severity] = (sevCount[e.severity] || 0) + 1; });

  // ── UPDATE HEADER ────────────────────────────────────────────────────
  const statusEl = document.querySelector('.status-live');
  if (statusEl) statusEl.textContent = hormuzActive ? 'HORMUZ DISRUPTED' : (oil[oil.length-1].phase || 'ACTIVE CONFLICT').toUpperCase();

  const metaDivs = document.querySelectorAll('.header-meta > div');
  if (metaDivs[1]) metaDivs[1].innerHTML =
    `Dataset: Kaggle · <a href="https://www.kaggle.com/datasets/zkskhurram/global-petrol-prices-impact-of-2026-us-iran-war/data" target="_blank" style="color:var(--accent);text-decoration:none;">5 CSV Files</a>`;
  if (metaDivs[2]) metaDivs[2].textContent = `${ppAll.length} Countries · ${warEvents.length} War Events`;
  if (metaDivs[3]) metaDivs[3].textContent = `Period: ${startDate} – ${latestDate}`;

  // ── UPDATE KPI CARDS ─────────────────────────────────────────────────
  const kpis = document.querySelectorAll('.kpi');
  if (kpis[0]) {
    kpis[0].querySelector('.kpi-label').textContent = `Brent Crude (${latestDate})`;
    kpis[0].querySelector('.kpi-value').textContent = `$${brentCurrent.toFixed(2)}`;
    kpis[0].querySelector('.kpi-sub').innerHTML =
      `Pre-war: $${brentStart.toFixed(2)} · <span class="up">▲ ${brentPctChg.toFixed(1)}% to peak</span>`;
  }
  if (kpis[1]) {
    kpis[1].querySelector('.kpi-label').textContent = `WTI Crude (${latestDate})`;
    kpis[1].querySelector('.kpi-value').textContent = `$${wtiCurrent.toFixed(2)}`;
    kpis[1].querySelector('.kpi-sub').innerHTML =
      `Pre-war: $${wtiStart.toFixed(2)} · <span class="up">▲ ${wtiPctChg.toFixed(1)}% to peak</span>`;
  }
  if (kpis[2]) {
    kpis[2].querySelector('.kpi-value').textContent = `+${avgPetrolInc.toFixed(1)}%`;
    kpis[2].querySelector('.kpi-sub').textContent = `${ppAll.length} countries tracked`;
  }
  if (kpis[3] && topCountry) {
    kpis[3].querySelector('.kpi-value').textContent = topCountry.country.toUpperCase();
    kpis[3].querySelector('.kpi-sub').innerHTML =
      `Retail price: <span class="up">▲ ${topCountry.pctInc.toFixed(1)}%</span> since ${startDate}`;
  }

  // ── UPDATE PRICE SHOCK SUMMARY CARDS ────────────────────────────────
  const shockCards = document.querySelectorAll('.panel [style*="border-left"]');
  if (shockCards[0]) {
    shockCards[0].querySelector('[style*="font-size:32px"]').textContent =
      `+$${Math.abs(maxDayChg.brentChg * maxDayChg.brent / 100).toFixed(2)}/day`;
    shockCards[0].querySelector('[style*="font-size:10px"]').textContent =
      `PEAK BRENT SPIKE (${maxDayChg.date})`;
    shockCards[0].querySelector('[style*="font-size:12px"]').textContent =
      `Largest single-day jump in the dataset (${maxDayChg.brentChg.toFixed(1)}% change)`;
  }
  if (shockCards[2]) {
    shockCards[2].querySelector('[style*="font-size:32px"]').textContent =
      `$${spreadNow.toFixed(2)}`;
    shockCards[2].querySelector('[style*="font-size:12px"]').textContent =
      `Pre-war spread was $${spreadStart.toFixed(2)} — Middle East risk premium ${spreadNow > spreadStart ? 'expanding' : 'compressing'}`;
  }

  // ── UPDATE HORMUZ IMPACT TEXT ─────────────────────────────────────────
  const hormuzEl = document.getElementById('hormuzEffect');
  const hormuzDesc = document.getElementById('hormuzEffectDesc');
  const hormuzStatus = hormuzActive ? 'CLOSED/RESTRICTED' : 'OPEN';

  if (hormuzEl) {
    if (hormuzPctPostClosure != null) {
      const dir = hormuzPctPostClosure > 0 ? '▲' : hormuzPctPostClosure < 0 ? '▼' : '→';
      const verb = hormuzPctPostClosure > 0 ? 'increased' : hormuzPctPostClosure < 0 ? 'decreased' : 'held steady';
      hormuzEl.textContent = `${dir} ${Math.abs(hormuzPctPostClosure).toFixed(1)}%`;
      if (hormuzDesc) {
        hormuzDesc.textContent = `Since ${hormuzClosureDate || 'closure'}, Brent has ${verb} ${Math.abs(hormuzPctPostClosure).toFixed(1)}% — Hormuz is currently ${hormuzStatus}.`;
      }
    } else {
      hormuzEl.textContent = '--%';
      if (hormuzDesc) {
        hormuzDesc.textContent = `Hormuz is currently ${hormuzStatus}. No closure/restriction date found in the data.`;
      }
    }
  }

  // ── UPDATE FOOTER ────────────────────────────────────────────────────
  document.querySelector('.footer-right').innerHTML =
    `<br>Analysis by: <span style="color:var(--text);">Alyssa Atmasava</span> · ${latestDate}`;

  // ─── CRUDE OIL CHART ──────────────────────────────────────────────────────

  const crudeCtx = document.getElementById('crudeChart').getContext('2d');

  const brentGradient = crudeCtx.createLinearGradient(0, 0, 0, 280);
  brentGradient.addColorStop(0, 'rgba(255,77,28,0.3)');
  brentGradient.addColorStop(1, 'rgba(255,77,28,0)');

  const wtiGradient = crudeCtx.createLinearGradient(0, 0, 0, 280);
  wtiGradient.addColorStop(0, 'rgba(255,179,71,0.2)');
  wtiGradient.addColorStop(1, 'rgba(255,179,71,0)');

  const allPrices = [...brentPrices, ...wtiPrices];
  const yMin = Math.floor(Math.min(...allPrices) * 0.95);
  const yMax = Math.ceil(Math.max(...allPrices) * 1.02);

  // determine phase ranges for shading
  const phases = ['Pre-Conflict','Active Conflict'];
  const phaseRanges = phases.map(ph => {
    const seg = oil.filter(r => r.phase === ph);
    if (seg.length === 0) return null;
    return {phase: ph, start: seg[0].date, end: seg[seg.length-1].date};
  }).filter(x=>x);

  const phasePlugin = {
    id: 'phasePlugin',
    beforeDraw(chart) {
      const {ctx, chartArea: {top, bottom, left, right}, scales: {x}} = chart;
      ctx.save();
      ctx.font = '11px DM Mono';
      ctx.fillStyle = '#a0a0b8';
      ctx.textBaseline = 'top';
      phaseRanges.forEach(r=>{
        const startX = x.getPixelForValue(r.start);
        const endX   = x.getPixelForValue(r.end);
        const width = endX - startX;
        ctx.fillStyle = r.phase === 'Pre-Conflict' ? 'rgba(255,170,0,0.1)' : 'rgba(255,51,51,0.1)';
        ctx.fillRect(startX, top, width, bottom - top);

        // draw label centered at top of shaded area
        const label = r.phase === 'Pre-Conflict' ? 'PRE-CONFLICT' : 'ACTIVE CONFLICT';
        const textWidth = ctx.measureText(label).width;
        const xPos = startX + (width - textWidth) / 2;
        ctx.fillStyle = '#a0a0b8';
        ctx.fillText(label, xPos, top + 4);
      });
      ctx.restore();
    }
  };

  new Chart(crudeCtx, {
    type: 'line',
    plugins: [phasePlugin],
    data: {
      labels: crudeDates,
      datasets: [
        {
          label: 'Brent Crude',
          data: brentPrices,
          borderColor: '#ff4d1c',
          backgroundColor: brentGradient,
          borderWidth: 2,
          pointBackgroundColor: '#ff4d1c',
          pointRadius: 3,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'WTI Crude',
          data: wtiPrices,
          borderColor: '#ffb347',
          backgroundColor: wtiGradient,
          borderWidth: 2,
          pointBackgroundColor: '#ffb347',
          pointRadius: 3,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18181d',
          borderColor: '#222228',
          borderWidth: 1,
          titleColor: '#f0ede8',
          bodyColor: '#7a7878',
          padding: 12,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}/bbl`
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          border: { color: borderColor },
          ticks: { maxTicksLimit: 10 }
        },
        y: {
          grid: { color: gridColor },
          border: { color: borderColor },
          ticks: { callback: v => `$${v}` },
          min: yMin,
          max: yMax,
        }
      }
    }
  });

  // ─── COUNTRY CHART ──────────────────────────────────────────────────────

  const countryCtx = document.getElementById('countryChart').getContext('2d');
  new Chart(countryCtx, {
    type: 'bar',
    data: {
      labels: countryData.map(d => d.country),
      datasets: [
        {
          label: 'Pre-War',
          data: countryData.map(d => d.before),
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
          borderRadius: 1,
        },
        {
          label: 'Mar 7, 2026',
          data: countryData.map(d => d.after),
          backgroundColor: countryData.map(d => {
            if (d.risk === 'critical') return 'rgba(255,51,51,0.7)';
            if (d.risk === 'high') return 'rgba(255,77,28,0.7)';
            if (d.risk === 'med') return 'rgba(255,179,71,0.6)';
            return 'rgba(51,204,136,0.5)';
          }),
          borderColor: 'transparent',
          borderRadius: 1,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18181d',
          borderColor: '#222228',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toFixed(3)}/L (USD equiv.)`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: borderColor },
          ticks: { maxRotation: 45, font: { size: 9 } }
        },
        y: {
          grid: { color: gridColor },
          border: { color: borderColor },
          ticks: { callback: v => `$${v}` }
        }
      }
    }
  });

  // ─── COUNTRY BARS (sidebar) ─────────────────────────────────────────────

  const barsEl = document.getElementById('countryBars');
  const maxChange = Math.max(...countryData.map(d => d.change));
  countryData.forEach(d => {
    const width = (d.change / maxChange * 100).toFixed(1);
    const cls = d.change >= 50 ? 'high' : d.change >= 30 ? 'med' : 'low';
    barsEl.innerHTML += `
      <div class="country-bar-row">
        <div class="country-name">${d.country}</div>
        <div class="bar-track">
          <div class="bar-fill-after" style="width:${width}%"></div>
        </div>
        <div class="bar-pct ${cls}">+${d.change}%</div>
      </div>
    `;
  });

  // ─── TIMELINE ──────────────────────────────────────────────────────────────

  const tlEl = document.getElementById('timeline');
  warEvents.forEach(e => {
    const isPos = e._impact >= 0;
    tlEl.innerHTML += `
      <div class="timeline-item">
        <div class="timeline-date">${e.date}</div>
        <div class="timeline-dot dot-${e.severity}"></div>
        <div class="timeline-content">
          <div class="timeline-event">${e.event}</div>
          <div class="timeline-impact">Brent on date: <span style="color:${isPos ? 'var(--danger)' : 'var(--safe)'}">${e.oil_impact}</span> &nbsp;·&nbsp; <span style="color:var(--muted)">${e.category}</span></div>
        </div>
      </div>
    `;
  });

  // ─── EVENT IMPACT CHART ────────────────────────────────────────────────────

  const evtCtx = document.getElementById('eventChart').getContext('2d');
  const evtImpacts = warEvents.map(e => +e._impact.toFixed(2));
  const evtLabels  = warEvents.map(e => e.date);

  new Chart(evtCtx, {
    type: 'bar',
    data: {
      labels: evtLabels,
      datasets: [{
        label: 'Brent Δ on event date (%)',
        data: evtImpacts,
        backgroundColor: evtImpacts.map(v => v > 0 ? 'rgba(255,77,28,0.7)' : 'rgba(51,204,136,0.6)'),
        borderRadius: 1,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18181d',
          borderColor: '#222228',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y > 0 ? '+' : ''}${ctx.parsed.y}%`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { color: borderColor }, ticks: { maxRotation: 60, font: { size: 8 } } },
        y: {
          grid: { color: gridColor },
          border: { color: borderColor },
          ticks: { callback: v => `${v > 0 ? '+' : ''}${v}%` }
        }
      }
    }
  });

  // ─── SEVERITY DONUT ───────────────────────────────────────────────────────

  const sevCtx = document.getElementById('severityChart').getContext('2d');
  new Chart(sevCtx, {
    type: 'doughnut',
    data: {
      labels: ['Critical', 'High', 'Medium', 'Low'],
      datasets: [{
        data: [sevCount.critical, sevCount.high, sevCount.medium, sevCount.low || 0],
        backgroundColor: ['#ff3333', '#ff4d1c', '#ffb347', '#555'],
        borderWidth: 0,
        hoverOffset: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18181d',
          borderColor: '#222228',
          borderWidth: 1,
          padding: 10,
        }
      }
    }
  });

  // Update severity legend counts dynamically
  const sevLegend = document.querySelector('#tab-timeline [style*="line-height:2"]');
  if (sevLegend) {
    sevLegend.innerHTML = `
      <div>🔴 Critical (Military/Strike) — <span style="color:var(--danger)">${sevCount.critical} events</span></div>
      <div>🟠 High (Energy/Naval) — <span style="color:var(--accent)">${sevCount.high} events</span></div>
      <div>🟡 Medium (Diplomatic/Political) — <span style="color:var(--accent2)">${sevCount.medium} events</span></div>
      <div>⚪ Low (Other) — <span style="color:var(--muted)">${sevCount.low || 0} events</span></div>
    `;
  }

  // ─── GDP IMPACT CHART ─────────────────────────────────────────────────

  const gdpCtx = document.getElementById('gdpImpactChart').getContext('2d');
  new Chart(gdpCtx, {
    type: 'bar',
    data: {
      labels: impactData.map(d => d.country),
      datasets: [{
        label: 'GDP Impact (%)',
        data: impactData.map(d => d.gdpImpact),
        backgroundColor: impactData.map(d => d.gdpImpact < -2 ? '#ff3333' : d.gdpImpact < -1.5 ? '#ff4d1c' : d.gdpImpact < -1 ? '#ffb347' : '#33cc88'),
        borderRadius: 1,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18181d',
          borderColor: '#222228',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => `${ctx.parsed.y}% GDP impact — Inflation risk: ${impactData[ctx.dataIndex].inflation}`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { color: borderColor }, ticks: { maxRotation: 45, font: { size: 8 } } },
        y: {
          grid: { color: gridColor },
          border: { color: borderColor },
          ticks: { callback: v => `${v}%` }
        }
      }
    }
  });

  // ─── STOCK MARKET IMPACT CHART ────────────────────────────────────────

  const impactDataByStock = [...impactData].sort((a, b) => a.stockImpact - b.stockImpact);

  const stockCtx = document.getElementById('stockImpactChart').getContext('2d');
  new Chart(stockCtx, {
    type: 'bar',
    data: {
      labels: impactDataByStock.map(d => d.country),
      datasets: [{
        label: 'Stock Market Impact (%)',
        data: impactDataByStock.map(d => d.stockImpact),
        backgroundColor: impactDataByStock.map(d => d.stockImpact < -5 ? '#ff3333' : d.stockImpact < -4 ? '#ff4d1c' : d.stockImpact < -3 ? '#ffb347' : '#33cc88'),
        borderRadius: 1,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18181d',
          borderColor: '#222228',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => `${ctx.parsed.y}% stock market change — Currency pressure: ${impactDataByStock[ctx.dataIndex].currency}`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { color: borderColor }, ticks: { maxRotation: 45, font: { size: 8 } } },
        y: {
          grid: { color: gridColor },
          border: { color: borderColor },
          ticks: { callback: v => `${v}%` }
        }
      }
    }
  });

  // ─── OIL IMPORT GDP CORRELATION CHART ─────────────────────────────────

  const gdpCorrelationCtx = document.getElementById('oilImportGDPChart').getContext('2d');
  new Chart(gdpCorrelationCtx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Countries',
        data: impactData.map(d => ({ x: d.oilImport, y: d.gdpImpact })),
        backgroundColor: impactData.map(d => d.oilImport > 80 ? '#ff3333' : d.oilImport > 60 ? '#ff4d1c' : d.oilImport > 40 ? '#ffb347' : '#33cc88'),
        pointRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18181d',
          borderColor: '#222228',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => `${impactData[ctx.dataIndex].country}: GDP Impact ${ctx.parsed.y}% | Oil Import: ${ctx.parsed.x}%`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Oil Import Dependency (%)' },
          grid: { color: gridColor },
          border: { color: borderColor },
          ticks: { callback: v => `${v}%` }
        },
        y: {
          title: { display: true, text: 'GDP Impact (%)' },
          grid: { color: gridColor },
          border: { color: borderColor },
          ticks: { callback: v => `${v}%` }
        }
      }
    }
  });

  // ─── OIL IMPORT STOCK CORRELATION CHART ──────────────────────────────

  const stockCorrelationCtx = document.getElementById('oilImportStockChart').getContext('2d');
  new Chart(stockCorrelationCtx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Countries',
        data: impactData.map(d => ({ x: d.oilImport, y: d.stockImpact })),
        backgroundColor: impactData.map(d => d.oilImport > 80 ? '#ff3333' : d.oilImport > 60 ? '#ff4d1c' : d.oilImport > 40 ? '#ffb347' : '#33cc88'),
        pointRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18181d',
          borderColor: '#222228',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => `${impactData[ctx.dataIndex].country}: Stock Impact ${ctx.parsed.y}% | Oil Import: ${ctx.parsed.x}%`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Oil Import Dependency (%)' },
          grid: { color: gridColor },
          border: { color: borderColor },
          ticks: { callback: v => `${v}%` }
        },
        y: {
          title: { display: true, text: 'Stock Market Impact (%)' },
          grid: { color: gridColor },
          border: { color: borderColor },
          ticks: { callback: v => `${v}%` }
        }
      }
    }
  });

} // end initDashboard

// ─── TAB SWITCHING ─────────────────────────────────────────────────────────

function switchTab(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.target.classList.add('active');
}
