<div dir="rtl">

# REG-IN — לוח מצב

> עודכן לאחרונה: 07/07/2026 14:32
> **לוח בלבד — לא סיפור.** מתעדכן ע"י Claude בסוף כל סשן (נאכף ב-hook). היסטוריה ונרטיב → `docs/CLAUDE_CODE_LOG.md` · שינויים מתוארכים → `docs/CHANGELOG.md`.

## טבלת המודולים

סטטוס: ✅ הושלם · 🔨 בעבודה · ⬜ טרם החל

| # | מודול | אחראי | סטטוס | ענף | מדריך שלב |
|---|-------|-------|:-----:|-----|-----------|
| 0 | תשתית | ישי | ✅ | — | — |
| 1 | משתמשים והרשאות | ישי | 🔒 סגור (אודיט עבר) — הענף קומט ונדחף (594c26b+ec408d4); ממתין רק ל-PR+merge של ישי | `ishay/module-1-permissions` | [ishay/01](docs/guides/ishay/01_close_module_1.md) |
| 2 | לקוחות | עמית | ⬜ 📘 בלופרינט מוכן (07/07) — בנייה אחרי merge של מודול 1 | `amit/module-2-customers` (עתידי) | [amit/06](docs/guides/amit/06_module_02_customers.md) · [מדריך מיקרו](docs/micro_guides/module-2.md) |
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
**השלב הנוכחי:** [docs/guides/ishay/01_close_module_1.md](docs/guides/ishay/01_close_module_1.md) — להדביק את **פרומפט הסגירה המעודכן** (⑥, Opus): אודיט חוזר על מדריך המיקרו המסונכרן + קומיט ה-docs הפתוחים; ואז הצעד הידני — פתיחת PR (base: `dev` ← compare: `ishay/module-1-permissions`, יש בלוק 🧩 מוכן במדריך), CI, ‏Merge. אחרי המיזוג → [ishay/02](docs/guides/ishay/02_module_04_hostesses.md) (מודול 4).
מפת המסלול המלאה: [docs/guides/ishay/00_track.md](docs/guides/ishay/00_track.md)

## המסלול של עמית
**השלב הנוכחי:** [docs/guides/amit/01_install_tools.md](docs/guides/amit/01_install_tools.md) — התקנת כלים (משלב אפס: VS Code, Git, Node, Claude Code).
מפת המסלול המלאה: [docs/guides/amit/00_track.md](docs/guides/amit/00_track.md)

## שאלות פתוחות
הרשימה הממוסמרת חיה **רק** ב-[PROJECT_MASTER §7](docs/PROJECT_MASTER.md). כרגע פתוחים: 1, 4, 5, 6, 7, 9, 12–20, 22, 23. ‎**#3 + #11 נסגרו (06–07/07/2026, פתיחת מודול 2)** — תוויות `customer_type` לפי האפיון; בלי מיזוג לקוחות (ח"פ קנוני + חיפוש סלחני). ‎**#21 נסגר (06/07/2026)** — ראו התבנית ב-§7. ‎**#10 נסגר בפועל** (modules=9 בוצע 02/07). ‎**#22–23 נוספו (06/07)** — פערי אפיון שאותרו בסריקה (לוגיסטיקה actual<planned; audit-trail). ‎**#24 נוסף ונסגר (06/07)** — סיסמאות משתמשי הבדיקה לא יוחלפו (סיכון מקובל, פרויקט אקדמי).
**חוסמים את הצעדים הקרובים:** ‎#1 (מע"מ 17/18 — מודול 3). מודול 2 — אין חסמי §7; חסם יחיד: merge של מודול 1 ל-`dev`.

## תזכורות תפעוליות
- 🔧 **ה-Stop hook מודע-לסשן (07/07/2026 12:55):** שיחת **קריאה-בלבד** ליד שיחה כותבת פעילה כבר **לא נחסמת** בלולאה — סשן שלא ערך קבצים בעצמו פטור מבדיקת התיעוד. השינוי בקבצי ה-hook בלבד (`.claude/hooks/*.sh`), לא בקומיט עדיין. ר' CHANGELOG + LOG (רשומת 12:55).
- 🆕 **כללי ברזל 16–17 + מדריך 04c (07/07/2026 10:47):** ‏מקביליות — שיחה כותבת אחת בכל רגע (מקביל = קריאה/תכנון בלבד) · כל צעד 👤 מקבל "פרומפט מסירה 🧩" לתוסף הכרום · תאריכי יומנים מעכשיו `DD/MM/YYYY HH:MM` · Plan Mode רק בפתיחה/סגירה/§7 · מדריך חדש: [amit/04c](docs/guides/amit/04c_working_with_claude.md) (עבודה נכונה עם Claude — גם לישי). ‏`module-1.md` סונכרן במלואו לטמפלט — פרומפט הסגירה המעודכן ב-[ishay/01 ⑥](docs/guides/ishay/01_close_module_1.md) מוכן להדבקה.
- 📘 **מדריך חדש לעמית (07/07):** [04b_claude_code_power_setup.md](docs/guides/amit/04b_claude_code_power_setup.md) — כיוונון Claude Code חזק (MCP/סקילים/פלאגינים). ‏`.mcp.json` כבר מגורסן ומספק Supabase MCP; עמית רק מאשר+מתחבר. בקומיט `ec408d4` — יגיע לעמית דרך ה-merge.
- ✅ **2 משתמשים אמיתיים נוספו (07/07):** עמית מילר + טל רודגולד, שניהם מנכ"ל. עמית התחבר בפועל ✓. ⚠️ **טל מעולם לא התחבר** — הסיסמה שלו היא זו שהוגדרה ב-03/07; אם אבדה: מחיקה ויצירה מחדש ב-Supabase‏ Authentication→Users (לא recovery-mail — אין מסך איפוס עד מודול 10).
- ✅ **הקומיטים לפני ה-PR בוצעו (07/07):** ‏`594c26b` (סייד-בר) + `ec408d4` (חבילת docs: מדריך מיקרו מודול 2 + 04b + טמפלטים) — נדחפו ל-origin. **לפני פתיחת ה-PR:** ‏commit אחד קטן לקבצי היומנים שעוד פתוחים (`git add docs/ STATUS.md && git commit && git push`). אחרי ה-merge: להריץ `regin-docs-sync` ‏(Run now).
- ✅ תיקוני P0+P1 מבקרת הקוד בוצעו (06/07): Error Boundary, engines, .env.example, `lang="he" dir="rtl"`, הערת תיעוד ל-RLS load-bearing function, 2 בדיקות E2E חדשות למטריצה. ‏07/07: ה-E2E הוקשח לרשת איטית (המתנה מפורשת לכתיבת PATCH לפני reload + ‏timeouts מורחבים) — `npm run verify` + `npm run test:e2e` ‏(8/8) אומתו ירוקים מחדש.
- ✅ שלושת פריטי טרום-ה-PR נסגרו (06/07): ‏(1) אומת ב-Table Editor — `modules`=9, `permissions`=45. ‏(2) `.claude/settings.json` החדש הודבק ע"י ישי (hooks בסקריפטים + הגנת קבצים קפואים — אומת בדיף). ‏(3) 🔒 **הוחלט (ישי, 06/07): סיסמאות 5 משתמשי הבדיקה לא יוחלפו** — פרויקט אקדמי, סיכון מקובל ומתועד; ר' [PROJECT_MASTER §7.24](docs/PROJECT_MASTER.md).
- ⚠️ `mcp__scheduled-tasks__list_scheduled_tasks` לא מציג את 4 הרוטינות הקיימות (`~/.claude/scheduled-tasks/*`) — ודא ידנית שכפתור "Run now" עדיין מפעיל אותן (ר' `docs/CLAUDE_CODE_LOG.md`, סשן 06/07).
- ✅ 4 קבצי פלטי-הסוכנים ב-`docs/reference_spec/` נמחקו (06/07) אחרי שכל הידע מהם שולב ב-PROJECT_MASTER/מדריכים.

</div>
