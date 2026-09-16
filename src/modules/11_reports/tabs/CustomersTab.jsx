// לשונית לקוחות — **מ19 · מ20 · מ21 · מ22** (`approved/05_tab_customers_approved.html`,
// כרטיסים `stage2-cards/cards-customers.md`). ‏**מ25 חי בתוך מ22** ואין לו משטח משלו.
//
// 🔑 **מה הקובץ הזה עושה, והוא היחיד שעושה זאת:** מתרגם **הרשאות** ו**ניווט** לשפה של
// המשטח. כל השאר — מטען, אריחים, גרפים, טבלה, ייצוא, מצבים — יורד ל-`CustomerSurface`
// ומשם ל-`ReportSurface` המשותף.
//
// 🔴 **שתי הדלתות של הלשונית, ולמה שתיהן כאן:**
// ‏**① הכרעה 33 — כל אריח במבט-על הוא דלת לדף:** ‏`tiles[].target` חוזר כ-
// `{tab:'לקוחות', report:'שביעות רצון'}` — **תוויות עבריות**, לא מפתחות — ולכן התרגום
// ל-`?tab=customers&report=satisfaction` נשען על `reportsCatalog` ואינו נגזר מתבנית.
// ‏**② הכרעה 19 — השורה כולה לחיצה, יעד אחד לדף:** מ19/מ21 ⇐ כרטיס-לקוח · מ20/מ22 ⇐
// כרטיס-פרויקט (טבלאות-האינטראקציה ① של ארבעת הכרטיסים, שורות 10–13).
//
// ⚠️ **ומכאן דבר אחד שנראה כתחבולה ואינו:** ‏`ReportSurface` מחווט את `onDrill` של
// הטבלה **רק כאשר `surface.drill`** — דגל שמשמעותו בקטלוג היא *דריל היררכי (📐13)*,
// ואף אחד מארבעת המשטחים כאן אינו כזה (D-14). ⇒ בלי הדגל, **אף שורה בלשונית אינה
// לחיצה** — כלומר הכרעה 19 נופלת בשקט על ארבעה דפים. הלשונית מעבירה `surface` נגזר עם
// `drill: true`; הפירורים אינם מופיעים ממילא (`payload.drill` הוא `null` ⇒ אפס פירורים),
// והייצוא אינו נושא תווית-רמה. **מדווח כפער-מעטפת**, והתיקון הנכון — הפרדת "שורה-דלת"
// מ"דוח-דריל" ב-`ReportSurface` — אינו בבעלות הלשונית הזו.

import { useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { REPORT_TABS, canOpenTab } from '../reportsCatalog'
import CustomerSurface from './customers/CustomerSurface'
import { customersTransform } from './customers/payload'

// הכרעה 19 — **יעד-קידוח אחד לכל דף**, מטבלאות-האינטראקציה ① של הכרטיסים.
const RECORD_ROUTE = { מ19: 'customers', מ20: 'projects', מ21: 'customers', מ22: 'projects' }

// 🔴 **שתי צורות של `drill_key`, ובכוונה — הלשונית חיה בשתיהן:** המטען שנמדד 16/09/2026
// מחזיר **סקלר** (‏`401`), ומיגרציית-התיקון G2-3 מיישרת אותו לצורה האחידה של C8,
// ‏`{kind:'customer'|'project', id}`, כמו בשתים-עשרה הפונקציות האחרות. **קריאת ה-`kind`
// קודמת** — היא המקור המדויק ליעד; הנפילה למפה לפי-משטח היא הגשר עד שהתיקון יוחל.
// ⚠️ ובלי ההבחנה הזו אובייקט-`drill_key` היה נקרא כ-`tiles[].target` (גם הוא אובייקט)
// והשורה הייתה **מחליפה דוח במקום לפתוח כרטיס** — כשל שקט, בלי שגיאה.
const ROUTE_BY_KIND = { customer: 'customers', project: 'projects' }

const tabByLabel = (label) => REPORT_TABS.find((tab) => tab.label === label) ?? null

// רמות-ההרשאה שפותחות מודול (זהה ל-`canOpenTab` של הקטלוג, על מודול ולא על לשונית).
const OPEN_LEVELS = new Set(['edit', 'view'])

export default function CustomersTab({ surface, filters, drill, onWindow, onRetry }) {
  const { permissions } = useAuth()
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()

  // 🔒 ₪ בדף המתרחקים כפוף למודול **'כספים'** ולא ל'לקוחות' (הכרטיס ⑤ מ21, ו-`meta.notes`
  // של ה-RPC אומר *"המיסוך מתבצע בלשונית"*) · הרצה ואישור כפופים ל-`edit` על 'דו"חות' (ת2).
  const canSeeMoney = OPEN_LEVELS.has(permissions?.['כספים'])
  const canEdit = permissions?.['דו"חות'] === 'edit'

  const transformPayload = useMemo(
    () =>
      customersTransform(surface.id, {
        canSeeMoney,
        canOpenTargetTab: (label) => {
          const tab = tabByLabel(label)
          return Boolean(tab) && canOpenTab(tab, permissions)
        },
      }),
    [surface.id, canSeeMoney, permissions],
  )

  // ‏`useCallback` ולא חץ-אינליין: `ReportSurface` מחזיק את `onDrill` בגוף effect-הטעינה
  // דרך `onWindow`-ים אחרים, ופונקציה חדשה בכל רינדור היא מקור-לולאות מוכר כאן.
  const openDoor = useCallback(
    (value) => {
      // ① שורה-דלת בצורת C8 האחידה (הכרעה 19) — ‏`kind` מכריע את היעד, לא המשטח.
      if (value?.kind && ROUTE_BY_KIND[value.kind]) {
        navigate(`/${ROUTE_BY_KIND[value.kind]}/${value.id}`)
        return
      }
      // ② אריח-דלת (הכרעה 33) — תוויות עבריות שמתורגמות דרך הקטלוג.
      if (value && typeof value === 'object') {
        const tab = tabByLabel(value.tab)
        const target = tab?.surfaces.find((row) => row.name === value.report)
        if (!tab || !target) return
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.set('tab', tab.key)
            next.set('report', target.slug)
            next.delete('drill')
            next.delete('page')
            return next
          },
          { replace: true },
        )
        return
      }
      const route = RECORD_ROUTE[surface.id]
      if (route && value != null) navigate(`/${route}/${value}`)
    },
    [surface.id, navigate, setSearchParams],
  )

  // ר' הערת-הכותרת: הדגל מפעיל את שורת-הדלת של `ReportTable`, ולא דריל היררכי.
  const rowDoorSurface = useMemo(() => ({ ...surface, drill: true }), [surface])

  return (
    <CustomerSurface
      surface={rowDoorSurface}
      filters={filters}
      drill={drill}
      onDrill={openDoor}
      onWindow={onWindow}
      transformPayload={transformPayload}
      canEdit={canEdit}
      onChanged={onRetry}
    />
  )
}
