<div dir="rtl">

# 🤖 שלב 05 — הקמת 4 הרוטינות של Claude

> מקומו בהיררכיית האמת: הוראות תפעוליות בלבד.
> צעדים שבוצעו מסומנים ✅.

## ① מה נשיג בשלב הזה

4 המשימות המתוזמנות (routines) שישי כבר משתמש בהן — `regin-docs-sync`, `regin-health-pulse`, `regin-pr-gate`, `regin-e2e-check` — נוצרות גם בחשבון Claude שלך. הן **פר-מחשב, לא פר-ריפו** — אז `git clone` לא מביא אותן אוטומטית, וצריך ליצור אותן פעם אחת.

## ② תנאי כניסה

- [ ] [04_git_and_module_workflow.md](04_git_and_module_workflow.md) הושלם.

## ③ חלוקת עבודה

| אתה | Claude |
|---|---|
| מדביק את הפרומפט | יוצר את 4 המשימות המתוזמנות בהתאם להגדרות הקנוניות |

## ④ החלק שלך

1. פתח את [docs/claude_routines.md](../../claude_routines.md) — קרא לפחות את סעיף 1 (מה זה בעצם) כדי להבין למה זה מתוזמן-ידני ולא cron.
2. הדבק את הפרומפט בסעיף ⑥.

## ⑤ החלק של Claude

קורא את `docs/claude_routines.md` ויוצר 4 משימות מתוזמנות (**Manual/Run Now בלבד — בלי cron**) בשמות המדויקים, עם תוכן ה-SKILL.md המדויק שמופיע בקובץ.

## ⑥ 📋 הפרומפט להדבקה

```
היי Claude. קרא docs/claude_routines.md וצור אצלי את 4 הרוטינות
בדיוק לפי ההגדרות הקנוניות שם (משימות מתוזמנות מסוג Manual בלבד, בלי cron):
regin-docs-sync, regin-health-pulse, regin-pr-gate, regin-e2e-check.
אחרי היצירה — הרץ רשימה ותציג לי שכולן קיימות ומאופשרות (enabled).
```

## ⑦ בדיקת קבלה

- הרצת `regin-health-pulse` פעם אחת (Run Now) מסתיימת בשורת יומן חדשה בעברית ב-`docs/CLAUDE_CODE_LOG.md`.

## ⑧ אם משהו השתבש

- **המשימה לא נוצרה** — ודא שאתה בתוך תיקיית הריפו של `Reg-In` כשה-Claude Code רץ.
- **`regin-health-pulse` מדווחת "Supabase advisors skipped — no MCP access"** — זה תקין; ל-MCP של Supabase יש הגדרה נפרדת שלא חובה בשלב הזה.

</div>
