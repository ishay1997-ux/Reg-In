// קטלוג-המשטחים של מודול 11 — **דאטה טהורה, אפס JSX ואפס רשת.**
//
// 🔑 **למה קובץ נפרד ולא מערך בתוך `ReportsPage`:** ארבעה סוכני-לשונית בונים על אותה רשימה,
// וכל אחד צריך את שם-ה-RPC, את השם הקצר ואת השאלה. רשימה שחיה בתוך רכיב נקראת רק על-ידו,
// והעתק שני שלה בכל לשונית הוא בדיוק מה ש-jscpd (3%) יתפוס — אחרי שכבר סטו.
//
// 🔒 **מקורות, ואין גזירה מאף אחד מהם:**
// · שם קצר + שאלה ⇐ `processes-approved.md §🏷️` **מילה-במילה** (הכרעה 18: שם בניווט,
//   השאלה ככותרת-משנה). 🚫 **אין מספר-דוח בממשק** (`spec.md §1.2`).
// · שם-ה-RPC ⇐ מדריך-המיקרו §2ב **C8**, הרשימה הנעולה 16/09/2026 — **אותה רשימה בדיוק**
//   שהמיגרציות בונות. שם שנגזר כאן לפי תבנית במקום להיות מועתק היה נשבר בשקט מול המסד.
// · מודול-הבעלים ⇐ הכרעה 2 / C5: הנהלה+כספים ⇐ `'כספים'` · דיילות ⇐ `'דיילות'` ·
//   לקוחות ⇐ `'לקוחות'`. **שתי לשוניות נפרדות על המסך, אותה הרשאת-מודול** — וזה מכוון.
//
// ⏸️ **המשטחים הנדחים אינם כאן כלל** (הכרעה 30 + הכרעת-ישי 15/09): מ5 · מ10 · מ11 · מ13 ·
// מ18 · מ26 · מ23 · מ24. **דחייה אינה מצב-ביניים על המסך** — שבב מנוטרל מייצר דף שאיש לא
// הזמין. *(המוקאפ של לשונית-הכספים כן מצייר שלושה מהם `class="deferred"`, וישי אישר אותו
// כך; זו החלטת-ציור על מוקאפ קפוא, ו-`reportsCatalog` מתאר את מה שנבנה.)*

// מודול-ההרשאה שכל לשונית נפתחת לפיו (הכרעה 2). 🚫 **לא מיוצא** — אין לו צרכן מחוץ לקובץ,
// ו-knip תופס ייצוא ספקולטיבי בצדק. כשיידרש (למשל למסך-הרשאות) — אז מייצאים.
const TAB_PERMISSION_MODULE = Object.freeze({
  exec: 'כספים',
  finance: 'כספים',
  hostesses: 'דיילות',
  customers: 'לקוחות',
})

/**
 * שישה-עשר המשטחים הנבנים, בסדר-ההצגה של כל לשונית (מבט-על ראשון, ואז שלושת הדפים).
 *
 * `topN` = **רשימת-שיא מתוכננת, לא טבלה שנחתכה** (הכרעת-ישי 4, 17/09/2026) — הטבלה מקבלת
 * כותרת כנה *"8 האירועים הגדולים · מתוך 246"* במקום פאג'ר שאומר *"1–8 מתוך 8"*. אותה תווית
 * משמשת את חלון-הייצוא (`exportFetch.js`) — **בית אחד**, כדי שהמסך והקובץ לא ייקראו לה בשני שמות.
 *
 * `drill: true` = 📐13 — פירורי-לחם · אריחים ושורת-"אז מה" שיורדים עם הרמה · ייצוא של הרמה
 * הנוכחית · והמצב בכתובת-הדף. **בשאר הדפים: סינון-צולב בלבד.**
 * 🔴 **וכאן יושבת סתירה מתועדת שלא הוכרעה על-ידי, ר' הדיווח:** ‏`C8` (נעול 16/09/2026)
 * נוקב ב-**מ3 · מ9 · מ17**, ואילו 📐13 ו-`spec.md §✅` נוקבים ב**מגמות · גיול · שכר ·
 * ריכוזיות** — כלומר מ3 · מ9 · **מ13** · **מ5**, שהאחרונים שניהם נדחים. ‏**הקוד עוקב אחרי
 * C8** כי הוא החוזה שהמיגרציות ובוני-הלשוניות מדברים בו, והפער מדווח ולא מתוקן.
 */
export const REPORT_TABS = Object.freeze([
  {
    key: 'exec',
    label: 'הנהלה',
    permissionModule: TAB_PERMISSION_MODULE.exec,
    surfaces: Object.freeze([
      {
        id: 'מ2',
        slug: 'exec-overview',
        rpc: 'report_m02_exec_overview',
        name: 'מבט-על הנהלה',
        question: 'מה מצב העסק השנה?',
        drill: false,
        topN: '8 האירועים הגדולים',
      },
      {
        id: 'מ3',
        slug: 'trends',
        rpc: 'report_m03_trends',
        // ✏️ 24/09/2026 — דוחות-החלטה (docs/plans/2026-09-23-module-11-decision-reports.md): שלושת
        // המשטחים של הלשונית שודרגו במקום — אותו rpc ו-slug, שם ושאלה חדשים (processes-approved §🏷️).
        name: 'סגירת הצעות',
        question: 'מה סוגר הצעה, ואיפה הכסף הולך לאיבוד?',
        // ✏️ 24/09/2026 — כבר לא דוח-קידוח: אין בו ציר-שנים לרדת בו. הסינון-הצולב (סיבה ⇐ טבלה) מחליף אותו.
        drill: false,
      },
      {
        id: 'מ4',
        slug: 'discounts',
        rpc: 'report_m04_discounts',
        name: 'הנחה מול סגירה',
        question: 'מתי הנחה שווה את זה?',
        drill: false,
      },
      {
        id: 'מ6',
        slug: 'staffing',
        rpc: 'report_m06_staffing',
        name: 'איכות אירועים',
        question: 'מה מוריד את ציון האירוע?',
        drill: false,
      },
    ]),
  },
  {
    key: 'finance',
    label: 'כספים',
    permissionModule: TAB_PERMISSION_MODULE.finance,
    surfaces: Object.freeze([
      {
        id: 'מ7',
        slug: 'finance-overview',
        rpc: 'report_m07_finance_overview',
        name: 'מבט-על כספים',
        question: 'מה מצב הכסף?',
        drill: false,
        topN: '4 החשבוניות הישנות ביותר',
      },
      {
        id: 'מ8',
        slug: 'profitability',
        rpc: 'report_m08_profitability',
        name: 'רווחיות פרויקטים',
        question: 'אילו פרויקטים דלפו מהתקציב?',
        drill: false,
      },
      {
        id: 'מ9',
        slug: 'aging',
        rpc: 'report_m09_aging',
        name: 'גיול חובות',
        question: 'את מי לגבות השבוע?',
        drill: true,
      },
      {
        id: 'מ12',
        slug: 'equipment',
        rpc: 'report_m12_equipment',
        name: 'צריכת ציוד',
        question: 'כמה ציוד נצרך וכמה להזמין?',
        drill: false,
      },
    ]),
  },
  {
    key: 'hostesses',
    label: 'דיילות',
    permissionModule: TAB_PERMISSION_MODULE.hostesses,
    // ✏️ **`defaultPeriod` — הכרעת-ישי 16/09/2026 17:4X (כרטיס ⑧H2).** ארבעת כרטיסי-הדיילות
    // מוגדרים על **חלון מתגלגל של ⁦12⁩ חודשים** (`cards-hostesses.md:413`:
    // `(10/09/2025, 10/09/2026]`), והלשונית נפתחה עד היום על **שנה קלנדרית** — כלומר הכרטיס
    // והמסך מדדו שתי אוכלוסיות שונות בשקט. 🔑 **השדה יושב על הלשונית ולא על המשטח** כי
    // מסנן-התקופה הוא **גלובלי למעטפת** ומשותף לארבעת דפי-הלשונית.
    // 🚫 שלוש הלשוניות האחרות אינן מכריזות דבר ⇒ `DEFAULT_PERIOD` ('השנה', ח8-7) — **בלי
    // שורה מיותרת שתסתיר את העובדה שרק אחת חורגת.**
    defaultPeriod: '12m',
    surfaces: Object.freeze([
      {
        id: 'מ14',
        slug: 'hostess-overview',
        rpc: 'report_m14_hostess_overview',
        name: 'מבט-על דיילות',
        question: 'מה מצב המאגר?',
        drill: false,
      },
      {
        id: 'מ15',
        slug: 'reliability',
        rpc: 'report_m15_reliability',
        name: 'אמינות והתייצבות',
        question: 'את מי לא לשלוח, ואת מי להזהיר?',
        drill: false,
      },
      {
        id: 'מ16',
        slug: 'quality-cost',
        rpc: 'report_m16_quality_cost',
        name: 'איכות מול עלות',
        question: 'מי שווה את התעריף שלה?',
        drill: false,
      },
      {
        id: 'מ17',
        slug: 'fairness',
        rpc: 'report_m17_fairness',
        name: 'הוגנות השיבוץ',
        question: 'האם השיבוץ הוגן ומהיר?',
        // ✏️ 16/09/2026 — הכרעת-המתזמר (C8 תוקן, מדריך §9 D-14): 📐13 מונה דוחות 1 · 6 · 16 · 4 =
        // מ3 · מ9 · מ13 · מ5. "ריכוזיות" שב-spec §✅ היא מ5 (ריכוזיות לקוחות, נדחה) — מ17 אינו דוח-דריל.
        drill: false,
      },
    ]),
  },
  {
    key: 'customers',
    label: 'לקוחות',
    permissionModule: TAB_PERMISSION_MODULE.customers,
    surfaces: Object.freeze([
      {
        id: 'מ19',
        slug: 'customers-overview',
        rpc: 'report_m19_customers_overview',
        name: 'מבט-על לקוחות',
        question: 'מה הלקוחות מרגישים?',
        drill: false,
        topN: '8 הלקוחות הגדולים',
      },
      {
        id: 'מ20',
        slug: 'satisfaction',
        rpc: 'report_m20_satisfaction',
        name: 'שביעות רצון',
        question: 'מה משמח ומה מכעיס לקוחות?',
        drill: false,
      },
      {
        id: 'מ21',
        slug: 'drifting',
        rpc: 'report_m21_drifting',
        name: 'לקוחות מתרחקים',
        question: 'למי להתקשר החודש?',
        drill: false,
      },
      {
        id: 'מ22',
        slug: 'notes',
        rpc: 'report_m22_notes',
        name: 'ניתוח הערות',
        question: 'מה ההערות אומרות שהתגיות לא תפסו?',
        drill: false,
      },
    ]),
  },
])

/** רמות-ההרשאה שפותחות לשונית. `blocked` וחוסר-שורה כאחד ⇒ ממוסך (הכרעה 2). */
const OPEN_LEVELS = new Set(['edit', 'view'])

export function canOpenTab(tab, permissions) {
  return OPEN_LEVELS.has(permissions?.[tab.permissionModule])
}

export function findTab(tabKey) {
  return REPORT_TABS.find((t) => t.key === tabKey) ?? null
}

export function findSurface(tab, slug) {
  return tab?.surfaces.find((s) => s.slug === slug) ?? null
}
