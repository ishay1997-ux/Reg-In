<div dir="rtl">

# CLAUDE_CODE_LOG — יומן עבודה פנימי של Claude Code

> קובץ זה **לא** מיועד לישי לתחזק — הוא ליצירה ועדכון עצמי שלי (Claude Code) בין סשנים, כדי לא לאבד הקשר. ישי יכול לקרוא אבל האחריות על עדכונו שלי. עדכן בסוף כל סשן משמעותי.
> מקורות אמת אחרים שלא כפולים כאן: `docs/PROJECT_MASTER.md` (סכמה/הרשאות/מסכים + §7 שאלות פתוחות), `docs/CHANGELOG.md` (יומן DB+קוד לשני המפתחים), `docs/micro_guides/module-1.md` (מתכון צעד-צעד), `../CLAUDE.md` (כללי ברזל), `../STATUS.md` (לוח מצב מודולים), `docs/guides/00_roadmap.md` (מפת הדרכים התפעולית — מחליף את `macro-guide.md`/`WORKFLOW.md` הישנים, שמוזגו לכאן ולערכת ה-guides).

## מדיניות תחזוקה (לקרוא לפני עריכה)
- **"מצב נוכחי"** = snapshot שנכתב-**מחדש** כל פעם לשקף מציאות. לא append, לא נותנים לו להתיישן.
- **"יומן סשנים"** = append-only, תמציתי, הכי-חדש-למעלה. הסשן האחרון-שניים בפירוט סביר; ישן יותר מקוצר ל-1-3 שורות תחת "ארכיון".
- כשהקובץ עובר **~250 שורות** — דוחסים את היומן הישן (לא את החדש).
- סעיפי הרפרנס (tech-debt, DB) חייבים להישאר מעודכנים.

---

## מצב נוכחי (snapshot — 04/07/2026)

**Stack:** React 19 + Vite 8 · JavaScript (לא TS) · Tailwind 4 + shadcn/ui (מעל Radix) · Lucide · Supabase (Auth + Postgres 17 + RLS) · react-router-dom v7 · RTL מלא · alias `@/`→`src/`. **Session ב-`sessionStorage`** (סגירת לשונית/דפדפן = ניתוק; רענון שומר).

**תשתית הנדסית (ספרינט הקשחה 04/07) — ✅ קיימת:** שער-איכות `npm run verify` (lint+format:check+test+build); **Prettier** (single-quote/no-semi) + **ESLint נקי** (overrides ל-shadcn/config); **Husky pre-commit**→lint-staged; **Vitest** — 16 בדיקות ב-3 קבצים (`validators.test`, `permissions.test`, `ProtectedRoute.test`); `isAllowed()` חולץ ל-`src/lib/permissions.js`; **CI** `.github/workflows/ci.yml` (lint+test+build+gitleaks על PR); **מיגרציות מגורסנות** ב-`supabase/migrations/` (baseline + 6 מיגרציות שנמשכו מה-remote) — `docs/schema.sql` = snapshot לקריאה; **Vercel מוכן-לא-מופעל** (`vercel.json`+`.env.example`). הסטנדרט המלא: `docs/architecture_and_qa_roadmap.md`.

**תיעוד — שמות קבצים ורוטינות (04/07, המשך):** כל שמות-הקבצים העבריים המובילים תחת `docs/` הוחלפו לשמות אנגליים (תוכן RTL לא נגע): `macro-guide.md`, `amit-onboarding.md`, `micro_guides/module-1.md`. `docs/mokap/` → `docs/mockups/` עם 11 תת-תיקיות באנגלית (`customers-screen`, `quote-screen` וכו') ו-44 התמונות ממוספרות `01.png..NN.png` לפי סדר ההופעה ב-`mockup_descriptions.md`. כל ההפניות תוקנו (`README.md`, `PROJECT_MASTER.md`, `amit-onboarding.md`, כאן).

**4 רוטינות ידניות** (scheduled-tasks, Manual only, כולן `enabled`, כל אחת עם כותרת "🕐 מתי להפעיל"):
- `regin-docs-sync` — סנכרון תיעוד/בין-קבצי, auto-fix.
- `regin-health-pulse` — lint/outdated/audit/Supabase-advisors/git-status, read-only, שורת יומן אחת.
- `regin-pr-gate` — מריצה `npm run verify`; **אם ירוק על ענף פיצ'ר אישי → commit+push אוטומטי** (בדיקת-ענף מוחלטת: לעולם לא על `main`/`master`/`dev`, לעולם לא `--force`; אם ה-push נדחה — עוצרת ומדווחת, לא מנסה לפתור). אם אדום — אבחון עברי, לא מתקנת קוד.
- `regin-e2e-check` (חדש) — מריצה `npm run test:e2e` (Playwright אמיתי, זרימות מודול 1 בלבד) ומדווחת סיכום עברי.

**E2E (Playwright) — הוקדם ממודול 12, מותקן עכשיו לזרימות מודול 1 בלבד** (Auth/RBAC — המשטח הכי קריטי-אבטחתית): `@playwright/test` + Chromium בלבד, `playwright.config.js` (workers=1 בכוונה — DB-בדיקה משותף + Auth אמיתי, מקביליות גרמה ל-timeout מקרי בבדיקה הראשונה). `e2e/auth.spec.js` + `e2e/permissions.spec.js`, 6 בדיקות, כולן ירוקות. פרטי-בדיקה (`E2E_CEO_*`/`E2E_STAFF_*`) ב-`.env.local` בלבד (לא ב-git), נקראים דרך `process.env` — לא סוד חדש בקוד-מגורסן. **לא** נוסף ל-CI/ל-`verify` (E2E איטי במכוון, נשאר רוטינה נפרדת). `docs/architecture_and_qa_roadmap.md` עודכן (חלק 0 + חלק F.1 חדש לרוטינות).

**מודול 1 (משתמשים והרשאות) — ✅ ברובו גמור ומאומת, קוד כבר committed (`011e588`), ממתין ל-PR+merge ל-`dev`.**

זרימת RBAC בקוד:
- `contexts/AuthContext.jsx` — מקור אמת יחיד: session→שורת `users`→`{user, permissions}`. **שער ההרשאה המרכזי** כאן: session בלי שורת `users` פעילה → `signOut`+`authError` (מכסה גם חזרת OAuth). חושף `useAuth()`.
- `components/layout/`: `MainLayout` (שער session + חסימת `inactive`) · `Sidebar` (מודולים דינמיים מ-`modules`, `blocked` מוסתר, כפתור כיווץ **בראש+ממורכז**, "מסך הבית" קבוע, "ניהול מערכת" = **קישור שטוח** ל-`/system/users`) · `Topbar` (פרופיל+Logout, חיפוש placeholder) · `ProtectedRoute` (`allow`=מחרוזת|מערך של מודולים/תפקידים).
- `modules/01_auth/`: `LoginPage` (email/password + **Google Sign-In אמיתי** + **נעילת חשבון** 5-כשלונות→15דק') · `SystemManagementPage` (טאבים) · `UsersManagementPage` (CRUD + סטטוס דו-כיווני active/inactive, self-lockout) · `PermissionsMatrixPage` (7 מודולים ב-4 קבוצות, עמודת מנכ"ל נעולה, auto-save).
- `components/ProfileSettingsPage.jsx` (משותף, כל מחובר): פרטים/אבטחה/התראות(מנוטרל). `lib/`: `constants.js` (`CEO_ROLE_NAME`, `SYSTEM_MODULES`), `validators.js`.
- **גישת "ניהול מערכת" = permission-driven** (בדיקת `permissions['ניהול הרשאות'/'הגדרות מערכת']` דרך `SYSTEM_MODULES`), **לא** `role==='מנכ"ל'` קשיח — פתר את ה-split-brain.
- **DB:** RLS על 4 טבלאות ליבה (`roles`/`modules`/`permissions`/`users`) + `current_user_role_id()` (SECURITY DEFINER, מוקשח). `login_attempts` + 3 פונקציות SECURITY DEFINER לנעילה. 11 טבלאות עסקיות = RLS-on-deny-all עד בניית המודול.
- **מודל אבטחה:** CAPTCHA **בוטל** (הוחלף ב-Google Sign-In + נעילה + sessionStorage). מתועד כסטייה מ-5.6.1 בתיעוד החי; `reference_spec` הקפוא לא נגע.

**פתוח במודול 1:** PR+merge ל-`dev` (הקוד כבר committed) · 12 תרחישי RLS על `customers` (נדחה ל-M2) · backlog נדחה: שינוי-אימייל עצמי, טבלת העדפות, חיפוש Topbar, UI ל-`params` (מודול 9), שדרוג נעילה ל-Auth Hook (דורש תוכנית Team), חשיפת מודולי-אדמין במטריצה, Error Boundary ברמת Router.

**הבא בתור:** מודול 2 (לקוחות, עמית).

---

## יומן סשנים (הכי חדש למעלה)

### 📝 סשן 05/07/2026 — "ניקוי תיעוד + פרוטוקול עדכון schema" (GitHub Copilot)
**זמן:** ~45 דק'. **ענף:** `ishay/module-1-permissions`. **סוג:** תיעוד + meta (פרוטוקול).

**משימות שהושלמו:**

1. **ניקוי תיעוד (35-40% כפילות בוטלה)**
   - ✅ **Delete `docs/amit-onboarding.md`** — 80% כפול של `macro-guide.md` סעיף 7 (Git workflow). קובץ משנמחק לחלוטין.
   - ✅ **Move `CLAUDE_CODE_LOG.md` ל-`docs/`** — מ-root ל-`docs/CLAUDE_CODE_LOG.md` (ארגון ברור), עם קובץ **redirect בשורש** שמסביר ההעברה (ללא symlink, דורש Admin).
   - ✅ **Crosstalk hints** — הוספת הפניות הדדיות ל:
     - `README.md` — דלוג מ-amit-onboarding להפנות ל-`macro-guide.md` סעיף 7 בישירות.
     - `PROJECT_MASTER.md` — עדכון היררכיית מקורות אמת, הפניה ישירה ל-`docs/schema.sql` + `supabase/migrations/`.
     - `CHANGELOG.md` — header חדש מסביר חלוקת אחריות: יומן DB+קוד משותף לשני המפתחים, יומן סטטוס עמוק של Claude בקובץ זה.
   - ✅ **SQL refactoring** — PROJECT_MASTER.md הוא **ספציפיקציה בלבד**, לא storage ל-DDL חי. הצביע ל-`schema.sql` כ"מקור האמת ההנדסי", ל-`migrations/` כ"היסטוריה של שינויים חיים".
   - **Git commits:** `2e1fedf` ("docs: clean up documentation duplication + reorganize").

2. **פרוטוקול עדכון schema.sql → macro-guide.md (סעיף 12.1 חדש)**
   - ✅ סעיף **"עדכון `docs/schema.sql` — חלק מ-Definition of Done"**: 
     - שלבים ברורים: הרץ migration → דלוג מ-Supabase SQL Editor → עדכן ידנית → commit ביחד.
     - דרך מהירה: **Supabase Studio → SQL → Snapshots → Generate Schema SQL** → copy ל-`docs/schema.sql`.
     - **חובה ב-DoD (סעיף 6):** מודول לא approved בלי schema.sql מעודכן.
   - **Git commit:** `a4e5d1d` ("docs: add DB schema snapshot protocol to Definition of Done").

**המלצות שעדיין **פתוחות** (לא בוצעו בסשן זה — ממתינות לאישור/עדיפות):**
1. 🔴 **קריטי — RLS placeholder ל-11 טבלאות** (`customers`, `products`, `price_tiers`, `params`, `quotes`, `quote_services`, `projects`, `hostesses`, `salary_reports`, `assignments`, `logistics`): **בוטל RLS=on ללא policies** = deny-all כוונתי עד בנייתם. **דורש:** אחד-שורה SELECT policy על כל אחת = הרשה על-תנאי כלשהו (למשל: `WHERE auth.email() IN (SELECT owner_email FROM auth.users)` — ביומנקס לוגיקה משטח כך שרלס על כולם פותחת). **זה חסום** module 2 (לקוחות, עמית) מלהתחיל ברשמה. **זמן משוער:** ~15 דק' SQL + 30 דק' בדיקה. **עדיפות:** **HIGH** — דורש ביצוע לפני סוף היום (M2 backlog).
2. 🟡 **גבוה — Seed data decisions** (ל-מודול 3, products/customers/params enums): Enum לקוח (סוגי לקוח — בחברה פרטית/ממשלה/חברת הפקה/nonprofit), SKU format, שדה כתובת ב-hostesses (כעת רק `city`), משקולות Smart Match (W1/W2/W3), ערכי מע"מ/יחס. **זמן משוער:** 30 דק' קול עם ישי + עמית ל-הכרעה קטגורית. **עדיפות:** MEDIUM — לפני M2-M3 boundary (שבוע).
3. 🟢 **בינוני — Module 1 PR + merge ל-dev:** קוד כבר committed (`011e588`), ממתין ליצירת PR ב-GitHub (ישי) + אישור (עמית). **זמן משוער:** 10 דק'. **עדיפות:** MEDIUM — לאחר ניקוי תיעוד בוצע, כדי ש-PR description יכול להצביע על תיעוד עדכן.

**Tech-debt נוסף (הערה הערה):** Validation ב-`users` form (טלפון בפורמט בעברית), Error Boundary (Router level לא קיים), מאגר לקוחות: `customer_type` enum = unclear mapping (ראו סעיף 7 פריט 3 ב-PROJECT_MASTER).

---

### 04/07/2026 — כותרות-הפעלה, auto-commit+push, ורוטינת E2E אמיתית (**בוצע**)
- ישי ביקש 3 שיפורים לרוטינות: (1) כותרת "מתי להפעיל" בכל אחת, (2) `regin-pr-gate` תבצע commit+push אוטומטי כש-verify ירוק **בלי לשאול**, (3) רוטינת UI/UX/E2E חדשה. שאלתי 2 שאלות הבהרה (plan mode): גבולות ה-auto-push (בחר: רק ענף נוכחי, לעולם לא main/dev) והיקף ה-E2E (בחר: Playwright אמיתי עכשיו, לא לחכות למודול 12).
- **כותרות:** נוספה שורת "🕐 מתי להפעיל" בראש כל אחת מ-4 הרוטינות.
- **`regin-pr-gate` — auto-commit+push:** נבנה עם שער-בטיחות מוחלט: `git branch --show-current` נבדק לפני כל commit — אם `main`/`master`/`dev` → עוצרת ומדווחת, אפס commit. אחרת: `git add -A` → הודעת commit אמיתית (מבוססת `git diff --stat`, לא גנרית) עם תיוג `🤖 Auto-committed by regin-pr-gate (verify green)` → `git push` רגיל (לעולם לא `--force`; push שנדחה = עצירה+דיווח, לא ניסיון-פתרון-עצמי). PR נשאר תמיד ידני.
- **E2E (Playwright), הוקדם ממודול 12 במכוון:** `npm install -D @playwright/test` + `npx playwright install chromium` (רק כרום). `playwright.config.js` + `e2e/auth.spec.js` + `e2e/permissions.spec.js` לזרימות מודול 1 (login/RTL, ניתוב-להתחברות בלי session, סיסמה-שגויה-פעם-אחת [כדי לא לנעול חשבון אמיתי בטעות], הרשאת-CEO מול לוגיסטיקה על `/system/permissions`).
- **באגים אמיתיים שנתפסו תוך כדי כתיבת ה-specs (בדיוק הערך של E2E):**
  1. `getByRole('button', { name: 'התחברות' })` תפס גם את כפתור "התחברות עם Google" (substring match) → תוקן ל-`exact: true`.
  2. הנחתי ש-`dir="rtl"` על `<html>` — בפועל `index.html` הוא `<html lang="en">` בלי `dir` בכלל; ה-RTL מוחל רק per-page על `<div dir="rtl">` (למשל ב-`LoginPage.jsx`). תיקנתי את הבדיקה לבדוק את ה-div בפועל ולא לנחש; **לא תיקנתי את `index.html` עצמו** — מחוץ להיקף המשימה, אבל ⚠️ שווה לב: הוספת `lang="he" dir="rtl"` ל-`<html>` תשפר נגישות/RTL-נכונות גלובלית (autofill, כיווני-דיאלוג של הדפדפן) ולא רק פר-קומפוננטה.
  3. ריצה ראשונה עם 2 workers מקבילים נכשלה ב-timeout על התחברות (Supabase אמיתי, לא מדומה) — DB-בדיקה משותף + זרימות-רשת מקבילות לא מתאימות; תוקן ל-`workers: 1` + `expect.timeout: 10s`. 6/6 ירוקות אחרי כל התיקונים.
  4. **גילוי אגבי (לא טופל):** `docs/mockups/mockup_descriptions.md` (מהסשן הקודם) מתברר כמסמך שונה ומוקדם מ-`PROJECT_MASTER.md` למרות כותרת H1 זהה — כפילות-תוכן פוטנציאלית, מוזכר כאן כי עלה שוב תוך כדי קריאת קבצי מודול 1.
  5. **תיקון נדרש ב-`vite.config.js`:** אחרי הוספת `e2e/*.spec.js`, `npm run verify` נשבר כי Vitest ניסה להריץ גם אותם (glob חופף ל-`*.spec.js` של Vitest) — נוסף `test.exclude: ['node_modules/**', 'e2e/**']`. `npm run verify` חזר ירוק (16 בדיקות Vitest, לא כולל e2e).
- **פרטי-בדיקה ל-E2E:** `E2E_CEO_EMAIL/PASSWORD`, `E2E_STAFF_EMAIL/PASSWORD` נוספו ל-`.env.local` בלבד (לא ב-git); `.env.example` מקבל placeholders. `playwright.config.js` טוען `.env.local` ידנית (בלי תלות `dotenv` חדשה) כי Vite עושה זאת אוטומטית לאפליקציה אבל Playwright/Node לא.
- **תיעוד:** `docs/architecture_and_qa_roadmap.md` — חלק 0 עודכן (E2E = 🟡 פרוסה ראשונה, לא ⬜), נוסף חלק F.1 חדש שמתעד את 4 הרוטינות (לא היו מתועדות שם בכלל עד עכשיו — פער שסגרתי).
- **מצב סיום התור:** `npm run verify` ירוק, `npm run test:e2e` ירוק (6/6). `list_scheduled_tasks` מציג 4 רוטינות, כולן Manual only + enabled. לא בוצע commit/push על השינויים האלה עצמם (אין עדיין הפעלה של `regin-pr-gate` בפועל על ה-diff הזה).

### 04/07/2026 — פיצול רוטינות + סידור שמות-קבצים בתיעוד (**בוצע**)
- ישי ראה את מסך ניהול המשימות המתוזמנות (screenshot של `regin-docs-sync`) ושאל: (1) האם לפצל את הרוטינה לכמה רוטינות ממוקדות עם הסבר ברור לכל אחת, (2) האם לסדר קבצים לתיקיות ולשנות שמות עבריים לאנגליים. ישי בחר: **3 רוטינות**, וטווח שינוי-שמות **מלא** (כולל `mokap` והתמונות).
- **לפני שהתחלתי:** אימות read-only שעדכון 5 החבילות מהסשן הקודם (`@supabase/supabase-js`, `lucide-react`, `radix-ui`, `shadcn`, `vite`) לא עשה שטויות — `git diff` על `package.json` + גרסאות מיושבות ב-`package-lock.json` הראו שהכל בתוך טווח ה-semver הקיים, אין שדרוג מייג'ור. תקין.
- **שינוי שמות-קבצים (בוצע, תוכן RTL לא נגע — רק שמות):**
  - `docs/REG-IN_מדריך_מאקרו.md`→`macro-guide.md`, `REG-IN_מדריך_לעמית_מאוחד.md`→`amit-onboarding.md`, `micro_guides/REG-IN_מדריך_מיקרו_מודול_1.md`→`module-1.md` — כולם דרך `git mv` (שומר היסטוריה).
  - `docs/mokap/`→`docs/mockups/`: **נכשל בהתחלה** (`git mv` על התיקייה כולה קיבל "Permission denied" — כנראה handle נעול על קובץ בתוכה); פתרון: `mkdir docs/mockups` + `git mv` לכל תת-תיקייה/קובץ בנפרד (עבד). 11 תת-תיקיות עבריות → שמות אנגליים לפי מודול (`customers-screen`, `quote-screen`, `hostesses-screen` וכו'), ו-44 קובצי `צילום מסך <תאריך-שעה>.png` → ממוספרים `01.png..NN.png` (סדר לפי הופעה ב-`mockup_descriptions.md`, לא כרונולוגי גרידא — כדי שהמספור יתאים לסדר הקריאה בתיאורים).
  - **גילוי אגבי:** `docs/mockups/mockup_descriptions.md` נושא את אותה כותרת H1 כמו `PROJECT_MASTER.md` ("מסמך אב מרכזי") אך הוא קובץ שונה ומוקדם יותר — כנראה הגרסה המקורית שממנה סונתז PROJECT_MASTER. לא טופל (מחוץ להיקף — רק שמות-קבצים), אבל שווה לב שיש כפילות תוכן פוטנציאלית בין השניים.
  - כל ההפניות תוקנו: `README.md`, `PROJECT_MASTER.md` (18 מקומות), `amit-onboarding.md`, `mockup_descriptions.md` עצמו, כאן. גרפ סופי גורף על כל ה-repo אחרי התיקונים = **0 הפניות שבורות** (חוץ מ-`docs/reference_spec/C5_...md` — מוזכר כטקסט-פרוזה בלבד, לא לינק, קפוא במכוון; ומ-`micro_guides/module-1.md` שורה 10 — הערה היסטורית לגיטימית על קובץ-קודם-בשם-דומה שכבר נמחק, לא לינק פעיל).
  - `npm run verify` ירוק אחרי כל השינויים (16 בדיקות, build תקין) — כצפוי, `src/` לא נוגע בשינויי תיעוד.
- **3 רוטינות (scheduled-tasks, Manual only, כולן `enabled`):**
  1. `regin-docs-sync` — צומצם: הוסר ממנו סעיף ה-"system pulse" (עבר ל-#2), עודכנו נתיבי הקבצים לשמות החדשים, נוסף לקריאה `architecture_and_qa_roadmap.md`.
  2. `regin-health-pulse` (חדש) — read-only בלבד: lint/npm outdated/npm audit/Supabase advisors/git status, שורת יומן אחת בלבד, לא נוגע בשום badge/snapshot אחר.
  3. `regin-pr-gate` (חדש) — מריץ `npm run verify` ומאבחן כשל בעברית (איזה שלב, איזה קובץ, השערת-סיבה) לפני פתיחת PR; **לעולם לא מתקן קוד לבד** — התוספת היא הפרשנות, לא ההרצה.
- **מצב סיום התור:** `docs/CHANGELOG.md` עודכן עם שורת ⚠️ ייעודית לעמית (שמות-קבצים השתנו, לעדכן bookmarks אם יש). **פתוח:** ה-baseline המקומי-בלבד של המיגרציות (מהספרינט הקודם) עדיין לא מסונכרן ל-remote דרך `supabase migration repair` — ממתין לחיבור CLI. הפעלת Vercel בפועל — ידני. לא בוצע commit — הכל בעץ העבודה יחד עם שאר השינויים הלא-committed.

### 04/07/2026 — עדכון 5 החבילות שזוהו כ"בפיגור מינורי" ברוטינת הסנכרון
- עודכנו בהצלחה 5 החבילות שדווחו קודם ב-`npm outdated` (רוטינת סנכרון תיעוד): `@supabase/supabase-js` (2.108.2→2.110.0), `lucide-react` (1.22.0→1.23.0), `radix-ui` (1.6.0→1.6.1), `shadcn` (4.12.0→4.13.0), `vite` (8.1.0→8.1.3). כל העדכונים בתוך טווח ה-semver הקיים ב-`package.json` (`npm update <pkg>` בלי `--save`) — רק `package-lock.json` השתנה בפועל. `npm outdated` אחרי העדכון חוזר ריק לגמרי.
- **⚠️ תקלת סביבה שהתגלתה תוך כדי (חשוב לסשנים הבאים):** ריצת `npm update` הראשונה נתקעה **17 דקות** בלי שום פלט. אבחון: `node -e "require('https').get('https://registry.npmjs.org/...')"` זרק `unable to verify the first certificate` — כשל אימות TLS מול ה-registry (כנראה proxy/AV מקומי שמזריק שורש-CA שחנות ה-CA המובנית של Node לא מכירה). **פתרון שאומת עובד:** `NODE_OPTIONS="--use-system-ca"` לפני כל פקודת npm שנוגעת ברשת (`install`/`update`/`outdated`) — עם ה-flag הבקשה ל-registry חזרה מיידית (200), והעדכון עצמו רץ תוך ~2 דקות. **לא חסימה מוחלטת:** התהליך התקוע (בלי ה-flag) בסופו של דבר **כן הצליח לבד** אחרי 17 דקות (2 חבילות בלבד) לפני שנעצר ידנית והוחלף — כלומר כשל-חוזר-איטי-מאוד, לא hang נצחי. **מומלץ לישי:** לקבוע `NODE_OPTIONS=--use-system-ca` כברירת מחדל בסביבה (למשל env קבוע), אחרת כל פקודת npm-רשת עתידית עלולה להיתקע ארוך.
- `npm run build` אומת ירוק אחרי העדכון (vite 8.1.3, ~720ms, ללא שגיאות — רק אזהרת chunk-size רגילה שכבר הייתה קיימת קודם, לא קשורה לעדכון).
- לא בוצע commit על השינוי הזה — `package.json`/`package-lock.json` נשארו ב-working tree, יחד עם שאר השינויים הלא-committed של ספרינט ההקשחה (רשומה הבאה).

### 04/07/2026 — ספרינט הקשחה: תשתית בדיקות + CI + מיגרציות (**בוצע**)
- ישי קרא מאמר ארכיטקטוני (walking skeleton, contracts, CI/CD, 9 סוגי בדיקות) וביקש התייעצות + יישום. אבחון: היסודות (מודול 1) חזקים; חסרה **כל שכבת האוטומציה/בדיקות**. הוחלט על ספרינט הקשחה מלא לפני שמודול 2 מתפצל. ישי ביקש מוכנות מלאה + המלצות על סדר התיעוד.
- **בוצע (verify ירוק מקצה-לקצה):**
  - **Part A** — תוקנו 8 שגיאות lint (overrides ל-`src/components/ui/**` + `*.config.js` node globals, לא נגעתי בקוד shadcn); Prettier (עוצבו 24 קבצים, `docs`/`*.md` מוחרגים); Husky pre-commit→lint-staged; סקריפט `verify`.
  - **Part B** — Vitest+jsdom+testing-library; `isAllowed()` חולץ מ-`ProtectedRoute.jsx` ל-`src/lib/permissions.js` (הרכיב עכשיו מייבא אותה); 16 בדיקות (validators/permissions/ProtectedRoute).
  - **Part C** — `.github/workflows/ci.yml` (2 jobs: quality-gate + gitleaks); `vercel.json` (SPA rewrite קריטי ל-react-router); `.env.example`. **`.env.local` אומת שאינו tracked** (מכוסה ב-`*.local`) — הסוד בטוח, בניגוד לחשד ראשוני.
  - **Part D** — ⚠️ גילוי חשוב: ל-remote **כבר** יש 6 מיגרציות רשומות (דרך MCP `apply_migration`) שלא היו ב-git. נמשך ה-SQL האמיתי שלהן מ-`supabase_migrations.schema_migrations` ונכתב verbatim ל-`supabase/migrations/`, + `20260629000000_baseline_schema.sql` (מצב לפני-המעקב, עם `frozen` שהוסר במיגרציה הראשונה). baseline→6 משחזר את המצב הנוכחי. `supabase/README.md` מתעד את רוטינת השינוי + `migration repair`.
  - **Part E+F** — התברר שהתיעוד כבר מסודר (index, כותרות-מטרה ב-CHANGELOG+CLAUDE_CODE_LOG, גבולות ברורים) → **לא אוחד כלום, לא בוצע reorg** (המלצה מפורשת). `architecture_and_qa_roadmap.md` שוכתב מ"מאמר כללי" ל**סטנדרט אקציוני** (חלק 0: מצב יישום + DoD + רוטינות). נוספו שורות ל-`docs/README.md`.
- **פתוח:** ה-baseline מקומי-בלבד — סנכרון להיסטוריית remote דרך `supabase migration repair --status applied 20260629000000` (צעד ידני, דורש CLI linked). הפעלת Vercel בפועל (חיבור repo + env vars) = ידני. E2E/Load/UAT נשארו למודול 12 במכוון.
- **מצב סיום התור:** `npm run verify` ירוק (lint 0 · 16 בדיקות · build תקין). סונכרנו `docs/CHANGELOG.md` (שורת "עדכוני קוד" חדשה, בלי שורת-DB כי לא היה שינוי סכימה), `docs/README.md` (index) ו-`docs/architecture_and_qa_roadmap.md`. **לא בוצע commit/PR** — הכל בעץ העבודה, ממתין להחלטת ישי (הענף: `ishay/module-1-permissions`).

### 04/07/2026 — בקשת רוטינת בדיקות (Unit/Integration) — **לא בוצעה בפועל**, סיכום שיחה
- ישי ביקש רוטינה **ידנית (ad-hoc, בלי cron)** להרצת Unit+Integration tests. **חסם אמיתי שהוצג לו:** בפרויקט אין שום תשתית בדיקות (אין Vitest/Jest, אין קובץ `*.test.*` אחד) — אומת שוב עכשיו (`grep` על package.json + חיפוש קבצים, שניהם ריקים). ישי הכריע במפורש: **לבנות תשתית אמיתית** ("תכתוב את כל הבדיקות הנדרשות... סומך עליך שלא תפספס כלום") ורק אז ליצור את המשימה כ-ad-hoc.
- **⚠️ שום דבר מזה לא בוצע.** בין ההחלטה לביצוע הגיעו כמה הודעות חוזרות ("שנה לידנית") תוך כדי החלפות `/model` מהירות ברצף — נראה שההודעות "התנגשו" ולא בוצעה שום פעולה. אומת עכשיו: `list_scheduled_tasks` מחזיר **רק** `regin-docs-sync`, אין `vitest` ב-`package.json`, אין קובצי בדיקה.
- **המשימה המדויקת לסשן הבא:** להתקין Vitest + לכתוב בדיקות יחידה אמיתיות ל-`src/lib/validators.js` (regex טלפון/מייל, אורך סיסמה) + לפחות בדיקת אינטגרציה אחת (למשל שמירת טלפון בפרופיל מול Supabase) + `npm test` ב-`package.json`, **ואז** ליצור משימה מתוזמנת **ad-hoc** (בלי `cronExpression`) שמריצה אותם, מופעלת רק ב-"Run now".
- **⚠️ ממצאים נוספים תוך כדי אימות המצב, לא לפספס בסשן הבא:**
  1. **Git לא נקי** — למרות שישי אמר שביצע commit+push, `git log` מראה שעדיין `011e588` הוא האחרון (אין commit חדש), ו-`git status` מראה שינויים לא-committed ב-4 מסמכי תיעוד (מהרוטינה + מהסשן). **לבדוק עם ישי** אם התכוון ל-`011e588` הישן או שהוא צריך לבצע commit אמיתי לשינויים החדשים.
  2. **קובץ חדש לא-מוכר:** `docs/architecture_and_qa_roadmap.md` — ארכיון של המאמר הארכיטקטוני שישי הדביק בשיחה (walking skeleton, contracts, CI/CD, טקסונומיית 9-בדיקות). **לא נוצר על ידי** — כנראה ישי שמר אותו כרפרנס. לא נגעתי בו.
- נמסר לישי סיכום-שיחה מאוחד ומעודכן (מחליף סיכומים קודמים) שממליץ להתחיל ממנו בשיחה הבאה, עם דגש על "מצב נוכחי" שכבר מדויק ב-CLAUDE_CODE_LOG — אין צורך לשחזר את כל היסטוריית מודול 1 מחדש.

### 04/07/2026 — הקמת רוטינת הסנכרון האוטומטית (השיחה שיצרה את הרשומה הבאה)
- נוצרה משימה מתוזמנת **`regin-docs-sync`** דרך מנגנון `scheduled-tasks` המקומי של Claude Code (**לא** `CronCreate` — לזה תפוגה של 7 ימים, לא מתאים לריצה מתמשכת). קרון `53 6 */3 * *` (כל 3 ימים, 06:53 מקומי). **⚠️ מגבלה:** רצה רק כשהאפליקציה פתוחה; אם סגורה בזמן הריצה — רצה ב-launch הבא, לא נעלמת (לא מנגנון ענן חסין-סגירה כמו שהנחתי בהתחלה — תוקן לישי במפורש).
- **היקף:** קריאת קוד/DB/git → תיקון סטיות בתיעוד + בדיקת התאמה **בין הקבצים עצמם** → auto-edit בתיעוד בלבד → "System pulse" קריאה-בלבד (lint/outdated/audit/Supabase advisors/git-status) → רשומת יומן. **גבולות קשיחים:** לעולם לא `src/`/`schema.sql`/`reference_spec/*`, לעולם לא commit/push/DB-write. עודכנה פעם אחת אחרי האישור הראשוני להוסיף ל-Pulse: `npm audit` (חולשות ידועות, שונה מ-`npm outdated`) + Supabase security/performance advisors (בדיוק סוג הבעיה שתפסתי ידנית פעם קודמת - הרשאת anon שגויה).
- **⚠️ שקיפות שנדרשה:** אין לי גישה למודל/רמת-המאמץ שהרוטינה רצה בהם בפועל — סכמות ה-tool לא חושפות זאת. נאמר לישי במפורש, לא נוחש.
- **הבהרת "ממצא מוזר":** בזמן שבדקתי את הריצה הראשונה מצאתי `git status` נקי לגמרי + commit חדש (`011e588`) שלא הכרתי. **ישי אישר שהוא ביצע את ה-commit+push בעצמו** — לא קשור לרוטינה (שאסור לה) ולא אלי.
- ראו את הרשומה הבאה (נכתבה ע"י הרוטינה עצמה, ריצה ראשונה שהופעלה ידנית) לתוצאות בפועל.

### 04/07/2026 — בדיקת סנכרון תיעוד אוטומטית (routine)
- **ממצא ותיקון (סתירה בין-קבצית):** 4 מסמכים (`CLAUDE_CODE_LOG.md` פעמיים, `PROJECT_MASTER.md`, מדריך מאקרו, מדריך מיקרו מודול 1 שלוש פעמים) עדיין כתבו "ממתין ל-commit+PR ל-`dev`" — אבל `git log` מראה שה-commit האחרון (`011e588`, 03/07/2026 20:27) כבר בוצע ו-`git status` נקי לחלוטין. תוקן בכל 7 המקומות ל"ממתין ל-PR+merge ל-`dev` (הקוד כבר committed)" — משאיר את החוסם האמיתי (PR+merge) בלי לטעון שה-commit עדיין לא קרה.
- **וידוא קוד מול תיעוד** (`AuthContext.jsx`, `Sidebar.jsx`, `constants.js`, `supabaseClient.js`, `App.jsx`, `schema.sql`): הכל תואם למתואר — שער-הרשאה מרכזי ב-AuthContext, Sidebar עם קישור שטוח permission-driven + כפתור כיווץ בראש, `SYSTEM_MODULES`/`CEO_ROLE_NAME` ב-constants, `sessionStorage` ב-supabaseClient, `moduleName="דיילות"` ב-App.jsx (התיקון מ-03/07 עדיין בתוקף), 3 פונקציות נעילת החשבון + `login_attempts` בסכמה. שום דריפט קוד↔תיעוד לא נמצא.
- **וידוא DB בפועל (Supabase MCP, read-only):** `roles`=5, `modules`=9, `permissions`=45, RLS מופעל על כל 16 הטבלאות — תואם ל-Seed המתועד. `login_attempts`=1 שורה (נתוני בדיקה, לא מתועד בכוונה לפי מדיניות הקובץ).
- **Pulse (Step 5, read-only):**
  - `npm run lint`: **נכשל** — 8 שגיאות, כולן ב-`src/components/ui/*.jsx` (shadcn גנרי, `React` לא בשימוש) + `vite.config.js` (`__dirname` לא מוגדר). **לא בקוד מודול 1 עצמו** — התיעוד הקיים ("המודול כולו lint-נקי") מתייחס לקוד המודול, לא לרכיבי ה-UI הגנריים/קונפיג, ונשאר נכון.
  - `npm outdated`: 5 חבילות בפיגור מינורי בלבד (`@supabase/supabase-js`, `lucide-react`, `radix-ui`, `shadcn`, `vite`) — לא דרמטי, FYI בלבד.
  - `npm audit`: **0 חולשות ידועות**.
  - Supabase advisors — **security**: רק ממצאים כבר-מתועדים (RLS-on-בלי-policies על 11 טבלאות עסקיות + `login_attempts`; EXECUTE ל-`anon`/`authenticated` על 4 פונקציות נעילת-החשבון/הרשאות — סיכון מקובל ומתועד; Leaked Password Protection כבוי — backlog מודול 10). שום ממצא אבטחה **חדש**.
  - Supabase advisors — **performance** (חדש, FYI בלבד — לא תוקן): 7 מפתחות זרים בלי אינדקס מכסה (`assignments`, `logistics`, `permissions`, `projects`, `quote_services`, `quotes`, `users`); "multiple permissive policies" על `permissions`/`users` (SELECT/UPDATE). לא נרשם בעבר ב-tech-debt — שווה החלטה עתידית של ישי אם להוסיף אינדקסים/לאחד policies, לא דחוף כרגע (0 שורות דאטה עסקי).
  - `git status`: נקי — אין diff ממתין ל-commit.
- **לא נמצאו סתירות פתוחות חדשות הדורשות הכרעת ישי** מעבר לרשימה הקיימת ב-`PROJECT_MASTER.md` §7.

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
- **חוב DB פתוח (קופל לכאן ממדריך המאקרו הישן לפני מחיקתו, 06/07/2026):** `auth.email()` לא עטוף ב-`(select …)` בשתי policies — אופטימיזציית initplan עתידית, לא דחוף (0 שורות דאטה עסקי כרגע).

## רפרנס: טמפלטים ו-hook

`docs/templates/create_micro_guide_template.md` (פתיחת מודול) + `create_module_final_test_template.md` (סגירה) — כוללים היררכיית מקורות-אמת, ציטוט קובץ+שורה, RTL, משמעת Git, מטריצת QA. **Stop hook ב-`.claude/settings.json`** (משותף, **ב-git** — מגיע גם לעמית ב-clone; תוקן 06/07/2026, קודם היה ב-`settings.local.json` האישי ומצביע בטעות על `CLAUDE_CODE_LOG.md` בשורש) חוסם סיום-תור עד שהיומן הזה **וגם `STATUS.md`** מעודכנים.

</div>
