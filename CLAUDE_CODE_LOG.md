<div dir="rtl">

# CLAUDE_CODE_LOG — יומן עבודה פנימי של Claude Code

> קובץ זה **לא** מיועד לישי לתחזק — הוא ליצירה ועדכון עצמי שלי (Claude Code) בין סשנים, כדי לא לאבד הקשר. ישי יכול לקרוא אותו אבל האחריות על עדכונו היא שלי. עדכן אותו בסוף כל סשן עבודה משמעותי.
>
> מקורות אמת מחייבים אחרים שלא כפולים כאן: `docs/PROJECT_MASTER.md` (מסמך-על — סכמה/הרשאות/מסכים), `docs/CHANGELOG.md` (יומן שינויי DB וקוד, לשני המפתחים), `docs/micro_guides/REG-IN_מדריך_מיקרו_מודול_1.md` (מתכון צעד-אחר-צעד למודול 1). הקובץ הזה משלים אותם — לא מחליף.

---

## 1. ארכיטקטורת המערכת הנוכחית (הערכה, 02/07/2026)

**Stack:** React 19 + Vite 8, JavaScript בלבד (לא TS), Tailwind CSS v4 + shadcn/ui (מעל Radix, package מאוחד `radix-ui`), Lucide לאייקונים, Supabase (Auth + Postgres+RLS), `react-router-dom` v7 (BrowserRouter), ממשק עברי RTL מלא, alias `@/` → `src/`.

**זרימת הרשאות (RBAC) בפועל בקוד:**
- `src/contexts/AuthContext.jsx` — מקור אמת יחיד ל"מי מחובר": טוען session מ-Supabase Auth, שולף שורת `users` תואמת (email/full_name/phone/status/role_id/roleName), ואם `status==='active'` שולף גם מפת `permissions` שטוחה `{ module_name: 'edit'|'view'|'blocked' }`. חושף `{ loading, user, permissions, reload, signOut }` דרך `useAuth()`.
- `src/components/layout/MainLayout.jsx` — שער-העל: מפנה ל-`/login` אם אין `user`, מציג מסך "מוקפא" אם `status==='frozen'`, אחרת מרכיב `Sidebar`+`Topbar`+`<Outlet/>`.
- `src/components/layout/Sidebar.jsx` — מתקפל, קבוע מימין (RTL). "לוח בקרה" קבוע לכולם (לא מודול-RBAC). שאר 9 המודולים נשלפים דינמית מטבלת `modules` בפועל (לא hard-coded), ומסוננים: `permission==='blocked'` → מוסתר לגמרי מהתפריט. מיפוי אייקון+נתיב לכל שם-מודול קיים ב-`MODULE_META` (אובייקט קבוע בקוד, במפורש נגד ה-`module_name` האמיתי מה-DB).
- `src/components/layout/ProtectedRoute.jsx` — הגנת נתיב ברמת ה-Route: מקבל כרגע `requiredModule` (מחרוזת בודדת), חוסם אם `blocked`/לא קיים — **גם** גישה ישירה ב-URL, לא רק הסתרה בתפריט.
- `src/components/layout/Topbar.jsx` — חיפוש (placeholder ויזואלי בלבד, מנוטרל, לא מחובר) + תפריט משתמש (שם+תפקיד מ-AuthContext, Logout אמיתי).
- `src/App.jsx` — עץ ה-Routes: `/login` מחוץ ל-Layout; כל השאר תחת `<Route element={<MainLayout/>}>` — `index`=`WelcomePage`, ואז נתיב שטוח אחד לכל מודול (`/users`,`/customers`,`/quotes`,`/projects`,`/hostesses`,`/logistics`,`/finance`,`/reports`,`/settings`), כולם עטופים ב-`ProtectedRoute` עם `requiredModule` תואם. כל המודולים חוץ מ-`/users` מציגים `UnderConstruction` placeholder גנרי.
- `src/modules/01_auth/UsersManagementPage.jsx` — מסך ניהול משתמשים אמיתי (לא placeholder): טבלת עובדים + הוספת משתמש (Dialog+Select מ-shadcn) + הקפאה/שחזור סטטוס. יש בדיקת גישה כפולה בתוך הקומפוננטה עצמה (session→role==='מנכ"ל') מעבר להגנת ה-Route, כי ה-RLS ב-DB בכל מקרה אוכף בפועל.
- `src/modules/01_auth/LoginPage.jsx` — shadcn (Input/Button), ולידציה מקומית, בדיקת status/role אחרי אימות מוצלח מול Supabase, מנווט ל-`/` (לא `alert` יותר).
- DB: RLS פעיל בפועל רק על 4 טבלאות (`roles`,`modules`,`permissions`,`users`) דרך `current_user_role_id()` (SECURITY DEFINER, אוכפת גם `status='active'`). **שאר 11 הטבלאות העסקיות חסומות לגמרי** (RLS on, 0 policies) — כל מודול עתידי יגלה דאטה ריק עד שיוסיף policy.

---

## 2. אבני דרך שהושלמו

- מודול 0 (תשתית: Vite+Tailwind+Supabase+RTL).
- מודול 1, צעדים 1,2,4,5,6,8,9 (מתוך 14 במדריך המאוחד): Seed בסיסי (roles/modules/permissions), RLS על 4 טבלאות ליבה + פונקציית עזר מאובטחת, הגנת פרונטנד בהתחברות, שדרוג shadcn למסך ההתחברות, מסך ניהול משתמשים ראשוני.
- תשתית ניתוב כללית **מעבר למה שהמדריך המקורי דרש** (הוספה תוך כדי עבודה, על דעת ישי): `react-router-dom`, `AuthContext` משותף, `MainLayout`+`Sidebar`+`Topbar`+`ProtectedRoute`, `WelcomePage`+`UnderConstruction` placeholders. אומת ידנית מול sessions אמיתיים משלושה תפקידים שונים — סינון RBAC, ניווט, קיפול, וחסימת נתיב ישיר ב-URL כולם עבדו כצפוי. Logout לא אומת ויזואלית עד הסוף (מגבלת כלי-בדיקה מול תפריט Radix, לא חשד לבאג).
- **שום דבר מכל זה עדיין לא עבר `git commit`** — הכל לוקאלי, ממתין לסקירת ישי (ראה `git status` — כל הקבצים החדשים/משונים שלמעלה).

---

## 3. דרישות פעילות — Refactor ניתוב מקונן (הוזמן ע"י ישי, 02/07/2026)

הוחלט ואושר סופית ע"י ישי (לא פתוח לדיון נוסף, רק לאופן היישום):

1. **Sidebar Accordion + תת-טאבים ברמת התוכן** — גישה משולבת: פריט הורה בתפריט הצד יכול "להיפתח" (accordion) לתת-פריטים; בתוך אזור התוכן של המודול עצמו יש גם תצוגת טאבים תואמת. **צמצום היקף מאושר:** כשה-Sidebar מכווץ (collapsed) — קליק על אייקון ההורה מנווט ישירות לדף הנחיתה של המודול, **בלי** flyover בהצבעה (hover). לא נבנה hover-flyout בכלל.
2. **מודול "גיוס" (דיילות):** קליק על "גיוס" בתפריט **לא** ינווט ישירות למאגר הדיילות. במקום זה — ינווט למסך נחיתה נקי חדש: **"גיוס" (Recruitment Overview)**, placeholder בשלב זה.
3. **הגנת נתיב גלובלית גמישה:** `ProtectedRoute` צריך לקבל **מחרוזת בודדת או מערך** של מודולים/תפקידים מותרים (future-proofing מכוון). המימוש שבחרתי (לאישור ישי בתוכנית): פרופ יחיד `allow` שמקבל string או string[]; כל איבר נבדק קודם מול שם-תפקיד מדויק (`roleName`), ואם לא תואם — מול `permissions[moduleName]` (view/edit=מותר). גישה ניתנת אם **איזשהו** איבר עובר (OR).
4. **מודול "ניהול מערכת" — CEO בלבד, view+edit:** פריט ההורה **וכל תתי-הנתיבים שלו** מוגבלים ל-`מנכ"ל` בלבד. **הסתרה מלאה** מהתפריט לכל תפקיד אחר (לא רק "blocked" בטבלת permissions — הסתרה קשיחה לפי תפקיד, ללא תלות בערכי permissions), **וגם** חסימת גישה ישירה ב-URL באמצעות ה-guard.
5. **3 טאבים מבניים בתוך "ניהול מערכת":**
   - *ניהול משתמשים* → מתחבר ל-`UsersManagementPage.jsx` הקיים (לא נבנה מחדש, רק מתחבר כתוכן-טאב/נתיב-מקונן).
   - *הרשאות* → placeholder למסך מטריצת ההרשאות העתידי (צעד 10 במדריך מודול 1, טרם נבנה).
   - *פרמטרים* → placeholder נקי (עתידי: `params` table, מודול 9 / 5.16 באפיון).

**⚠️ נקודה לתשומת לב ישי (לא הכרעתי לבד, מסמן בפירוש):** ב-DB הקיים "ניהול הרשאות" ו-"הגדרות מערכת" הם **שני מודולים נפרדים** בטבלת `modules`/`permissions` (ראו PROJECT_MASTER §2.1, §3). "ניהול מערכת" כפי שמתואר כאן הוא **מטריה ניווטית חדשה בממשק בלבד** שמאגדת את שניהם (+טאב ניהול-משתמשים שאין לו מודול-DB נפרד כלל) תחת הורה אחד. אין בכוונתי לשנות את הסכמה או את `permissions` — הבדיקה בפועל תהיה role-based ישירות (`roleName === 'מנכ"ל'`), לא דרך ערכי ה-permissions של שני המודולים הללו. זה עקבי עם המטריצה הקיימת (רק מנכ"ל לא-חסום בשניהם ממילא) אבל זו הכרעת-מימוש שלי, לא עובדה מה-DB.

---

## 4. דגלים ו-Tech Debt (עבר + עתיד)

**פתוחים מ-PROJECT_MASTER §7 (לא נסגרו):**
- #1 מע"מ 17%/18% (האפיון קובע 18%, יש סתירה מול מוקאפ).
- #3 `customer_type` enum מול תוויות מוקאפ.
- #4 ערכי מטריצת ההרשאות במוקאפ מול האפיון.
- #5 מבנה שטוח מול 4 קבוצות-על לתפריט/מטריצה — **קשור ישירות ל-refactor הנוכחי**, לתשומת לב בעת בניית מסך המטריצה עצמו.
- #6 כתובת דיילת (יש רק `city` בסכמה).
- #7 stepper פרויקט (5 שלבים במוקאפ מול 8 ב-DB).
- #8 CAPTCHA — נדרש באפיון 5.6.1, לא קיים בקוד, לא הוכרע ספק.

**Tech debt קיים:**
- RLS חסר על 11 מהטבלאות (רק roles/modules/permissions/users מוגנות).
- Logout לא אומת ויזואלית סוף-לסוף.
- חיפוש ב-Topbar הוא placeholder בלבד, לא מחובר לנתונים.
- `docs/PROJECT_MASTER.md` לא מתאר בכלל את שכבת ה-Layout/Routing (Sidebar/Topbar/AuthContext/ProtectedRoute) — פער תיעוד ידוע.
- מסך מטריצת הרשאות (צעד 10 במדריך) עדיין לא קיים בקוד בפועל.

**TODO מהמשימה הנוכחית — הושלם ואומת (02/07/2026):**
- [x] `ProtectedRoute` — הוחלף `requiredModule` ב-`allow` (string | string[], מודולים+תפקידים מעורבים; entry נבדק קודם מול `roleName`, אח"כ מול `permissions`).
- [x] מסך "גיוס" (Recruitment Overview) — לא נוצר קובץ חדש; `UnderConstruction moduleName="גיוס"` בנתיב `/hostesses`. תווית ה-Sidebar עצמה נשארה "דיילות" (הכרעת ישי במפורש — לא לשנות).
- [x] מסך "ניהול מערכת" (`SystemManagementPage.jsx` חדש) — הורה חדש בנתיב `/system`, CEO-בלבד (`ProtectedRoute allow={CEO_ROLE_NAME}`), מוסתר לגמרי מה-Sidebar לכל תפקיד אחר (בדיקת `roleName` ישירה, לא permission-based).
- [x] 3 טאבים תחת "ניהול מערכת" (`NavLink`, לא Radix Tabs — כל טאב = Route אמיתי): ניהול משתמשים (מחובר ל-`UsersManagementPage` הקיים), הרשאות (placeholder), פרמטרים (placeholder).
- [x] Sidebar — accordion אמיתי לפריט "ניהול מערכת" בלבד (לא מנגנון גנרי): מורחב=toggle+3 קישורי-בת מוזחים, מכווץ=ניווט ישיר ל-`/system/users` בלי flyover. "ניהול הרשאות"/"הגדרות מערכת" הוסרו מ-`MODULE_META` (עדיין ב-DB, פשוט לא מיוצגים).
- [x] `UsersManagementPage.jsx` — שולב כתוכן-טאב (הוסר ה-wrapper `min-h-screen`+בדיקת session/role כפולה, מוחלף ב-`useAuth()`); ולידציית מייל (regex מלא), טלפון ישראלי (regex, רק אם הוזן), שם מלא (≥2 תווים); נעילת כפתור "הקפא" על שורת המשתמש המחובר עצמו (self-lockout prevention).
- [x] `src/lib/constants.js` חדש — `CEO_ROLE_NAME` משותף (היה כפול בקוד).
- [x] **תיקון אגב שהתגלה בבדיקה:** לטופס `UsersManagementPage` חסר `noValidate` (בניגוד ל-`LoginPage.jsx` שכבר עשה זאת בכוונה) — ולידציית הדפדפן המובנית על `type="email"` הייתה חוסמת/עוקפת את הודעות השגיאה המותאמות-אישית שלנו. נוסף `noValidate` לטופס, אומת שההודעה בעברית שלנו מוצגת עכשיו נכון.
- [ ] **לא בוצע בכוונה:** הוספת שורת משתמש בדיקה אמיתית ל-DB דרך ה-UI (כדי לא לזהם דאטה אמיתי בלי לתאם עם ישי קודם) — הצלחת ה-flow "הוספה תקינה" אומתה רק דרך שלוש בדיקות הכשל (מייל/טלפון/שם), לא דרך insert בפועל.
- [ ] עדכון `docs/PROJECT_MASTER.md` בהזדמנות — עדיין לא מתעד את שכבת ה-Layout/Routing כלל, ועכשיו גם לא את מבנה "ניהול מערכת" החדש.
- [ ] עדכון `docs/CHANGELOG.md` — לא בוצע במסגרת המשימה הזו (קוד עדיין לא committed); לעדכן כשישי מאשר ומחליט על commit.

**אומת ב-preview (dev server, sessions אמיתיים מ-Supabase):** login כמנכ"ל, accordion פתיחה/סגירה+ניווט ל-3 תתי-הנתיבים, טאבים מסונכרנים עם ה-URL, self-lockout על שורת המנכ"ל עצמו, 3 הודעות הולידציה (מייל/טלפון/שם) כל אחת בנפרד, "דיילות" בתפריט נשאר אך מנחית על "גיוס", כיווץ+קליק על "ניהול מערכת" מנווט ישירות בלי flyover, login כ-`logistics.test@regin.co.il` (לא-מנכ"ל) — "ניהול מערכת" נעדר לגמרי מהתפריט וגישה ישירה ב-URL ל-`/system/users` נחסמה עם "אין לך הרשאה לצפות במסך זה.", ומודול רגיל (`/logistics`) ממשיך לעבוד עם ה-`allow` המחודש.

</div>
