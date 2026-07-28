<div dir="rtl">

# REG-IN — לוח מצב

> עודכן לאחרונה: 29/07/2026 01:20
> **לוח מצב-עכשיו בלבד — לא ארכיון.** היסטוריה ונרטיב → `docs/CLAUDE_CODE_LOG.md` + `git log` ·
> שינויי-DB → `docs/db_roadmap.md` + migrations · שאלות פתוחות → `PROJECT_MASTER §7`.
> *(הגרסה המלאה הקודמת, כולל 24 תזכורות היסטוריות: `docs/archive/STATUS_full_2026-07-28.md`.)*
> 👤 **מפתח יחיד: ישי** · ⏱️ **דדליין-הגשה: 19/09/2026** — [00_roadmap §3](docs/guides/00_roadmap.md).

## 🫵 הצעד הנוכחי

**מודול 3 (הצעות מחיר) — פזה 1 (DB) נסגרה.** שער-1.7 אושר (ישי, 23/07 ערב): 5/5 מיגרציות הוחלו
ואומתו חי (מבנה · Seed 11/40/20 · RLS 10-policies · lock+RPCs · pg_cron), סוללת-ההתחזות עברה,
‏`schema.sql` סונכרן.
**➡️ הצעד הפעיל: 2.1 — `pricing.js`** (שער-6,319). המשך: **"תמשיך לבנות"**.
ענף: `ishay/module-3-quotes-build` (נפתח 22/07 מ-`dev` טרי `a35c92f`).
מדריך המיקרו: [docs/micro_guides/module-3.md](docs/micro_guides/module-3.md).

✅ **שיפוץ ארכיטקטורת ההקשר הושלם** (28/07, כל 9 השלבים; התוכנית `~/.claude/plans/iterative-hatching-karp.md`
סיימה את תפקידה). הרצפה הקבועה ירדה ב-76%. **הצעד היחיד שנותר: לפתוח סשן חדש ולמדוד** אם זמן-החשיבה
השתפר. לא השתפר → מחזירים `.claude/settings.backup-2026-07-28.json` ובודקים את מחברי-claude.ai.

## טבלת המודולים

סטטוס: ✅ הושלם · 🔨 בעבודה · ⬜ טרם החל

| # | מודול | סטטוס | דדליין | מדריך שלב |
|---|-------|:-----:|:---:|-----------|
| 0 | תשתית | ✅ | — | — |
| 1 | משתמשים והרשאות | ✅ מוזג ל-`dev` (PR [#2](https://github.com/ishay1997-ux/Reg-In/pull/2)) | — | [module_01](docs/guides/modules/module_01_close.md) |
| 2 | לקוחות | ✅ מוזג ל-`dev` (PR [#6](https://github.com/ishay1997-ux/Reg-In/pull/6), `e69383a`) | — | [module_02](docs/guides/modules/module_02_customers.md) |
| 3 | **הצעות מחיר** | 🔨 **פזה 2 — צעד 2.1** | **07/08** | [module_03](docs/guides/modules/module_03_quotes.md) |
| 4 | דיילות + Smart Match | ⬜ | 21/08 | [module_04](docs/guides/modules/module_04_hostesses.md) |
| 5 | לוגיסטיקה | ⬜ | 04/09 (משולב עם 6) | [module_05](docs/guides/modules/module_05_logistics.md) |
| 6 | פרויקטים (המחבר) | ⬜ | 04/09 (משולב עם 5) | [module_06](docs/guides/modules/module_06_projects.md) |
| 8 | כספים וסגירת אירוע | ⬜ | 08/09 | [module_08](docs/guides/modules/module_08_finance.md) |
| 9 | הגדרות מערכת | ⬜ | 10/09 | [module_09](docs/guides/modules/module_09_settings.md) |
| 7 | מסך הבית / Dashboard | ⬜ | 12/09 | [module_07](docs/guides/modules/module_07_dashboard.md) |
| 11 | דו"חות מנהלים | ⬜ | 15/09 | [module_11](docs/guides/modules/module_11_reports.md) |
| 10 | אוטומציות | ⬜ | 17/09 | [module_10](docs/guides/modules/module_10_automations.md) |
| 12 | אינטגרציה והגשה (Vercel) | ⬜ | 19/09 | [module_12](docs/guides/modules/module_12_integration.md) |

*(סדר-הבנייה בפועל — הליבה העסקית קודם, מודולי-העלה בזנב. **מדיניות-חריגה: דוחים מודול שלם, לא
מקצצים תוכן** — [00_roadmap §3](docs/guides/00_roadmap.md).)*

**ענפים חיים:** `main` · `dev` · `ishay/module-3-quotes-build`. ‏`ishay/module-3-quotes` ו-`ishay/solo-reorg`
מוזגו ומתים — **לא לערום עליהם** (כלל 10).

## שאלות פתוחות (§7)

**המספר החי תמיד דרך grep, לא מתוחזק כאן:**
`grep -cE '^[0-9]+\. 🟡' docs/PROJECT_MASTER.md` (פתוחים) · `'🔵'` להנהון · `'⚪'` מוכרע-ממתין · `'🟢'` סגור.
*(snapshot 15/07: 🟢33 · 🟡33 · 🔵7 · ⚪12 = 85.)*

**חוסמי-מודול-3 = 0.** רוב הפתוחים שייכים למודולים עתידיים ומוכרעים בסבב-הקדם של כל מודול
(סקיל `section7-rulings` — "בוא נסגור שאלות פתוחות"). הרשימה חיה **רק** ב-[PROJECT_MASTER §7](docs/PROJECT_MASTER.md).

## ⚠️ מטלות פתוחות

- **`npm run gate` = הגדרת-הסיום של מטלת-ההקשחה** (נוסף 28/07). הפקודה מריצה `verify` → `dup` →
  `deadcode` → `audit` → `check:context` ברצף. **היום היא נכשלת בכוונה** בשני השלבים האחרונים — וזה בדיוק מה שנשאר:
  - `sonarjs/*` ל-`error` ב-`eslint.config.js` + הסרת `continue-on-error` מ-jscpd/knip/audit ב-`ci.yml`
    (הכרעת-ישי 23/07, הורחבה 25/07; מתועד ב-`module-3.md §9`).
  - **knip: 4 ממצאים** — 3 dependencies יתומות (`postcss`/`autoprefixer` אינם בשימוש ב-Tailwind v4) +
    הייצוא `MARKETING_MAX_BYTES` ב-`api.js`.
  - **audit: 4 חולשות high** (react-router/postcss/shadcn — קדמו ל-25/07).
  - **3 קבצים ייפלו על מורכבות** כשמקשיחים: `CustomerFormDialog` (33) · `MarketingPanel` (26) ·
    `CustomersPage` (21). פירוקם חלק מאותה מטלה.
  **`npm run gate` ירוק = המטלה הושלמה.**
- **4 הערות בקוד שסותרות את הקוד** (אותרו בסקירת 28/07, לא תוקנו): `PermissionsMatrixPage.jsx:3-5` ·
  `SystemManagementPage.jsx:1` · `UsersManagementPage.jsx:2` · `e2e/auth.spec.js:9` + מטפל-דיאלוג מת
  ב-`e2e/customers.spec.js:68`. פירוט ב-`src/CLAUDE.md`.
- **`PermissionsMatrixPage.jsx:91-100` כותב בלי `.select()`+בדיקת-שורות** — חורג ממוסכמת ה-RLS-guard.
- **מצב-כהה: `--primary` תחת `.dark` נשאר אפור** — הפעלת מצב-כהה תאבד את הטורקיז בכל כפתור ברירת-מחדל.
- 👤 **ממתין להדבקה: `pr-review-toolkit` צריך לחזור ל-`true`** ב-`.claude/settings.json`. הוא כבוי בטעות שלי, ו-3 דיספאצ'ים חיים תלויים בו (`module-close` §3b · `quality-audit` ×3) — הם ייכשלו **בשקט** עד שיודלק. הבלוק המתוקן והמאומת ניתן בצ'אט (28/07).
- **מחברי claude.ai טרם צומצמו** (make.com ~150 כלים, Gmail, Drive, מלונות…) — ר' `docs/toolbox.md`.
  לא נגענו במכוון; להחליט אחרי מדידת השפעת צמצום-הפלאגינים.

## 🔮 Checkpoint אחרי מודול 4 — "מבחן-אמת של התשתית"

בונים את מודול 4 עם התשתית הקיימת, מתעדים איפה היא נכשלת **בפועל**, ואז — עם ראיות — סשן-מסקנות
אחד (לא גל-שיפוצים). **מה לבחון:** האם 4 הרוטינות מבצעות מה שנועדו · איכות הטמפלטים והמדריכים ·
**ראיות-השדה של 6 הסקילים שנבנו 23/07** (האם הטריגרים נתפסים · האם `section7-rulings` באמת מוריד
עומס-הכרעה · האם `feature-acceptance` תופס פערי-כוונה) · **ראיות-השדה של שיפוץ-ההקשר 28/07** ·
**עקרון-הגריעה (F1):** לפני הוספת כלל — לבדוק אם קיים מכסה, ומה נגרע.
**הכרעת-ישי (09/07): לא-מועצה-עכשיו** — דיון תיאורטי שווה פחות מראיות-שדה.
🅿️ רזרבה: hook-מזכיר ל-§7-write-back (תוכנית מוכנה: `~/.claude/plans/polymorphic-wibbling-blum.md`)
— לבנות **רק אם** הדריפט חוזר למרות כלל 13(א).

## תזכורות תפעוליות חיות

- ⚠️ **טל רודגולד מעולם לא התחבר** — הסיסמה שלו מ-03/07. אם אבדה: מחיקה ויצירה מחדש ב-Supabase
  ‏Authentication→Users (אין מסך איפוס עד מודול 10). *(עמית מילר = לקוח/משתמש-בדיקה, לא המפתח.)*
- 🔒 **סיסמאות 5 משתמשי הבדיקה לא יוחלפו** — פרויקט אקדמי, סיכון מקובל ומתועד (§7.24).
- 🧊 **הקפאת-תשתית:** לא מוסיפים כללים/טקסים/מנגנוני-ממשל עד ראיות-שדה ממודול 4. פתיחות-מכוונות
  נרשמות ביומן. *(נפתחה 28/07 לשיפוץ-ההקשר — **גורע**, לא מוסיף.)*
- 📚 [ספריית פרומפטים מצבית](docs/guides/prompt_library.md) (P1–P25) — סיטואציה מיוחדת ← פותחים שם.
  ⚠️ P7 · P14 · P24 פרשו (תלויי-מפתח-שני); P12/P13 הוחלפו בסקילים.

</div>
