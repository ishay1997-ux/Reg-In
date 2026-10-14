// כתיבת קובץ ה-xlsx בשרת — `write-excel-file` בגרסה המדויקת שהדפדפן משתמש בה (`package.json`).
//
// 🔬 **הוכח ב-spike של 13.10.2026 (חוזה §3.4, W0-CHECK 3), לפני שנכתבה שורה כאן:** הכניסה
// הדפדפנית רצה ב-Deno 2 (היא מחזירה `Blob`, ו-`Blob` קיים ב-Deno), הקובץ נקרא חזרה ב-
// `read-excel-file/node` עם ת"ז `"012345678"` כמחרוזת (האפס המוביל נשמר) ומספרים כמספרים, ב-XML
// של הגיליון יש `rightToLeft="1"`, ו-300 שורות נבנו ב-37 מילי-שניות (תקרת ה-CPU בשרת: 2 שניות).
// 🔬 **14.10.2026 — שני גיליונות** ("סיכום לפי דיילת"): הוכח באותה דרך ב-Deno — שני הגיליונות
// קיימים, בשניהם `rightToLeft="1"`, והת"ז נקראת חזרה כמחרוזת.
// ⚠️ **הקובץ הזה אינו עובר Vitest** (ייבוא `npm:`) — הוא נבדק ב-`deno check` ב-CI, והמבנה שהוא
// כותב (`doc.sheet`, `doc.summarySheet`) נבדק תא-תא ב-`document.parity.test.js`.

import writeXlsxFile from 'npm:write-excel-file@2.3.10'
import {
  COLUMN_WIDTHS,
  HOSTESS_SUMMARY_SHEET_NAME,
  HOSTESS_SUMMARY_WIDTHS,
  type SalaryDocument,
} from './document.ts'

// שם-הגיליון הראשון הוא תווית-החודש בלבד ("אוגוסט 2026"), כמו במקור — גם בדוח-השלמה, שבו
// הכותרת שבתוך הגיליון כבר נושאת "— השלמה n". השני: "סיכום לפי דיילת".
export async function writeSalaryReportXlsx(doc: SalaryDocument): Promise<Uint8Array> {
  const result: unknown = await writeXlsxFile([doc.sheet, doc.summarySheet], {
    sheets: [doc.periodLabel, HOSTESS_SUMMARY_SHEET_NAME],
    columns: [COLUMN_WIDTHS, HOSTESS_SUMMARY_WIDTHS],
    rightToLeft: true,
  })
  if (!(result instanceof Blob)) throw new Error('XLSX_BUILD_FAILED')
  return new Uint8Array(await result.arrayBuffer())
}
