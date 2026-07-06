<div dir="rtl">

# REG-IN — דף הבית של הפרויקט

מערכת ניהול עסקית לחברת אירועים וכנסים: לקוחות → הצעת מחיר → פרויקט → שיבוץ דיילות חכם (Smart Match) → לוגיסטיקה → סגירה פיננסית → דו"חות. מחליפה אקסלים וקבוצות וואטסאפ במערכת אחת עם הרשאות אמיתיות (RLS ב-Supabase).

## מי זה מי
| מי | תפקיד |
|---|---|
| **ישי** | בעל הריפו · מודולים 0, 1, 4, 5, 9, 10 · מסלול: [docs/guides/ishay/00_track.md](docs/guides/ishay/00_track.md) |
| **עמית** | מפתח שותף · מודולים 2, 3, 7, 8, 11 · מסלול: [docs/guides/amit/00_track.md](docs/guides/amit/00_track.md) |
| **Claude** | כותב את הקוד, מריץ את הפקודות, מתקן תקלות, מעדכן את התיעוד · הכללים שלו: [CLAUDE.md](CLAUDE.md) |
| 🤝 משותף | מודולים 6, 12 — שני המפתחים יחד: [docs/guides/shared/](docs/guides/shared/) |

## איפה אני? → פתח את…
| מצב | פתח את |
|---|---|
| לא זוכר איפה עצרנו | [STATUS.md](STATUS.md) — לוח המצב, ואז המדריך שהוא מפנה אליו |
| רוצה להבין את התמונה הגדולה | [docs/guides/00_roadmap.md](docs/guides/00_roadmap.md) — מפת הדרכים |
| ישי, מתחיל שלב חדש | [docs/guides/ishay/00_track.md](docs/guides/ishay/00_track.md) |
| עמית, מתחיל (אפילו בלי VS Code) | [docs/guides/amit/01_install_tools.md](docs/guides/amit/01_install_tools.md) |
| רוצה לדעת מה המערכת אמורה לעשות | [docs/PROJECT_MASTER.md](docs/PROJECT_MASTER.md) |
| משהו השתבש | פרומפט החילוץ למטה 👇 |

## שלושת הפרומפטים שכדאי להכיר בעל-פה

**הפרומפט האוניברסלי** — כשלא זוכרים איפה עצרנו:
```
קרא את CLAUDE.md ואת STATUS.md והמשך מאיפה שעצרנו במסלול של [ישי/עמית].
לפני שאתה עושה משהו — הסבר לי במילים פשוטות איפה אנחנו עומדים ומה השלב הבא.
```

**פרומפט התחלת שלב** — בכל תחילת מדריך (יש גרסה מדויקת בסוף כל מדריך):
```
אנחנו בפרויקט REG-IN. קרא את CLAUDE.md, את STATUS.md ואת docs/guides/___/__________.md
ובצע את "החלק של Claude" בשלב הזה.
בסוף: עדכן את היומנים ואת STATUS.md לפי הפרוטוקול ב-CLAUDE.md,
והסבר לי במילים פשוטות מה לבדוק ואיך.
```

**פרומפט החילוץ** — כשמשהו השתבש:
```
משהו השתבש. קרא את CLAUDE.md ואת STATUS.md.
זה מה שניסיתי לעשות: ___
זו ההודעה/התקלה שקיבלתי (הדבק במלואה): ___
תסביר לי מה קרה במילים פשוטות, ואז תקן.
```

## איך עובדים עם Claude — בקצרה
- **מדריך אחד = פגישת עבודה אחת.** כל מדריך ב-`docs/guides/` בנוי מ-8 סעיפים קבועים, כולל **שלושת הפרומפטים להדבקה** (פתיחה / המשך-בנייה / סגירה) ו"בדיקת קבלה".
- **מודול חדש** נפתח עם פרומפט הפתיחה (Claude קורא את `docs/templates/create_micro_guide_template.md` בעצמו ומייצר **מדריך מיקרו** — בלופרינט חי באנגלית, כתוב ל-Claude → אתם מאשרים → Claude בונה, מאמת עצירות 🔻 טכניות לבד ועוצר לאישורכם בסוף כל פזה) ונסגר עם פרומפט הסגירה (אודיט + עדכון כל התיעוד + הוראות PR מודפסות לכם). מדריך המיקרו מתעדכן תוך כדי העבודה — hook חוסם סיום סשן אם קוד מודול השתנה בלי עדכונו. הפרטים: [docs/guides/00_roadmap.md](docs/guides/00_roadmap.md) §5.
- **בסוף כל סשן** Claude מעדכן את היומנים ואת STATUS.md — יש hook שלא נותן לו לסיים בלי זה.
- **סודות** (`.env.local`, סיסמאות) עוברים רק בערוץ פרטי בין ישי לעמית — לעולם לא בריפו, בצ'אט או במדריכים.

## מפת כל התיעוד
| מסמך | תפקיד |
|------|-------|
| [CLAUDE.md](CLAUDE.md) | כללי הברזל של Claude — נטען אוטומטית בכל סשן |
| [STATUS.md](STATUS.md) | **לוח המצב היחיד** — סטטוס מודולים + השלב הנוכחי של כל מסלול |
| [docs/guides/00_roadmap.md](docs/guides/00_roadmap.md) | מפת הדרכים: מודולים, תלויות, אבני דרך, שיטת העבודה |
| [docs/guides/ishay/](docs/guides/ishay/) · [docs/guides/amit/](docs/guides/amit/) · [docs/guides/shared/](docs/guides/shared/) | מדריכי השלבים בעברית (8 סעיפים + 3 פרומפטים בכל אחד) |
| [docs/PROJECT_MASTER.md](docs/PROJECT_MASTER.md) | האפיון המסונתז: סכמה, הרשאות, 17 מסכים + **§7 שאלות פתוחות** |
| [docs/schema.sql](docs/schema.sql) | סכמת DB בפועל (snapshot; מקור-אמת לשינויים = `supabase/migrations/`) |
| [docs/architecture_and_qa_roadmap.md](docs/architecture_and_qa_roadmap.md) | סטנדרט הנדסי + Definition of Done + QA |
| [docs/claude_routines.md](docs/claude_routines.md) | 4 הרוטינות של Claude — הגדרות קנוניות + פרוטוקול עדכון |
| [docs/code_review_2026-07.md](docs/code_review_2026-07.md) | בקרת קוד מודול 1 + המלצות להמשך |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | יומן שינויים מתוארך (DB+קוד) — משותף לשני המפתחים |
| [docs/CLAUDE_CODE_LOG.md](docs/CLAUDE_CODE_LOG.md) | יומן הסשנים של Claude (נרטיב, החלטות, tech-debt) |
| [supabase/README.md](supabase/README.md) | ניהול מיגרציות DB |
| [docs/micro_guides/](docs/micro_guides/) | מדריכי מיקרו — בלופרינטים חיים **באנגלית, כתובים ל-Claude** (module-1.md ✅, השאר ייווצרו בפתיחת כל מודול) |
| [docs/templates/](docs/templates/) | התבניות (אנגלית) לפתיחת מודול ולסגירתו — Claude קורא אותן בעצמו |
| [docs/mockups/](docs/mockups/) | 44 צילומי מוקאפ + [תיאורים](docs/mockups/mockup_descriptions.md) — רפרנס ויזואלי בלבד |
| `docs/reference_spec/` | האפיון המאושר (פרקים 5–6) — **קפוא, לא לערוך**; + `products_and_params.md` (החלטות Seed) |

## היררכיית מקורות אמת (בסתירה — הגבוה קובע)
`docs/schema.sql` ← האפיון המאושר (פרקים 5–6, `reference_spec/`) ← המוקאפים ← המדריכים.

> ⚠️ קבצי `reference_spec/*.md` הם ייצוא קפוא של האפיון המאושר — לא לערוך ידנית. סטיות מהאפיון נרשמות בתיעוד החי בלבד (PROJECT_MASTER / מדריך המודול / CHANGELOG).

</div>
