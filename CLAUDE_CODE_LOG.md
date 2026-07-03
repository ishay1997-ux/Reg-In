<div dir="rtl">

# CLAUDE_CODE_LOG — יומן עבודה פנימי של Claude Code

> קובץ זה **לא** מיועד לישי לתחזק — הוא ליצירה ועדכון עצמי שלי (Claude Code) בין סשנים, כדי לא לאבד הקשר. ישי יכול לקרוא אבל האחריות על עדכונו שלי. עדכן בסוף כל סשן משמעותי.
> מקורות אמת אחרים שלא כפולים כאן: `docs/PROJECT_MASTER.md` (סכמה/הרשאות/מסכים), `docs/CHANGELOG.md` (יומן DB+קוד לשני המפתחים), `docs/micro_guides/…מודול_1.md` (מתכון צעד-צעד), `docs/REG-IN_מדריך_מאקרו.md` (SSOT תפעולי).

## מדיניות תחזוקה (לקרוא לפני עריכה)
- **"מצב נוכחי"** = snapshot שנכתב-**מחדש** כל פעם לשקף מציאות. לא append, לא נותנים לו להתיישן.
- **"יומן סשנים"** = append-only, תמציתי, הכי-חדש-למעלה. הסשן האחרון-שניים בפירוט סביר; ישן יותר מקוצר ל-1-3 שורות תחת "ארכיון".
- כשהקובץ עובר **~250 שורות** — דוחסים את היומן הישן (לא את החדש).
- סעיפי הרפרנס (tech-debt, DB) חייבים להישאר מעודכנים.

---

## מצב נוכחי (snapshot — 03/07/2026)

**Stack:** React 19 + Vite 8 · JavaScript (לא TS) · Tailwind 4 + shadcn/ui (מעל Radix) · Lucide · Supabase (Auth + Postgres 17 + RLS) · react-router-dom v7 · RTL מלא · alias `@/`→`src/`. **Session ב-`sessionStorage`** (סגירת לשונית/דפדפן = ניתוק; רענון שומר).

**מודול 1 (משתמשים והרשאות) — ✅ ברובו גמור ומאומת, ממתין ל-commit+PR ל-`dev`.**

זרימת RBAC בקוד:
- `contexts/AuthContext.jsx` — מקור אמת יחיד: session→שורת `users`→`{user, permissions}`. **שער ההרשאה המרכזי** כאן: session בלי שורת `users` פעילה → `signOut`+`authError` (מכסה גם חזרת OAuth). חושף `useAuth()`.
- `components/layout/`: `MainLayout` (שער session + חסימת `inactive`) · `Sidebar` (מודולים דינמיים מ-`modules`, `blocked` מוסתר, כפתור כיווץ **בראש+ממורכז**, "מסך הבית" קבוע, "ניהול מערכת" = **קישור שטוח** ל-`/system/users`) · `Topbar` (פרופיל+Logout, חיפוש placeholder) · `ProtectedRoute` (`allow`=מחרוזת|מערך של מודולים/תפקידים).
- `modules/01_auth/`: `LoginPage` (email/password + **Google Sign-In אמיתי** + **נעילת חשבון** 5-כשלונות→15דק') · `SystemManagementPage` (טאבים) · `UsersManagementPage` (CRUD + סטטוס דו-כיווני active/inactive, self-lockout) · `PermissionsMatrixPage` (7 מודולים ב-4 קבוצות, עמודת מנכ"ל נעולה, auto-save).
- `components/ProfileSettingsPage.jsx` (משותף, כל מחובר): פרטים/אבטחה/התראות(מנוטרל). `lib/`: `constants.js` (`CEO_ROLE_NAME`, `SYSTEM_MODULES`), `validators.js`.
- **גישת "ניהול מערכת" = permission-driven** (בדיקת `permissions['ניהול הרשאות'/'הגדרות מערכת']` דרך `SYSTEM_MODULES`), **לא** `role==='מנכ"ל'` קשיח — פתר את ה-split-brain.
- **DB:** RLS על 4 טבלאות ליבה (`roles`/`modules`/`permissions`/`users`) + `current_user_role_id()` (SECURITY DEFINER, מוקשח). `login_attempts` + 3 פונקציות SECURITY DEFINER לנעילה. 11 טבלאות עסקיות = RLS-on-deny-all עד בניית המודול.
- **מודל אבטחה:** CAPTCHA **בוטל** (הוחלף ב-Google Sign-In + נעילה + sessionStorage). מתועד כסטייה מ-5.6.1 בתיעוד החי; `reference_spec` הקפוא לא נגע.

**פתוח במודול 1:** commit+PR ל-`dev` · 12 תרחישי RLS על `customers` (נדחה ל-M2) · backlog נדחה: שינוי-אימייל עצמי, טבלת העדפות, חיפוש Topbar, UI ל-`params` (מודול 9), שדרוג נעילה ל-Auth Hook (דורש תוכנית Team), חשיפת מודולי-אדמין במטריצה, Error Boundary ברמת Router.

**הבא בתור:** מודול 2 (לקוחות, עמית).

---

## יומן סשנים (הכי חדש למעלה)

### 03/07/2026 — סנכרון תיעוד מקיף + מטריצת QA
- סונכרנו כל מסמכי מודול 1 למציאות (מדריך מיקרו: סטטוסי צעדים + DoD + "מה בפועל" ליד כל סטייה, בלי למחוק את המתכון המקורי; מדריך מאקרו §12/§13; PROJECT_MASTER §1). קובץ זה עבר restructure מלא (280→~90 שורות): snapshot שנכתב-מחדש + יומן סשנים append-only + ארכיון מקוצר + מדיניות תחזוקה. אומת: grep על `accordion`/`frozen`/"לוח בקרה" — כולם רק בהקשר היסטורי/מתכון, לא כטענת מצב-נוכחי.
- נוספה **מטריצת כיסוי QA** (9 סוגי בדיקות: unit/integration/E2E/regression/UAT · security/performance/usability/compatibility) למדריך מודול 1 + לטמפלט הסגירה כמבנה קבוע.
- שמות פיקטיביים לתפקידים (בקשת ישי): נועה כהן / מיכל לוי / שירה מזרחי / דנה ברק (מנכ"ל=ישי אטיאס). עדכון DB בלבד.
- **ניסוי propagation חי (באישור מפורש):** CEO משנה הרשאה למנהלת פרויקטים בזמן שהיא מחוברת → ה-session הפתוח **לא מתעדכן** עד רענון/relogin (אין realtime subscription על `permissions`; `AuthContext.loadUser` רק ב-mount/`onAuthStateChange`). שוחזר במדויק לבייסליין.
- **בדיקת UI/UX מקיפה (3 תפקידים):** כל המסכים עברו; ProtectedRoute חוסם URL ישיר; אין שגיאות קונסול. 2 ממצאים תוקנו: (1) `App.jsx:85` `moduleName="גיוס"`→"דיילות" (אי-התאמה מול `allow="דיילות"`); (2) הרמז "לשינוי תפקיד פנה למנכ"ל" ב-ProfileSettings מוסתר כשה-viewer הוא המנכ"ל.
- **לקח classifier:** submit-clicks על טפסים שכותבים ל-DB אמיתי + שינוי RBAC חי נחסמים ע"י ה-auto-mode classifier בלי אישור/הקשר מפורש — גם אם הקוד יחסום ערכים לא-תקינים. לכבד, לא לעקוף.

### 03/07/2026 — סגירת מודול 1: מודל אבטחה חדש + פולואפים
- **CAPTCHA בוטל** (מעולם לא מומש בקוד — עדכון תיעוד בלבד; סטייה מאושרת מ-5.6.1). **Google Sign-In אמיתי** (`signInWithOAuth`) + שער הרשאה שעבר ל-`AuthContext` לכיסוי חזרת OAuth.
- **נעילת חשבון:** ה-Auth Hook נעול ל-Team, לכן חלופת Free — `login_attempts` + 3 פונקציות SECURITY DEFINER (`check`/`register` ל-anon, `reset` ל-authenticated בלבד). נעילה 15דק'. הורץ דרך MCP (2 migrations). אכיפה app/DB — ניתנת לעקיפה בקריאת API ישירה (מקובל למערכת פנימית). נבדק חי: 1-4→null, 5→נעילה.
- **Sidebar:** כפתור כיווץ עבר לראש+ממורכז (grid 3-עמודות מאזן את הלוגו); "ניהול מערכת" מ-accordion ל**קישור שטוח**; ניקוי קוד מת.
- **Topic A permission-driven admin** (`SYSTEM_MODULES` ב-constants, נאכף ב-Sidebar+App.jsx) — פתר split-brain. **Topic B sessionStorage.**
- **Topic D — החלטות Seed של products/params ננעלו** (בראש `products_and_params.md`): enum באנגלית, SKU בלי מקף, שירותים לפי base_price בלי tiers, `שכר_מינימום_שעתי=35` (אין פרמטר "תעריף חיוב"), W3=מהימנות 0.4/0.3/0.3, max_qty=NULL. **ה-Seed עצמו נדחה למודול 3.**
- **Topic E** playbook חירום לשחרור נעילה + טיפ Google-עוקף-נעילה (במדריך צעד 7). **Topic F** (עמית כ-CEO+Google test user) ממתין למייל שלו.
- Workflow: 2 הטמפלטים עודכנו + `docs/WORKFLOW.md` חדש. `index.html` title `reg-in`→`REG-IN`.
- **פרוטוקול port 5173:** orphaned vite process תופס את הפורט בין סשנים; לפני נגיעה בודקים `CommandLine` (`Get-CimInstance`) שזה `vite.js` מהפרויקט, ואז Stop+restart. הפורט קבוע ל-5173 (OAuth redirect מוגדר אליו). מבצע אוטומטית בלי לשאול.

### ארכיון (02/07/2026 ומוקדם — מקוצר)
- **מודול 0** (תשתית: Vite+Tailwind+Supabase+RTL) ✅.
- **מודול 1 גל ראשון:** Seed (5 roles / 9 modules / 45 permissions) · RLS על 4 טבלאות ליבה + `current_user_role_id()` · תשתית ניתוב (AuthContext/MainLayout/Sidebar/Topbar/ProtectedRoute) · LoginPage shadcn+הגנת פרונטנד.
- **מיגרציית soft-delete** `frozen`→`inactive` (סדר נכון: drop→update→add constraint) · **policy `users_update_self`** (מלכודת recursion נתפסה — פתרון `current_user_role_id()` SECURITY DEFINER; מקפיא `role_id`+`status`) · הקשחת `current_user_role_id` (`search_path=''` + הסרת EXECUTE מ-anon).
- **מסך מטריצת הרשאות** (צעד 10): 4 קבוצות-על, עמודת מנכ"ל נעולה, auto-save. **UsersManagement:** מעבר ל-סטטוס דו-כיווני (בלי מסגור "מחיקה"). **ProfileSettings + Topbar** + הגדרות פרופיל.
- **Refactor ניתוב מקונן** (אושר ע"י ישי): בזמנו נבנה עם **accordion** ל"ניהול מערכת" + גישה role-based CEO-קשיחה — **שניהם הוחלפו ב-03/07** (קישור שטוח + permission-driven). "ניהול מערכת" הוגדר כמטריה ניווטית מעל 2 מודולי ה-DB (8,9).
- **ליטוש Context/Hooks** (`useCallback`/`mountedRef`/Guard Clause ל-`useAuth`), הערות עברית why-first, מודול lint-נקי. ניקוי תיעוד (README, `reference_spec/*.md.md`→`.md`+קפוא, יצירת `docs/README.md`, הרחבת מדריך מאקרו ל-SSOT).
- **ביקורת final-test (§ ישן 6):** זוהו 3 חוסמים (users_update_self חסר, CHANGELOG לא עודכן, צעד 12) — **כולם טופלו/נדחו רשמית מאז** (users_update_self הוחל, CHANGELOG עודכן, צעד 12 נדחה ל-M2). האזהרה הישנה "טרם תוקן" כבר לא רלוונטית.
- 5 משתמשי בדיקה אמיתיים (Auth+identities) ל-5 התפקידים; סיסמאות אומתו קריפטוגרפית.

---

## רפרנס: Tech-debt ודגלים פתוחים (מעודכן)

- **RLS חסר על 11 טבלאות** — deny-all עד בניית המודול. כל מי שמתחיל טבלה חדשה יגלה דאטה ריק עד policy.
- **12 תרחישי RLS על `customers`** — נדחה רשמית ל-M2 (RLS-on-בלי-policies כרגע). תרחישי הליבה 5-12 של מודול 1 אומתו חיים.
- **שינוי-אימייל עצמי הושמט בכוונה** — `users.email` = PK + מפתח RLS (`auth.email()`) + FK-target (`projects.owner_email`, בלי cascade). חוסר-סנכרון זמני היה נועל משתמש מכל ה-RLS. למימוש עתידי: `on update cascade` + סנכרון `auth.users.email`↔`public.users.email`.
- **נעילת חשבון ברמת app/DB** (לא Auth Hook) — ניתנת לעקיפה בקריאת API ישירה. שדרוג ל-Hook דורש תוכנית Team.
- **Leaked-Password Protection** כבוי (מודול 10). **חיפוש Topbar** placeholder. **UI ל-`params`** (מודול 9). **Error Boundary** ברמת Router (מודול 3). **מיפוי מודולים לפי מחרוזת עברית** (`MODULE_META`/`GROUPS`) — שם-מודול שישתנה ב-DB ישבור בשקט; להעביר ל-`module_id`/slug כשנוגעים בסכמה.
- **מוסכמה מחייבת:** סטטוס דו-כיווני active/inactive (בלי מסגור "מחיקה") חל גם על `customers` (M2) ו-`hostesses` (M4).
- **דגלים פתוחים מ-PROJECT_MASTER §7:** מע"מ 17/18, `customer_type` enum, ערכי מטריצה מוקאפ מול אפיון, כתובת דיילת, stepper פרויקט.

## רפרנס: יומן DB (מודול 1)

- **פונקציות:** `current_user_role_id()→int` (SECURITY DEFINER, `search_path=''`, מחזיר role_id רק ל-`status='active'`, EXECUTE ל-authenticated בלבד) · `check_login_lock(text)`, `register_failed_login(text)`, `reset_login_attempts()` (נעילה, SECURITY DEFINER, `reset` ל-authenticated בלבד).
- **טבלאות חדשות:** `login_attempts` (email PK, failed_count, locked_until, RLS-on בלי policies — גישה רק דרך הפונקציות).
- **RLS:** `roles`/`modules`/`permissions` SELECT-לכל-authenticated (permissions כתיבה למנכ"ל) · `users` self-או-מנכ"ל + `users_update_self`. **טריגרים:** אין.
- **מיגרציות מרכזיות:** soft-delete (frozen→inactive) · `users_update_self` · `harden_current_user_role_id` · `module1_login_attempts_lockout` · `module1_reset_login_attempts_revoke_anon`.

## רפרנס: טמפלטים ו-hook

`docs/templates/create_micro_guide_template.md` (פתיחת מודול) + `create_module_final_test_template.md` (סגירה) — כוללים היררכיית מקורות-אמת, ציטוט קובץ+שורה, RTL, משמעת Git, מטריצת QA. Stop hook ב-`.claude/settings.local.json` (אישי, לא ב-git) חוסם סיום-תור עד שהיומן הזה מעודכן.

</div>
