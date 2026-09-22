// בחירת-העמודות והסדר שלהן בחלון-הייצוא — **גנרי, ואינו יודע דבר על דוחות**.
//
// 🔑 **למה כאן ולא ב-`src/modules/11_reports/`:** מודול 11 הוא הצרכן הראשון, לא היחיד.
// ‏`PROJECT_MASTER §6` רושם חמישה מסכי-רשימות נוספים שיצרכו את אותו חלון (הכרעת-ישי
// ‏17/09/2026), וכל מה שהקובץ הזה צריך הוא מערך `{ key, label, format }` — חוזה שכל מסך
// יכול לספק בכ-20 שורות. **שם עם הקידומת `reports` היה מחייב שכפול ביום שהמסך השני יגיע.**
//
// 🔴 **המודל: `order` מחזיק את **כל** המפתחות, ו-`selected` מסמן מי נכנס לקובץ.**
// ‏why: בפקד של רשימה-אחת (הכרעת-ישי: *"עמודה אחת בה הוא מסדר את הסדר, מסתיר או לא"*)
// עמודה שכובתה **נשארת במקומה** ברשימה. אילו `order` היה מחזיק רק את הנבחרות, החזרת
// עמודה הייתה חייבת להמציא לה מיקום — והיא הייתה נוחתת בסוף, הרחק מהמקום שממנו הוסרה.

/**
 * 🔑 **דלת-הקריאה היחידה לתא.** עמודה רשאית להצהיר `value: (row) => …`,
 * **והיא חייבת לקרוא לאותה פונקציית-נגזרת שהטבלה על המסך קוראת לה** — לעולם לא מימוש שני.
 *
 * 🔴 **למה זה קיים:** װ`PROJECT_MASTER §6` מבטיח למסכים הבאים חוזה
 * `{key, label, format, value?, visible?}`, וװ📊 **נמדד 17/09/2026 ששלושת אתרי-הקריאה
 * קראו `row[key]` בלבד.** װ**הכשל היה שקט:** מפתח חסר ⇒ `undefined` ⇒ תא ריק
 * **בלי שגיאה ובלי אזהרה** ⇒ עמודה שלמה ריקה בקובץ שנראה תקין.
 */
export function readCell(row, column) {
  return typeof column?.value === 'function' ? column.value(row) : row?.[column?.key]
}

/**
 * 🔴🔴 **מסנן-ההרשאות, והוא מנגנון-בטיחות ולא נוחות-תצוגה.**
 *
 * װ`RepositoryTab.jsx:404` · `:455` מסירים לגמרי את עמודת `שכר שעתי` כשהמשתמשת
 * אינה `edit` על 'דיילות'. **תיאור-עמודות תמים היה מייצא אותה לכולן.**
 *
 * ⚠️ **ברירת-המחדל היא "נראית" במכוון:** 16 הדוחות של מ11 אינם מצהירים
 * `visible` כלל, והסתרה-כברירת-מחדל היתה **מרוקנת את כל הקבצים בשקט** — כלומר
 * בדיוק אותה מחלקת-כשל שהפונקציה הזו נולדה למנוע. **הסתרה היא הצהרה מפורשת.**
 */
export function isVisible(column) {
  const flag = column?.visible
  // לא הוצהר כלל ⇒ נראית. 16 הדוחות של מ11 אינם מצהירים `visible`.
  if (flag === undefined || flag === null) return true
  const resolved = typeof flag === 'function' ? flag() : flag
  // 🔴🔴 **`=== true` ולא `Boolean(…)`, וזה ההפרש בין נופל-סגור לנופל-פתוח.**
  // 📊 **נמדד 22/09/2026 על-ידי סוכן-יריב, ואומת בבדיקה שנכשלה:** הרשאות
  // בריפו הזה הן **מחרוזות** (`RepositoryTab.jsx:72` — `permissions['דיילות'] === 'edit'`),
  // ולכן הכתיבה הטבעית `visible: () => permissions['דיילות']` מחזירה `'view'`.
  // װ`Boolean('view')` הוא **`true`** ⇒ השכר היה מיוצא למי שאסור לה לראות אותו.
  // ⚠️ **מנגנון-הרשאות חייב ליפול סגור:** כל שאינו `true` מפורש — מסתיר.
  // װ(Promise מ-`async`, מחרוזת, מספר, `undefined` מפרמטר שלא הועבר — כולם מסתירים.)
  return resolved === true
}

/**
 * ‏`columns` של ה-RPC ⇐ העמודות שייכתבו לקובץ, מסוננות ומסודרות.
 *
 * 🔴 **מפתח שאינו קיים ב-`columns` הנוכחי נזרק בשקט — וזו הנקודה שבה הקובץ הזה מרוויח את
 * קיומו.** ‏why: רשימת-העמודות מתחלפת כשעוברים דוח **וגם כשיורדים רמת-דריל** (`report_m09_aging`
 * מכריזה עמודות שונות לרמה 0 ולרמה 1). העדפה שנשמרה על רשימה אחת ומוחלת על אחרת היא בדיוק
 * ‏Metabase issue #75791 — שם אי-התאמה של רשומה אחת החזירה את כל העמודות המוסתרות **והרסה את
 * הסדר**. ⇒ מסננים מול המציאות הנוכחית, לא מניחים שהיא לא זזה.
 *
 * ⚠️ **ובחירה ריקה מחזירה את הכול ולא כלום:** קובץ בן שורת-כותרת בלבד נראה כמו ייצוא שהצליח.
 * המסך חוסם את המצב הזה מראש (הכפתור מנוטרל), והשכבה הטהורה אינה סומכת עליו.
 */
export function applyColumnOrder(columns, order, selected) {
  // 🔴🔴 **האכיפה יושבת כאן ולא ברכיב, וזה מה שהופך אותה לגדר.**
  // הפונקציה הזו מזינה **גם** את התצוגה-המקדימה **וגם** את `buildSheet`
  // (`ExportDialog.jsx` — אותו `visibleColumns` נשלח לשניהם), ולכן סינון כאן
  // סוגר את שני המסלולים בבת-אחת. ⚠️ **והוא חוזר גם אחרי `defaultOrder` במכוון:**
  // `order` הוא state ששורד החלפות-דוח, ועמודה שהוסתרה **אחרי** שנכנסה לסדר
  // היתה חוזרת דרכו. **סינון במקום אחד בלבד הוא דלת פתוחה.**
  const list = (Array.isArray(columns) ? columns : []).filter(isVisible)
  if (list.length === 0) return []

  const byKey = new Map(list.map((column) => [column.key, column]))
  const ordered = (Array.isArray(order) ? order : []).map((key) => byKey.get(key)).filter(Boolean)

  // עמודה שה-RPC הוסיף ואינה ב-`order` השמור — מצטרפת בסוף ולא נעלמת.
  const seen = new Set(ordered.map((column) => column.key))
  const merged = [...ordered, ...list.filter((column) => !seen.has(column.key))]

  const keep = selected instanceof Set ? selected : new Set(selected ?? [])
  const picked = merged.filter((column) => keep.has(column.key))
  return picked.length > 0 ? picked : merged
}

/** סדר-הפתיחה: כפי שה-RPC הכריז. **הוא גם מה ש"איפוס" חוזר אליו.** */
export function defaultOrder(columns) {
  // עמודה שהוסתרה אינה נכנסת לסדר ולכן **גם אינה מופיעה בבוחר** —
  // המשתמשת אינה יודעת שהיא קיימת, ואינה יכולה לסמן אותה.
  return (Array.isArray(columns) ? columns : []).filter(isVisible).map((column) => column.key)
}

/**
 * הזזת מפתח צעד אחד. **מחזיר מערך חדש** — הרשימה נשמרת ב-state של React, ומוטציה
 * במקום לא הייתה מרנדרת מחדש.
 * ⚠️ קצה = אין-מעש, ולא גלישה לצד השני.
 */
export function moveKey(order, key, delta) {
  const list = [...(Array.isArray(order) ? order : [])]
  const from = list.indexOf(key)
  if (from < 0) return list
  const to = from + delta
  if (to < 0 || to >= list.length) return list
  list.splice(to, 0, list.splice(from, 1)[0])
  return list
}

/**
 * גרירה: מציב את `key` **לפני** `beforeKey`, או בסוף כש-`beforeKey` הוא `null`.
 * 🔑 **אנכי בלבד, וזו הסיבה שאין כאן ספריית-גרירה:** פקד דו-אזורי היה מעביר **אופקית**,
 * ותחת `<html dir="rtl">` חץ "ימינה" מעביר שמאלה. רשימה אחת מוחקת את המלכודת מהשורש.
 */
export function reorderKey(order, key, beforeKey) {
  const list = (Array.isArray(order) ? order : []).filter((item) => item !== key)
  if (!(Array.isArray(order) ? order : []).includes(key)) return [...(order ?? [])]
  const at = beforeKey == null ? list.length : list.indexOf(beforeKey)
  list.splice(at < 0 ? list.length : at, 0, key)
  return list
}

/**
 * קפיצה לראש הרשימה בלחיצה אחת (הכרעת-ישי 17/09/2026: *"«העבר לראש» מסכים"*).
 *
 * 🔑 **למה פונקציה ולא `reorderKey(order, key, order[0])` בקריאה ישירה:** ‏📊 **נמדד —
 * הקריאה הישירה שוברת כשהמפתח כבר ראשון.** ‏`reorderKey` מסנן את `key` החוצה ואז מחפש
 * את `beforeKey` ברשימה המסוננת; כששניהם אותו מפתח `indexOf` מחזיר `-1`, והענף
 * `at < 0 ? list.length` **מעיף את הפריט לסוף הרשימה במקום להשאירו בראש.**
 * ⚠️ **הכפתור אמנם מנוטרל ב-`index === 0`, והשכבה הטהורה אינה סומכת על כך** — אותו
 * נימוק בדיוק שכתוב ב-`applyColumnOrder` על בחירה ריקה.
 *
 * 📊 **והנימוק שהמוקאפ חשף:** להעביר שדה ממקום 30 למקום 1 בחצים = **29 לחיצות**.
 * הסידור — לא החיפוש — הוא מה שנשבר כשרשימת-העמודות גדלה מ-8 ל-30.
 */
export function moveToTop(order, key) {
  const list = Array.isArray(order) ? order : []
  if (!list.includes(key) || list[0] === key) return [...list]
  return reorderKey(list, key, list[0])
}
