<div dir="rtl">

# 🔍 בקרת קוד — מודול 1 (06/07/2026)

> סקירה חד-פעמית של כל הקוד/DB/תיעוד שנבנה עד כה (ענף `ishay/module-1-permissions`), לפני סגירת מודול 1. **מטרת המסמך:** לתת לכל Claude עתידי (או לישי/עמית) רשימת פעולות מדורגת — לא רק "יש בעיה" אלא **איפה היא נסגרת**.
>
> **מסקנה מרכזית:** אין חוסמים קריטיים. מודול 1 מוכן ל-merge ברמת פונקציונליות/אבטחה/איכות-קוד. הממצאים כאן הם שיפורים, לא תיקוני-חובה לפני מיזוג — מלבד P0 שמומלץ לסגור באותה נשימה כי הם קטנים.

---

## מתודולוגיה

נסקרו: מבנה הקוד (`src/`), שכבת ה-Supabase (`supabase/migrations/`, RLS, RPCs), זרימת ה-Auth (Google OAuth + נעילת חשבון), תשתית הבדיקות (Vitest + Playwright + CI), וה-Git state (ענפים, קומיטים, קבצים שהשתנו). **לא** נסקר: עומס/ביצועים (אין עדיין דאטה בקנה-מידה), נגישות (a11y) מעבר לבדיקה ויזואלית בסיסית.

---

## 🔴 P0 — לסגור עם מודול 1 (קטן, מהיר)

| # | ממצא | קובץ | תיקון |
|---|---|---|---|
| 1 | אין שדה `engines` ב-`package.json` — CI רץ על Node 20 אבל שום דבר לא מכריח את זה מקומית | `package.json` | להוסיף `"engines": { "node": ">=20.0.0" }` |
| 2 | `.env.example` לא מתעד את משתני ה-E2E (`E2E_CEO_EMAIL` וכו') בצורה שמישהו חדש (עמית!) יבין שהם אופציונליים | `.env.example` | להוסיף הערה: "אופציונלי להרצת E2E מקומית — בקש מישי" |

**נתיב סגירה:** [ishay/01_close_module_1.md](guides/ishay/01_close_module_1.md) — סעיף ⑤.

---

## 🟡 P1 — לפני/במהלך מודול 2 (חשוב, לא חוסם)

| # | ממצא | פירוט | נתיב סגירה |
|---|---|---|---|
| 3 | **RLS על 11 הטבלאות העסקיות** — כולן RLS-on בלי policies (deny-all מכוון). כל מודול חדש יגלה מסך ריק עד שיכתוב policies בעצמו. **תלוי הכרעה:** מודל בעלות-דאטה (מטריצת הרשאות בלבד, או גם בעלות ברמת-רשומה) | ר' `docs/PROJECT_MASTER.md` §7 פריט 21 | ishay/01 (הכרעה) → amit/06 מודול 2 (יישום ראשון) |
| 4 | **אין Error Boundary** ב-`src/App.jsx` — קריסת רינדור = מסך לבן, בלי הודעה | `src/App.jsx` | ishay/01 |
| 5 | **שינוי סיסמה לא מחובר ל-Backend** — טאב "אבטחה" ב-`ProfileSettingsPage.jsx` הוא UI בלבד; אין קריאה ל-`supabase.auth.updateUser({password})` | `src/components/ProfileSettingsPage.jsx` | ishay/01 |
| 6 | **E2E למטריצת הרשאות חלקי** — `e2e/permissions.spec.js` קיים אך לא בודק שינוי תא בפועל (edit→view→blocked) ולא בודק הגנת self-lockout במטריצה | `e2e/permissions.spec.js` | ishay/01 |
| 7 | **`current_user_role_id()` — הערת תיעוד חסרה** על היותה load-bearing לכל RLS עתידי | `supabase/migrations/20260702195258_harden_current_user_role_id.sql` | ishay/01 (הערה) |

---

## 🟢 P2 — לשיפור, לא דחוף

| # | ממצא | פירוט | נתיב סגירה |
|---|---|---|---|
| 8 | **`MODULE_META` ב-`Sidebar.jsx` שביר** — מיפוי לפי מחרוזת עברית של שם המודול; שינוי שם ב-DB ישבור בשקט את התצוגה (`if (!meta) return null`) | `src/components/layout/Sidebar.jsx` | לשקול מפתח יציב (`module_id`/slug) בפעם הבאה שנוגעים בסכמת `modules` — לא דחוף |
| 9 | **`params` בלי Seed** — הטבלה קיימת, ריקה. נדרש לפני מודול 3 (מע"מ, יחס אורחים-לדיילת, משקולות Smart Match) | `docs/reference_spec/products_and_params.md` (החלטות נעולות) | amit/07 מודול 3 |
| 10 | **סיסמאות בדיקה בטקסט גלוי ב-`docs/CHANGELOG.md`** (שורות ~11–21: סיסמת מנכ"ל + סיסמה משותפת ל-4 משתמשי בדיקה) | `docs/CHANGELOG.md` | **המלצה בלבד — לא לפעול בלי אישור ישי מפורש.** אם מוחלט לפעול: להעביר לערוץ פרטי ולהחליף לכתובות/פרטים גנריים בקובץ |
| 11 | **`<html lang="he" dir="rtl">`** — לאמת שזה מוגדר בפועל ב-`index.html` (חשוב ל-a11y ול-E2E שמצפה RTL) | `index.html` | ishay/01 (בדיקה מהירה) |

---

## טבלת ניתוב — כל ממצא לאן הוא נסגר

| ממצא | נתיב |
|---|---|
| P0 #1–2 | [ishay/01_close_module_1.md](guides/ishay/01_close_module_1.md) |
| P1 #3 (RLS ownership) | [PROJECT_MASTER §7.21](PROJECT_MASTER.md) → ishay/01 → [amit/06_module_02_customers.md](guides/amit/06_module_02_customers.md) |
| P1 #4–7 | [ishay/01_close_module_1.md](guides/ishay/01_close_module_1.md) |
| P2 #8 | backlog — לתעד ב-`docs/CHANGELOG.md` בפעם שנוגעים בסכמת `modules` |
| P2 #9 | [amit/07_module_03_quotes.md](guides/amit/07_module_03_quotes.md) |
| P2 #10 | דורש שיחה עם ישי — לא לפעול אוטומטית |
| P2 #11 | [ishay/01_close_module_1.md](guides/ishay/01_close_module_1.md) |

</div>
