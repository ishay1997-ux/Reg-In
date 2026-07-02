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
- `src/components/layout/MainLayout.jsx` — שער-העל: מפנה ל-`/login` אם אין `user`, מציג מסך "לא פעיל" אם `status==='inactive'`, אחרת מרכיב `Sidebar`+`Topbar`+`<Outlet/>`.
- `src/components/layout/Sidebar.jsx` — מתקפל, קבוע מימין (RTL). "לוח בקרה" קבוע לכולם (לא מודול-RBAC). שאר 9 המודולים נשלפים דינמית מטבלת `modules` בפועל (לא hard-coded), ומסוננים: `permission==='blocked'` → מוסתר לגמרי מהתפריט. מיפוי אייקון+נתיב לכל שם-מודול קיים ב-`MODULE_META` (אובייקט קבוע בקוד, במפורש נגד ה-`module_name` האמיתי מה-DB).
- `src/components/layout/ProtectedRoute.jsx` — הגנת נתיב ברמת ה-Route: מקבל `allow` (מחרוזת בודדת או מערך, כל איבר = שם-מודול **או** שם-תפקיד מדויק), חוסם אם אף איבר לא עובר — **גם** גישה ישירה ב-URL, לא רק הסתרה בתפריט.
- `src/components/layout/Topbar.jsx` — חיפוש (placeholder ויזואלי בלבד, מנוטרל, לא מחובר) + תפריט משתמש (שם+תפקיד מ-AuthContext, פריט "הגדרות פרופיל"→`/profile`, Logout אמיתי).
- `src/App.jsx` — עץ ה-Routes: `/login` מחוץ ל-Layout; כל השאר תחת `<Route element={<MainLayout/>}>` — `index`=`WelcomePage`, `profile`=`ProfileSettingsPage` (בלי `ProtectedRoute` - נגיש לכל מחובר), `system` = עץ מקונן CEO-בלבד (`users`→`UsersManagementPage`, `permissions`→`PermissionsMatrixPage`, `params`→`UnderConstruction`, דרך `SystemManagementPage`), ושאר המודולים (`customers`,`quotes`,`projects`,`hostesses`,`logistics`,`finance`,`reports`) כנתיב שטוח כל אחד עם `ProtectedRoute allow="..."` תואם ל-`UnderConstruction`.
- `src/modules/01_auth/PermissionsMatrixPage.jsx` — מטריצת הרשאות (צעד 10 במדריך המיקרו): 7 מודולים עסקיים (**לא** 9 - ראו הסבר למטה) מקובצים ל-4 קבוצות-על ("לקוחות ומכירות","תפעול ופרויקטים","לוגיסטיקה","כספים ודוחות", לפי מבנה המוקאפ) × 5 תפקידים. כל תא לחיץ (מחזוריות `edit→view→blocked`, כתיבה מיידית ל-`permissions`, בלי כפתור שמירה נפרד). עמודת מנכ"ל **נעולה** (`disabled`, תמיד "עריכה") - מניעת self-lockout, אותו עיקרון בדיוק כמו במחיקת משתמש עצמית.
- `src/modules/01_auth/SystemManagementPage.jsx` — מעטפת "ניהול מערכת": שורת טאבים (`NavLink`, לא Radix Tabs - כל טאב Route אמיתי) + `<Outlet/>`.
- `src/modules/01_auth/UsersManagementPage.jsx` — טאב "ניהול משתמשים" בתוך "ניהול מערכת" (לא מסך עצמאי יותר): טבלת עובדים + הוספת משתמש (Dialog+Select מ-shadcn, ולידציות מ-`src/lib/validators.js`) + **מחיקה רכה** (`status='inactive'`, כפתור אדום עם אייקון `Trash2`, `window.confirm` לפני שליחה, שורות `inactive` מסוננות מהתצוגה) עם מניעת self-lockout על השורה של המשתמש המחובר עצמו. גישה נקבעת ע"י ה-Route (`allow={CEO_ROLE_NAME}`) + RLS ב-DB, לא בדיקה עצמאית כפולה בתוך הקומפוננטה.
- `src/components/ProfileSettingsPage.jsx` — עמוד משותף (לא מודול-RBAC, יושב ב-`components/` לא ב-`modules/`), נגיש לכל משתמש מחובר. טאבים מקומיים (state, לא Routes): פרטים אישיים (טלפון ניתן לעריכה, אימייל read-only בכוונה), אבטחה (שינוי סיסמה עם re-authentication), העדפות והתראות (טוגלים מקומיים, לא מחוברים ל-DB עדיין).
- `src/modules/01_auth/LoginPage.jsx` — shadcn (Input/Button), ולידציה מקומית, בדיקת status/role אחרי אימות מוצלח מול Supabase, מנווט ל-`/` (לא `alert` יותר).
- `src/lib/constants.js` (`CEO_ROLE_NAME`), `src/lib/validators.js` (`EMAIL_REGEX`,`ISRAELI_MOBILE_REGEX`,`MIN_PASSWORD_LENGTH`) — קבועים/ולידציות משותפים בין כמה מסכים, כדי לא לשכפל.
- `src/components/ui/switch.jsx` — טוגל (עוטף `Switch` מ-`radix-ui`, אותה תבנית עטיפה כמו `dialog.jsx`/`select.jsx`), RTL-aware (`rtl:` variant על כיוון ה-thumb).
- DB: RLS פעיל בפועל רק על 4 טבלאות (`roles`,`modules`,`permissions`,`users`) דרך `current_user_role_id()` (SECURITY DEFINER, אוכפת גם `status='active'`). **שאר 11 הטבלאות העסקיות חסומות לגמרי** (RLS on, 0 policies) — כל מודול עתידי יגלה דאטה ריק עד שיוסיף policy.
- `users.status` — `'active'`/`'inactive'` בלבד (תואם למוסכמה הקיימת ב-`customers`/`hostesses`). `'frozen'` הוחלף לגמרי; מיגרציית ה-DB רצה בהצלחה (פירוט בסעיף 2.1).

---

## 2. אבני דרך שהושלמו

- מודול 0 (תשתית: Vite+Tailwind+Supabase+RTL).
- מודול 1, צעדים 1,2,4,5,6,8,9 (מתוך 14 במדריך המאוחד): Seed בסיסי (roles/modules/permissions), RLS על 4 טבלאות ליבה + פונקציית עזר מאובטחת, הגנת פרונטנד בהתחברות, שדרוג shadcn למסך ההתחברות, מסך ניהול משתמשים ראשוני.
- תשתית ניתוב כללית **מעבר למה שהמדריך המקורי דרש** (הוספה תוך כדי עבודה, על דעת ישי): `react-router-dom`, `AuthContext` משותף, `MainLayout`+`Sidebar`+`Topbar`+`ProtectedRoute`, `WelcomePage`+`UnderConstruction` placeholders. אומת ידנית מול sessions אמיתיים משלושה תפקידים שונים — סינון RBAC, ניווט, קיפול, וחסימת נתיב ישיר ב-URL כולם עבדו כצפוי. Logout לא אומת ויזואלית עד הסוף (מגבלת כלי-בדיקה מול תפריט Radix, לא חשד לבאג).
- **Refactor "ניהול מערכת" (מפורט בסעיף 3 למטה)** — הושלם ואומת במלואו, ו-**עבר `git commit`** (ענף `ishay/module-1-permissions`, לא נדחף).
- **מודול "הגדרות פרופיל אישי"** (חדש) — עמוד נגיש לכל משתמש מחובר, נפתח מתפריט המשתמש ב-Topbar (לא בסרגל הצד). 3 טאבים מקומיים: פרטים אישיים (טלפון ניתן לעדכון עצמי, כולל ולידציה ורענון `AuthContext` אחרי שמירה), אבטחה (שינוי סיסמה עם re-authentication לפני `updateUser`), העדפות והתראות (2 טוגלים מקומיים בלבד, לא מחוברים ל-DB - כמפורש בדרישה). **הוחלט במפורש לא לכלול עריכה עצמית של אימייל בשלב הזה** (ראו Tech Debt למטה - סיבה טכנית משמעותית, לא שכחה). אומת ב-preview: גישה אוניברסלית (גם תפקיד לא-מנכ"ל), ולידציות טלפון/סיסמה, טוגלים, ושה-Route Guard הקיים (`/system` CEO-only) לא נפגע.
- **ליטוש 1: "הקפא" → "מחק" (Soft Delete)** ב-`UsersManagementPage.jsx` — כפתור אדום עם `Trash2`, `window.confirm` לפני שליחה, שורות `status='inactive'` מסוננות לגמרי מהטבלה (`.filter()`), self-lockout נשמר. עדכון מקביל ב-`LoginPage.jsx`+`MainLayout.jsx` (הבדיקה הקשיחה עברה מ-`'frozen'` ל-`'inactive'`, עם ניסוח הודעה מתאים ל"לא פעיל" ולא "הוקפא זמנית"). מיגרציית ה-DB הנדרשת **רצה בהצלחה ואומתה** (סעיף 2.1) - הפיצ'ר שלם ופעיל.
- **ליטוש 2: נטרול טוגלי התראות** ב-`ProfileSettingsPage.jsx` - שני ה-`Switch` ב"העדפות והתראות" קיבלו `disabled` + תווית `(בקרוב)` ליד כל שם, כדי לא ליצור רושם מטעה שהתכונה כבר פעילה.
- **צעד 10 — מסך מטריצת הרשאות** (`PermissionsMatrixPage.jsx` חדש, ב-`/system/permissions`) — פירוט מלא בסעיף 2.2 למטה.
- **שום דבר מכל זה עדיין לא עבר `git commit`** מעבר למצוין למעלה — כל העבודה מאז ה-refactor הקודם (הגדרות פרופיל, שני הליטושים, מטריצת הרשאות) עדיין לוקאלית, ממתינה לסקירת ישי.

---

## 2.1 ✅ מיגרציית DB ל-"מחק משתמש" — בוצעה (02/07/2026)

**מה קרה בפועל:** ה-harness חסם ריצה אוטומטית פעמיים - קודם דרש אישור נפרד ומפורש (לא רק אישור-תוכנית), ואז הניסיון הראשון עצמו נכשל (`ADD CONSTRAINT` הופעל *לפני* ה-`UPDATE`, כך שהשורה הקיימת `frozen` הפרה את ה-constraint החדש מיד). תוקן לסדר הנכון: **drop → update → add constraint** (לא drop → add → update). ישי אישר את הגרסה המתוקנת במפורש ("מאשר"), ורק אז רצה בהצלחה.

**ה-SQL שבאמת רץ (פרויקט Supabase `yfeovxppnfoafmfbdfvh`):**
```sql
alter table users drop constraint users_status_check;
update users set status = 'inactive' where status = 'frozen';
alter table users add constraint users_status_check check (status in ('active', 'inactive'));
```
**אומת אחרי הריצה:** `pg_get_constraintdef` מראה `CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))`; `finance.test@regin.co.il` עבר בהצלחה מ-`frozen` ל-`inactive` (ולכן נעלם מהטבלה ב-UI, כצפוי).

---

## 2.2 ✅ צעד 10 — מסך מטריצת הרשאות (02/07/2026)

**מבנה:** נבחר (ישי) קיבוץ ל-4 קבוצות-על במקום רשימה שטוחה, לפי מבנה המוקאפ המקורי (`docs/mokap/מסך הרשאות/`). הקבוצות בפועל (עם שמות המודולים האמיתיים שלנו, לא ההמצאות הגרנולריות יותר של המוקאפ): **לקוחות ומכירות** (לקוחות, הצעות מחיר) · **תפעול ופרויקטים** (פרויקטים, דיילות) · **לוגיסטיקה** (לוגיסטיקה - קבוצת שורה יחידה, כמו במוקאפ) · **כספים ודוחות** (כספים, דו"חות).

**שתי החלטות ארכיטקטוניות שלי, לא רק "העתקת מוקאפ" - מתועדות כאן כי משפיעות על מה שהמנכ"ל בפועל יכול לשלוט בו מהמסך הזה:**
1. **"ניהול הרשאות" ו"הגדרות מערכת" (module_id 8,9) לא מופיעות ברשת בכלל.** הגישה אליהן כבר קבועה בקוד כ-CEO-בלבד באופן קשיח (`Sidebar.jsx`/`ProtectedRoute` בודקים `roleName` ישירות, לא דרך `permissions` - ראו סעיף 3 למעלה על "ניהול מערכת"). אילו הרשת הייתה מציגה אותן כניתנות לעריכה, שינוי הערך שלהן ב-DB לא היה משפיע על שום דבר בפועל - מטעה. **הן עדיין קיימות ב-DB** (9 מודולים, 45 שורות `permissions` כרגיל) - רק לא מוצגות במסך הזה.
2. **עמודת "מנכ"ל" נעולה** (`disabled`, מוצגת קבוע כ"עריכה") - מניעת מצב שבו המנכ"ל בטעות חוסם לעצמו מודול, אותו עיקרון-בדיוק כמו מניעת ה-self-lockout במחיקת משתמש ב-`UsersManagementPage.jsx`.

**התנהגות:** כתיבה מיידית לכל קליק (`edit→view→blocked→edit`) ל-`permissions`, בלי כפתור "שמור"/"ביטול" נפרד - תואם למדריך המיקרו ("כפתור לחיץ במחזוריות, כותב ל-permissions") ולשאר האפליקציה. כישלון כתיבה מחזיר את התא לערך הקודם + הודעת שגיאה.

**אומת ב-preview:** login כמנכ"ל → `/system/permissions` מציג 7 מודולים ב-4 קבוצות עם כותרות אפורות, הערכים תואמים במדויק למטריצת `PROJECT_MASTER.md §3`; עמודת מנכ"ל = 7 כפתורים מנוטרלים (נספר בפועל); תא לא-מנכ"ל אינטראקטיבי (`disabled=false`, `onclick` קיים) עם tooltip נכון. **לא נבדק קליק אמיתי** (ה-harness חוסם כתיבת DB חיה בבדיקת UI בלי אישור נפרד, כמו בבדיקות קודמות) - נבדק רק קריאה + אינטראקטיביות; הלוגיקה זהה לחלוטין לתבנית ה-update שכבר אומתה במחיקת משתמש ופרופיל. login כ-`logistics.test` (לא-מנכ"ל) → `/system/permissions` חסום עם "אין לך הרשאה לצפות במסך זה." (רגרסיה על ה-guard תקינה).

**כשישי מאשר במפורש** - להריץ דרך `mcp__...__apply_migration` (יש גישה חיה, פרויקט `yfeovxppnfoafmfbdfvh`), ואז לאמת: `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.users'::regclass and contype='c';` מראה `('active','inactive')`, ו-`select email,status from users;` מראה ש-`finance.test` הפך ל-`inactive` (ואז ייעלם מהטבלה ב-UI - זו בדיוק ההתנהגות הרצויה).

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
- #5 ✅ **הוכרע (02/07/2026):** מבנה 4 קבוצות-על (לא רשימה שטוחה), לפי המוקאפ - מומש ב-`PermissionsMatrixPage.jsx`.
- #6 כתובת דיילת (יש רק `city` בסכמה).
- #7 stepper פרויקט (5 שלבים במוקאפ מול 8 ב-DB).
- #8 CAPTCHA — נדרש באפיון 5.6.1, לא קיים בקוד, לא הוכרע ספק.

**פתוח חדש (מ-"הגדרות פרופיל אישי", 02/07/2026) - שינוי אימייל עצמי:**
`users.email` הוא גם ה-PK, גם מפתח הזיהוי היחיד ש-RLS משווה מולו (`auth.email() = users.email` בכל policy), וגם FK-target אמיתי (`projects.owner_email references users(email)`, **בלי** `on update cascade`). נבדק ואושר עם ישי (02/07/2026) **להשמיט עריכת אימייל עצמית לגמרי בשלב זה** - Supabase דורש אישור-מייל אסינכרוני לשינוי כתובת ב-Auth, וזה לא מסתנכרן אוטומטית עם `public.users.email`; חוסר-סנכרון זמני היה נועל משתמש לגמרי מכל ה-RLS (חמור בהרבה מ-self-lockout של הקפאה). כדי לממש את זה נכון בעתיד צריך: (1) `on update cascade` על `projects.owner_email` (ולבדוק אם יש FKs נוספים דומים על `users.email`), (2) מנגנון סנכרון בין `auth.users.email` ל-`public.users.email` בזמן אישור השינוי (טריגר/Edge Function בצד ה-DB) - דורש גישת MCP חיה ל-Supabase שלא הייתה זמינה בסשן הזה.

**Tech debt קיים:**
- RLS חסר על 11 מהטבלאות (רק roles/modules/permissions/users מוגנות).
- Logout לא אומת ויזואלית סוף-לסוף.
- חיפוש ב-Topbar הוא placeholder בלבד, לא מחובר לנתונים.
- `docs/PROJECT_MASTER.md` לא מתאר בכלל את שכבת ה-Layout/Routing (Sidebar/Topbar/AuthContext/ProtectedRoute) — פער תיעוד ידוע.
- ✅ מסך מטריצת הרשאות (צעד 10 במדריך) — הושלם (02/07/2026), ראו סעיף 2.2 למטה.

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

**TODO "הגדרות פרופיל אישי" — הושלם ואומת (02/07/2026):**
- [x] `src/lib/validators.js` חדש, `UsersManagementPage.jsx` עודכן לייבא ממנו.
- [x] `src/components/ui/switch.jsx` חדש (Radix Switch, RTL-aware) — אומת ויזואלית שהצבע/מיקום ה-thumb נכונים.
- [x] `ProfileSettingsPage.jsx` - 3 טאבים מקומיים, נגיש דרך `/profile` בלי `ProtectedRoute`.
- [x] `Topbar.jsx` - פריט "הגדרות פרופיל" מעל Logout, עם separator משני הצדדים.
- [x] אומת: גישה כ-`logistics.test@regin.co.il` (לא-מנכ"ל) ל-`/profile` עובדת, ולידציות טלפון/סיסמה (regex, אורך מינ', אי-התאמה) מוצגות נכון בלי לגעת ב-DB, טוגלים מגיבים, ו-`/system/users` עדיין חסום לתפקיד הזה (רגרסיה על ה-guard הישן).
- [ ] **לא בוצע בכוונה (נחסם ע"י ה-harness, לא רק שיקול שלי):** ניסיתי לבדוק את שמירת הטלפון בפועל מול Supabase חי ולהחזיר מיד לערך המקורי (כפי שתוכנן), אבל ה-permission classifier של Claude Code חסם את הכתיבה כ"שינוי DB חי בלי אישור מפורש". הקוד לא נבדק end-to-end מול DB אמיתי - רק מול הבדיקה הלוגית (`supabase.from("users").update(...).eq(...)`, אותו pattern בדיוק כמו ב-`UsersManagementPage.handleToggleStatus` שכבר אומת בעבר). **אם ישי רוצה בדיקה חיה מלאה - צריך אישור מפורש שלו קודם, לא רק תוכנית מאושרת מראש.**
- [ ] לא נבדק שינוי סיסמה אמיתי מול Auth חי (סיכון לנעילת חשבון בדיקה) - רק הולידציות המקומיות (אורך, התאמה).

</div>
