# ניהול מסד הנתונים — מיגרציות

תיקייה זו היא **מקור-האמת לשינויי DB** בפרויקט. כל שינוי סכימה נכתב כאן כקובץ מיגרציה
ממוספר, במקום עריכה ישירה של `docs/schema.sql` (שהפך ל-snapshot מתועד לקריאה בלבד).

## המצב שאותר (בעת אימוץ התיקייה)

ל-DB בפרודקשן כבר יש היסטוריית מיגרציות: 6 מיגרציות של מודול 1 שהוחלו דרך Supabase
(MCP `apply_migration`) ורשומות ב-`supabase_migrations.schema_migrations`. הבעיה: הן
**לא היו מגורסנות ב-git**. 15 הטבלאות עצמן נוצרו ידנית עוד לפני שהמעקב התחיל.

הספרינט הזה סוגר את הפער: משך את 6 המיגרציות מה-DB לקבצים מקומיים, והוסיף לפניהן
קובץ **baseline** שמתאר את המצב שלפני-המעקב. כך `git` = מקור-אמת מלא ושחזור-מלא אפשרי.

## הקבצים (לפי סדר הרצה)

| קובץ | מקור | תפקיד |
| :--- | :--- | :--- |
| `20260629000000_baseline_schema.sql` | נבנה מ-schema.sql | 15 טבלאות + RLS ראשוני, לפני-המעקב. לא רשום ב-remote. |
| `20260702112703_users_status_soft_delete.sql` | remote | מחיקה רכה: הסרת 'frozen' מ-status |
| `20260702143254_module1_users_update_self.sql` | remote | מדיניות עדכון-עצמי |
| `20260702143405_module1_users_update_self_fix_recursion.sql` | remote | תיקון רקורסיה במדיניות |
| `20260702195258_harden_current_user_role_id.sql` | remote | הקשחת search_path + revoke |
| `20260703071534_module1_login_attempts_lockout.sql` | remote | טבלת נעילת-חשבון + 3 פונקציות |
| `20260703071740_module1_reset_login_attempts_revoke_anon.sql` | remote | least-privilege ל-reset |
| `20260707163709_module1_users_rls_initplan_select_wrap.sql` | חדש (07/07, הוחל ב-MCP; ‏remote: `20260707133754`) | עטיפת `(select …)` ב-2 ה-policies של users — תיקון לינט `auth_rls_initplan` |
| `20260710160735_module2_customers_surrogate_key_rls_and_marketing.sql` | חדש (10/07, הוחל ב-MCP; ‏remote: `20260710132720`) | מודול 2: ‏§7.64 מפתח-surrogate ל-customers (ח"פ→`company_number`) + חבילת-nod (‏§7.40א/48/62/73) + ‏2 ‏policies ל-customers (תבנית §7.21) + ‏bucket ‏`marketing` + ‏4 ‏policies ל-storage |
| `20260710164420_module2_moddatetime_to_extensions_schema.sql` | חדש (10/07, הוחל ב-MCP; ‏remote: `20260710134449`) | העברת `moddatetime` מ-`public` ל-`extensions` (תיקון advisor `extension_in_public`; ‏11 הטריגרים נקשרים ל-OID ולכן נשארו תקינים) |

⛔ **הטענה שהייתה כאן — "הרצת baseline → המיגרציות שאחריו לפי הסדר משחזרת בדיוק את המצב הנוכחי" —
בוטלה 31/07/2026. היא כבר אינה נכונה, ואין להסתמך עליה.** ‏**הוכרע (ישי, §7.86):** ‏MCP
‏(`apply_migration`) הוא מסלול-ההחלה היחיד, והתיקייה הזו היא **תיעוד-קריאה של מה שהוחל — לא
סקריפט-שחזור.** נמדד חי באותו יום: ‏21 קבצי SQL על הדיסק מול 18 שורות ב-`schema_migrations`;
**שני קבצים אינם רשומים כלל ובכל זאת חיים במסד** (‏`20260711013517_module2_customer_contacts`,
‏`20260723111005_module3_quotes_structure`), ושניהם **אינם אידמפוטנטיים** — ולכן `supabase db push`
ייעצר על הראשון. כלומר אין היום דרך אוטומטית להקים את המסד מאפס; זו תהיה עבודה ידנית, וישי
אישר את הוויתור במפורש. הריפוי החד-פעמי נדחה כי המיגרציה הבאה דרך MCP פותחת את הפער מחדש.
המספרים המלאים והנימוק: `docs/db_roadmap.md` §0.0.
⚠️ **מה שנשאר בתוקף מלא:** append-only (תיקון קדימה בלבד) · שער ה-typed-echo לפני כל החלה ·
רענון `docs/schema.sql` אחרי כל החלה. ואין להריץ מיגרציה שוב על ה-DB הקיים.

> ⚠️ **פער-מספור מקומי↔remote (מיגרציות שהוחלו ב-MCP):** ‏`apply_migration` של ה-MCP חותם את
> הגרסה ב-remote לפי שעת-UTC, בעוד שם-הקובץ המקומי נקבע לפי השעון המקומי (ישראל, ‏UTC+3) —
> לכן שלוש המיגרציות האחרונות רשומות ב-remote תחת גרסה שונה משם-הקובץ (מפורט בטבלה).
> ה-SQL זהה; רק המספר שונה. בעת `supabase migration list`/`repair` יש ליישר לפי העמודה
> "remote" בטבלה למעלה, לא לפי שם-הקובץ. (אומת חי ב-MCP ‏`list_migrations`, ‏10/07/2026.)

## סנכרון ההיסטוריה (צעד ידני חד-פעמי, כשתקשר את ה-CLI)

כל המיגרציות שאחרי ה-baseline כבר רשומות כ-applied ב-remote. רק ה-baseline מקומי-בלבד; רושמים אותו
כ"כבר-הוחל" כדי ש-`migration list` יהיה נקי:

```bash
supabase link --project-ref yfeovxppnfoafmfbdfvh
supabase migration repair --status applied 20260629000000
supabase migration list          # אימות: כל המיגרציות מסומנות applied בשני הצדדים
```

בנוסף, בגלל פער-המספור המקומי↔remote (ההערה למעלה), שלוש המיגרציות שהוחלו ב-MCP יופיעו
כ"לא-מיושרות" ב-`migration list` — מיישרים לפי גרסאות-ה-remote שבטבלה (rename מקומי או `repair`).

## רוטינת שינוי DB (מכאן והלאה)

1. `supabase migration new <שם_תיאורי>` — יוצר קובץ מיגרציה ריק וממוספר.
2. כתוב את ה-DDL (רק שינוי דלתא — `alter table ...`, לא הסכימה המלאה).
3. החל: `supabase db push` (או דרך Supabase MCP `apply_migration`).
   🔴 **תוקן 03/09/2026 באודיט-סגירת מ9 — הצעד הזה כפי שנוסח אינו עובד, וההסבר כבר יושב ~30 שורות מעליו:**
   ‏`supabase db push` נופל על המיגרציה הלא-אידמפוטנטית הראשונה, ולכן **מסלול-ההחלה בפועל בפרויקט הזה הוא
   ‏`apply_migration` דרך ה-MCP** (עם שער ה-typed-echo). ‏`db push` נשאר כאן כהיסטוריה בלבד — לא להריץ אותו.
4. עדכן את `docs/schema.sql` כ-snapshot של המצב החדש.
5. תעד ב-`docs/db_roadmap.md` §10 (רשימת-ה-Done) וברשומת-הסשן ב-`docs/CLAUDE_CODE_LOG.md`. *(‏`CHANGELOG.md` הוקפא 23/07/2026.)*
