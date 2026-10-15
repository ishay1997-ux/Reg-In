# Judge Q&A material, from the UI/UX manager's tour (14.10, 19:0x). Saved by the deputy

The screenshots are in `payroll-work/judge-tour/`. Every screen opened cleanly, in 1.7–3.3 s.

## One sentence per screen ("what this screen is for")
| Screen | Sentence for a judge |
|---|---|
| Login | כניסה עם אימייל או Google; כל משתמש רואה רק את מה שהתפקיד שלו מתיר. |
| Home | כל בוקר: מה דורש טיפול היום, לפי תפקיד, ולוח האירועים של החודש. |
| Customers list | כל הלקוחות, עם איש קשר, הנחה קבועה, היקף עסקים ושביעות רצון. |
| Customer card | כרטיס לקוח: הצעות, פרויקטים ונתוני רווח במקום אחד, ומכאן פותחים הצעה חדשה. |
| Quotes list | כל הצעות המחיר לפי מצב: בתהליך, מאושרות, נדחו. |
| Quote builder | בניית הצעה: המחיר מהמחירון, ההנחה והמע"מ מחושבים, והרווח מוצג רק לנו. |
| Projects list | כל האירועים הפעילים, ומה חסר בכל אחד: דיילות או ציוד. |
| Project card | כרטיס אירוע: פרטים, צוות, ציוד, ואחרי האירוע גם הסגירה. |
| Hostesses | מעקב זימונים לפי אירוע, ומאגר הדיילות. |
| Hostess card | כרטיס דיילת: היענות, היסטוריה והעדפות של לקוחות. |
| Logistics | מה יוצא עד יום העסקים הבא, ומה צריך להזמין לחודש הקרוב. |
| Finance | גבייה: ממתין לחשבונית, ממתין לתשלום, ופרויקטים שהסתיימו. |
| Payroll | דוח שכר חודשי: כל דיילת מאשרת את השעות שלה לפני שהדוח יוצא לרואה החשבון. |
| Reports | 13 דוחות ב-4 לשוניות, וכל דוח פותח במשפט "מה לעשות". |
| System (users, permissions, prices, params) | ניהול המערכת: משתמשים, הרשאות לפי תפקיד, מחירון, וכללים שהמנהל משנה בלי מתכנת. |
| My settings / profile / 404 | ההגדרות של המשתמש, הפרופיל, ודף "לא נמצא" מסודר. |

## Ready answers: "why is this number different from that one?"
One sentence covers all of them: **"כל מסך מצהיר על התקופה שלו."** The details:
- **"חסרות דיילות":** the home screen shows 1, because it looks 14 days ahead. Projects and hostesses show 15, because they look at all active events. The hostesses report shows 2, for its own period.
- **Open debt:** finance shows 241,187 ₪, which includes events still awaiting an invoice. The aging report shows 189,259 ₪, which counts only the 22 invoices already sent.
- **Quotes:** "הכול" shows 178 for 3 months. The customer card shows "842 מתוך 1,179" for all time.
- **Customer card:** 19 events all time. The "פרויקטים" tab shows 4, for 3 months.
- **Payroll history (if opened after "הפק ושלח"):** the history keeps every shift, including those with no hours. The accountant's file has only the paid ones.

## Other likely questions
- **"Is this AI?"** The "ניתוח הערות" report classifies customer comments with AI, and the manager approves the run before anything is shown.
- **The users screen shows `*.test@regin.co.il` addresses:** "חשבון הדגמה לכל תפקיד". The automated tests log in through them.
- **The OpenU contact `ishay1997+openu@gmail.com`:** "כתובת הדגמה שמנותבת אלינו".
- **Events 1638–1647 show a planned revenue of 2,200 ₪ for 12 hostesses:** "פרויקטי הדגמה לשיבוץ". Their quote has one setup line only.
- **Quote 25 "E2E-תרחיש-סגירה" and quote 31 "כנס דשנתי":** approved quotes are locked in the DB by design, so they were not renamed. Answer: "רשומות בדיקה מהפיתוח".
- **"כנס לקוחות - חזרה" (quote 2431, project 1652):** tonight's rehearsal object. It shows in lists, and we leave it.

## Fixed tonight (deputy)
- **Projects 1638–1647 now have a project owner (Ishay's details).** Without one, the final-approval mail in stage step 7 would NOT have been sent: `resolveShiftContact` → null. The agent's rehearsal used 1648, which had an owner, so this was never caught.
- **The test users' fake-pattern phones were replaced** with realistic numbers.
- **Copy and visual fixes are being built.** They will be merged after 21:00:
  - feminine manager strings;
  - jargon;
  - the red wall on the projects list, which is now red only within 14 days;
  - green "פעיל" tags;
  - orange param lines;
  - hyphen-compounds.
