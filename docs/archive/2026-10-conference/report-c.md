I've built C on `ishay/payroll-c` (commit `167d7607`, one commit above `8b3f967f`): the `payroll` server function, the guarded `send-email`, and the Deno type-check step in CI. Nothing was deployed, pushed, sent or written to the live database. One problem: the tool would not let me write `C:\Users\ishay\payroll-work\report-c.md`. It said subagents must return findings as text. So the full report is in the appendix below, ready to save.

**XLSX spike (§3.4): passed.** `write-excel-file@2.3.10` runs in Deno 2.9.6. Read back, the ID `"012345678"` stayed text with its leading zero, money stayed numbers, the sheet is right-to-left, and 300 rows built in 37 ms. A real supplement file built by the actual `document.ts` + `xlsx.ts` read back correctly too.

**`npm run gate`: exit code 0.** `Test Files 148 passed (148)` · `Tests 3659 passed (3659)` · build ✓. `deno check` passes for both functions. All 21 committed files are LF (checked with `git ls-files --eol`; `grep -c $'\r'` inside a loop gave false counts in Git Bash).

**New test files (215 tests):** `pipeline.test.js` 86 · `document.parity.test.js` 36 · `mail.parity.test.js` 30 · `guard.test.js` 28 · `dates.parity.test.js` 25 · `send-email/payrollGate.test.js` 6 · `transport.test.js` 4. Five deliberate code breaks (money format, guard anchor, failed vs unknown, time zone, mail body) were each caught.

**Tested in depth:** the server's file, mail text and dates match the browser code, including 14 shared error codes. Also every guard case, the sent/failed/unknown classification, and every §3.2 crash point against fakes. Appendix §3 maps each action, crash point and guard case to its test.

**Not tested:**
- Nothing against a real database or Supabase.
- The `send-email` salary branch has only a type check; the refusal decision itself has 6 tests.
- The 120-second lease that turns `sending` into `unknown` lives in A's database code.

**Siblings:** every payroll mail path in the new function goes through one send routine and one guard. The gap: `send-email` with `invoice` can still send a payroll file to any address. The contract says that branch stays untouched, so I left it; it needs a 🚧 line.

**My decisions:** 10 reversible ones, in appendix §5. The main ones:
- If recording the result fails after Make accepted the mail, the response says `unknown`, because that is what the database will show.
- Unrecognised database errors return `RPC_ERROR` without the raw text.
- A 120-second time budget per distribution call, on top of the batch of 8.
- `send-email` refuses an old-flow salary send (409) when it can't read `payroll_config`.

**For the deputy to write:**
- A new secret, `PAYROLL_ALLOWED_ORIGINS`, must be set before deploying `payroll`.
- Deploy `send-email` only after migrations 1 and 3; before them every old-flow salary send gets 409.
- Old-flow sends now log the delivered address, which is Ishay's.
- 🚧 the unguarded `invoice` branch.

**Blind spots:**
- The fakes follow the contract's return shapes, not A's or B's code, because their branches have no commits yet. Appendix §6 lists 9 assumptions to cross-check.
- Neither `index.ts` has ever run.
- I didn't check whether the Make scenario cuts long subjects; redirected mails now start with `[הופנה: …]`.
- The chunked base64 encoding has not been run on a large file.

---

## Appendix: full report (for `C:\Users\ishay\payroll-work\report-c.md`)

<div dir="rtl">

### 0. ה-spike של §3.4 (W0-CHECK 3) — עבר
Deno 2.9.6 (‏`npx deno@2`). ‏`npm:write-excel-file@2.3.10` בכניסה הדפדפנית מחזיר `Blob`, שמומר ל-`Uint8Array`.
- ‏`read-excel-file/node`: ת"ז `"012345678"` נשארה מחרוזת, ומספרים נשארו מספרים.
- ב-XML של הגיליון מופיע `rightToLeft="1"`.
- ‏300 שורות נבנו ב-37ms.
- **ראיה מקצה לקצה:** ‏`document.ts` ו-`xlsx.ts` האמיתיים רצו ב-Deno ובנו `08_2026_Payroll_Report_Supplement_1.xlsx`. הקובץ נקרא חזרה ונמצא תקין:
  - כותרת `… — השלמה 1`, ושורת `דוח מקורי | 15` מיד אחרי `הופק בתאריך 14/10/2026 10:00`.
  - ‏`—` בעמודות בונוס ונסיעות של שורת הפיצוי.
  - שורת האפס הושמטה, והסה"כ 318.54.
- הגיבוי (jszip) לא נדרש.

### 1. קבצים
‏`supabase/functions/payroll/`:
- ‏`index.ts` — הנתב.
- ‏`pipeline.ts` — כל התזמור, עם תלויות מוזרקות.
- ‏`document.ts` — העתק בונה הדוח, ועוד הרחבת ההשלמה.
- ‏`xlsx.ts` — בלי cast.
- ‏`mail.ts`, `dates.ts`, `money.ts` — העתקי הכללים מ-`src/`.
- ‏`guard.ts` — השומר. עותק זהה בבתים ב-`send-email/guard.ts`, כולל `applyRedirectNoticeHtml`.
- ‏`transport.ts` — השליחה ל-Make.
- ‏`README.md` — בקשה ותשובה, סודות, סדר פריסה, בדיקות אחרי פריסה, מגבלות, ה-spike.

ועוד:
- ‏`send-email/payrollGate.ts` — הכרעת ה-409.
- ‏`send-email/index.ts` — משתנה רק ענף `salary_report`.
- ‏`ci.yml` — שלב `Type-check payroll`.

### 2. ראיות
- ‏gate: יציאה 0. ‏148/148 קבצים, 3659/3659 בדיקות.
- ‏`deno check`: שתי הפונקציות 0.
- ‏`git ls-files --eol`: ‏`i/lf w/lf` לכל 21 הקבצים.
- 5 מוטציות, וכולן נתפסו:
  - פורמט כסף: 13 בדיקות נכשלו.
  - עוגן השומר: 2.
  - ‏failed במקום unknown: 5.
  - אזור זמן UTC: 36.
  - גוף מייל הרו"ח: 1.

### 3. מפת כיסוי
**פעולות:**
- ‏`issue`: ‏"issue — מסלול מלא", "הקובץ: מפתח…", "generated_at של המסד", "השלמה", ‏begin ‏403, ‏begin ‏REVIEW_NOT_READY, נרמול `YYYY-MM`.
- ‏`resume`: כל בלוקי §3.2, ‏failed/superseded, משתמשת צפייה.
- ‏`distribute`: 11 בדיקות — מסלול, השלמה, אצווה 8, תקציב זמן, מקור, ‏begin נדחה, ‏mint, טוקן, ‏claim חסר, ‏NOT_CLAIMABLE, צורת `{attempts}`.
- ‏`distribute_continue`: 2.
- ‏`resend_review`: 2 — נתונים מה-claim בלבד (F7), ו-`acknowledge=false` כברירת מחדל.
- ‏`retry_accountant`: 5.
- גוף פסול: 13 מקרים, ואפס קריאות למסד.

**§3.2:**
- ‏begin אבד: ‏existing ממשיך ל-commit בלבד, ולשונית שנייה ממשיכה את הפעולה הקיימת.
- ‏snapshot/build/upload: ‏`prepare_attempt+1` ומפתח חדש; הקובץ היתום לא נדרס. כל כשל קורא ל-`payroll_operation_fail`.
- ‏record_artifact: ‏commit בלבד.
- תשובת commit אבדה: ‏NOT_CLAIMABLE, בלי שליחה שנייה.
- לפני claim: שליחה אחת.
- ‏`sending`: מדלגים. היציאה היחידה היא retry/resend עם אישור. **החכירה של 120 שניות היא של A ולא מכוסה כאן.**
- ‏complete נכשל או STALE: מחזירים unknown.

**השומר:**
- מותר: 5 צורות.
- מופנה: 8 צורות, כולל `ishay1997.x@`.
- זורק: 8 צורות — ריק, שתי כתובות, bcc ב-newline, ‏null.
- הבאנר, תגית הנושא והברחת הכתובת: נבדקו.
- זהות בתים בין שני העותקים: נבדקה.
- אין `env` בשומר: נבדק.
- השומר בתוך `send-email` עצמו: **לא ביחידה** — רק `deno check` ו-P9.

### 4. אחיות
- כל מסלולי `payroll` (רו"ח, דיילת, תזכורת, המשך, שליחה חוזרת, ניסיון חוזר) עוברים ב-`deliverAttempt` ובשומר.
- ‏`send-email` ‏`salary_report`: ‏409 או שומר.
- ‏`send-email` ‏`payroll_review`: ‏403, לפי המפה, שלא שונתה.
- ‏**`send-email` ‏`invoice` אינו מוגן.** החוזה §3.3.4 קובע שלא נוגעים בו, וממצא-רשות 9 של בודק 1 לא נלקח.
- הקובץ אינו נדרס: ‏`upsert:false`, מפתח חדש לכל ניסיון, וגיבוב מחדש לפני שליחה. המדיניות על ה-storage היא של A.
- ‏unknown לא נשלח שוב לבד: נשלחים רק ניסיונות queued, ו-claim מסרב לכל מצב אחר.

### 5. הכרעות (הפיכות)
1. ‏complete נכשל אחרי שליחה מוצלחת: התשובה היא `unknown`, כי זה המצב שיישמר.
2. שגיאת RPC לא מזוהה: ‏`RPC_ERROR`, בלי טקסט המסד.
3. תקציב זמן-קיר של 120 שניות לכל קריאת הפצה (ממצא-רשות 10).
4. ‏`remaining` מחושב מ-`p_limit:1000` פחות מה שכבר התחיל.
5. שדות חובה בתבנית (לפי F9), אחרת `TEMPLATE_INVALID` לפני שליחה.
6. ‏`send-email` מסרב (409) כשאין ודאות.
7. באנר ההפניה כ-HTML, בתוך `guard.ts`.
8. תווי LRI/PDI נכתבים ב-`fromCharCode` ולא כתווים גלויים.
9. ‏CORS `*`.
10. בדיקת הגוף רצה לפני שער ההרשאה במסד (סדר החוזה).

### 6. הנחות לאימות מול A ו-B
1. ‏begin מחזיר `operation_id`.
2. ‏status מחזיר `state` ו-`failure_code`.
3. ‏claim מחזיר את שדות F7.
4. ‏mint מחזיר text שתואם `^[A-Za-z0-9_-]{20,}$`.
5. צורת `queued_attempts`, והפרמטר `p_limit`.
6. ‏commit אידמפוטנטי ומחזיר `attempt_id` גם בקריאה חוזרת.
7. שדות snapshot: ‏`kind`, ‏`supplement_seq`, ‏`original_report_id`, ‏`generated_at`, ‏`prepare_attempt`, ‏`artifact_key_prefix`.
8. שמות הפרמטרים של fail ו-record_artifact.
9. גיבוב התבנית: ‏sha256 hex על בתי UTF-8.

### 7. לסגן
- ‏CODE_MAP: פונקציה רביעית `payroll`.
- סוד `PAYROLL_ALLOWED_ORIGINS`.
- לפרוס את `send-email` רק אחרי מיגרציות 1 ו-3.
- ‏`email_log.recipient` מציג את הכתובת שנמסרה בפועל; הכתובת המקורית ב-`intended_recipient`.
- 🚧 ענף invoice.
- ממצאי-רשות: 10 ו-15 נלקחו, 9 לא.

### 8. לא נבדק
- מסד ו-storage אמיתיים.
- ענף `send-email` (רק deno check).
- ‏Make.
- זמני Edge אמיתיים.

### 9. עיוורון
1. הזיופים נכתבו מהחוזה ולא מקוד.
2. ‏`index.ts` לא רץ אף פעם.
3. ‏Make מול נושא עם `[הופנה: …]`.
4. ‏base64 ידני על קובץ גדול.
5. תזמון החכירה מול complete איטי.
6. שם הגיליון בהשלמה.

</div>