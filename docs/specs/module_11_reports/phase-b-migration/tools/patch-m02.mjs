// Preview of the planned text migration for report_m02_exec_overview — applied to the LIVE
// payload in the browser only (network intercept). No DB write. The strings here are the ones
// the migration will emit; the numbers are the live ones.
const L = '⁦'
const R = '⁩'
const iso = (s) => `${L}${s}${R}`
const int = (n) => Math.round(n).toLocaleString('en-US')
const pct = (n) => (Math.round(n * 10) / 10).toFixed(1)

export default function patch(rpc, p) {
  if (rpc !== 'report_m02_exec_overview') return p
  const all = /מתוך\s*⁦?([\d,]+)/.exec(p.population.label)?.[1]
  const n = p.population.n
  p.population.summary = `${iso(int(n))} אירועים שהסתיימו · מתוך ${iso(all)}`
  p.population.label =
    'נכללים אירועים שכבר התקיימו: הסתיים, ממתין לסגירה, ממתין לחשבונית או ממתין לתשלום. לא נכללים אירועים עתידיים, בתהליך או מבוטלים.'
  const [rev, margin, , top5] = p.tiles
  const top5Sub = top5.sub
  const amounts = /([\d,]+) ₪.*?מתוך.*?([\d,]+) ₪/.exec(top5Sub.replace(/[⁦-⁩]/g, ''))
  for (const t of p.tiles) {
    t.sub = null
    if (t.compare) t.compare.note = null
  }
  top5.window = 'כל הזמנים'
  const growth = (rev.value / rev.compare.value - 1) * 100
  const up = margin.value >= margin.compare.value
  p.so_what =
    growth >= 0
      ? up
        ? `לשים לב שההכנסות גבוהות ב-${iso(pct(growth) + '%')} מאשתקד, ושולי-הרווח עלו ל-${iso(pct(margin.value) + '%')}.`
        : `לשים לב שההכנסות גבוהות ב-${iso(pct(growth) + '%')} מאשתקד, אך שולי-הרווח ירדו ל-${iso(pct(margin.value) + '%')}.`
      : `לשים לב שההכנסות נמוכות ב-${iso(pct(-growth) + '%')} מאשתקד; שולי-הרווח ${iso(pct(margin.value) + '%')}.`
  p.definitions =
    'שולי-רווח = סך הרווח הגולמי חלקי סך ההכנסה, על כל האירועים יחד · רווח גולמי = הכנסה פחות עלויות ישירות (דיילות, ציוד, נסיעות), בלי הוצאות משרד · ' +
    `נתח 5 הלקוחות הגדולים = ${iso(amounts[1] + ' ₪')} מתוך ${iso(amounts[2] + ' ₪')}, על כל ההיסטוריה · ` +
    '"אשתקד" = אותם ימים בדיוק בשנה שעברה.'
  return p
}
