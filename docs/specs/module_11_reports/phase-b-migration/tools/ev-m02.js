(() => {
  const q = (id) => document.querySelector(`[data-testid=${id}]`)
  const qa = (sel) => [...document.querySelectorAll(sel)]
  const strip = (s) => (s ?? '').replace(/[⁦-⁩]/g, '')
  const visible = (el) => !!el && el.offsetParent !== null && el.getClientRects().length > 0
  // explanatory text visible in the surface (not numbers-in-tables, not titles)
  const parts = {
    population: visible(q('report-population')) ? strip(q('report-population').innerText) : '',
    definitions: visible(q('report-definitions')) ? strip(q('report-definitions').innerText) : '',
    scopeChip: strip(q('report-scope-summary')?.innerText),
    soWhat: strip(q('report-so-what')?.innerText),
    tileSubs: qa('[data-testid=kpi-sub],[data-testid=kpi-compare-note]').filter(visible).map((e) => strip(e.innerText)).join(' | '),
    chartNote: strip(q('chart-note')?.innerText),
    rowAction: strip(q('report-row-action')?.innerText),
    rowCap: strip(q('report-row-cap')?.innerText),
    topN: strip(q('report-topn-title')?.innerText),
    hints: qa('[data-testid^=hint-]').filter(visible).map((e) => strip(e.innerText)).join(' | '),
  }
  const chars = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, v.length]))
  const total = Object.entries(chars).filter(([k]) => k !== 'hints').reduce((s, [, v]) => s + v, 0)
  const fs = (id) => (q(id) ? getComputedStyle(q(id)).fontSize : null)
  return {
    parts,
    chars,
    visibleExplanatoryTotal: total,
    pager: !!q('report-pager'),
    fonts: { chip: fs('report-scope-summary'), soWhat: fs('report-so-what'), topN: fs('report-topn-title') },
  }
})()
