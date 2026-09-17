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
  const list = Array.isArray(columns) ? columns : []
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
  return (Array.isArray(columns) ? columns : []).map((column) => column.key)
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
