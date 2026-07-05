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

הרצת baseline → 6 המיגרציות משחזרת בדיוק את המצב הנוכחי. ⚠️ אין להריץ אותן שוב על
ה-DB הקיים — רק על DB ריק (branch/staging).

## סנכרון ההיסטוריה (צעד ידני חד-פעמי, כשתקשר את ה-CLI)

6 המיגרציות כבר רשומות כ-applied ב-remote. רק ה-baseline מקומי-בלבד; רושמים אותו
כ"כבר-הוחל" כדי ש-`migration list` יהיה נקי:

```bash
supabase link --project-ref yfeovxppnfoafmfbdfvh
supabase migration repair --status applied 20260629000000
supabase migration list          # אימות: כל 7 מסומנים applied בשני הצדדים
```

## רוטינת שינוי DB (מכאן והלאה)

1. `supabase migration new <שם_תיאורי>` — יוצר קובץ מיגרציה ריק וממוספר.
2. כתוב את ה-DDL (רק שינוי דלתא — `alter table ...`, לא הסכימה המלאה).
3. החל: `supabase db push` (או דרך Supabase MCP `apply_migration`).
4. עדכן את `docs/schema.sql` כ-snapshot של המצב החדש.
5. תעד ב-`CHANGELOG.md`.
