// ה2 · **הנחה מול סגירה** — *"מתי הנחה שווה את זה?"* (שדרוג-במקום של מ4, 24/09/2026 ·
// `docs/plans/2026-09-23-module-11-decision-reports.md` §3). ה-RPC נשאר `report_m04_discounts`.
//
// 🔑 **הטבלה היא טבלת-סיכום (8 שורות: 4 מדרגים × 2 סוגי-לקוח), לא רשימת הצעות** — ולכן אין כאן
// שבבי-מדרג ואין `p_drill`: לחיצה על עמודה בגרף מסננת את הטבלה למדרג הזה (הסינון-הצולב של המעטפת,
// כי `chart.xKey` = `band` הוא גם עמודה בשורות). המדרגים עצמם — הכרעה 39.

import { ChartLead, SurfaceHint, TableLead, ExecutiveSurface } from './surfaceKit'

export default function DiscountsSurface(props) {
  return (
    <ExecutiveSurface
      {...props}
      renderAfterSoWhat={() => <SurfaceHint hintId="reports.discounts.purpose" />}
      renderBeforeChart={() => <ChartLead hintIds={['reports.discounts.chart']} />}
      renderBeforeTable={() => <TableLead hintId="reports.discounts.table" />}
    />
  )
}
