<div dir="rtl">

# REG-IN — לוח מצב

> עודכן לאחרונה: 06/07/2026
> **לוח בלבד — לא סיפור.** מתעדכן ע"י Claude בסוף כל סשן (נאכף ב-hook). היסטוריה ונרטיב → `docs/CLAUDE_CODE_LOG.md` · שינויים מתוארכים → `docs/CHANGELOG.md`.

## טבלת המודולים

סטטוס: ✅ הושלם · 🔨 בעבודה · ⬜ טרם החל

| # | מודול | אחראי | סטטוס | ענף | מדריך שלב |
|---|-------|-------|:-----:|-----|-----------|
| 0 | תשתית | ישי | ✅ | — | — |
| 1 | משתמשים והרשאות | ישי | 🔨 ממתין לסגירה (PR+merge) | `ishay/module-1-permissions` | [ishay/01](docs/guides/ishay/01_close_module_1.md) |
| 2 | לקוחות | עמית | ⬜ | `amit/module-2-customers` (עתידי) | [amit/06](docs/guides/amit/06_module_02_customers.md) |
| 3 | הצעות מחיר | עמית | ⬜ | | [amit/07](docs/guides/amit/07_module_03_quotes.md) |
| 4 | דיילות + Smart Match | ישי | ⬜ | | [ishay/02](docs/guides/ishay/02_module_04_hostesses.md) |
| 5 | לוגיסטיקה | ישי | ⬜ | | [ishay/03](docs/guides/ishay/03_module_05_logistics.md) |
| 6 | פרויקטים (המחבר) | 🤝 משותף | ⬜ | | [shared/module_06](docs/guides/shared/module_06_projects.md) |
| 7 | מסך הבית / Dashboard | עמית | ⬜ | | [amit/08](docs/guides/amit/08_module_07_dashboard.md) |
| 8 | כספים וסגירת אירוע | עמית | ⬜ | | [amit/09](docs/guides/amit/09_module_08_finance.md) |
| 9 | הגדרות מערכת | ישי | ⬜ | | [ishay/04](docs/guides/ishay/04_module_09_settings.md) |
| 10 | אוטומציות | ישי | ⬜ | | [ishay/05](docs/guides/ishay/05_module_10_automations.md) |
| 11 | דו"חות מנהלים | עמית | ⬜ | | [amit/10](docs/guides/amit/10_module_11_reports.md) |
| 12 | אינטגרציה והגשה (כולל פריסת Vercel) | 🤝 משותף | ⬜ | | [shared/module_12](docs/guides/shared/module_12_integration.md) |

## המסלול של ישי
**השלב הנוכחי:** [docs/guides/ishay/01_close_module_1.md](docs/guides/ishay/01_close_module_1.md) — סגירת מודול 1 (push, PR, merge ל-dev + תיקוני בקרת קוד).
מפת המסלול המלאה: [docs/guides/ishay/00_track.md](docs/guides/ishay/00_track.md)

## המסלול של עמית
**השלב הנוכחי:** [docs/guides/amit/01_install_tools.md](docs/guides/amit/01_install_tools.md) — התקנת כלים (משלב אפס: VS Code, Git, Node, Claude Code).
מפת המסלול המלאה: [docs/guides/amit/00_track.md](docs/guides/amit/00_track.md)

## שאלות פתוחות
הרשימה הממוסמרת חיה **רק** ב-[PROJECT_MASTER §7](docs/PROJECT_MASTER.md). כרגע פתוחים: 1, 3, 4, 5, 6, 7, 9, 11–21.
**חוסמים את הצעדים הקרובים:** ‎#21 (מודל בעלות-דאטה ל-RLS — חוסם סגירת מודול 1 ומודול 2) · ‎#3 (מיפוי `customer_type` — מודול 2) · ‎#1 (מע"מ 17/18 — מודול 3).

## תזכורות תפעוליות
- קומיטים מקומיים על `ishay/module-1-permissions` (מודול 1 + ערכת המדריכים המלאה) ממתינים ל-push.
- בסגירת מודול 1: לאמת ב-Supabase ש-`modules` = 9 שורות (ייתכן ש-10 הוזנו — §7 פריט 10) ו-`permissions` = 45.
- ⚠️ `mcp__scheduled-tasks__list_scheduled_tasks` לא מציג את 4 הרוטינות הקיימות (`~/.claude/scheduled-tasks/*`) — ודא ידנית שכפתור "Run now" עדיין מפעיל אותן (ר' `docs/CLAUDE_CODE_LOG.md`, סשן 06/07).

</div>
