<div dir="rtl">

# REG-IN — מדריך הפיתוח היומיומי ומרכז השליטה (Developer Home)

> **נקודת הכניסה המרכזית לפיתוח ותפעול שוטף במערכת**  
> ספרי הפעלה הנדסיים: [docs/DEV_WORKFLOW.md](DEV_WORKFLOW.md) · [docs/ENVIRONMENTS.md](ENVIRONMENTS.md) · [docs/MAINTENANCE.md](MAINTENANCE.md)  
> מפת קוד מלאה וארכיטקטורה: [docs/CODE_MAP.md](CODE_MAP.md).

---

## 1. ניווט מהיר — לפי מצב עבודה

| מצב נוכחי | מסמך לפתיחה |
|---|---|
| **מתחילים סשן עבודה / איפה עצרנו?** | [STATUS.md](../STATUS.md) — לוח המצב הפעיל היחיד והצעד המדויק הבא |
| **רוצים להבין את ארכיטקטורת הקוד והתיקיות** | [docs/CODE_MAP.md](CODE_MAP.md) — מפת הקוד המלאה, ספירת שורות ואינווריאנטים |
| **נהלי עבודה, ענפים ושערי איכות לפני מיזוג** | [docs/DEV_WORKFLOW.md](DEV_WORKFLOW.md) — מחזור פיתוח, משמעת Git ו-DoD |
| **סביבות הרצה, שחזור מאסון וסנכרון סודות** | [docs/ENVIRONMENTS.md](ENVIRONMENTS.md) — מודל מסד נתונים יחיד וסביבות Dev/Preview/Prod |
| **בדיקות בריאות מסד נתונים ותחזוקה תקופתית** | [docs/MAINTENANCE.md](MAINTENANCE.md) — שגרות תחזוקה, DB Health Checks ופטורי אבטחה |
| **מפת דרכים, מודולים ואבני דרך** | [docs/guides/00_roadmap.md](guides/00_roadmap.md) — פירוט 13 המודולים וסדר הבנייה |
| **מפרט מוצר מלא וחובות עתידיים** | [docs/PROJECT_MASTER.md](PROJECT_MASTER.md) (כולל §6 רשם חובות עתידיים) |
| **הכרעות ארכיטקטוניות ושאלות פתוחות** | [docs/PROJECT_MASTER_sec7.md](PROJECT_MASTER_sec7.md) — רשם ההכרעות היחיד (§7) |
| **הפקדת שאילתות וסכמת מסד נתונים פעילה** | [docs/schema.sql](schema.sql) + [docs/db_roadmap.md](db_roadmap.md) |
| **רקע היסטורי ופילוסופיית תכנון** | [docs/agent-context/](agent-context/) — מאמרי עומק והסברי "הלמה" |

---

## 2. פקודות הפעלה ושערי איכות יומיים

```bash
# הרצת שרת פיתוח מקומי (פורט 5173)
npm run dev

# אימות מקומי מלא (חובה לפני כל קומיט: Lint + Prettier + Tests + Build)
npm run verify

# שער איכות מורחב (חובה לפני פתיחת PR)
npm run gate

# בדיקת עשן חיה ומהירה במסע משתמש (פורט 5173)
npm run smoke

# הרצת בדיקות E2E מלאות ב-Playwright (פורט 4173)
npm run test:e2e
```

---

## 3. פרומפטים אוניברסליים לתחילת עבודה

**פרומפט פתיחת סשן (P1):**
```
אני ישי. קרא את CLAUDE.md ואת STATUS.md והמשך מאיפה שעצרנו.
לפני שאתה עושה משהו — הסבר לי במילים פשוטות איפה אנחנו עומדים ומה השלב הבא.
```

ספריית הפרומפטים המלאה למצבי קצה (חילוץ, קונפליקטים, ביקורות): [docs/guides/prompt_library.md](guides/prompt_library.md).

---

## 4. רשת ספרי ההפעלה ההנדסיים (CLAUDE Runbooks)

| שכבה | ספר הפעלה ייעודי | תוכן מרכזי |
|---|---|---|
| **שורש המערכת** | [CLAUDE.md](../CLAUDE.md) | שערי איכות גלובליים, אינדקס חוקי ברזל, ופנקס מלכודות שקטות כללי |
| **קוד מקור ו-React** | [src/CLAUDE.md](../src/CLAUDE.md) | מוקשי Radix, עברית ו-RTL פיזי, Tailwind v4, ואינווריאנטי UI |
| **מסד נתונים ומיגרציות** | [supabase/migrations/CLAUDE.md](../supabase/migrations/CLAUDE.md) | השער הבלתי-הפיך, Expand-Contract, וסנכרון סכמה אוטונומי |
| **בדיקות ו-E2E** | [e2e/CLAUDE.md](../e2e/CLAUDE.md) | איסור הזרקת נתונים למסד, פיקסטורות דינמיות, ויירוט רשת ב-Playwright |
| **מערך התיעוד** | [docs/CLAUDE.md](CLAUDE.md) | חלוקת SSOT ללא כפילויות, פרוטוקול אדוות, ותקינות Bidi |
| **מודולי המערכת** | `src/modules/*/CLAUDE.md` | ספרי הפעלה מקומיים לכל אחד מ-9 המודולים הפעילים |

---

## 5. היררכיית מקורות אמת (בסתירה — הגבוה קובע)

1. **`docs/schema.sql`** — סכמת מסד הנתונים הנוכחית הפעילה (מקור לשינויים: `supabase/migrations/`).
2. **האפיון המאושר של המודול** — `docs/specs/module_NN_*/` (תוצרי שיחות האפיון המאושרות).
3. **האפיון הקפוא** — `docs/reference_spec/C5_clean_transcript.md` — **רשימת כיסוי ובקרה בלבד** ("מה שכחנו?"), אינו סמכות מוצרית מחייבת.
4. **המוקאפים** (`docs/mockups/`) — רפרנס ויזואלי בלבד.
5. **המדריכים** (`docs/guides/`) — מתכוני עבודה.

</div>
