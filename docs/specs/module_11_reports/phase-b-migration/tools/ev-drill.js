(async () => {
  const q = (id) => document.querySelector(`[data-testid=${id}]`)
  const action = q('chart-action')?.innerText ?? null
  const fs = q('chart-action') ? getComputedStyle(q('chart-action')).fontSize : null
  const btn = q('chart-select-1')
  const before = decodeURIComponent(location.search)
  btn?.click()
  await new Promise((r) => setTimeout(r, 3500))
  return {
    action,
    fontSize: fs,
    clicked: !!btn,
    before,
    after: decodeURIComponent(location.search),
    crumbs: q('drill-crumbs')?.innerText ?? null,
    actionAfter: q('chart-action')?.innerText ?? null,
  }
})()
