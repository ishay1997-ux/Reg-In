// לשונית לקוחות — **מ19 · מ20 · מ21 · מ22** (`approved/05_tab_customers_approved.html`,
// כרטיסים `stage2-cards/cards-customers.md`). ‏**מ25 חי בתוך מ22** ואין לו משטח משלו.
//
// 🔑 **מה נשאר לקובץ הזה אחרי סבב-היישור של 16/09 11:1X — ורק זה:** תרגום **הרשאות**
// לשפה של המשטח. שתי הרשאות, ושתיהן של מודול **אחר** מזה שפותח את הלשונית:
// ‏① ₪ בדף המתרחקים כפוף ל-**'כספים'** (הכרטיס ⑤ מ21, ו-`meta.notes` של ה-RPC אומר
//    במפורש *"המיסוך מתבצע בלשונית"*) · ② הרצה ואישור של מ25 כפופים ל-`edit` על
//    **'דו"חות'** (ת2). **אף אחת מהשתיים אינה נגזרת מ-`permissions['לקוחות']`**, ולכן אף
//    רכיב משותף אינו יכול לגזור אותן — הן חייבות לשבת בלשונית.
//
// ✂️ **ומה שנמחק מכאן, כי המעטפת עושה זאת עכשיו לכל ארבע הלשוניות:**
// ‏`openDoor` המקומי (כתיבת `?tab=&report=` לכתובת · ניווט ל-`/customers/:id`) ועקיפת
// `surface.drill = true` שהייתה נחוצה כדי ששורה תהיה לחיצה. ‏`ReportsPage.openDoor` הוא
// נתב-הדלתות היחיד עכשיו, ו-`ReportSurface` פותח שורה מכל `drill_key` שה-`kind` שלו נתיב.
// ⇒ **הלשונית מעבירה את `onDrill` הלאה ואינה נוגעת בו.**

import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import CustomerSurface from './customers/CustomerSurface'
import { customersTransform } from './customers/payload'

// רמות-ההרשאה שפותחות מודול (זהה ל-`canOpenTab` של הקטלוג, על מודול ולא על לשונית).
const OPEN_LEVELS = new Set(['edit', 'view'])

export default function CustomersTab({ surface, filters, drill, onDrill, onWindow, onRetry }) {
  const { permissions } = useAuth()

  const canSeeMoney = OPEN_LEVELS.has(permissions?.['כספים'])
  const canEdit = permissions?.['דו"חות'] === 'edit'

  // 🔴 **זהות יציבה, ולא נוחות:** ‏`ReportSurface` ממומואיזי את הטרנספורמציה על
  // `[rawPayload, transformPayload]`. פונקציה חדשה בכל רינדור הייתה מבטלת את המימואיזציה
  // ומכריחה את Recharts לצייר מחדש כל גרף בכל הקלדה במסנן. התלויות הן **פרימיטיבים בלבד**.
  const transformPayload = useMemo(
    () => customersTransform(surface.id, { canSeeMoney }),
    [surface.id, canSeeMoney],
  )

  return (
    <CustomerSurface
      surface={surface}
      filters={filters}
      drill={drill}
      onDrill={onDrill}
      onWindow={onWindow}
      transformPayload={transformPayload}
      canEdit={canEdit}
      onChanged={onRetry}
    />
  )
}
