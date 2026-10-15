# Card: builder, copy and visual fixes from the UI/UX manager's judge tour (14.10 ~19:2x)

**Role: builder.** You build exactly the items below, verbatim. The source of each item is the UI/UX manager's report, quoted in the deputy's message. Where an item gives file:line, verify the line first, because main may have moved.

- **Worktree:** `C:\Users\ishay\Reg-In-payroll-f`. Create the branch `ishay/judge-fixes` from `origin/main` (61329d97 or later): `git fetch origin && git checkout -b ishay/judge-fixes origin/main`.
- Commit by explicit pathspec, one commit per group below.
- No push, merge, deploy or DB write. You MAY build during the 19:45–21:00 freeze; the deputy merges after 21:00.
- **Done** = `npm run gate > C:\Users\ishay\payroll-work\gate-judge.log 2>&1; echo exit=$?` exits 0. Never pipe it into head/tail.

## Group 1: manager-facing feminine strings → masculine/neutral
Ishay's ruling of 11.10 (PR #177): manager copy is masculine or neutral, and hostess-facing copy stays feminine.
- `AnalysisRunBar.jsx` ~61: "הריצי שוב" → "הרץ שוב"
- `SmartMatchPage.jsx` ~354/370/424/483: "אשרי בכל זאת" → "אשר בכל זאת" · "אשרי ושחררי" → "אשר ושחרר" · "שחררי" → "שחרר"
- `SmartMatchPane.jsx` ~58: "שינוי כאן משנה את הדירוג שתראי מחר במסך השיבוץ." → "שינוי כאן ישנה את הדירוג במסך השיבוץ."
- `ErrorBoundary.jsx` ~38: "רענני את הדף" → "רענן את הדף"
- `src/lib/email.js` ~239: "בדקי בתיבת "נשלחו" שלך…" → "בדוק בתיבת "נשלחו" לפני שליחה חוזרת."
- `src/modules/08_finance/api.js` ~480: "בדקי את תבנית המייל…" → "בדוק את תבנית המייל…" (keep the rest of the sentence)
- `src/lib/projectCard.js` ~25: "מלאי גם שעת התחלה וגם שעת סיום, או השאירי…" → "יש למלא שעת התחלה ושעת סיום, או להשאיר את שתיהן ריקות."
- `src/modules/04_hostesses/api.js` ~1007, ~1022: "פתחי אותה לעריכה והזיני/סמני…" → "יש לפתוח את הכרטיס לעריכה ולהזין שוב."
- `ProjectCardPage.jsx` ~68 and `TeamTab.jsx` ~84: "עברי ללשונית 'סגירת אירוע'…" → "שינוי תכולה אחרי האירוע נעשה בלשונית 'סגירת אירוע'."
- `MarketingPanel.jsx` ~229: the sentence "בטלי… השתמשי… ושלחי ידנית, או המתיני לשליחת-השרת (מודול 10)" → "הרשימה ארוכה מדי לתוכנת המייל. אפשר להעתיק את הרשימה ולשלוח ידנית." In `src/lib/marketing.js` ~72, "השתמשי בהעתקה" → "אפשר להעתיק".
- aria-labels: "הסירי מדרגה" → "הסר מדרגה" · "הסירי מסנן" → "הסר מסנן" · "פתחי כרטיס…" → "פתח כרטיס…"
- `src/lib/onboardingCopy.js` lines ~87, 228, 235, 279, 314: feminine imperatives addressed to the manager → masculine/neutral, same meaning.
- **The mechanism:** fix the comment in `ConfirmDialog.jsx` ~35 that tells writers to use feminine labels. It must say manager copy is masculine or neutral (PR #177).
- Then grep `src/` for any remaining manager-facing feminine imperative (pattern: a verb ending in י addressed to "you", for example `[א-ת]+י ` before an object) and fix the clear cases. Leave hostess-facing text alone.

## Group 2: jargon and vague wording (non-report screens)
- "(עוד N מחוץ לחלון)" → "(עוד N מחוץ לתקופה)" · "אין שיבוצים בחלון הזמן הנבחר" → "אין שיבוצים בתקופה שנבחרה"
- "מיון: חסרון תחילה, ובתוכם לפי קרבת האירוע" → "מיון: חסרים קודם, ואז לפי תאריך" · "ממוין: מה שרחוק ביותר ממוכן — תחילה" → "מיון: הפחות מוכנים קודם"
- Logistics: "⏱ שורה בענבר = דורש תשומת-לב. שום דבר לא ננעל." → "שורה מודגשת = דורשת טיפול"
- "אי-הגעה (הבריזה)" and a column named "הבריזה" → "לא הגיעה"
- Users screen column "מצב הטמעה" → "רמת הסברים"
- Project card:
  - "טרם אותר על המפה — דירוג הקרבה בשיבוץ יהיה ניטרלי" → "המיקום לא אותר במפה, והמרחק לא ישוקלל בשיבוץ"
  - "אין. הכמות עומדת על N מאז אישור ההצעה (DATE). ההצעה עצמה נשארת קפואה ואינה משתנה לעולם." → "אין שינויים מאז אישור ההצעה (DATE)."
  - Remove the sentence "השליחה במסך השיבוץ… נעשית בידי מנהלת הגיוס."
  - Remove the duplicate second "פתח שיבוץ לאירוע →" button.
- Finance:
  - "דמי-ביטול — טרם נפתרו" → "דמי ביטול — טרם נקבעו"
  - a lone "אחר" → "סיבת ביטול: אחר"
  - "נסגר תפעולית" → "האירוע נסגר"
  - header "בקרת גבייה, סגירת-תיקים ודו"ח-שכר" → "גבייה, סגירת תיקים ודוח שכר"
- Projects tab "לסגירה": the orange repeated "ממתין להזנת שעות בפועל, כמות אורחים ודוח-סיכום" → gray "חסרים: שעות, אורחים, דוח סיכום"
- Hostess card: "יש רכב: כן" → "רכב: יש" · "שיעור-היענות 48 מ-49" → "שיעור היענות 48 מתוך 49"
- Home: "הצעות ממתינות" → "הצעות פתוחות"
- "ראש-משמרת" → "אחראית משמרת", but only in client strings; anything coming from report DB functions waits for group 4.

## Group 3: visual noise, using the calm tones from today (StatusTag: colour only for "needs attention")
- **Projects list:** the red wall. Pink row background, ⚠ and red "לא נשלח אף זימון לדיילת" only when the event is **within 14 days**, the same window as the home screen; find that constant and reuse it. Beyond 14 days: no row colour, and gray "טרם נשלחו זימונים".
- **Customers list and hostess repository:** no green "פעיל"/"פעילה" tag on active rows. Show a tag only when NOT active.
- **Users list:** the red disable icon becomes gray, and hover may stay red.
- **Params:** the orange "↳ משפיע:" lines become gray (`text-slate-500`).

## Group 4: hyphen-compounds that read like code (client strings only)
Remove the hyphen in visible client text: מבט-על, יתרת-חוב, חציון-סטייה, שעות-צוות, ציון-משוב, אי-הגעה, מסנני-דף, באיחור-תשלום, דמי-ביטול, שיעור-היענות, ימי-האיחור, טופס-המשוב, שביעות-הרצון, מדרג-גיול, סוג-לקוח, דוח-סיכום, שינויי-תכולה, פרטי-בנק.
- **Visible strings only.** Never touch code comments, identifiers, test names or DB param names. A param name like `ימי_…` uses underscores and is not affected.
- **Report labels that come from DB functions are NOT yours.** List them in your report and the deputy will do them.
- Update the tests that lock any changed string.

## Report (your final message)
- the SHAs;
- per group, the files and strings changed;
- anything skipped and why;
- the DB-sourced strings you found and left;
- the gate exit code.

**Finish by 21:00.**
