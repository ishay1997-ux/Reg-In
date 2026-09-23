(() => {
  const q = (id) => document.querySelector(`[data-testid=${id}]`)
  const bar = q('reports-filters')
  return {
    filters: bar?.innerText ?? null,
    periodFixed: q('reports-period-fixed')?.innerText ?? null,
    customerFixed: q('reports-customer-fixed')?.innerText ?? null,
    pills: document.querySelectorAll('[data-testid^=reports-period-]').length,
    ignoredSentences: (document.body.innerText.match(/אינו מושפע/g) ?? []).length,
    windowLabel: q('reports-window-label')?.innerText ?? null,
    factFont: q('reports-period-fixed') ? getComputedStyle(q('reports-period-fixed')).fontSize : null,
  }
})()
