<div dir="rtl">

# תוכנית עבודה הנדסית: התאמה רוחבית ללשון זכר / נייטרלי בכל המערכת

> **תאריך:** 11/10/2026  
> **מטרה:** הסרת כל פניות הלשון בנקבה המופנות למשתמש/מנהל (כגון "לחצי", "נסי שוב", "בחרי", "הזיני", "שמרי ושלחי", "סגרי ללא תשלום") והמרתן ללשון זכר תקנית או נייטרלית (שם פועל / סביל / שם פעולה), תוך שימור קפדני של סטטוסי עבר של דיילות.  
> **ענף עבודה:** `ishay/gender-neutral-copy`  
> **שער יציאה מחייב:** 100% שער איכות ירוק (`npm run verify`, `npm run test:run`), אפס מופעי פנייה בנקבה למשתמש, אימות Playwright E2E, מיזוג ל-`dev` (PR) ומיזוג ל-`main` (ייצור).

---

## 1. חוקי ברזל ואינווריאנטים מחייבים (Invariants)

1. **שימור סטטוסי עבר של דיילות:** כל סטטוס או פעולת עבר שבוצעה על ידי דיילת נשארים **בלשון נקבה בלבד**:
   - `"אישרה זמינות"`, `"סירבה"`, `"ביטלה"`, `"שוחררה"`, `"סימנה אי-זמינות"`, `"הוזמנה"`, `"שובצה"`.
   - לעולם אין להמיר סטטוסי דיילת אלו לזכר!
2. **אחידות פנייה למנהל/משתמש:**
   - הודעות שגיאה: `"נסי שוב"` ⇐ `"נסה שוב"`.
   - טולטיפים והנחיות: `"לחצי על..."` ⇐ `"לחץ על..."` או `"יש ללחוץ על..."`.
   - שדות בחירה (Placeholders): `"בחרי מוצר"` ⇐ `"בחר מוצר"` או `"בחירת מוצר"`.
   - שדות קלט (Placeholders): `"הזיני ערך"` ⇐ `"הזן ערך"` או `"הזנת ערך"`.
   - כפתורי שמירה ושליחה: `"שמרי ושלחי"` ⇐ `"שמור ושלח"`, `"שמרי שינוי"` ⇐ `"שמור שינוי"`.
   - כפתורי סגירה: `"סגרי ללא תשלום"` ⇐ `"סגור ללא תשלום"`, `"שמרי דמי-ביטול"` ⇐ `"שמור דמי ביטול"`.
3. **עמידות בדיקות (Test Alignment):** כל עדכון של מחרוזת בקוד הייצור מחייב עדכון מיידי ומקביל של קובץ הבדיקה המתאים שבודק אותה, כך שסוויטת הבדיקות תישאר ירוקה לאורך כל הדרך.
4. **שמירה על מבנה וסופי שורה:** סופי שורה LF בלבד, אפס שינוי בלוגיקה עסקית, חישובים או מבנה ה-DOM.

---

## 2. פירוק לחבילות עבודה (Work Packages)

### חבילה WP-1: אימות, כניסה ורכיבים גלובליים (`01_auth` & `components`)
- **קבצי ייצור:**
  - `src/modules/01_auth/LoginPage.jsx`
  - `src/modules/01_auth/UsersManagementPage.jsx`
  - `src/modules/01_auth/ProductFormDialog.jsx`
  - `src/modules/01_auth/PriceTiersDialog.jsx`
  - `src/modules/01_auth/PricesManagementPage.jsx`
  - `src/modules/01_auth/pricesApi.js`
  - `src/modules/01_auth/PermissionsMatrixPage.jsx`
  - `src/components/ProfileSettingsPage.jsx`
  - `src/components/LoadingOrError.jsx`
  - `src/components/PermissionAwareEmpty.jsx`
  - `src/components/ExportConfigPanel.jsx`, `ExportDialog.jsx`
- **קבצי בדיקות מתאימים:**
  - `UsersManagementPage.test.jsx`
  - `LoadingOrError.test.jsx`
  - `ProtectedRoute.test.jsx`
  - `ProfileSettingsPage.test.jsx`
  - `PermissionAwareEmpty.test.jsx`
- **מה נחשב עובד:** בדיקות מודול 1 עוברות, הודעות התחברות וניהול משתמשים/מוצרים פונות בזכר/נייטרלי.

---

### חבילה WP-2: מודול לקוחות ודיוור (`02_customers` & `lib/customers`, `marketing`)
- **קבצי ייצור:**
  - `src/modules/02_customers/CustomerFormDialog.jsx` (למשל: "בחרי סוג לקוח", "שחזרי מהארכיון ופתחי לעריכה", "לחצי שוב")
  - `src/modules/02_customers/CustomersPage.jsx`
  - `src/modules/02_customers/CustomerDetailsPage.jsx`
  - `src/modules/02_customers/MarketingPanel.jsx` (למשל: "סמני והעתיקי", "שלחי לנמענים")
  - `src/lib/customers.js`, `src/lib/marketing.js`
- **קבצי בדיקות מתאימים:**
  - `CustomerFormDialog.test.jsx`
  - `CustomerDetailsPage.projects.test.jsx`
  - `CustomersPage.export.test.jsx`
  - `CustomerDetailsPage.export.test.jsx`
- **מה נחשב עובד:** מסכי לקוחות ושיווק מציגים ניסוחי זכר/נייטרלי בכל הדיאלוגים והפעולות.

---

### חבילה WP-3: מודול הצעות מחיר וטיוטות (`03_quotes` & `lib/quotes`, `quoteFollowup`)
- **קבצי ייצור:**
  - `src/modules/03_quotes/QuotesPage.jsx`
  - `src/modules/03_quotes/QuoteBuilderPage.jsx`
  - `src/modules/03_quotes/QuoteSummaryPanel.jsx`
  - `src/modules/03_quotes/QuoteLineEditor.jsx`
  - `src/modules/03_quotes/FollowupDraftDialog.jsx`
  - `src/lib/quotes.js`, `src/lib/quoteFollowup.js`
- **קבצי בדיקות מתאימים:**
  - `QuoteBuilderPage.test.jsx`
  - `FollowupDraftDialog.test.jsx`
  - `quoteFollowup.test.js`
- **מה נחשב עובד:** כל מסכי הצעות המחיר, טיוטת המעקב ועריכת הפריטים פונים בזכר, בדיקות היחידה עוברות.

---

### חבילה WP-4: מודול דיילות ולוגיסטיקה (`04_hostesses` & `05_logistics`)
- **קבצי ייצור:**
  - `src/modules/04_hostesses/SmartMatchPage.jsx`
  - `src/modules/04_hostesses/OverviewTab.jsx`
  - `src/modules/04_hostesses/RepositoryTab.jsx`
  - `src/modules/04_hostesses/HostessFormDialog.jsx`
  - `src/modules/05_logistics/ChecklistDialog.jsx`
  - `src/lib/shiftInvite.js`, `src/modules/04_hostesses/api.js`
- **קבצי בדיקות מתאימים:**
  - `OverviewTab.params.test.jsx`
  - `LogisticsPage.test.jsx`
  - `shiftEmails.test.js`
- **אינווריאנט מחמיר:** אימות שסטטוסי הדיילת נשארים בנקבה.
- **מה נחשב עובד:** פניות למנהל בשיבוץ ולוגיסטיקה בזכר, סטטוסי הדיילות נשמרו, בדיקות ירוקות.

---

### חבילה WP-5: מודול פרויקטים וכספים (`06_projects` & `08_finance`)
- **קבצי ייצור:**
  - `src/modules/06_projects/ClosingTab.jsx` ("שמרי ושלחי" ⇐ "שמור ושלח", "בחרי קובץ" ⇐ "בחר קובץ", "בחרי נוכחות" ⇐ "בחר נוכחות")
  - `src/modules/06_projects/ScopeChangeDialog.jsx` ("שמרי שינוי תכולה", "בחרי מוצר מהקטלוג")
  - `src/modules/06_projects/EditProjectDetailsDialog.jsx`
  - `src/modules/06_projects/TeamTab.jsx`
  - `src/modules/08_finance/ClosingWindowDialog.jsx` ("שמרי דמי-ביטול", "סגרי ללא תשלום", "עדכני ציון")
  - `src/modules/08_finance/SalaryReportDialog.jsx`
  - `src/modules/08_finance/FinancePage.jsx`
  - `src/lib/closingDraft.js`, `src/modules/08_finance/api.js`
- **קבצי בדיקות מתאימים:**
  - `ClosingTab.test.jsx`
  - `ScopeChangeDialog.test.jsx`
  - `EditProjectDetailsDialog.test.jsx`
  - `ClosingWindowDialog.test.jsx`
  - `FinancePage.test.jsx`
- **מה נחשב עובד:** כל מסכי הסגירה והכספים עודכנו בהצלחה, כפתור "שמור ושלח" פעיל בזכר, בדיקות עוברות.

---

### חבילה WP-6: הגדרות, דוחות והסברים מובנים (`09_settings`, `11_reports`, `lib/onboardingCopy`, `paramsRegistry`)
- **קבצי ייצור:**
  - `src/modules/09_settings/components/SaveRow.jsx`
  - `src/modules/09_settings/SmartMatchPane.jsx`
  - `src/modules/09_settings/TemplateEditor.jsx`
  - `src/modules/11_reports/components/ChartCard.jsx`
  - `src/modules/11_reports/tabs/customers/AnalysisRunBar.jsx`
  - `src/lib/paramsRegistry.js`
  - `src/lib/onboardingCopy.js`
  - `src/lib/onboardingCopy.m11.hostesses.js`
- **קבצי בדיקות מתאימים:**
  - `ParamRow.test.jsx`, `SaveRow.test.jsx`, `TemplateEditor.test.jsx`
  - `paramsRegistry.test.js`, `ReportsPage.test.jsx`
  - `CustomersTab.test.jsx`, `FinanceTab.test.jsx`, `HostessesTab.test.jsx`
- **מה נחשב עובד:** כל ההסברים המובנים וההגדרות עודכנו, בדיקות ירוקות.

---

### חבילה WP-7: אימות סופי, שערי איכות והעלאה לייצור
1. **סריקה רוחבית חוזרת:** אימות שאפס פניות בנקבה למשתמש נותרו בקבצי המקור של המערכת.
2. **אימות שימור דיילות:** וידוא שסטטוסי "אישרה", "סירבה", "ביטלה" לא נפגעו.
3. **שער איכות מקומי מלא:**
   - `npm run verify` (ESLint + Prettier + בדיקות יחידה + Build).
   - `npm run test:run` (100% מבחנים ירוקים).
4. **בדיקות E2E ב-Playwright:** הרצת מסלולי מפתח לוודא שאין רגרסיה.
5. **מיזוג ל-`dev` ואז ל-`main`:**
   - פתיחת PR לענף `dev`, המתנה ל-CI ירוק, ומיזוג.
   - פתיחת PR מ-`dev` ל-`main`, המתנה ל-CI ירוק, ומיזוג לייצור.
   - עדכון `STATUS.md` בייצור.

</div>
