<div dir="rtl">

# מיפוי וסיווג — כל מחרוזת עברית ב-`src/`

> **מה זה:** סריקה מכנית ומלאה (לא מדגמית) של כל טקסט עברי שמוצג למשתמשת בקוד המערכת —
> ✅ **19 מסכי-Page ב-9 מודולים · `src/components/` · `src/lib/`** (146 קבצי-מקור שאינם קבצי-בדיקה,
> נסרקו כולם). **מתי:** בקשת-ישי, 07/09/2026 — "נדרשת סקירה מעמיקה כי כרגע חלק מהדברים הם לא שם
> ולא שם". **מי:** סוכן-סקירה בהקשר-טרי, בלי שינוי קוד. **שאינו קובע כלל-מוצר:** המסמך הזה הוא
> **מפה וממצא**, לא הכרעה — כל שינוי-ניסוח, כל איחוד-מחרוזות וכל "התאמת לשון-פנייה" הם החלטת-ישי,
> לא שלי. הטבלה בסעיף 2 גדולה בכוונה ולא מדוגמת — כך ביקש ישי.

## איך נסרק בפועל (מכני, לא בעין)

1. פענוח כל קובץ ל-AST אמיתי (`@babel/parser` + `@babel/traverse`, אותה ספרייה שבודקת
   `App.routes.test.jsx` בריפו) — לא regex על טקסט. חולץ כל `StringLiteral` / טקסט-JSX /
   `TemplateLiteral` שמכיל תו עברי (טווח Unicode `֐–׿`).
2. **תיקון קריטי באמצע הסריקה:** הריצה הראשונה פירקה משפט שמפוצל סביב `{ביטוי}` (בין אם
   ב-Template Literal ובין אם ב-JSX) לשברי-משפט נפרדים — "‏— בלעדיו השמירה נחסמת" בלי ה"מה"
   שלפניו. תוקן: כל צומת-JSX שיש לו טקסט עברי ישיר מרוכב **מחדש** משורשו (טקסט + placeholder
   ‏`{...}` לביטויים + טקסט-בת של תגיות מקוננות) לפני שהוא נכנס לניתוח — כלומר כל שורה בטבלה
   שלמטה היא **המשפט השלם** כפי שהוא נראה על המסך, לא קטע ממנו.
3. דה-דופליקציה לפי ערך מדויק (לא fuzzy) → **2,311 מחרוזות ייחודיות** מתוך **3,005 מופעים**
   (כלומר 694 מופעים הם חזרה מדויקת על מחרוזת שכבר נספרה — פירוט בסעיף 4).
4. סיווג ①–④: כללים מכניים בעלי-ביטחון-גבוה (אורך · הקשר-JSX/attr · מילות-פתיחה אופייניות
   להודעת-שגיאה/מצב-ריק) מיינו את הרוב; **כל מחרוזת שנפלה בתפר בין הקטגוריות** (819 מחרוזות —
   דלי "④?" ו-"①?" המקוריים) **נקראה ידנית, אחת-אחת, מול הקוד שסביבה** — לא רק מול הערך המבודד.
   קטגוריה ④ עברה בדיקה שלישית: אימות מול קובץ המקור בפועל (מספר שורה, קומפוננטה, האם מאחורי
   מתג) לפני שנרשמה כממצא.

## מקרא הסיווג

**①** תווית/כותרת — שם שדה, כותרת עמודה, שם כפתור. **②** ממשק-קבוע — הודעת-שגיאה, מצב-ריק,
אישור-פעולה מסוכנת. **③** עזרת-הטמעה — מסבירה מנגנון, ומקומה מאחורי מתג/tooltip/עמודת-"הערה"
מיועדת. **④** לא-שם-ולא-שם — הממצא המרכזי: לא נקייה מספיק לתווית, לא מסבירה מספיק להיות עזרה.

## §1 · המספרים

**סה"כ מופעי-מחרוזת שנסרקו: 3,005 · מחרוזות ייחודיות (אחרי דה-דופליקציה מדויקת): 2,311.**

### פילוח לפי סיווג (על 2,311 הייחודיות)

| סיווג | כמות | % |
|---|---|---|
| ① תווית/כותרת | 1,336 | 57.8% |
| ② ממשק-קבוע (שגיאה/ריק/אישור) | 903 | 39.1% |
| ③ עזרת-הטמעה (מוסברת, מתויגת) | 60 | 2.6% |
| ④ לא-שם-ולא-שם | 12 | 0.5% |

⚠️ **הגבול בין ① ל-② הוא היוריסטי** (אורך + מילות-פתיחה), לא נקרא-בעין אחת-אחת עבור כל 2,239
המחרוזות בשתי הקטגוריות האלה — זו הייתה עבודה של אלפי שורות בלי תוספת-ערך; מי שרוצה לדעת "האם
המחרוזת הזאת ① או ②" ספציפית יכולה לשאול. **קטגוריות ③ ו-④, לעומת זאת, עברו קריאה אנושית מלאה
של כל 819 המחרוזות שנפלו בתפר** (ר' מתודולוגיה למעלה) — שם המספרים מדויקים.

### פילוח לפי מודול — חלוקה בלעדית (כל מחרוזת נספרת פעם אחת בדיוק, בקובץ שבו היא מוגדרת)

| מודול | ① | ② | ③ | ④ | סה"כ |
|---|---|---|---|---|---|
| מודול 1 · הרשאות/כניסה | 88 | 50 | 1 | 0 | 139 |
| מודול 2 · לקוחות | 126 | 62 | 0 | 0 | 188 |
| מודול 3 · הצעות מחיר | 128 | 61 | 1 | 0 | 190 |
| מודול 4 · דיילות + Smart Match | 149 | 114 | 2 | **4** | 269 |
| מודול 5 · לוגיסטיקה | 34 | 30 | 2 | 0 | 66 |
| מודול 6 · פרויקטים | 156 | 138 | 2 | **4** | 300 |
| מודול 7 · מסך-הבית | 23 | 11 | 1 | 0 | 35 |
| מודול 8 · כספים | 153 | 146 | 5 | 0 | 304 |
| מודול 9 · הגדרות | 27 | 40 | 1 | 0 | 68 |
| `src/lib/**` (משותף — SSOT-לוגיקה, כלל-ברזל 14) | 411 | 231 | 45 | **4** | 691 |
| `src/components/**` (משותף) | 40 | 14 | 0 | 0 | 54 |
| `src/api/**` (משותף) | 1 | 4 | 0 | 0 | 5 |
| `src/contexts/**` | 0 | 2 | 0 | 0 | 2 |
| **סה"כ** | **1,336** | **903** | **60** | **12** | **2,311** |

⚠️ **`src/lib/**` הוא 691 מחרוזות — כ-30% מהסך הכול** — כי כלל-הברזל 14 (SSOT) מרכז שם את כל
נוסחי-השגיאה/ההודעה/ה-hint, וה-UI רק מייבא. **חלק ניכר מ-מודול 9 (הגדרות) חי טכנית שם:**
‏`src/lib/paramsRegistry.js` מחזיק 44 מחרוזות `hint` (כולן ③) שמוצגות במסכי מודול 9 — משויכות כאן
לקובץ שבו הן מוגדרות, כדי לא לספור פעמיים. שבע מחרוזות שמות-המודולים (`"לקוחות"`, `"פרויקטים"`
וכו') מוגדרות פעמיים — פעם ב-`App.jsx`/הסרגל ופעם ב-`src/lib/constants.js` — ונספרות כאן תחת
‏`lib` (מקור-האמת שלהן).

### כמה מכוסה כבר בכרטיסי-המסך (סעיף ⑥ "הגדרות מאחורי מילה על המסך")

נספר בפועל (`grep -c "⑥"` על כל `screens-approved.md` קיים — לא הוסתמך על מספר שנמסר):

| קובץ | מופעי ⑥ |
|---|---|
| `docs/specs/module_04_hostesses/screens-approved.md` | 14 |
| `docs/specs/module_05_logistics/screens-approved.md` | 7 |
| `docs/specs/module_06_projects/screens-approved.md` | 25 |
| `docs/specs/module_08_finance/screens-approved.md` | 12 |
| **סה"כ** | **58** |

🔴 **וזה כל מה שיש — רק 4 מודולים (4/5/6/8) מחזיקים `screens-approved.md` בכלל**, ורק בהם
**939 מחרוזות** (40.6% מהסך) נמצאות תחת קובץ-מסך שעקרונית *יכול* להכיל תיעוד-⑥ (58 מופעים אינם
מכסים את כל ה-939 — זו רשימת-נספח לכרטיסי-מסך ספציפיים, לא מילון ממצה). **מודולים 1 · 2 · 3 · 7 · 9
(620 מחרוזות, 26.8%) אין להם `screens-approved.md` בכלל — אין להן אפילו מסלול-תיעוד אפשרי.**
ובקוד-המשותף (`lib`/`components`/`api`/`contexts`, 752 מחרוזות, 32.5%) — שם ממילא לא קיים "כרטיס
מסך" משלו, כי הקובץ אינו שייך למסך אחד. **סך-הכול: 1,372 מחרוזות (59.4%) יושבות היום במקום שאין
לו מסלול-⑥ אפשרי כלל, גם אם ירצו.** המסקנה הפרקטית: "כל מילה לא-מובנת-מאליה מוסברת בכרטיס" היא
עבודה שטרם החלה ברוב המערכת, לא רק שלא הושלמה בארבעת המודולים שכבר יש להם כלי.

## §2 · הטבלה המלאה — כל 2,311 המחרוזות

**לא מדוגמת ולא מקוצרת** (כבקשת ישי) — מסודרת לפי מודול, ובתוך כל מודול לפי סיווג (④ קודם, ①
אחרון) ואז לפי סדר-א"ב. עמודת "קובץ:שורה" מציגה את המופע **הראשון**; `(×N)` מציין שהמחרוזת
חוזרת ב-N מיקומים בסך-הכול (הרשימה המלאה של איפה — בתוך קובצי-העבודה של הסריקה, לא כאן, כדי
לא להכפיל את הטבלה פי-1.3). "lib (משותף)" ו-"components (משותף)" הם `src/lib/**` ו-
`src/components/**` — לא מודול-מוצר, אלא הקוד-המשותף שכלל-ברזל 14 מרכז שם.


#### מודול 1 (auth) — 139 מחרוזות ייחודיות

| מחרוזת | קובץ:שורה | סיווג | הערה |
|---|---|---|---|
| המדרגה שכמות-המינימום שלה היא הגבוהה ביותר מבין אלה שאינן עולות על הכמות בהצעה — היא שקובעת את המחיר. ללא מדרגות, ההצעה מתומחרת לפי מחיר הבסיס. | modules/01_auth/PriceTiersDialog.jsx:129 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| אותיות גדולות, ספרות ומקפים בלבד (לא בתחילת המק"ט) | modules/01_auth/ProductFormDialog.jsx:62 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אין גישה | modules/01_auth/PermissionsMatrixPage.jsx:25 | ② | מצב-ריק |
| אין הרשאה לעדכן את עלות המוצר. | modules/01_auth/pricesApi.js:72 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין הרשאה לעדכן מוצר זה. | modules/01_auth/pricesApi.js:62 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין הרשאה לשמור מדרגות מחיר. | modules/01_auth/pricesApi.js:126 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין הרשאה לשנות את סטטוס המוצר. | modules/01_auth/pricesApi.js:81 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין מדרגות למוצר זה — הוא מתומחר לפי מחיר הבסיס. | modules/01_auth/PriceTiersDialog.jsx:149 | ② | מצב-ריק |
| ההתחברות עם Google נכשלה. נסה שוב. | modules/01_auth/LoginPage.jsx:124 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הזן קודם את כתובת הדוא״ל שלך בשדה למעלה. | modules/01_auth/LoginPage.jsx:131 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| החשבון ננעל זמנית עקב ריבוי ניסיונות כושלים. נסה שוב מאוחר יותר. | modules/01_auth/LoginPage.jsx:47 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| החשבון ננעל עקב 5 ניסיונות כושלים. נסה שוב בעוד כ-15 דקות. | modules/01_auth/LoginPage.jsx:64 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המוצר יתווסף לקטלוג ויהיה זמין לבחירה בהצעות מחיר חדשות. | modules/01_auth/ProductFormDialog.jsx:180 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המוצר נוצר אך שמירת העלות נכשלה — יש לפתוח אותו לעריכה ולשמור שוב. | modules/01_auth/pricesApi.js:45 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המק"ט {form.sku.trim()} כבר קיים בקטלוג. בחרו מק"ט אחר. | modules/01_auth/ProductFormDialog.jsx:154 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המשתמש יתווסף לטבלת המשתמשים במערכת. | modules/01_auth/UsersManagementPage.jsx:253 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הסיסמה חייבת להכיל לפחות 6 תווים. | modules/01_auth/LoginPage.jsx:36 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפעלת המשתמש נכשלה. נסה שוב. | modules/01_auth/UsersManagementPage.jsx:206 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| השבתת המשתמש נכשלה. נסה שוב. | modules/01_auth/UsersManagementPage.jsx:206 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| השינוי לא נשמר. נסה שוב. | modules/01_auth/PermissionsMatrixPage.jsx:107 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חשבון זה אינו פעיל במערכת. פנה למנכ"ל לצורך בירור. | components/layout/MainLayout.jsx:38 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| טעינת מדרגות המחיר נכשלה. | modules/01_auth/PriceTiersDialog.jsx:65 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כבר קיים משתמש עם כתובת הדוא"ל הזו. | modules/01_auth/UsersManagementPage.jsx:170 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא הצלחנו לשלוח מייל איפוס. בדוק את הכתובת. | modules/01_auth/LoginPage.jsx:137 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן להשבית את החשבון שלך | modules/01_auth/UsersManagementPage.jsx:382 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לשינוי לאחר יצירה | modules/01_auth/ProductFormDialog.jsx:204 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לשנות תפקיד לחשבון שלך. | modules/01_auth/UsersManagementPage.jsx:312 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| להשבית את המשתמש "{targetUser.full_name}"? הוא לא יוכל להתחבר למערכת עד שיוחזר לפעיל. | modules/01_auth/UsersManagementPage.jsx:191 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מדרגות מחיר — {product.item_name} | modules/01_auth/PriceTiersDialog.jsx:126 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מחיר במספרים, אפס ומעלה | modules/01_auth/ProductFormDialog.jsx:70 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מספר טלפון נייד לא תקין (לדוגמה: 050-1234567). | components/ProfileSettingsPage.jsx:80 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| משתמש זה אינו מורשה במערכת. פנה למנהל. | modules/01_auth/LoginPage.jsx:96 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נשלח אליך מייל לאיפוס הסיסמה. בדוק את תיבת הדוא״ל. | modules/01_auth/LoginPage.jsx:139 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדכון פרטי המוצר. המק"ט קבוע ואינו ניתן לשינוי. | modules/01_auth/ProductFormDialog.jsx:179 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדכון שם, טלפון ותפקיד. לשינוי כתובת דוא"ל יש ליצור משתמש חדש. | modules/01_auth/UsersManagementPage.jsx:252 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עלות במספרים, אפס ומעלה | modules/01_auth/ProductFormDialog.jsx:72 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עריכת מוצר: {editingProduct.item_name} | modules/01_auth/ProductFormDialog.jsx:175 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שגיאה בטעינת מדרגות המחיר. | modules/01_auth/pricesApi.js:93 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת נתוני המטריצה. | modules/01_auth/PermissionsMatrixPage.jsx:59 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת קטלוג המוצרים. | modules/01_auth/PricesManagementPage.jsx:69 (×4) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת רשימת המשתמשים. | modules/01_auth/UsersManagementPage.jsx:76 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שינוי הסטטוס לא נשמר. | modules/01_auth/PricesManagementPage.jsx:91 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שינוי סטטוס המוצר נכשל. | modules/01_auth/pricesApi.js:80 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שם מלא חייב להכיל לפחות 2 תווים. | components/ProfileSettingsPage.jsx:76 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שמירה נכשלה. נסה שוב. | components/ProfileSettingsPage.jsx:96 (×3) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שמירה נכשלה. נסו שוב. | modules/01_auth/ProductFormDialog.jsx:156 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שמירת השינויים במוצר נכשלה. | modules/01_auth/pricesApi.js:61 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שמירת השינויים נכשלה. נסה שוב. | modules/01_auth/UsersManagementPage.jsx:147 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שמירת מדרגות המחיר נכשלה. | modules/01_auth/PriceTiersDialog.jsx:113 (×3) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שמירת עלות המוצר נכשלה. | modules/01_auth/pricesApi.js:71 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תקלה זמנית בטעינת פרטי החשבון. נסה שוב בעוד רגע. | contexts/AuthContext.jsx:102 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| {tiers} מדרגות | modules/01_auth/PricesManagementPage.jsx:208 | ① | קצר — כותרת/תווית סבירה |
| + הוספת משתמש חדש | modules/01_auth/UsersManagementPage.jsx:233 | ① | קצר — כותרת/תווית סבירה |
| + מוצר חדש | modules/01_auth/PricesManagementPage.jsx:124 | ① | קצר — כותרת/תווית סבירה |
| או | modules/01_auth/LoginPage.jsx:195 | ① | קצר — כותרת/תווית סבירה |
| בחר תפקיד | modules/01_auth/UsersManagementPage.jsx:299 | ① | קצר — כותרת/תווית סבירה |
| בחרו יחידה | modules/01_auth/ProductFormDialog.jsx:269 | ① | קצר — כותרת/תווית סבירה |
| בחרו קטגוריה | modules/01_auth/ProductFormDialog.jsx:217 | ① | קצר — כותרת/תווית סבירה |
| דוא"ל | components/ProfileSettingsPage.jsx:118 (×3) | ① | קצר — כותרת/תווית סבירה |
| הגדרות מערכת | components/layout/Topbar.jsx:23 (×6) | ① | קצר — כותרת/תווית סבירה |
| הוסף מוצר | modules/01_auth/ProductFormDialog.jsx:359 | ① | קצר — כותרת/תווית סבירה |
| הוסף משתמש | modules/01_auth/UsersManagementPage.jsx:324 | ① | קצר — כותרת/תווית סבירה |
| הוספת מדרגה | modules/01_auth/PriceTiersDialog.jsx:228 | ① | קצר — כותרת/תווית סבירה |
| הוספת משתמש חדש | modules/01_auth/UsersManagementPage.jsx:249 | ① | קצר — כותרת/תווית סבירה |
| הנתונים נשמרו בהצלחה | modules/01_auth/PriceTiersDialog.jsx:246 (×3) | ① | קצר — כותרת/תווית סבירה |
| הסר מדרגה | modules/01_auth/PriceTiersDialog.jsx:201 | ① | קצר — כותרת/תווית סבירה |
| הסר מדרגה {i + 1} | modules/01_auth/PriceTiersDialog.jsx:202 | ① | קצר — כותרת/תווית סבירה |
| הפעל משתמש מחדש | modules/01_auth/UsersManagementPage.jsx:392 | ① | קצר — כותרת/תווית סבירה |
| הרשאות | modules/01_auth/SystemManagementPage.jsx:11 | ① | קצר — כותרת/תווית סבירה |
| השבת משתמש | modules/01_auth/UsersManagementPage.jsx:192 (×2) | ① | קצר — כותרת/תווית סבירה |
| השבתת משתמש | modules/01_auth/UsersManagementPage.jsx:190 | ① | קצר — כותרת/תווית סבירה |
| התחברות | modules/01_auth/LoginPage.jsx:189 | ① | קצר — כותרת/תווית סבירה |
| התחברות עם Google | modules/01_auth/LoginPage.jsx:199 | ① | קצר — כותרת/תווית סבירה |
| טלפון | components/ProfileSettingsPage.jsx:139 (×9) | ① | קצר — כותרת/תווית סבירה |
| טלפון (לא חובה) | modules/01_auth/UsersManagementPage.jsx:281 | ① | קצר — כותרת/תווית סבירה |
| יחידה | lib/catalog.js:21 (×5) | ① | קצר — כותרת/תווית סבירה |
| יחידת מכירה | modules/01_auth/ProductFormDialog.jsx:258 | ① | קצר — כותרת/תווית סבירה |
| יצירת המוצר נכשלה. | modules/01_auth/pricesApi.js:39 | ① | קצר — כותרת/תווית סבירה |
| יש לבחור יחידת מכירה | modules/01_auth/ProductFormDialog.jsx:68 | ① | קצר — כותרת/תווית סבירה |
| יש לבחור קטגוריה | modules/01_auth/ProductFormDialog.jsx:66 | ① | קצר — כותרת/תווית סבירה |
| יש לבחור תפקיד. | modules/01_auth/UsersManagementPage.jsx:126 | ① | קצר — כותרת/תווית סבירה |
| יש להזין כתובת דוא"ל תקינה. | modules/01_auth/UsersManagementPage.jsx:154 | ① | תווית/כותרת/פעולה קצרה |
| יש להזין כתובת דוא״ל. | modules/01_auth/LoginPage.jsx:32 | ① | תווית/כותרת/פעולה קצרה |
| כניסה למערכת | modules/01_auth/LoginPage.jsx:153 | ① | קצר — כותרת/תווית סבירה |
| כספים ודוחות | lib/constants.js:23 (×3) | ① | קצר — כותרת/תווית סבירה |
| כתובת דוא״ל | modules/01_auth/LoginPage.jsx:157 | ① | קצר — כותרת/תווית סבירה |
| לא פעיל | lib/catalog.js:16 (×3) | ① | קצר — כותרת/תווית סבירה |
| לוגיסטיקה | App.jsx:200 (×10) | ① | קצר — כותרת/תווית סבירה |
| ללא הגבלה | modules/01_auth/PriceTiersDialog.jsx:174 | ① | קצר — כותרת/תווית סבירה |
| ללא מדרגות | modules/01_auth/PricesManagementPage.jsx:208 | ① | קצר — כותרת/תווית סבירה |
| למנכ"ל תמיד עריכה מלאה | modules/01_auth/PermissionsMatrixPage.jsx:176 | ① | תווית/כותרת/פעולה קצרה |
| לקוחות ומכירות | lib/constants.js:18 (×3) | ① | קצר — כותרת/תווית סבירה |
| מדרגות מחיר | modules/01_auth/PricesManagementPage.jsx:156 | ① | קצר — כותרת/תווית סבירה |
| מודול | modules/01_auth/PermissionsMatrixPage.jsx:137 | ① | קצר — כותרת/תווית סבירה |
| מוצר חדש | modules/01_auth/ProductFormDialog.jsx:175 | ① | קצר — כותרת/תווית סבירה |
| מחיר בסיס | modules/01_auth/PricesManagementPage.jsx:153 | ① | קצר — כותרת/תווית סבירה |
| מחיר בסיס (₪) | modules/01_auth/ProductFormDialog.jsx:297 | ① | קצר — כותרת/תווית סבירה |
| מחיר ליחידה (₪) | modules/01_auth/PriceTiersDialog.jsx:144 | ① | קצר — כותרת/תווית סבירה |
| מחירים | modules/01_auth/SystemManagementPage.jsx:12 | ① | קצר — כותרת/תווית סבירה |
| מטריצת הרשאות | modules/01_auth/PermissionsMatrixPage.jsx:121 | ① | קצר — כותרת/תווית סבירה |
| מייל או סיסמה שגויים. נסה שוב. | modules/01_auth/LoginPage.jsx:65 | ① | תווית/כותרת/פעולה קצרה |
| מכמות | modules/01_auth/PriceTiersDialog.jsx:142 | ① | קצר — כותרת/תווית סבירה |
| מק"ט | modules/01_auth/PricesManagementPage.jsx:149 (×2) | ① | קצר — כותרת/תווית סבירה |
| מתחבר... | modules/01_auth/LoginPage.jsx:189 | ① | קצר — כותרת/תווית סבירה |
| ניהול הרשאות | lib/constants.js:10 (×2) | ① | קצר — כותרת/תווית סבירה |
| ניהול מערכת | components/layout/Sidebar.jsx:128 (×3) | ① | קצר — כותרת/תווית סבירה |
| ניהול משתמשים | modules/01_auth/SystemManagementPage.jsx:10 | ① | קצר — כותרת/תווית סבירה |
| סטטוס | modules/01_auth/PricesManagementPage.jsx:157 (×11) | ① | קצר — כותרת/תווית סבירה |
| סטטוס המוצר | modules/01_auth/PricesManagementPage.jsx:225 | ① | קצר — כותרת/תווית סבירה |
| סיסמה | modules/01_auth/LoginPage.jsx:169 | ① | קצר — כותרת/תווית סבירה |
| עד כמות | modules/01_auth/PriceTiersDialog.jsx:143 | ① | קצר — כותרת/תווית סבירה |
| עלות | modules/01_auth/PricesManagementPage.jsx:154 | ① | קצר — כותרת/תווית סבירה |
| עלות (₪) | modules/01_auth/ProductFormDialog.jsx:317 | ① | קצר — כותרת/תווית סבירה |
| ערוך משתמש | modules/01_auth/UsersManagementPage.jsx:371 | ① | קצר — כותרת/תווית סבירה |
| עריכת {p.item_name} | modules/01_auth/PricesManagementPage.jsx:246 | ① | קצר — כותרת/תווית סבירה |
| עריכת מוצר | modules/01_auth/PricesManagementPage.jsx:245 | ① | קצר — כותרת/תווית סבירה |
| עריכת משתמש | modules/01_auth/UsersManagementPage.jsx:249 | ① | קצר — כותרת/תווית סבירה |
| פעולות | modules/01_auth/UsersManagementPage.jsx:340 (×4) | ① | קצר — כותרת/תווית סבירה |
| פעיל | lib/catalog.js:14 (×4) | ① | קצר — כותרת/תווית סבירה |
| פרמטרים | modules/01_auth/SystemManagementPage.jsx:13 | ① | קצר — כותרת/תווית סבירה |
| צפייה בלבד | modules/01_auth/PermissionsMatrixPage.jsx:21 (×3) | ① | קצר — כותרת/תווית סבירה |
| צפייה ועריכה | modules/01_auth/PermissionsMatrixPage.jsx:20 | ① | קצר — כותרת/תווית סבירה |
| קטגוריה | modules/01_auth/PricesManagementPage.jsx:151 (×2) | ① | קצר — כותרת/תווית סבירה |
| קטלוג מוצרים ושירותים | modules/01_auth/PricesManagementPage.jsx:122 | ① | תווית/כותרת/פעולה קצרה |
| קישור לתמונה (רשות) | modules/01_auth/ProductFormDialog.jsx:283 | ① | קצר — כותרת/תווית סבירה |
| רשימת עובדים | modules/01_auth/UsersManagementPage.jsx:231 | ① | קצר — כותרת/תווית סבירה |
| שדה חובה | modules/01_auth/ProductFormDialog.jsx:61 (×2) | ① | קצר — כותרת/תווית סבירה |
| שולי רווח | modules/01_auth/PricesManagementPage.jsx:155 | ① | קצר — כותרת/תווית סבירה |
| שומר... | components/ProfileSettingsPage.jsx:157 (×12) | ① | קצר — כותרת/תווית סבירה |
| שכחת סיסמה? | modules/01_auth/LoginPage.jsx:226 | ① | קצר — כותרת/תווית סבירה |
| שם הפריט | modules/01_auth/PricesManagementPage.jsx:150 (×2) | ① | קצר — כותרת/תווית סבירה |
| שם מלא | components/ProfileSettingsPage.jsx:129 (×5) | ① | קצר — כותרת/תווית סבירה |
| שם פרטי ומשפחה | components/ProfileSettingsPage.jsx:133 (×2) | ① | קצר — כותרת/תווית סבירה |
| שמור שינויים | components/ProfileSettingsPage.jsx:157 (×6) | ① | קצר — כותרת/תווית סבירה |
| שמירת המדרגות | modules/01_auth/PriceTiersDialog.jsx:264 | ① | קצר — כותרת/תווית סבירה |
| תג שם רגיל - ממותג | modules/01_auth/ProductFormDialog.jsx:237 | ① | קצר — כותרת/תווית סבירה |
| תיאור (רשות) | modules/01_auth/ProductFormDialog.jsx:245 | ① | קצר — כותרת/תווית סבירה |
| תפעול ופרויקטים | lib/constants.js:20 (×3) | ① | קצר — כותרת/תווית סבירה |
| תפקיד | components/ProfileSettingsPage.jsx:107 (×3) | ① | קצר — כותרת/תווית סבירה |

#### מודול 2 (customers) — 188 מחרוזות ייחודיות

| מחרוזת | קובץ:שורה | סיווג | הערה |
|---|---|---|---|
| אי אפשר למחוק את איש הקשר הראשי. סמן קודם אחר כראשי. | modules/02_customers/CustomerFormDialog.jsx:77 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אין הצעות התואמות לסינון | modules/02_customers/CustomerDetailsPage.jsx:872 | ② | מצב-ריק |
| אין הצעות מחיר ללקוח הזה | modules/02_customers/CustomerDetailsPage.jsx:799 | ② | מצב-ריק |
| אין הרשאה לעדכן לקוח זה. | modules/02_customers/api.js:213 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין הרשאה לשנות את סטטוס הלקוח. | modules/02_customers/api.js:226 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין לך הרשאה לצפות בפרויקטים. | modules/02_customers/CustomerDetailsPage.jsx:1101 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין לקוחות בארכיון. | modules/02_customers/CustomersPage.jsx:771 | ② | מצב-ריק |
| אין לקוחות במערכת עדיין. | modules/02_customers/CustomersPage.jsx:618 | ② | מצב-ריק |
| אין לקוחות התואמים את החיפוש. | modules/02_customers/CustomersPage.jsx:765 | ② | מצב-ריק |
| אין לקוחות פעילים — כל הלקוחות בארכיון. | modules/02_customers/CustomersPage.jsx:773 | ② | מצב-ריק |
| אין לקוחות שאישרו קבלת דיוור. | modules/02_customers/MarketingPanel.jsx:341 | ② | מצב-ריק |
| אין נתונים עדיין | components/StatTile.jsx:30 (×6) | ② | מצב-ריק |
| אין עסקאות סגורות | modules/02_customers/CustomerDetailsPage.jsx:656 | ② | מצב-ריק |
| אין פרויקט התואם לחיפוש. נקה חיפוש | modules/02_customers/CustomerDetailsPage.jsx:1171 | ② | מצב-ריק |
| איש קשר אחד חייב להיות מסומן כראשי. הוא זה שמופיע בהצעת המחיר ומקבל את המיילים. | modules/02_customers/CustomerFormDialog.jsx:478 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הגדרות המסך לא נטענו — מסננת "לקוחות רדומים" ועמודת ההתרשמות אינן זמינות כרגע. | modules/02_customers/CustomersPage.jsx:600 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הלקוח {duplicate.customer.company_name} (ח"פ {duplicate.customer.company_number} ) קיים בארכיון — לשחזר? | modules/02_customers/CustomerFormDialog.jsx:403 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הלקוח יתווסף לרשימת הלקוחות במערכת. | modules/02_customers/CustomerFormDialog.jsx:338 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| העבר לארכיון: {customer.company_name} | modules/02_customers/CustomersPage.jsx:972 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| העלו חומר ושלחו אותו ללקוחות שאישרו קבלת דיוור. | modules/02_customers/CustomersPage.jsx:1029 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| העלו חומר שיווקי, בחרו נמענים מבין הלקוחות שאישרו דיוור, ושלחו. | modules/02_customers/MarketingPanel.jsx:148 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| העתקה נכשלה — ניתן להעתיק ידנית. | modules/02_customers/MarketingPanel.jsx:135 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חברה זו כבר רשומה במערכת: {duplicate.customer.company_name} (איש קשר: {primaryContact(duplicate.customer)?.contact_name ?? '—'}, ח"פ {duplicate.customer.company_number}). | modules/02_customers/CustomerFormDialog.jsx:381 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חברה זו כבר רשומה במערכת. רעננו את הרשימה כדי לראות את הכרטיס הקיים. | modules/02_customers/CustomerFormDialog.jsx:286 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חיפוש לפי שם חברה, איש קשר או ח"פ... | modules/02_customers/CustomersPage.jsx:634 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| טרם התקיים אירוע | modules/02_customers/CustomerDetailsPage.jsx:147 | ② | מצב-ריק |
| טרם ידוע אם יש הצעות פתוחות | modules/02_customers/CustomersPage.jsx:492 | ② | מצב-ריק |
| טרם נשלחה ללקוח | modules/02_customers/CustomerDetailsPage.jsx:935 (×2) | ② | מצב-ריק |
| לא ניתן היה לבדוק אילו הצעות כבר נשלחו ללקוח — בדקו בחלון המסמך לפני שליחה. | modules/02_customers/CustomerDetailsPage.jsx:807 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לטעון את אנשי הקשר כרגע. שאר פרטי הלקוח יישמרו כרגיל; נסו שוב מאוחר יותר לעריכת אנשי הקשר. | modules/02_customers/CustomerFormDialog.jsx:467 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לחצו על "+ לקוח חדש" כדי להוסיף את הלקוח הראשון. | modules/02_customers/CustomersPage.jsx:620 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מאושר לדיוור: {customer.company_name} | modules/02_customers/CustomersPage.jsx:1076 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מייל ל{contact.contact_name \|\| 'איש הקשר'} | modules/02_customers/CustomersPage.jsx:896 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נמענים — {checkedCount} מתוך {recipients.length} נבחרו | modules/02_customers/MarketingPanel.jsx:349 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נסו לשנות את מונחי החיפוש או לנקות את הסינון. | modules/02_customers/CustomersPage.jsx:766 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נתוני ההצעות לא נטענו — עמודת ההכנסות ריקה, וכל העברה לארכיון תבקש וידוא גם ללקוח שאין לו הצעות פתוחות. | modules/02_customers/CustomersPage.jsx:576 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סוג קובץ לא נתמך. יש להעלות PDF, JPG או PNG. | modules/02_customers/api.js:304 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סיבת דחייה: {quote.rejection_reason} | modules/02_customers/CustomerDetailsPage.jsx:928 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סינון {activeFilterCount > 0 && ( <span className="bg-teal-600 text-white text-xs rounded-full px-1.5 py-0.5"> {activeFilterCount} </span> )} | modules/02_customers/CustomersPage.jsx:639 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדיין לא נוצר פרויקט ללקוח הזה. פרויקט נולד מאישור הצעת מחיר. | modules/02_customers/CustomerDetailsPage.jsx:1135 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדכון הסכמת הדיוור נכשל. | modules/02_customers/CustomersPage.jsx:459 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדכון פרטי הלקוח. מספר הח"פ קבוע ואינו ניתן לשינוי. | modules/02_customers/CustomerFormDialog.jsx:337 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עריכת לקוח: {editingCustomer.company_name} | modules/02_customers/CustomerFormDialog.jsx:333 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| פתח כרטיס לקוח: {customer.company_name} | modules/02_customers/CustomersPage.jsx:863 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| פתח כרטיס פרויקט: {project.event_name} | modules/02_customers/CustomerDetailsPage.jsx:1286 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| קבצים נתמכים: PDF, JPG, PNG · עד {MARKETING_MAX_BYTES / 1024 / 1024}MB. | modules/02_customers/MarketingPanel.jsx:199 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| רדום · לפני {state.daysAgo} ימים | modules/02_customers/CustomerDetailsPage.jsx:158 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| רשימת הנמענים ארוכה מדי לשליחה דרך תוכנת הדוא"ל (חלק מהנמענים היו נחתכים בשקט). בטלו חלק מהנמענים, השתמשו ב"העתק רשימת נמענים" ושלחו ידנית, או המתינו לשליחת-השרת (מודול 10). | modules/02_customers/MarketingPanel.jsx:224 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שגיאה בטעינת אנשי הקשר. | modules/02_customers/api.js:242 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת היסטוריית הפרויקטים. | modules/02_customers/CustomerDetailsPage.jsx:276 (×3) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת כרטיס הלקוח. | modules/02_customers/CustomerDetailsPage.jsx:455 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת נתוני הפרויקטים. | modules/02_customers/api.js:140 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת פרטי הלקוח. | modules/02_customers/api.js:58 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת רשימת הלקוחות. | modules/02_customers/CustomersPage.jsx:179 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת רשימת הנמענים המאושרים. | modules/02_customers/MarketingPanel.jsx:334 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שחזור הלקוח מהארכיון נכשל. | modules/02_customers/CustomerFormDialog.jsx:304 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שחזר מהארכיון: {customer.company_name} | modules/02_customers/CustomersPage.jsx:986 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שינוי סטטוס הלקוח נכשל. | modules/02_customers/CustomersPage.jsx:506 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שמירת אנשי הקשר נכשלה. | modules/02_customers/api.js:283 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שמירת השינויים נכשלה. | modules/02_customers/api.js:212 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תאריך האירוע טרם עבר · הקרוב ראשון | modules/02_customers/CustomerDetailsPage.jsx:1192 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תאריך האירוע עבר, או שהפרויקט בוטל · האחרון ראשון · המבוטלים בסוף | modules/02_customers/CustomerDetailsPage.jsx:1201 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| % הנחה | modules/02_customers/CustomersPage.jsx:811 | ① | קצר — כותרת/תווית סבירה |
| + לקוח חדש | modules/02_customers/CustomersPage.jsx:543 (×2) | ① | קצר — כותרת/תווית סבירה |
| ✉ מייל | modules/02_customers/CustomersPage.jsx:894 | ① | קצר — כותרת/תווית סבירה |
| 30 הימים האחרונים | modules/02_customers/CustomersFilterSheet.jsx:99 | ① | קצר — כותרת/תווית סבירה |
| 90 הימים האחרונים | modules/02_customers/CustomersFilterSheet.jsx:100 | ① | קצר — כותרת/תווית סבירה |
| אזור שיווק | modules/02_customers/MarketingPanel.jsx:147 | ① | קצר — כותרת/תווית סבירה |
| אחוז הנחה קבוע | modules/02_customers/CustomerDetailsPage.jsx:717 | ① | קצר — כותרת/תווית סבירה |
| אחוז הנחה קבוע (0–100) | modules/02_customers/CustomerFormDialog.jsx:447 | ① | תווית/כותרת/פעולה קצרה |
| אחרי {discountPercent}% הנחה | modules/02_customers/CustomerDetailsPage.jsx:917 (×2) | ① | תווית/כותרת/פעולה קצרה |
| אימייל | modules/02_customers/CustomerDetailsPage.jsx:713 (×5) | ① | קצר — כותרת/תווית סבירה |
| אירוע אחרון | modules/02_customers/CustomerDetailsPage.jsx:669 | ① | קצר — כותרת/תווית סבירה |
| איש הקשר | modules/02_customers/CustomersPage.jsx:896 | ① | קצר — כותרת/תווית סבירה |
| איש קשר | modules/02_customers/CustomerDetailsPage.jsx:708 (×5) | ① | קצר — כותרת/תווית סבירה |
| אנשי קשר | modules/02_customers/CustomerFormDialog.jsx:477 | ① | קצר — כותרת/תווית סבירה |
| אנשי קשר נוספים | modules/02_customers/CustomerDetailsPage.jsx:725 | ① | קצר — כותרת/תווית סבירה |
| ארכיון | modules/02_customers/CustomersPage.jsx:740 | ① | קצר — כותרת/תווית סבירה |
| בארכיון | modules/02_customers/CustomerDetailsPage.jsx:602 | ① | קצר — כותרת/תווית סבירה |
| בחר הכל | modules/02_customers/MarketingPanel.jsx:359 | ① | קצר — כותרת/תווית סבירה |
| בחר סוג לקוח | modules/02_customers/CustomerFormDialog.jsx:432 | ① | קצר — כותרת/תווית סבירה |
| בלי הנחה | modules/02_customers/CustomersFilterSheet.jsx:129 | ① | קצר — כותרת/תווית סבירה |
| בתהליך | lib/projects.js:10 (×4) | ① | קצר — כותרת/תווית סבירה |
| גודל עסקה ממוצע | modules/02_customers/CustomerDetailsPage.jsx:654 | ① | קצר — כותרת/תווית סבירה |
| הוסף איש קשר | modules/02_customers/CustomerFormDialog.jsx:616 | ① | קצר — כותרת/תווית סבירה |
| הוסף לקוח | modules/02_customers/CustomerFormDialog.jsx:664 | ① | קצר — כותרת/תווית סבירה |
| החדשות ראשונות | modules/02_customers/CustomerDetailsPage.jsx:97 | ① | קצר — כותרת/תווית סבירה |
| החלף קובץ | modules/02_customers/MarketingPanel.jsx:163 | ① | קצר — כותרת/תווית סבירה |
| החלף קובץ שיווקי | modules/02_customers/MarketingPanel.jsx:169 | ① | קצר — כותרת/תווית סבירה |
| היה אמור להתקיים | modules/02_customers/CustomerDetailsPage.jsx:1295 | ① | קצר — כותרת/תווית סבירה |
| הכל | modules/02_customers/CustomerDetailsPage.jsx:829 (×4) | ① | קצר — כותרת/תווית סבירה |
| הלקוח הועבר לארכיון | modules/02_customers/CustomersPage.jsx:504 | ① | קצר — כותרת/תווית סבירה |
| הלקוח לא נמצא. | modules/02_customers/CustomerDetailsPage.jsx:511 | ① | קצר — כותרת/תווית סבירה |
| הלקוח שוחזר | modules/02_customers/CustomersPage.jsx:504 | ① | קצר — כותרת/תווית סבירה |
| הנחה | modules/02_customers/CustomersFilterSheet.jsx:107 (×2) | ① | קצר — כותרת/תווית סבירה |
| הסר איש קשר | modules/02_customers/CustomerFormDialog.jsx:529 | ① | קצר — כותרת/תווית סבירה |
| הסר איש קשר {idx + 1} | modules/02_customers/CustomerFormDialog.jsx:530 | ① | תווית/כותרת/פעולה קצרה |
| הסר את הקובץ שהועלה | modules/02_customers/MarketingPanel.jsx:185 | ① | קצר — כותרת/תווית סבירה |
| הסר קובץ | modules/02_customers/MarketingPanel.jsx:184 | ① | קצר — כותרת/תווית סבירה |
| העבר לארכיון | modules/02_customers/CustomersPage.jsx:494 (×4) | ① | קצר — כותרת/תווית סבירה |
| העלאת הקובץ נכשלה. | modules/02_customers/MarketingPanel.jsx:86 (×2) | ① | קצר — כותרת/תווית סבירה |
| העלה קובץ | modules/02_customers/MarketingPanel.jsx:163 | ① | קצר — כותרת/תווית סבירה |
| העלה קובץ שיווקי | modules/02_customers/MarketingPanel.jsx:169 | ① | קצר — כותרת/תווית סבירה |
| העתק קישור | modules/02_customers/MarketingPanel.jsx:259 | ① | קצר — כותרת/תווית סבירה |
| העתק רשימת נמענים | modules/02_customers/MarketingPanel.jsx:271 | ① | קצר — כותרת/תווית סבירה |
| הפוך לראשי | modules/02_customers/CustomerFormDialog.jsx:514 | ① | קצר — כותרת/תווית סבירה |
| הצעה חדשה | modules/02_customers/CustomerDetailsPage.jsx:610 | ① | קצר — כותרת/תווית סבירה |
| הצעות מחיר | App.jsx:147 (×8) | ① | קצר — כותרת/תווית סבירה |
| הקובץ גדול מדי (מותר עד 10MB). | modules/02_customers/api.js:307 | ① | תווית/כותרת/פעולה קצרה |
| הקישור הועתק | modules/02_customers/MarketingPanel.jsx:285 | ① | קצר — כותרת/תווית סבירה |
| הראשון מתוכנן ל- | modules/02_customers/CustomerDetailsPage.jsx:149 | ① | קצר — כותרת/תווית סבירה |
| התקיימו | modules/02_customers/CustomerDetailsPage.jsx:1200 | ① | קצר — כותרת/תווית סבירה |
| ח"פ | modules/02_customers/CustomerDetailsPage.jsx:701 (×3) | ① | קצר — כותרת/תווית סבירה |
| ח"פ (9 ספרות) | modules/02_customers/CustomerFormDialog.jsx:357 | ① | קצר — כותרת/תווית סבירה |
| חזרה לפעילים | modules/02_customers/CustomersPage.jsx:745 | ① | קצר — כותרת/תווית סבירה |
| חזרה לרשימת הלקוחות | modules/02_customers/CustomerDetailsPage.jsx:512 (×2) | ① | קצר — כותרת/תווית סבירה |
| חיפוש לפי שם אירוע | modules/02_customers/CustomerDetailsPage.jsx:824 (×2) | ① | קצר — כותרת/תווית סבירה |
| טעון בירור | lib/projectFinance.js:195 (×5) | ① | קצר — כותרת/תווית סבירה |
| יצירת הלקוח נכשלה. | modules/02_customers/api.js:193 | ① | קצר — כותרת/תווית סבירה |
| יש הנחה | modules/02_customers/CustomersFilterSheet.jsx:128 | ① | קצר — כותרת/תווית סבירה |
| כל הזמן | modules/02_customers/CustomersFilterSheet.jsx:95 (×2) | ① | קצר — כותרת/תווית סבירה |
| כל הסוגים | modules/02_customers/CustomersFilterSheet.jsx:59 (×2) | ① | קצר — כותרת/תווית סבירה |
| כן | modules/02_customers/CustomerDetailsPage.jsx:718 (×2) | ① | קצר — כותרת/תווית סבירה |
| כספים | App.jsx:210 (×4) | ① | קצר — כותרת/תווית סבירה |
| לא | modules/02_customers/CustomerDetailsPage.jsx:718 (×2) | ① | קצר — כותרת/תווית סבירה |
| לא מאושר | modules/02_customers/CustomersPage.jsx:919 | ① | קצר — כותרת/תווית סבירה |
| לא נבחר קובץ. | modules/02_customers/api.js:302 (×2) | ① | קצר — כותרת/תווית סבירה |
| לכרטיס → | modules/02_customers/CustomerDetailsPage.jsx:1322 (×2) | ① | קצר — כותרת/תווית סבירה |
| ללקוח יש הצעות פתוחות | modules/02_customers/CustomersPage.jsx:492 | ① | תווית/כותרת/פעולה קצרה |
| לקוח חדש | modules/02_customers/CustomerFormDialog.jsx:333 | ① | קצר — כותרת/תווית סבירה |
| לקוחות | App.jsx:127 (×6) | ① | קצר — כותרת/תווית סבירה |
| מ-{count} משובים שהתקבלו | modules/02_customers/CustomerDetailsPage.jsx:171 | ① | תווית/כותרת/פעולה קצרה |
| מאושר | modules/02_customers/CustomersPage.jsx:919 | ① | קצר — כותרת/תווית סבירה |
| מאושר לדיוור | modules/02_customers/CustomerDetailsPage.jsx:718 | ① | קצר — כותרת/תווית סבירה |
| מאושר לדיוור שיווקי | modules/02_customers/CustomerFormDialog.jsx:630 | ① | קצר — כותרת/תווית סבירה |
| מאושרות | modules/02_customers/CustomerDetailsPage.jsx:831 (×2) | ① | קצר — כותרת/תווית סבירה |
| מופיע בהצעת המחיר | modules/02_customers/CustomerFormDialog.jsx:511 | ① | קצר — כותרת/תווית סבירה |
| מחיקה חסומה | modules/02_customers/CustomerFormDialog.jsx:530 | ① | קצר — כותרת/תווית סבירה |
| מיון | modules/02_customers/CustomerDetailsPage.jsx:858 (×2) | ① | קצר — כותרת/תווית סבירה |
| מיון: {s.label} | modules/02_customers/CustomerDetailsPage.jsx:863 (×2) | ① | קצר — כותרת/תווית סבירה |
| ממוצע משוב | modules/02_customers/CustomerDetailsPage.jsx:682 | ① | קצר — כותרת/תווית סבירה |
| ממשוב אחד שהתקבל | modules/02_customers/CustomerDetailsPage.jsx:171 | ① | קצר — כותרת/תווית סבירה |
| מסחרי | modules/02_customers/CustomerDetailsPage.jsx:716 | ① | קצר — כותרת/תווית סבירה |
| מספר אירועים | modules/02_customers/CustomerDetailsPage.jsx:662 | ① | קצר — כותרת/תווית סבירה |
| מעלה... | modules/02_customers/MarketingPanel.jsx:194 | ① | קצר — כותרת/תווית סבירה |
| מצב | modules/02_customers/CustomerDetailsPage.jsx:1238 (×5) | ① | קצר — כותרת/תווית סבירה |
| מתקרבים | modules/02_customers/CustomerDetailsPage.jsx:1191 | ① | קצר — כותרת/תווית סבירה |
| נדחו | modules/02_customers/CustomerDetailsPage.jsx:832 (×2) | ① | קצר — כותרת/תווית סבירה |
| נוספו לאחרונה | modules/02_customers/CustomersFilterSheet.jsx:75 | ① | קצר — כותרת/תווית סבירה |
| ניתן לסמן איש קשר ראשי אחד בלבד. | modules/02_customers/CustomerFormDialog.jsx:80 | ① | תווית/כותרת/פעולה קצרה |
| נסה שוב | components/LoadingOrError.jsx:112 (×4) | ① | קצר — כותרת/תווית סבירה |
| נקה הכל | modules/02_customers/CustomersFilterSheet.jsx:35 (×2) | ① | קצר — כותרת/תווית סבירה |
| נשלחה ללקוח | modules/02_customers/CustomerDetailsPage.jsx:940 (×2) | ① | קצר — כותרת/תווית סבירה |
| סה"כ הצעות מאושרות | modules/02_customers/CustomersPage.jsx:825 | ① | קצר — כותרת/תווית סבירה |
| סוג לקוח | modules/02_customers/CustomerDetailsPage.jsx:703 (×4) | ① | קצר — כותרת/תווית סבירה |
| סינון מתקדם | modules/02_customers/CustomersFilterSheet.jsx:34 | ① | קצר — כותרת/תווית סבירה |
| סכום | modules/02_customers/CustomerDetailsPage.jsx:886 (×3) | ① | קצר — כותרת/תווית סבירה |
| סכום — מהגבוה | modules/02_customers/CustomerDetailsPage.jsx:98 (×2) | ① | קצר — כותרת/תווית סבירה |
| ערוך את הכרטיס הקיים | modules/02_customers/CustomerFormDialog.jsx:391 | ① | קצר — כותרת/תווית סבירה |
| ערוך לקוח | modules/02_customers/CustomersPage.jsx:956 | ① | קצר — כותרת/תווית סבירה |
| ערוך לקוח: {customer.company_name} | modules/02_customers/CustomersPage.jsx:957 | ① | תווית/כותרת/פעולה קצרה |
| עריכת פרטים | modules/02_customers/CustomerDetailsPage.jsx:621 | ① | קצר — כותרת/תווית סבירה |
| פג תוקף | components/StatusTag.jsx:51 (×5) | ① | קצר — כותרת/תווית סבירה |
| פגה | modules/02_customers/CustomerDetailsPage.jsx:115 | ① | קצר — כותרת/תווית סבירה |
| פרויקטים | App.jsx:174 (×10) | ① | קצר — כותרת/תווית סבירה |
| פרטי חברה | modules/02_customers/CustomerDetailsPage.jsx:700 | ① | קצר — כותרת/תווית סבירה |
| קהל דיוור | modules/02_customers/CustomersPage.jsx:656 | ① | קצר — כותרת/תווית סבירה |
| ראשי | modules/02_customers/CustomerFormDialog.jsx:505 | ① | קצר — כותרת/תווית סבירה |
| רדומים | modules/02_customers/CustomersPage.jsx:677 | ① | קצר — כותרת/תווית סבירה |
| רווח גולמי מהלקוח | modules/02_customers/CustomerDetailsPage.jsx:641 | ① | קצר — כותרת/תווית סבירה |
| רשימת הנמענים הועתקה | modules/02_customers/MarketingPanel.jsx:285 | ① | קצר — כותרת/תווית סבירה |
| רשימת לקוחות | modules/02_customers/CustomersPage.jsx:528 | ① | קצר — כותרת/תווית סבירה |
| שביעות רצון | modules/02_customers/CustomerDetailsPage.jsx:1239 (×4) | ① | קצר — כותרת/תווית סבירה |
| שווי הצעות פתוחות | modules/02_customers/CustomerDetailsPage.jsx:648 (×2) | ① | קצר — כותרת/תווית סבירה |
| שחזר מהארכיון | modules/02_customers/CustomersPage.jsx:985 | ① | קצר — כותרת/תווית סבירה |
| שחזר מהארכיון ופתח לעריכה | modules/02_customers/CustomerFormDialog.jsx:407 | ① | תווית/כותרת/פעולה קצרה |
| שלח ל{r.company_name} | modules/02_customers/MarketingPanel.jsx:374 | ① | תווית/כותרת/פעולה קצרה |
| שלח לנמענים שנבחרו | modules/02_customers/MarketingPanel.jsx:236 (×2) | ① | קצר — כותרת/תווית סבירה |
| שליחת חומר שיווקי | modules/02_customers/CustomersPage.jsx:533 (×2) | ① | קצר — כותרת/תווית סבירה |
| שם | lib/salaryReport.js:52 (×4) | ① | קצר — כותרת/תווית סבירה |
| שם איש הקשר | modules/02_customers/CustomerFormDialog.jsx:553 | ① | קצר — כותרת/תווית סבירה |
| שם האירוע | modules/02_customers/CustomerDetailsPage.jsx:885 (×2) | ① | קצר — כותרת/תווית סבירה |
| שם החברה / הארגון | modules/02_customers/CustomerFormDialog.jsx:349 | ① | קצר — כותרת/תווית סבירה |
| שם לקוח | modules/02_customers/CustomerFormDialog.jsx:344 (×2) | ① | קצר — כותרת/תווית סבירה |
| תאריך אירוע | modules/02_customers/CustomerDetailsPage.jsx:884 (×2) | ① | קצר — כותרת/תווית סבירה |
| תאריך האירוע — הקרוב | modules/02_customers/CustomerDetailsPage.jsx:99 (×2) | ① | קצר — כותרת/תווית סבירה |
| תוכן שיווקי | modules/02_customers/CustomersPage.jsx:817 | ① | קצר — כותרת/תווית סבירה |
| תצוגה מקדימה: {name} | modules/02_customers/MarketingPanel.jsx:309 | ① | קצר — כותרת/תווית סבירה |

#### מודול 3 (quotes) — 190 מחרוזות ייחודיות

| מחרוזת | קובץ:שורה | סיווג | הערה |
|---|---|---|---|
| המחירים בשקלים חדשים; מע"מ מחושב בשורת הסיכום על פי השיעור בתוקף במועד ההפקה. | modules/03_quotes/quotePdf.jsx:252 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| {metrics.approvedCount} מתוך {metrics.closedCount} שנסגרו | modules/03_quotes/QuotesPage.jsx:420 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {metrics.openCount} ממתינות לתשובת הלקוח | modules/03_quotes/QuotesPage.jsx:409 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {quote?.event_name ?? ''} · {quote?.customers?.company_name ?? ''}. ההצעה תיסגר ולא ניתן יהיה לערוך אותה שוב. | modules/03_quotes/RejectQuoteDialog.jsx:39 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אין הצעות בלשונית זו. | modules/03_quotes/QuotesPage.jsx:700 | ② | מצב-ריק |
| אין הצעות התואמות את החיפוש. | modules/03_quotes/QuotesPage.jsx:694 | ② | מצב-ריק |
| אין הצעות מחיר במערכת עדיין. | modules/03_quotes/QuotesPage.jsx:685 | ② | מצב-ריק |
| אין הרשאה לדחות הצעה זו. | modules/03_quotes/api.js:205 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין לך הרשאת עריכה להצעות מחיר. | modules/03_quotes/QuoteBuilderPage.jsx:400 | ② | מצב-ריק |
| אין עדיין לקוחות במערכת. | modules/03_quotes/CustomerPicker.jsx:182 | ② | מצב-ריק |
| איש קשר: {selectedContact.contact_name} | modules/03_quotes/QuoteBuilderPage.jsx:642 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אישור הצעה זו מהווה חתימה על הסכם התקשרות מול REG-IN. | modules/03_quotes/quotePdf.jsx:250 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אספקת השירותים מותנית בקבלת מלוא פרטי האירוע מהלקוח במועד סביר מראש. | modules/03_quotes/quotePdf.jsx:255 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ביטול הזמנה לאחר אישורה כפוף לחיוב בגין עלויות שכבר הוצאו בפועל. | modules/03_quotes/quotePdf.jsx:254 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| בשורות המפרט {actualHostesses} דיילות, ובפרטי האירוע נקבעו {Number(form.hostessCount)}. | modules/03_quotes/QuoteBuilderPage.jsx:673 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההמלצה: {recommendedHostesses} — החזרה | modules/03_quotes/QuoteBuilderPage.jsx:617 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההנחות חורגות מ-100% ({Number(form.appliedDiscount)}% + {Number(form.manualDiscount) \|\| 0} %) — לא ניתן לחשב סיכום ולא ניתן לשמור. תקנו את ההנחה הנוספת. | modules/03_quotes/QuoteBuilderPage.jsx:768 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההצעה לא נמצאה, או שאין לך הרשאה לצפות בה. | modules/03_quotes/QuoteBuilderPage.jsx:180 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההצעה לא נשלחה ללקוח — יש לנסות שוב. | modules/03_quotes/QuoteDocumentDialog.jsx:305 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההצעה נשמרה, אך לא ניתן לפתוח את חלון השליחה — ניתן לשלוח אותה ממסך ההצעות. | modules/03_quotes/QuoteBuilderPage.jsx:379 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההצעה תקפה 30 יום ממועד הפקתה, אלא אם צוין אחרת. | modules/03_quotes/quotePdf.jsx:251 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| החלפת לקוח (נבחר: {selectedCustomer.company_name}) | modules/03_quotes/CustomerPicker.jsx:93 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הכנת נתוני-השליחה נכשלה. | modules/03_quotes/QuoteDocumentDialog.jsx:273 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הלקוח נשמר, אך רענון הרשימה נכשל. | modules/03_quotes/QuoteBuilderPage.jsx:301 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המחירים כוללים את הציוד והשירותים המפורטים בהצעה זו בלבד. | modules/03_quotes/quotePdf.jsx:249 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המייל נשלח, אך רישום השליחה ביומן נכשל. | modules/03_quotes/QuoteDocumentDialog.jsx:291 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המסמך גדול מדי לשליחה — יש להוריד ולשלוח ידנית. | modules/03_quotes/QuoteDocumentDialog.jsx:244 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המסמך גדול מדי לשליחה אוטומטית. יש להוריד אותו ולשלוח ידנית. | modules/03_quotes/QuoteDocumentDialog.jsx:243 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המסמך כפי שהלקוח {quote?.customers?.company_name} יקבל אותו. | modules/03_quotes/QuoteDocumentDialog.jsx:319 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הנחה ידנית ({Number(manualDiscount \|\| 0)}%) | modules/03_quotes/QuoteSummaryPanel.jsx:58 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הנחה נוספת ({quote?.manualDiscount ?? 0}%) | modules/03_quotes/quotePdf.jsx:407 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הנחה קבועה {Number(form.appliedDiscount)}% | modules/03_quotes/QuoteBuilderPage.jsx:646 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הנחת לקוח ({Number(appliedDiscount \|\| 0)}%) | modules/03_quotes/QuoteSummaryPanel.jsx:53 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הנחת לקוח ({quote?.appliedCustomerDiscount ?? 0}%) | modules/03_quotes/quotePdf.jsx:402 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הסרת פריט: {line.itemName \|\| 'ללא מוצר'} | modules/03_quotes/QuoteLineEditor.jsx:301 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הערות להצעה — מופיעות במסמך שנשלח ללקוח | modules/03_quotes/QuoteBuilderPage.jsx:727 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הצעת מחיר {quote?.quote_id} — {quote?.event_name} | modules/03_quotes/QuoteDocumentDialog.jsx:316 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא התקבל אישור שליחה — יש לבדוק לפני שליחה חוזרת. | modules/03_quotes/QuoteDocumentDialog.jsx:304 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא ניתן לחשב רווחיות — חסרה עלות רכש {missingCostProducts.length > 1 ? 'למוצרים' : 'למוצר'}: {missingCostProducts.join(' · ')} | modules/03_quotes/QuoteSummaryPanel.jsx:91 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לערוך הצעה שאינה בסטטוס "בתהליך". | modules/03_quotes/QuoteBuilderPage.jsx:183 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא נמצא לקוח תואם. | modules/03_quotes/CustomerPicker.jsx:183 | ② | מצב-ריק |
| לחצו על "+ הצעה חדשה" כדי ליצור את ההצעה הראשונה. | modules/03_quotes/QuotesPage.jsx:687 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לקוח בשם זה נמצא בארכיון — יש לשחזר אותו במסך הלקוחות כדי להציע לו הצעה. | modules/03_quotes/CustomerPicker.jsx:180 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מדרגה {tier.min_qty}–{tier.max_qty ?? '∞'} | modules/03_quotes/QuoteLineEditor.jsx:269 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מוצר מושבת — לא יוצע בהצעות חדשות | modules/03_quotes/QuoteLineEditor.jsx:193 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מעקב אחר הצעות שנשלחו, ואישור או דחייה שלהן | modules/03_quotes/QuotesPage.jsx:399 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נשלח כבר ב-{formatDate(previousSend.created_at)} אל {previousSend.recipient} | modules/03_quotes/QuoteDocumentDialog.jsx:365 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדיין לא נוספו פריטים להצעה. | modules/03_quotes/QuoteLineEditor.jsx:320 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עם האישור ייפתח פרויקט חדש, וההצעה תינעל לעריכה. | modules/03_quotes/ApproveQuoteDialog.jsx:39 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עמוד {pageNumber} מתוך {totalPages} | modules/03_quotes/quotePdf.jsx:450 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| פנימי — לא מופיע בהצעה ללקוח. | modules/03_quotes/QuoteSummaryPanel.jsx:103 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שגיאה בטעינת הגדרות ההצעות. | modules/03_quotes/api.js:77 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת היסטוריית ההצעות של הלקוח. | modules/03_quotes/api.js:108 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת נתוני ההצעה. | modules/03_quotes/QuoteBuilderPage.jsx:211 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת פרטי ההצעה. | modules/03_quotes/api.js:93 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת פרמטרי התמחור. | modules/03_quotes/api.js:144 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת רשימת ההצעות. | modules/03_quotes/QuotesPage.jsx:202 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שיעור המע"מ אינו מוגדר בהגדרות המערכת — לא ניתן להפיק מסמך ללקוח. יש להוסיף את הפרמטר אחוז_מעמ בהגדרות המערכת. | modules/03_quotes/quotePdf.jsx:311 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שיעור המע"מ אינו מוגדר בהגדרות המערכת — לא ניתן לתמחר הצעה. | modules/03_quotes/QuoteBuilderPage.jsx:405 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תבנית המייל מכילה שדה לא-מוכר — המייל לא נשלח. | modules/03_quotes/QuoteDocumentDialog.jsx:257 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תבנית המייל מכילה שדה שהמערכת אינה מכירה: {list}. יש לתקן את התבנית בהגדרות. | modules/03_quotes/QuoteDocumentDialog.jsx:255 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תוספות ושינויים שיתבקשו לאחר האישור יתומחרו בנפרד ויעוגנו בעדכון בכתב. | modules/03_quotes/quotePdf.jsx:253 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| · ח"פ  | modules/03_quotes/CustomerPicker.jsx:165 | ① | קצר — כותרת/תווית סבירה |
| {eventHours} שעות | modules/03_quotes/QuoteBuilderPage.jsx:565 | ① | קצר — כותרת/תווית סבירה |
| + הצעה חדשה | modules/03_quotes/QuotesPage.jsx:494 | ① | קצר — כותרת/תווית סבירה |
| ✉ מייל לאיש הקשר | modules/03_quotes/QuotesPage.jsx:763 | ① | קצר — כותרת/תווית סבירה |
| ✓ נשלח ל-{customerEmail} | modules/03_quotes/QuoteDocumentDialog.jsx:375 | ① | תווית/כותרת/פעולה קצרה |
| אורחים * | modules/03_quotes/QuoteBuilderPage.jsx:578 | ① | קצר — כותרת/תווית סבירה |
| אחר | lib/feedback.js:76 (×6) | ① | קצר — כותרת/תווית סבירה |
| אירוע | modules/03_quotes/ApproveQuoteDialog.jsx:49 (×5) | ① | קצר — כותרת/תווית סבירה |
| אירועים קרובים | modules/03_quotes/QuotesPage.jsx:600 | ① | קצר — כותרת/תווית סבירה |
| אישור ההצעה נכשל. | modules/03_quotes/ApproveQuoteDialog.jsx:42 (×2) | ① | קצר — כותרת/תווית סבירה |
| אישור הצעה {quote?.quote_id ?? ''} | modules/03_quotes/ApproveQuoteDialog.jsx:38 | ① | תווית/כותרת/פעולה קצרה |
| אישור ופתיחת פרויקט | modules/03_quotes/ApproveQuoteDialog.jsx:40 | ① | קצר — כותרת/תווית סבירה |
| בבחירת "אחר" יש לפרט את הסיבה. | modules/03_quotes/RejectQuoteDialog.jsx:29 | ① | תווית/כותרת/פעולה קצרה |
| בחירת מוצר... | modules/03_quotes/QuoteLineEditor.jsx:163 | ① | קצר — כותרת/תווית סבירה |
| ביטול | components/ConfirmDialog.jsx:38 (×10) | ① | פועל-פעולה על כפתור |
| דוחה... | modules/03_quotes/RejectQuoteDialog.jsx:41 | ① | קצר — כותרת/תווית סבירה |
| דחיית ההצעה | lib/quotes.js:37 (×2) | ① | קצר — כותרת/תווית סבירה |
| דחיית ההצעה נכשלה. | modules/03_quotes/RejectQuoteDialog.jsx:42 (×2) | ① | קצר — כותרת/תווית סבירה |
| דחיית הצעה {quote?.quote_id ?? ''} | modules/03_quotes/RejectQuoteDialog.jsx:38 | ① | תווית/כותרת/פעולה קצרה |
| דיילות * | modules/03_quotes/QuoteBuilderPage.jsx:602 | ① | קצר — כותרת/תווית סבירה |
| דיילות נדרשות | modules/03_quotes/ApproveQuoteDialog.jsx:57 | ① | קצר — כותרת/תווית סבירה |
| האירוע נמשך אל תוך הלילה. | modules/03_quotes/QuoteBuilderPage.jsx:654 | ① | תווית/כותרת/פעולה קצרה |
| ההצעה | modules/03_quotes/QuotesPage.jsx:712 | ① | קצר — כותרת/תווית סבירה |
| ההצעה כבר נשלחה ללקוח. לשלוח שוב? | modules/03_quotes/QuoteDocumentDialog.jsx:220 | ① | תווית/כותרת/פעולה קצרה |
| ההצעה נשלחה ל-{payload.to}. | modules/03_quotes/QuoteDocumentDialog.jsx:293 | ① | תווית/כותרת/פעולה קצרה |
| ההצעה נשמרה. | modules/03_quotes/QuoteBuilderPage.jsx:358 | ① | קצר — כותרת/תווית סבירה |
| ההצעה עודכנה. | modules/03_quotes/QuoteBuilderPage.jsx:353 | ① | קצר — כותרת/תווית סבירה |
| הוספת פריט | modules/03_quotes/QuoteLineEditor.jsx:327 | ① | קצר — כותרת/תווית סבירה |
| הורדת PDF | modules/03_quotes/QuoteDocumentDialog.jsx:406 | ① | קצר — כותרת/תווית סבירה |
| החלפת לקוח | modules/03_quotes/CustomerPicker.jsx:92 | ① | קצר — כותרת/תווית סבירה |
| המשך לשליחה | modules/03_quotes/QuoteBuilderPage.jsx:330 (×2) | ① | קצר — כותרת/תווית סבירה |
| הנדון | modules/03_quotes/quotePdf.jsx:383 | ① | קצר — כותרת/תווית סבירה |
| הנחות והערות | modules/03_quotes/QuoteBuilderPage.jsx:682 | ① | קצר — כותרת/תווית סבירה |
| הסרת פריט | modules/03_quotes/QuoteLineEditor.jsx:300 | ① | קצר — כותרת/תווית סבירה |
| הערה | modules/03_quotes/QuoteLineEditor.jsx:128 (×3) | ① | קצר — כותרת/תווית סבירה |
| הערה לשורה | modules/03_quotes/QuoteLineEditor.jsx:288 | ① | קצר — כותרת/תווית סבירה |
| הערות | modules/03_quotes/quotePdf.jsx:266 (×2) | ① | קצר — כותרת/תווית סבירה |
| הפקת המסמך נכשלה. | modules/03_quotes/QuoteDocumentDialog.jsx:130 | ① | קצר — כותרת/תווית סבירה |
| הצעת מחיר {quote?.quoteId ?? ''} | modules/03_quotes/quotePdf.jsx:345 | ① | תווית/כותרת/פעולה קצרה |
| הצעת מחיר חדשה | modules/03_quotes/QuoteBuilderPage.jsx:413 | ① | קצר — כותרת/תווית סבירה |
| הצעת מחיר ללקוח | modules/03_quotes/quotePdf.jsx:350 | ① | קצר — כותרת/תווית סבירה |
| הקרוב לפוג ראשון | modules/03_quotes/QuotesPage.jsx:78 | ① | קצר — כותרת/תווית סבירה |
| ח"פ  | modules/03_quotes/QuoteBuilderPage.jsx:638 | ① | קצר — כותרת/תווית סבירה |
| חיפוש לקוח או אירוע... | modules/03_quotes/QuotesPage.jsx:518 | ① | תווית/כותרת/פעולה קצרה |
| יחס | modules/03_quotes/QuoteBuilderPage.jsx:590 | ① | קצר — כותרת/תווית סבירה |
| יש לבחור סיבת דחייה. | modules/03_quotes/RejectQuoteDialog.jsx:28 | ① | קצר — כותרת/תווית סבירה |
| יש שדות שדורשים תיקון לפני השמירה. | modules/03_quotes/QuoteBuilderPage.jsx:312 | ① | תווית/כותרת/פעולה קצרה |
| כל הלקוחות | modules/03_quotes/QuotesPage.jsx:534 | ① | קצר — כותרת/תווית סבירה |
| כמות | modules/03_quotes/QuoteLineEditor.jsx:123 (×3) | ① | קצר — כותרת/תווית סבירה |
| לכבוד | modules/03_quotes/quotePdf.jsx:373 | ① | קצר — כותרת/תווית סבירה |
| ללא מוצר | modules/03_quotes/QuoteLineEditor.jsx:301 | ① | קצר — כותרת/תווית סבירה |
| למוצר | modules/03_quotes/QuoteSummaryPanel.jsx:99 | ① | קצר — כותרת/תווית סבירה |
| למוצרים | modules/03_quotes/QuoteSummaryPanel.jsx:99 | ① | קצר — כותרת/תווית סבירה |
| לקוח | modules/03_quotes/ApproveQuoteDialog.jsx:48 (×6) | ① | קצר — כותרת/תווית סבירה |
| לקוח * | modules/03_quotes/QuoteBuilderPage.jsx:463 | ① | קצר — כותרת/תווית סבירה |
| לקוח ופרטי האירוע | modules/03_quotes/QuoteBuilderPage.jsx:457 | ① | קצר — כותרת/תווית סבירה |
| לרשימת ההצעות | modules/03_quotes/QuoteBuilderPage.jsx:436 | ① | קצר — כותרת/תווית סבירה |
| מאשר... | modules/03_quotes/ApproveQuoteDialog.jsx:41 | ① | קצר — כותרת/תווית סבירה |
| מה הייתה הסיבה? | modules/03_quotes/RejectQuoteDialog.jsx:89 | ① | קצר — כותרת/תווית סבירה |
| מחיר יחידה | modules/03_quotes/quotePdf.jsx:267 | ① | קצר — כותרת/תווית סבירה |
| מחיר ליחידה | modules/03_quotes/QuoteLineEditor.jsx:124 | ① | קצר — כותרת/תווית סבירה |
| מייל לאיש הקשר | modules/03_quotes/QuotesPage.jsx:768 | ① | קצר — כותרת/תווית סבירה |
| מיקום | modules/03_quotes/quotePdf.jsx:385 (×4) | ① | קצר — כותרת/תווית סבירה |
| מיקום * | modules/03_quotes/QuoteBuilderPage.jsx:509 | ① | קצר — כותרת/תווית סבירה |
| מס׳ | modules/03_quotes/QuotesPage.jsx:711 | ① | קצר — כותרת/תווית סבירה |
| מספר הצעה | modules/03_quotes/quotePdf.jsx:353 | ① | קצר — כותרת/תווית סבירה |
| מע"מ ({Number(vatRate)}%) | modules/03_quotes/QuoteSummaryPanel.jsx:64 | ① | תווית/כותרת/פעולה קצרה |
| מע"מ ({vatRate}%) | modules/03_quotes/quotePdf.jsx:416 | ① | קצר — כותרת/תווית סבירה |
| מפיק את המסמך... | modules/03_quotes/QuoteDocumentDialog.jsx:340 | ① | קצר — כותרת/תווית סבירה |
| מפרט השירותים | modules/03_quotes/QuoteBuilderPage.jsx:662 | ① | קצר — כותרת/תווית סבירה |
| משך האירוע | modules/03_quotes/QuoteBuilderPage.jsx:559 | ① | קצר — כותרת/תווית סבירה |
| נוספת | modules/03_quotes/QuoteBuilderPage.jsx:697 | ① | קצר — כותרת/תווית סבירה |
| ניהול הצעות מחיר | modules/03_quotes/QuotesPage.jsx:398 | ① | קצר — כותרת/תווית סבירה |
| ניקוי | modules/03_quotes/QuotesPage.jsx:654 | ① | קצר — כותרת/תווית סבירה |
| סה"כ | lib/salaryReport.js:58 (×6) | ① | קצר — כותרת/תווית סבירה |
| סה"כ לפני הנחה | modules/03_quotes/quotePdf.jsx:398 | ① | קצר — כותרת/תווית סבירה |
| סה"כ לפני מע"מ | modules/03_quotes/QuoteSummaryPanel.jsx:63 (×2) | ① | קצר — כותרת/תווית סבירה |
| סה"כ לתשלום | modules/03_quotes/QuoteSummaryPanel.jsx:66 | ① | קצר — כותרת/תווית סבירה |
| סה"כ סופי לתשלום | modules/03_quotes/quotePdf.jsx:418 | ① | קצר — כותרת/תווית סבירה |
| סה"כ שורה | modules/03_quotes/QuoteLineEditor.jsx:125 | ① | קצר — כותרת/תווית סבירה |
| סטטוס-שליחה לא ידוע | modules/03_quotes/QuoteDocumentDialog.jsx:230 (×2) | ① | קצר — כותרת/תווית סבירה |
| סיבות דחייה: | modules/03_quotes/QuotesPage.jsx:672 | ① | קצר — כותרת/תווית סבירה |
| סיבת דחייה * | modules/03_quotes/RejectQuoteDialog.jsx:50 | ① | קצר — כותרת/תווית סבירה |
| סיכום הצעת המחיר | modules/03_quotes/quotePdf.jsx:396 | ① | קצר — כותרת/תווית סבירה |
| סיכום פיננסי | modules/03_quotes/QuoteSummaryPanel.jsx:50 | ① | קצר — כותרת/תווית סבירה |
| סינון לפי לקוח | modules/03_quotes/QuotesPage.jsx:531 | ① | קצר — כותרת/תווית סבירה |
| סכום ביניים | modules/03_quotes/QuoteSummaryPanel.jsx:51 | ① | קצר — כותרת/תווית סבירה |
| סכום כולל | modules/03_quotes/ApproveQuoteDialog.jsx:62 (×2) | ① | קצר — כותרת/תווית סבירה |
| עדכון ההצעה נכשל. | modules/03_quotes/api.js:180 | ① | קצר — כותרת/תווית סבירה |
| עדכן ושלח | modules/03_quotes/QuoteBuilderPage.jsx:758 | ① | קצר — כותרת/תווית סבירה |
| עלות משוערת | modules/03_quotes/QuoteSummaryPanel.jsx:79 | ① | קצר — כותרת/תווית סבירה |
| עריכת הצעה #{quoteId} | modules/03_quotes/QuoteBuilderPage.jsx:413 | ① | תווית/כותרת/פעולה קצרה |
| פג בעוד {expiry.daysLeft} יום | modules/03_quotes/QuotesPage.jsx:804 | ① | תווית/כותרת/פעולה קצרה |
| פג בקרוב | modules/03_quotes/QuotesPage.jsx:585 | ① | קצר — כותרת/תווית סבירה |
| פירוט * | modules/03_quotes/RejectQuoteDialog.jsx:79 | ① | קצר — כותרת/תווית סבירה |
| פירוט שירותים ועלויות | modules/03_quotes/quotePdf.jsx:391 | ① | תווית/כותרת/פעולה קצרה |
| פרטי הלקוח | modules/03_quotes/quotePdf.jsx:371 | ① | קצר — כותרת/תווית סבירה |
| פרטי הפרויקט | modules/03_quotes/quotePdf.jsx:381 | ① | קצר — כותרת/תווית סבירה |
| צבע | modules/03_quotes/QuoteLineEditor.jsx:122 (×2) | ① | קצר — כותרת/תווית סבירה |
| צפייה במסמך | lib/quotes.js:34 (×2) | ① | קצר — כותרת/תווית סבירה |
| קבועה | modules/03_quotes/QuoteBuilderPage.jsx:690 | ① | קצר — כותרת/תווית סבירה |
| קוד פריט | modules/03_quotes/quotePdf.jsx:262 | ① | קצר — כותרת/תווית סבירה |
| רווח גולמי | modules/03_quotes/QuoteSummaryPanel.jsx:80 (×2) | ① | קצר — כותרת/תווית סבירה |
| רווחיות ההצעה | modules/03_quotes/QuoteSummaryPanel.jsx:78 | ① | קצר — כותרת/תווית סבירה |
| שולח... | modules/03_quotes/QuoteDocumentDialog.jsx:400 (×2) | ① | קצר — כותרת/תווית סבירה |
| שיעור אישור | modules/03_quotes/QuotesPage.jsx:415 | ① | קצר — כותרת/תווית סבירה |
| שיעור רווח | modules/03_quotes/QuoteSummaryPanel.jsx:82 | ① | קצר — כותרת/תווית סבירה |
| שירות / מוצר | modules/03_quotes/QuoteLineEditor.jsx:121 | ① | קצר — כותרת/תווית סבירה |
| שלח שוב | modules/03_quotes/QuoteDocumentDialog.jsx:221 (×2) | ① | קצר — כותרת/תווית סבירה |
| שליחה בלי שינוי | modules/03_quotes/QuoteBuilderPage.jsx:328 | ① | קצר — כותרת/תווית סבירה |
| שליחה חוזרת | modules/03_quotes/QuoteDocumentDialog.jsx:219 (×3) | ① | קצר — כותרת/תווית סבירה |
| שליחת ההצעה במייל | modules/03_quotes/QuoteDocumentDialog.jsx:403 | ① | קצר — כותרת/תווית סבירה |
| שם האירוע * | modules/03_quotes/QuoteBuilderPage.jsx:478 | ① | קצר — כותרת/תווית סבירה |
| שמור ושלח | modules/03_quotes/QuoteBuilderPage.jsx:758 (×3) | ① | קצר — כותרת/תווית סבירה |
| שמירת ההצעה נכשלה. | modules/03_quotes/QuoteBuilderPage.jsx:361 (×2) | ① | קצר — כותרת/תווית סבירה |
| שעות | lib/paramsRegistry.js:408 (×11) | ① | קצר — כותרת/תווית סבירה |
| שעת התחלה * | modules/03_quotes/QuoteBuilderPage.jsx:531 | ① | קצר — כותרת/תווית סבירה |
| שעת סיום * | modules/03_quotes/QuoteBuilderPage.jsx:542 | ① | קצר — כותרת/תווית סבירה |
| תאריך אירוע מ- | modules/03_quotes/QuotesPage.jsx:637 | ① | קצר — כותרת/תווית סבירה |
| תאריך אירוע עד | modules/03_quotes/QuotesPage.jsx:649 | ① | קצר — כותרת/תווית סבירה |
| תאריך האירוע | modules/03_quotes/ApproveQuoteDialog.jsx:52 (×6) | ① | קצר — כותרת/תווית סבירה |
| תאריך הפקה | modules/03_quotes/quotePdf.jsx:357 | ① | קצר — כותרת/תווית סבירה |
| תאריך משוער * | modules/03_quotes/QuoteBuilderPage.jsx:493 | ① | קצר — כותרת/תווית סבירה |
| תוקף ההצעה עד | modules/03_quotes/quotePdf.jsx:361 | ① | קצר — כותרת/תווית סבירה |
| תוקף ההצעה: 30 יום ממועד השליחה | modules/03_quotes/QuoteBuilderPage.jsx:415 | ① | תווית/כותרת/פעולה קצרה |
| תיאור השירות | modules/03_quotes/quotePdf.jsx:263 | ① | קצר — כותרת/תווית סבירה |
| תנאים כלליים | modules/03_quotes/quotePdf.jsx:436 | ① | קצר — כותרת/תווית סבירה |
| תצוגה מקדימה של הצעת המחיר | modules/03_quotes/QuoteDocumentDialog.jsx:335 | ① | תווית/כותרת/פעולה קצרה |

#### מודול 4 (hostesses) — 269 מחרוזות ייחודיות

| מחרוזת | קובץ:שורה | סיווג | הערה |
|---|---|---|---|
| לפי לקוח, לא רק ספירה שטוחה | modules/04_hostesses/HostessViewCard.jsx:323 | ④ | ממצא מאומת ידנית מול הקוד (ר׳ §3) |
| מה שהיא כרגע מחויבת אליו | modules/04_hostesses/HostessViewCard.jsx:311 | ④ | ממצא מאומת ידנית מול הקוד (ר׳ §3) |
| ממוין: חסרים תחילה, לפי קרבת האירוע | modules/04_hostesses/OverviewTab.jsx:235 | ④ | ממצא מאומת ידנית מול הקוד (ר׳ §3) |
| שכבה 2 של Smart Match | modules/04_hostesses/HostessViewCard.jsx:345 | ④ | ממצא מאומת ידנית מול הקוד (ר׳ §3) |
| היא תקבל הודעה שהמשרה אוישה. 🚫 שחרור אינו נספר לרעתה בשום צד של הדירוג — הוא פעולת מערכת. | modules/04_hostesses/SmartMatchPage.jsx:348 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| שחרר מהאירועים (מומלץ) — כל שיבוץ יסומן כ"שוחררה" והדיילת תקבל מייל-ביטול על כל אירוע. האירוע חוזר לחסר-איוש, וזה נספר כשחרור-שלנו — לא לרעתה. | modules/04_hostesses/RepositoryTab.jsx:536 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| · {waitingCount} אישרו זמינות וממתינות לאישורך | modules/04_hostesses/SmartMatchPage.jsx:541 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| · בתוך {cutoffHours} שעות | modules/04_hostesses/OverviewTab.jsx:348 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| · הקישור פג אחרי {validityHours} שעות | modules/04_hostesses/SmartMatchPage.jsx:750 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| · נותרו {hoursLeft} שעות | modules/04_hostesses/SmartMatchPage.jsx:751 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {counts.finallyApproved} מתוך {required} אושרו סופית | modules/04_hostesses/SmartMatchPage.jsx:540 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {data.full_name} נשמרה, אך אין לך הרשאה לשמור את פרטי הבנק שלה. | modules/04_hostesses/api.js:904 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {data.full_name} נשמרה, אך השפות שלה לא נשמרו. פתחי אותה לעריכה וסמני אותן שוב. | modules/04_hostesses/api.js:916 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {data.full_name} נשמרה, אך פרטי הבנק שלה לא נשמרו. פתחי אותה לעריכה והזיני אותם שוב. | modules/04_hostesses/api.js:901 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {deactivateChoice.hostess.full_name} משובצת ל- {deactivateChoice.futureActive.length} {deactivateChoice.futureActive.length === 1 ? 'אירוע עתידי' : 'אירועים עתידיים'} | modules/04_hostesses/RepositoryTab.jsx:523 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {derived.counts.confirmed} מ-{derived.counts.answered} | modules/04_hostesses/HostessViewCard.jsx:289 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {hostess.created_at && ( <> במאגר מ- <span dir="ltr" style={{ unicodeBidi: 'isolate' }}> {formatDate(hostess.created_at.slice(0, 10))} </span>{' '} ·{' '} </> )} עיר: {hostess.city} | modules/04_hostesses/HostessViewCard.jsx:253 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {hostess.full_name} שוחררה מהאירועים והושבתה | modules/04_hostesses/RepositoryTab.jsx:269 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {hostess.full_name} שוחררה, אך הודעות-הביטול: {parts.join(' · ')}. כדאי ליידע אותה טלפונית. | modules/04_hostesses/RepositoryTab.jsx:262 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {mail.unknown} — לא ידוע אם יצאו | modules/04_hostesses/RepositoryTab.jsx:260 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {Math.min(VISIBLE_CANDIDATES, candidates.length)} ראשונות מתוך {candidates.length} שעברו את הסינון · השאר בגלילה | modules/04_hostesses/SmartMatchPage.jsx:596 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {names.join(' · ')} לא שוחררו — הן עדיין משובצות לאירוע. נסי לשחרר ידנית מתפריט-השורה. | modules/04_hostesses/SmartMatchPage.jsx:241 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {payload.full_name} נשמרה — לא הצלחנו לאתר את הכתובת, והיא מסומנת "אין קואורדינטות". | modules/04_hostesses/HostessFormDialog.jsx:238 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {project.event_name} — לשיבוץ חכם | modules/04_hostesses/OverviewTab.jsx:321 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {releasing.map((r) => r.hostesses?.full_name).join(' · ')} — כל אחת מהן תקבל הודעה שהמשרה אוישה. להמשיך? | modules/04_hostesses/SmartMatchPage.jsx:299 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {unknown} — לא ידוע אם ההודעה יצאה | modules/04_hostesses/SmartMatchPage.jsx:252 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {unknown} — לא ידוע אם יצאו (ייתכן שכן; לא לשלוח שוב מיד) | lib/projectCard.js:251 (×3) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {who} — כולן קיבלו הודעה | modules/04_hostesses/SmartMatchPage.jsx:256 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {who} שוחררה — אך ההודעה אליה לא נשלחה. כדאי ליידע אותה טלפונית. | modules/04_hostesses/SmartMatchPage.jsx:225 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {who} שוחררה — לא ידוע אם ההודעה יצאה (ייתכן שכן; אל תשלחי שוב מיד). | modules/04_hostesses/SmartMatchPage.jsx:229 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {who} שוחררה, והודעה נשלחה אליה | modules/04_hostesses/SmartMatchPage.jsx:232 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ⚠️ לא ניתן להציג את האירועים — אין לך הרשאת צפייה במודול פרויקטים. זו אינה רשימה ריקה: המסך לא הצליח לקרוא את האירועים. פני למנכ״ל להרשאה. | modules/04_hostesses/OverviewTab.jsx:456 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ⚠️ עדיין לא זמין — הטבלה נכתבת ע״י מודול 6 ותישאר ריקה עד שהוא ייבנה. | modules/04_hostesses/HostessViewCard.jsx:346 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ✅ אין כרגע אירועים הממתינים לאיוש | modules/04_hostesses/OverviewTab.jsx:493 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| 🔍 אין אירועים התואמים לסינון נקה סינון | modules/04_hostesses/OverviewTab.jsx:471 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| 🔍 לא נמצאו דיילות התואמות לסינון נקה סינון | modules/04_hostesses/RepositoryTab.jsx:609 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| 🗂️ עדיין אין דיילות במאגר {canEdit && ( <div> <Button type="button" onClick={onAdd} className="mt-2 h-auto rounded-lg bg-teal-600 px-3 py-1.5 text-[12.5px] font-semibold text-white" > + הוספת דיילת </Button> </div> )} | modules/04_hostesses/RepositoryTab.jsx:631 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אי-זמינות מוצהרת — טווח תאריכים + הערה, לא תאריך יחיד | modules/04_hostesses/HostessFormDialog.jsx:457 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אין הרשאה לאשר את הדיילת הזו. | modules/04_hostesses/api.js:700 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין הרשאה לסמן אחראית משמרת. | modules/04_hostesses/api.js:871 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין הרשאה לעדכן אי-זמינות לדיילת זו. | modules/04_hostesses/api.js:1018 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין הרשאה לעדכן את השיבוץ הזה. | modules/04_hostesses/api.js:792 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין הרשאה לעדכן את פרטי הבנק של דיילת זו. | modules/04_hostesses/api.js:960 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין הרשאה לעדכן דיילת זו. | modules/04_hostesses/api.js:949 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין הרשאה לשחרר את השיבוץ הזה. | modules/04_hostesses/api.js:827 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין הרשאה לשנות את סטטוס הדיילת. | modules/04_hostesses/api.js:986 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין לה כרגע שיבוץ פעיל | modules/04_hostesses/HostessViewCard.jsx:313 | ② | מצב-ריק |
| אין מועמדות פנויות לאירוע הזה כרגע. כולן נפסלו בשער: לא פעילות · משובצות באותו תאריך · הצהירו אי-זמינות · רחוקות מ- {params?.gateDistanceKm ?? '—'} ק"מ · או מסומנות "לא-לשלוח" אצל הלקוח הזה. אפשר לבדוק במאגר הדיילות אם יש עוד מישהי שמתאימה ולא נכנסה לסינון. | modules/04_hostesses/SmartMatchPage.jsx:632 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אין מספר שהמערכת מציעה. שולחים בסבבים, ומחליטים בכל סבב מחדש כמה — כל זימון עודף שנסגר שולח "המשרה כבר אוישה", ושליחה נדיבה מדי שוחקת את שיעור-ההיענות. | modules/04_hostesses/SmartMatchPage.jsx:682 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אין קואורדינטות | modules/04_hostesses/SmartMatchPage.jsx:877 | ② | מצב-ריק |
| אין קואורדינטות — בחישוב הקרבה היא מקבלת ציון ניטרלי, לא אפס. | modules/04_hostesses/HostessViewCard.jsx:357 | ② | מצב-ריק |
| אין שיבוצים בחלון הזמן הנבחר | modules/04_hostesses/HostessViewCard.jsx:422 | ② | מצב-ריק |
| אישרה {candidate.confirmed} מ-{candidate.answered} | modules/04_hostesses/SmartMatchPage.jsx:849 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אף אחד מהם אינו בתוך {cutoffHours} שעות | modules/04_hostesses/OverviewTab.jsx:201 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דיילת חדשה, עדיין אין לה היסטוריית שיבוצים | modules/04_hostesses/HostessViewCard.jsx:409 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| האירוע יחזור להיות חסר, והביטול ייספר במרכיב האמינות שלה. 🚫 זה אינו "שחרור" — שם אנחנו ויתרנו עליה, וכאן היא חזרה בה. | modules/04_hostesses/SmartMatchPage.jsx:364 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| האירוע לא נמצא, או שאין לך הרשאה אליו. | modules/04_hostesses/api.js:286 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הדיילת לא נמצאה, או שאין לך הרשאה אליה. | modules/04_hostesses/HostessFormDialog.jsx:120 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הכרטיס נפתח רק אחרי שדיברת עם הדיילת בטלפון — היא לא רואה את הטופס הזה ולא ממלאת אותו בעצמה. בשמירה היא נכנסת מיידית למאגר בסטטוס "פעילה". | modules/04_hostesses/HostessFormDialog.jsx:268 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המכסה תיסגר — {releasing.length} דיילות שאישרו זמינות ישוחררו | modules/04_hostesses/SmartMatchPage.jsx:298 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| השבת — תשלים את מה שהתחייבה | modules/04_hostesses/RepositoryTab.jsx:561 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| השבת — תשלים את מה שהתחייבה — השיבוצים העתידיים נשארים על כנם; היא רק מפסיקה לקבל הזמנות חדשות. | modules/04_hostesses/RepositoryTab.jsx:540 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חיפוש לפי שם או טלפון | modules/04_hostesses/RepositoryTab.jsx:311 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסר איוש, והאירוע בתוך {cutoffHours} שעות | modules/04_hostesses/OverviewTab.jsx:332 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| טעינת טווחי אי-הזמינות נכשלה. | modules/04_hostesses/api.js:1002 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| טרם נצבר מידע | modules/04_hostesses/HostessViewCard.jsx:292 | ② | מצב-ריק |
| טרם נשלח זימון | modules/04_hostesses/SmartMatchPage.jsx:749 | ② | מצב-ריק |
| לא "דירוג": זו דעתך, לא ציון-מערכת. אינה חלק מ-Smart Match | modules/04_hostesses/HostessFormDialog.jsx:423 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא הצלחנו לטעון את המאגר | modules/04_hostesses/RepositoryTab.jsx:122 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא הצלחנו לטעון את המאגר — {error} | modules/04_hostesses/RepositoryTab.jsx:295 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא הצלחנו לטעון את כרטיס הדיילת | modules/04_hostesses/HostessViewCard.jsx:85 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא הצלחנו לטעון את מסך השיבוץ | modules/04_hostesses/SmartMatchPage.jsx:103 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא הצלחנו לטעון את מסך השיבוץ — {error} | modules/04_hostesses/SmartMatchPage.jsx:429 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא הצלחנו לטעון את רשימת האירועים | modules/04_hostesses/OverviewTab.jsx:105 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא הצלחנו לטעון את רשימת האירועים — {error} | modules/04_hostesses/OverviewTab.jsx:174 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ענתה ל-{unansweredThreshold} האחרונים ({unansweredCount}) | modules/04_hostesses/RepositoryTab.jsx:363 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לדוגמה: חופשה, מחלה, לימודים | modules/04_hostesses/HostessFormDialog.jsx:509 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מחיקת טווחי אי-הזמינות הישנים נכשלה. | modules/04_hostesses/api.js:1026 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מעל 40 ק"מ בלי רכב = פסילה בשיבוץ, לא ניקוד | modules/04_hostesses/HostessFormDialog.jsx:428 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מתוכם {kpis.expiredInvites} פג תוקפם | modules/04_hostesses/OverviewTab.jsx:216 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מתוכם {kpis.missingWithinFinalDay} בתוך {cutoffHours} שעות | modules/04_hostesses/OverviewTab.jsx:200 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נשלח {formatTimestamp(row.invite_sent_at, '—')} | modules/04_hostesses/SmartMatchPage.jsx:749 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סימון אחראית המשמרת נכשל. | modules/04_hostesses/api.js:870 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עבדה אצל {customerName ?? 'הלקוח הזה'} | modules/04_hostesses/SmartMatchPage.jsx:839 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עבדה לאחרונה לפני {candidate.weeksSinceWorked} שבועות | modules/04_hostesses/SmartMatchPage.jsx:883 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עבדה לאחרונה לפני {derived.weeksSinceWorked} שבועות | modules/04_hostesses/HostessViewCard.jsx:300 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדיין לא נשלח אף זימון לאירוע הזה — בחרי מועמדות מהטור השני ושלחי. | modules/04_hostesses/SmartMatchPage.jsx:545 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדיין לא עבדה אצל אף לקוח | modules/04_hostesses/HostessViewCard.jsx:325 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדכון פרטי הדיילת. תעודת הזהות קבועה ואינה ניתנת לשינוי — היא המזהה שלה במערכת. הפעלה/השבתה נעשית משורת הדיילת בטבלת המאגר, לא מכאן. | modules/04_hostesses/HostessFormDialog.jsx:267 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| פחות מ-3 מענים — מדורגת לפי ממוצע החברה | modules/04_hostesses/SmartMatchPage.jsx:871 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| פתח כרטיס דיילת: {hostess.full_name} | modules/04_hostesses/RepositoryTab.jsx:423 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| רחוב ומספר — משמש לחישוב הקרבה לאירוע | modules/04_hostesses/HostessFormDialog.jsx:344 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שגיאה בבדיקת שיבוצים באותו תאריך. | modules/04_hostesses/api.js:328 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת הזימונים לשליחה חוזרת. | modules/04_hostesses/api.js:543 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת היסטוריית השיבוצים. | modules/04_hostesses/api.js:327 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת העדפות הלקוח. | modules/04_hostesses/api.js:329 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת השיבוצים של האירוע. | modules/04_hostesses/api.js:437 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת השיבוצים של הדיילת. | modules/04_hostesses/api.js:383 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת טווחי אי-הזמינות. | modules/04_hostesses/api.js:1035 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת כרטיס הדיילת. | modules/04_hostesses/api.js:245 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת מאגר הדיילות. | modules/04_hostesses/api.js:234 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת פרטי האירוע. | modules/04_hostesses/api.js:285 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת פרטי הדיילות. | modules/04_hostesses/api.js:596 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת רשימת האירועים לאיוש. | modules/04_hostesses/api.js:268 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שדה-מידע בלבד. לא שער ולא עמודה בטבלת-המאגר — המנהלת בוחרת ידנית מי לזמן לכל תפקיד | modules/04_hostesses/HostessFormDialog.jsx:439 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שוחררו: {names.join(' · ')} | modules/04_hostesses/SmartMatchPage.jsx:248 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שחרור מ-{failed.length} מתוך {futureActive.length} אירועים נכשל — {hostess.full_name} עדיין משובצת אליהם. נסי לשחרר ידנית מתפריט-הפעולות במסך שיבוץ חכם. | modules/04_hostesses/RepositoryTab.jsx:238 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שיבוץ חכם — {project?.event_name} | modules/04_hostesses/SmartMatchPage.jsx:453 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שינוי כאן לא ישנה תעריף של שיבוץ עתידי שכבר קיים — הוא הוקפא ברגע השיבוץ. ההעלאה תחול על השיבוץ הבא בלבד. | modules/04_hostesses/HostessFormDialog.jsx:379 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שינוי סטטוס הדיילת נכשל. | modules/04_hostesses/RepositoryTab.jsx:274 (×3) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שלום, {invite?.hostess_name} 👋 | modules/04_hostesses/PublicConfirmPage.jsx:142 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שלח אישור סופי לכל מי שאישרה זמינות ({waitingCount}) | modules/04_hostesses/SmartMatchPage.jsx:584 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שלח מייל תיאום ({selected.length} נבחרו) | modules/04_hostesses/SmartMatchPage.jsx:677 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שלח שוב למי שפג תוקפן ({resendableCount}) | modules/04_hostesses/OverviewTab.jsx:250 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שליחת הקישורים מחדש נכשלה. | modules/04_hostesses/OverviewTab.jsx:162 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שמירת טווחי אי-הזמינות נכשלה. | modules/04_hostesses/api.js:1017 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שמירת פרטי הבנק נכשלה. | modules/04_hostesses/api.js:959 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תעריף: /שעה + נסיעות {travel ? ( <> {' '} <Money amount={travel} /> </> ) : null} | modules/04_hostesses/PublicConfirmPage.jsx:153 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ⓘ מרכיב "אמינות הגעה" כבוי — הוא עדיין אינו נכלל בציון. הדירוג כרגע מבוסס על שיעור-היענות {weights ? ' (${Math.round(weights.responsiveness * 100)}%)' : ''} ועל קרבה {weights ? ' (${Math.round(weights.proximity * 100)}%)' : ''} בלבד. | modules/04_hostesses/SmartMatchPage.jsx:517 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| REG-IN · אישור השתתפות | modules/04_hostesses/PublicConfirmPage.jsx:106 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| — כבוי | modules/04_hostesses/AssignmentRowMenu.jsx:84 (×2) | ① | קצר — כותרת/תווית סבירה |
| (שכר מינימום) חוסם שמירה | modules/04_hostesses/HostessFormDialog.jsx:364 | ① | תווית/כותרת/פעולה קצרה |
| {counts.expired} פג תוקפן | modules/04_hostesses/OverviewTab.jsx:389 | ① | תווית/כותרת/פעולה קצרה |
| {failed} לא קיבלו הודעה | modules/04_hostesses/SmartMatchPage.jsx:251 | ① | תווית/כותרת/פעולה קצרה |
| {failed} נכשלו | lib/projectCard.js:252 (×3) | ① | קצר — כותרת/תווית סבירה |
| {hostess.full_name} הופעלה | modules/04_hostesses/RepositoryTab.jsx:283 | ① | תווית/כותרת/פעולה קצרה |
| {hostess.full_name} הושבתה | modules/04_hostesses/RepositoryTab.jsx:269 | ① | תווית/כותרת/פעולה קצרה |
| {label} הוא שדה חובה | modules/04_hostesses/HostessFormDialog.jsx:151 | ① | קצר — כותרת/תווית סבירה |
| {label} נכשל. | modules/04_hostesses/SmartMatchPage.jsx:202 | ① | קצר — כותרת/תווית סבירה |
| {mail.failed} לא נשלחו | modules/04_hostesses/RepositoryTab.jsx:259 | ① | תווית/כותרת/פעולה קצרה |
| {name} ביטלה אחרי האישור הסופי? | modules/04_hostesses/SmartMatchPage.jsx:362 | ① | תווית/כותרת/פעולה קצרה |
| {name} סומנה כאחראית משמרת | modules/04_hostesses/SmartMatchPage.jsx:419 | ① | תווית/כותרת/פעולה קצרה |
| {name} סומנה כמי שאישרה זמינות | modules/04_hostesses/SmartMatchPage.jsx:378 | ① | תווית/כותרת/פעולה קצרה |
| {name} סומנה כמי שביטלה אחרי אישור | modules/04_hostesses/SmartMatchPage.jsx:371 | ① | תווית/כותרת/פעולה קצרה |
| {name} סומנה כמי שסירבה | modules/04_hostesses/SmartMatchPage.jsx:385 | ① | תווית/כותרת/פעולה קצרה |
| {payload.full_name} נוספה למאגר | modules/04_hostesses/HostessFormDialog.jsx:241 | ① | תווית/כותרת/פעולה קצרה |
| ← חזרה למבט-על | modules/04_hostesses/SmartMatchPage.jsx:442 | ① | קצר — כותרת/תווית סבירה |
| + הוסף טווח | modules/04_hostesses/HostessFormDialog.jsx:513 | ① | קצר — כותרת/תווית סבירה |
| + הוספת דיילת | modules/04_hostesses/RepositoryTab.jsx:370 (×2) | ① | קצר — כותרת/תווית סבירה |
| ★ אחראית משמרת | modules/04_hostesses/SmartMatchPage.jsx:755 | ① | קצר — כותרת/תווית סבירה |
| ✓ אני מגיעה | modules/04_hostesses/PublicConfirmPage.jsx:172 | ① | קצר — כותרת/תווית סבירה |
| 1 פג תוקף | modules/04_hostesses/OverviewTab.jsx:389 | ① | קצר — כותרת/תווית סבירה |
| 9 ספרות | modules/04_hostesses/HostessFormDialog.jsx:292 | ① | קצר — כותרת/תווית סבירה |
| אושרו סופית | modules/04_hostesses/OverviewTab.jsx:377 (×3) | ① | קצר — כותרת/תווית סבירה |
| אי-זמינות מוצהרת | modules/04_hostesses/HostessViewCard.jsx:391 | ① | קצר — כותרת/תווית סבירה |
| איוש | modules/04_hostesses/OverviewTab.jsx:268 (×2) | ① | קצר — כותרת/תווית סבירה |
| אירוע עתידי | modules/04_hostesses/RepositoryTab.jsx:526 | ① | קצר — כותרת/תווית סבירה |
| אירועים ברבעון האחרון | modules/04_hostesses/HostessViewCard.jsx:295 | ① | תווית/כותרת/פעולה קצרה |
| אירועים חסרים | modules/04_hostesses/OverviewTab.jsx:190 | ① | קצר — כותרת/תווית סבירה |
| אירועים עתידיים | modules/04_hostesses/RepositoryTab.jsx:526 | ① | קצר — כותרת/תווית סבירה |
| אירועים רבעון אחרון | modules/04_hostesses/RepositoryTab.jsx:402 | ① | קצר — כותרת/תווית סבירה |
| אישור נשלח | modules/04_hostesses/SmartMatchPage.jsx:310 (×2) | ① | קצר — כותרת/תווית סבירה |
| אישורים נשלחו | modules/04_hostesses/SmartMatchPage.jsx:310 | ① | קצר — כותרת/תווית סבירה |
| אישרו זמינות | modules/04_hostesses/OverviewTab.jsx:378 (×2) | ① | קצר — כותרת/תווית סבירה |
| אמהרית | modules/04_hostesses/HostessFormDialog.jsx:50 | ① | קצר — כותרת/תווית סבירה |
| אנגלית | modules/04_hostesses/HostessFormDialog.jsx:50 | ① | קצר — כותרת/תווית סבירה |
| אף אחת אינה ממתינה לאישורך | modules/04_hostesses/SmartMatchPage.jsx:483 | ① | תווית/כותרת/פעולה קצרה |
| אף קישור לא פג תוקף | modules/04_hostesses/OverviewTab.jsx:217 (×2) | ① | קצר — כותרת/תווית סבירה |
| בדיקת ספרת-ביקורת תוך כדי ההקלדה | modules/04_hostesses/HostessFormDialog.jsx:283 | ① | תווית/כותרת/פעולה קצרה |
| בחר את {candidate.full_name} | modules/04_hostesses/SmartMatchPage.jsx:815 | ① | תווית/כותרת/פעולה קצרה |
| במאגר מ- | modules/04_hostesses/HostessViewCard.jsx:255 | ① | קצר — כותרת/תווית סבירה |
| בנק | modules/04_hostesses/HostessFormDialog.jsx:63 (×2) | ① | קצר — כותרת/תווית סבירה |
| בנק · סניף · חשבון | modules/04_hostesses/HostessViewCard.jsx:375 | ① | קצר — כותרת/תווית סבירה |
| דחוף (עד {urgentHours} שעות) | modules/04_hostesses/OverviewTab.jsx:52 | ① | תווית/כותרת/פעולה קצרה |
| דיילות | App.jsx:190 (×10) | ① | קצר — כותרת/תווית סבירה |
| דיילות באירוע | modules/04_hostesses/SmartMatchPage.jsx:538 | ① | קצר — כותרת/תווית סבירה |
| דיילת חדשה | modules/04_hostesses/SmartMatchPage.jsx:868 | ① | קצר — כותרת/תווית סבירה |
| האישור הסופי | modules/04_hostesses/SmartMatchPage.jsx:305 (×2) | ① | קצר — כותרת/תווית סבירה |
| האישור הסופי נכשל. | modules/04_hostesses/api.js:700 | ① | קצר — כותרת/תווית סבירה |
| הוספת דיילת חדשה | modules/04_hostesses/HostessFormDialog.jsx:261 | ① | קצר — כותרת/תווית סבירה |
| היסטוריה | modules/04_hostesses/HostessViewCard.jsx:407 | ① | קצר — כותרת/תווית סבירה |
| הכול | lib/listWindow.js:18 (×4) | ① | קצר — כותרת/תווית סבירה |
| הלקוח הזה | modules/04_hostesses/SmartMatchPage.jsx:839 | ① | קצר — כותרת/תווית סבירה |
| הסימון | modules/04_hostesses/SmartMatchPage.jsx:369 (×4) | ① | קצר — כותרת/תווית סבירה |
| הסר | modules/04_hostesses/HostessFormDialog.jsx:472 | ① | קצר — כותרת/תווית סבירה |
| העדפת-לקוחות | modules/04_hostesses/HostessViewCard.jsx:345 | ① | קצר — כותרת/תווית סבירה |
| הערה קצרה | modules/04_hostesses/HostessFormDialog.jsx:504 | ① | קצר — כותרת/תווית סבירה |
| הערה: {state.note} | modules/04_hostesses/RepositoryTab.jsx:463 | ① | קצר — כותרת/תווית סבירה |
| הפעלת {hostess.full_name} | modules/04_hostesses/RepositoryTab.jsx:492 | ① | תווית/כותרת/פעולה קצרה |
| הצג חסרים בלבד | modules/04_hostesses/OverviewTab.jsx:51 | ① | קצר — כותרת/תווית סבירה |
| השבתת {hostess.full_name} | modules/04_hostesses/RepositoryTab.jsx:491 | ① | תווית/כותרת/פעולה קצרה |
| השחרור | modules/04_hostesses/SmartMatchPage.jsx:353 | ① | קצר — כותרת/תווית סבירה |
| השחרור נכשל. | modules/04_hostesses/api.js:826 | ① | קצר — כותרת/תווית סבירה |
| השינויים נשמרו | modules/04_hostesses/HostessFormDialog.jsx:241 | ① | קצר — כותרת/תווית סבירה |
| התרשמות | modules/04_hostesses/RepositoryTab.jsx:397 | ① | קצר — כותרת/תווית סבירה |
| התרשמות המנהלת | modules/04_hostesses/HostessViewCard.jsx:282 | ① | קצר — כותרת/תווית סבירה |
| התרשמות המנהלת (1–5) | modules/04_hostesses/HostessFormDialog.jsx:422 | ① | קצר — כותרת/תווית סבירה |
| זימון חדש נשלח | modules/04_hostesses/SmartMatchPage.jsx:339 | ① | קצר — כותרת/תווית סבירה |
| זימון נשלח | modules/04_hostesses/SmartMatchPage.jsx:269 (×2) | ① | קצר — כותרת/תווית סבירה |
| זימונים ממתינים | modules/04_hostesses/OverviewTab.jsx:206 | ① | קצר — כותרת/תווית סבירה |
| זימונים נשלחו | modules/04_hostesses/SmartMatchPage.jsx:269 | ① | קצר — כותרת/תווית סבירה |
| חסרה 1 | lib/projects.js:230 (×2) | ① | קצר — כותרת/תווית סבירה |
| חסרות {gap} | lib/projects.js:230 (×2) | ① | קצר — כותרת/תווית סבירה |
| טוען | modules/04_hostesses/PublicConfirmPage.jsx:126 (×2) | ① | קצר — כותרת/תווית סבירה |
| טעינת הכרטיס נכשלה. | modules/04_hostesses/HostessFormDialog.jsx:132 | ① | קצר — כותרת/תווית סבירה |
| יש רכב | modules/04_hostesses/HostessFormDialog.jsx:432 (×3) | ① | קצר — כותרת/תווית סבירה |
| יש רכב? | modules/04_hostesses/HostessFormDialog.jsx:428 | ① | קצר — כותרת/תווית סבירה |
| כל הערים | modules/04_hostesses/RepositoryTab.jsx:331 | ① | קצר — כותרת/תווית סבירה |
| כרטיס דיילת | modules/04_hostesses/HostessViewCard.jsx:127 | ① | קצר — כותרת/תווית סבירה |
| כתובת מלאה | modules/04_hostesses/HostessFormDialog.jsx:344 (×2) | ① | קצר — כותרת/תווית סבירה |
| לא אוכל הפעם | modules/04_hostesses/PublicConfirmPage.jsx:181 | ① | קצר — כותרת/תווית סבירה |
| לא הוצהרה אי-זמינות | modules/04_hostesses/HostessViewCard.jsx:393 | ① | קצר — כותרת/תווית סבירה |
| לא זמינה  | modules/04_hostesses/HostessFormDialog.jsx:469 (×2) | ① | קצר — כותרת/תווית סבירה |
| לא כולל את השיבוץ הפעיל שכבר מופיע למעלה | modules/04_hostesses/HostessViewCard.jsx:407 | ① | נבדק ידנית בהקשר — תווית/כותרת תקינה |
| לדוגמה: ביאליק 14 | modules/04_hostesses/HostessFormDialog.jsx:348 | ① | קצר — כותרת/תווית סבירה |
| לדוגמה: הפועלים | modules/04_hostesses/HostessFormDialog.jsx:393 | ① | קצר — כותרת/תווית סבירה |
| לדוגמה: נועה שגיא | modules/04_hostesses/HostessFormDialog.jsx:305 | ① | קצר — כותרת/תווית סבירה |
| לדוגמה: רמת גן | modules/04_hostesses/HostessFormDialog.jsx:340 | ① | קצר — כותרת/תווית סבירה |
| לשחרר את {name} מהאירוע? | modules/04_hostesses/SmartMatchPage.jsx:346 | ① | תווית/כותרת/פעולה קצרה |
| לשיבוץ → | modules/04_hostesses/OverviewTab.jsx:402 | ① | קצר — כותרת/תווית סבירה |
| מ-תאריך | modules/04_hostesses/HostessFormDialog.jsx:484 | ① | קצר — כותרת/תווית סבירה |
| מאגר דיילות | modules/04_hostesses/HostessesPage.jsx:22 | ① | קצר — כותרת/תווית סבירה |
| מאגר הדיילות ומעקב השיבוצים | modules/04_hostesses/HostessesPage.jsx:80 | ① | תווית/כותרת/פעולה קצרה |
| מועמדות מתאימות | modules/04_hostesses/SmartMatchPage.jsx:591 | ① | קצר — כותרת/תווית סבירה |
| מחכות לאישורך | modules/04_hostesses/OverviewTab.jsx:382 (×2) | ① | קצר — כותרת/תווית סבירה |
| ממתינות | modules/04_hostesses/OverviewTab.jsx:386 (×2) | ① | קצר — כותרת/תווית סבירה |
| מס׳ חשבון | modules/04_hostesses/HostessFormDialog.jsx:65 (×2) | ① | קצר — כותרת/תווית סבירה |
| מספר תעודת זהות אינו תקין | modules/04_hostesses/HostessFormDialog.jsx:156 | ① | תווית/כותרת/פעולה קצרה |
| מעקב פניות ושיבוצים | modules/04_hostesses/HostessesPage.jsx:21 | ① | קצר — כותרת/תווית סבירה |
| מצב הזימונים | modules/04_hostesses/OverviewTab.jsx:269 | ① | קצר — כותרת/תווית סבירה |
| מצוינת אצל הלקוח הזה | modules/04_hostesses/SmartMatchPage.jsx:823 | ① | קצר — כותרת/תווית סבירה |
| משחרר... | modules/04_hostesses/RepositoryTab.jsx:559 | ① | קצר — כותרת/תווית סבירה |
| מתוך {required} | modules/04_hostesses/SmartMatchPage.jsx:477 | ① | קצר — כותרת/תווית סבירה |
| מתוכן {counts.expired} פג תוקפן | modules/04_hostesses/SmartMatchPage.jsx:491 | ① | תווית/כותרת/פעולה קצרה |
| מתחת ל- | modules/04_hostesses/HostessFormDialog.jsx:362 | ① | קצר — כותרת/תווית סבירה |
| מתי | modules/04_hostesses/OverviewTab.jsx:266 (×6) | ① | קצר — כותרת/תווית סבירה |
| נדרשות | modules/04_hostesses/SmartMatchPage.jsx:469 | ① | קצר — כותרת/תווית סבירה |
| נסי שוב | components/PermissionAwareEmpty.jsx:35 (×6) | ① | קצר — כותרת/תווית סבירה |
| סימון אחראית המשמרת בוטל | modules/04_hostesses/SmartMatchPage.jsx:419 | ① | תווית/כותרת/פעולה קצרה |
| סינון לפי עיר | modules/04_hostesses/RepositoryTab.jsx:325 | ① | קצר — כותרת/תווית סבירה |
| סירבו | modules/04_hostesses/OverviewTab.jsx:385 | ① | קצר — כותרת/תווית סבירה |
| סניף | modules/04_hostesses/HostessFormDialog.jsx:64 (×2) | ① | קצר — כותרת/תווית סבירה |
| עבדה אצל | modules/04_hostesses/HostessViewCard.jsx:323 | ① | קצר — כותרת/תווית סבירה |
| עברית | modules/04_hostesses/HostessFormDialog.jsx:50 | ① | קצר — כותרת/תווית סבירה |
| עד-תאריך | modules/04_hostesses/HostessFormDialog.jsx:495 | ① | קצר — כותרת/תווית סבירה |
| עדכון הסטטוס נכשל. | modules/04_hostesses/api.js:791 | ① | קצר — כותרת/תווית סבירה |
| עדכון השפות נכשל. | modules/04_hostesses/api.js:174 | ① | קצר — כותרת/תווית סבירה |
| עיר | modules/04_hostesses/HostessFormDialog.jsx:61 (×4) | ① | קצר — כותרת/תווית סבירה |
| ערבית | modules/04_hostesses/HostessFormDialog.jsx:50 | ① | קצר — כותרת/תווית סבירה |
| עריכה | modules/04_hostesses/HostessViewCard.jsx:270 (×2) | ① | פועל-פעולה על כפתור |
| עריכת {hostess.full_name} | modules/04_hostesses/HostessViewCard.jsx:271 (×2) | ① | תווית/כותרת/פעולה קצרה |
| עריכת דיילת: {form.full_name} | modules/04_hostesses/HostessFormDialog.jsx:261 | ① | תווית/כותרת/פעולה קצרה |
| פעולה | modules/04_hostesses/OverviewTab.jsx:270 (×2) | ① | קצר — כותרת/תווית סבירה |
| פעולות על השיבוץ | modules/04_hostesses/AssignmentRowMenu.jsx:47 (×2) | ① | קצר — כותרת/תווית סבירה |
| פעילות בלבד | modules/04_hostesses/RepositoryTab.jsx:340 | ① | קצר — כותרת/תווית סבירה |
| פרטי בנק | modules/04_hostesses/HostessFormDialog.jsx:386 | ① | קצר — כותרת/תווית סבירה |
| פרטי קשר | modules/04_hostesses/HostessViewCard.jsx:349 | ① | קצר — כותרת/תווית סבירה |
| פרטים עסקיים | modules/04_hostesses/HostessViewCard.jsx:366 | ① | קצר — כותרת/תווית סבירה |
| פתיחת הזימון | modules/04_hostesses/SmartMatchPage.jsx:333 | ① | קצר — כותרת/תווית סבירה |
| קישור נשלח מחדש | modules/04_hostesses/OverviewTab.jsx:154 (×2) | ① | קצר — כותרת/תווית סבירה |
| קישורים נשלחו מחדש | modules/04_hostesses/OverviewTab.jsx:154 | ① | קצר — כותרת/תווית סבירה |
| רוסית | modules/04_hostesses/HostessFormDialog.jsx:50 | ① | קצר — כותרת/תווית סבירה |
| רק למי שיש לה הרשאת-עריכה | modules/04_hostesses/HostessViewCard.jsx:366 | ① | נבדק ידנית בהקשר — תווית/כותרת תקינה |
| שחרר מהאירועים | modules/04_hostesses/RepositoryTab.jsx:559 | ① | קצר — כותרת/תווית סבירה |
| שיבוצים קרובים | modules/04_hostesses/HostessViewCard.jsx:311 | ① | קצר — כותרת/תווית סבירה |
| שיעור היענות | modules/04_hostesses/HostessViewCard.jsx:284 | ① | קצר — כותרת/תווית סבירה |
| שכר שעתי | modules/04_hostesses/HostessFormDialog.jsx:62 (×3) | ① | קצר — כותרת/תווית סבירה |
| שכר שעתי (₪) | modules/04_hostesses/HostessFormDialog.jsx:355 | ① | קצר — כותרת/תווית סבירה |
| שלח שוב ({counts.expired}) | modules/04_hostesses/OverviewTab.jsx:417 | ① | תווית/כותרת/פעולה קצרה |
| שליחת הזימונים | modules/04_hostesses/SmartMatchPage.jsx:260 | ① | קצר — כותרת/תווית סבירה |
| שליחת הקישור | modules/04_hostesses/SmartMatchPage.jsx:325 | ① | קצר — כותרת/תווית סבירה |
| שמור דיילת | modules/04_hostesses/HostessFormDialog.jsx:544 | ① | קצר — כותרת/תווית סבירה |
| שמירת הדיילת נכשלה. | modules/04_hostesses/HostessFormDialog.jsx:247 (×2) | ① | קצר — כותרת/תווית סבירה |
| שמירת השפות נכשלה. | modules/04_hostesses/api.js:160 | ① | קצר — כותרת/תווית סבירה |
| שפות | modules/04_hostesses/HostessFormDialog.jsx:438 (×2) | ① | קצר — כותרת/תווית סבירה |
| תאריך | modules/04_hostesses/HostessViewCard.jsx:455 (×2) | ① | קצר — כותרת/תווית סבירה |
| תאריך הסיום מוקדם מתאריך ההתחלה. | modules/04_hostesses/HostessFormDialog.jsx:177 | ① | תווית/כותרת/פעולה קצרה |
| תוכלי להגיע למשמרת הזו? | modules/04_hostesses/PublicConfirmPage.jsx:166 | ① | תווית/כותרת/פעולה קצרה |
| תעודת זהות | modules/04_hostesses/HostessFormDialog.jsx:57 (×3) | ① | קצר — כותרת/תווית סבירה |

#### מודול 5 (logistics) — 66 מחרוזות ייחודיות

| מחרוזת | קובץ:שורה | סיווג | הערה |
|---|---|---|---|
| ⏱ שורה בענבר — פריט פיזי טרם הוזמן, והאירוע בתוך {optionalNumber(amberDays)} ימי עסקים — או: משלוח שתאריכו המובטח עבר וטרם הגיע. סימון מיידע בלבד: אפשר להתעלם ממנו, ואף פקד אינו ננעל. הקמת אתר רישום (01WEB) אינה נספרת — הסף נגזר מזמן ייצור של דפוס. | modules/05_logistics/LogisticsPage.jsx:666 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| כל הפקדים במסך הזה מושבתים ונשארים גלויים, כדי שיהיה ברור מה היה אפשר לעשות ולמה אי-אפשר. | modules/05_logistics/ChecklistDialog.jsx:561 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| {EXPLAINER_SAVE} סימון מוכן ממלא את הכמות בפועל אוטומטית, רק אם עדיין לא הוקלד בה ערך. וערך שמולא כך נושא לידו את הכיתוב "{AUTOFILL_TAG}" — שנעלם ברגע שהיא מקלידה. מספר שנרשם כאילו נמדד, ולא נמדד, יזלוג לחישוב הרווחיות של מודול 8 בלי שאיש ידע. מספר שהקלדת לעולם אינו נדרס. | modules/05_logistics/ChecklistDialog.jsx:546 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {project.event_name} — לצ'קליסט | modules/05_logistics/LogisticsPage.jsx:622 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {String(amber.businessDays)} ימי עסקים | modules/05_logistics/LogisticsPage.jsx:570 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {String(metric.ready)} מתוך {String(metric.total)} | modules/05_logistics/LogisticsPage.jsx:640 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אין כרגע פרויקט במצב הזה | modules/05_logistics/LogisticsPage.jsx:97 | ② | מצב-ריק |
| אין פרויקט התואם למסנן שבחרת. | modules/05_logistics/LogisticsPage.jsx:98 (×2) | ② | מצב-ריק |
| האירוע בוטל ב-{formatDate(project.cancelled_at, '—')} — הפרויקט נעול לעריכה. {project.cancel_reason ? 'הסיבה שנרשמה: "${project.cancel_reason}". ' : ''} אין לעדכן מצב או הערה בפרויקט מבוטל. אפשר עדיין לרשום כמות שהגיעה — שאר הפקדים נעולים. הנעילה חלה על כל המשתמשות. הפריט שכבר הוזמן נשאר ברשימה כראיית-חיוב ואינו משתנה — אין לו מצב "בוטל". | modules/05_logistics/ChecklistDialog.jsx:597 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| האירוע כבר הסתיים — לא ניתן לעדכן את הלוגיסטיקה שלו. | modules/05_logistics/ChecklistDialog.jsx:86 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| החלון: מהיום ועד יום העסקים הבא בכלל. היום {dayMonth(today)} — יום {weekdayOf(today)}, ושישי ושבת אינם ימי עבודה ⇒ יום העסקים הבא הוא {weekdayOf(next)} {dayMonth(next)}. | modules/05_logistics/LogisticsPage.jsx:417 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| היום: {formatDate(today)} · יום {weekdayOf(today)} | modules/05_logistics/LogisticsPage.jsx:366 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הסיבה שנרשמה: "{project.cancel_reason}". | modules/05_logistics/ChecklistDialog.jsx:605 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הסעיף מיידע בלבד — אין כאן סימון "יצא" ואין מה לשמור. | modules/05_logistics/LogisticsPage.jsx:91 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הערה — {name} — לא זמינה: {lockTitle} | modules/05_logistics/ChecklistDialog.jsx:867 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הערה חופשית — מה שכדאי שמנהלת הפרויקטים תדע | modules/05_logistics/ChecklistDialog.jsx:76 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפרויקט בוטל — אך אפשר לרשום סחורה שהגיעה (㊴) | modules/05_logistics/ChecklistDialog.jsx:82 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפרויקט בוטל — לא ניתן לעדכן | modules/05_logistics/ChecklistDialog.jsx:81 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפרויקט עבר ל"מוכן לביצוע" ויצא מרשימת העבודה שלך. כל הפריטים סומנו מוכנים והאיוש מלא. {completion.items > 0 && ( <span data-testid="checklist-shortfall"> {SHORTFALL.lead} {/* 🔴 היחיד נגזר מ-'units', לא מ-'items' — המילה שאחרי המספר מתארת **יחידות**. חוסר של יחידה אחת נמצא תמיד בפריט אחד, ולכן הענף הזה מכסה גם את שם-הפריט. */} {completion.units === 1 ? ( <> {SHORTFALL.oneUnit} {SHORTFALL.inOne}&quot;{completion.name}&quot; </> ) : completion.items === 1 ? ( <> <Ltr>{String(completion.units)}</Ltr> {SHORTFALL.inSingle}&quot;{completion.name}&quot; </> ) : ( <> <Ltr>{String(completion.units)}</Ltr> {SHORTFALL.inMany} <Ltr>{String(completion.items)}</Ltr> {SHORTFALL.itemsWord} </> )} {SHORTFALL.dash} <b>{SHORTFALL.emphasis}</b> {SHORTFALL.period} </span> )} | modules/05_logistics/ChecklistDialog.jsx:619 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפריט טרם הוזמן — הכמות בפועל נפתחת לעריכה אחרי סימון "הוזמן" | modules/05_logistics/ChecklistDialog.jsx:80 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כל הפריטים מוכנים — אך הפרויקט לא עבר ל"מוכן לביצוע": צוות הדיילות טרם הושלם. | modules/05_logistics/ChecklistDialog.jsx:117 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כל שינוי נשמר מיד — אין כפתור שמירה במסך. | modules/05_logistics/ChecklistDialog.jsx:88 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כמות בפועל — {name} — לא זמינה: {qtyTitle ?? ''} | modules/05_logistics/ChecklistDialog.jsx:798 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| פריט פיזי טרם הוזמן, והאירוע בתוך {days} ימי עסקים | modules/05_logistics/LogisticsPage.jsx:96 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שגיאה בטעינת הפרויקטים הפעילים. | modules/05_logistics/api.js:116 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת פרטי הפרויקט. | modules/05_logistics/api.js:196 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת פריטי הפרויקט | modules/05_logistics/ChecklistDialog.jsx:382 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת שורות הלוגיסטיקה. | modules/05_logistics/api.js:133 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שדה לא מוכר בבקשה ({key}) — העדכון לא בוצע. | modules/05_logistics/api.js:68 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שמירת עדכון הפריט נכשלה. | modules/05_logistics/api.js:216 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תאריך הגעה משוער — {name} | modules/05_logistics/ChecklistDialog.jsx:950 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תאריך הגעה משוער — {name} — נעול: {lockTitle} | modules/05_logistics/ChecklistDialog.jsx:950 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
|  ב | modules/05_logistics/ChecklistDialog.jsx:103 | ① | קצר — כותרת/תווית סבירה |
|  יחידות ב | modules/05_logistics/ChecklistDialog.jsx:104 | ① | קצר — כותרת/תווית סבירה |
|  יחידות ב- | modules/05_logistics/ChecklistDialog.jsx:105 | ① | קצר — כותרת/תווית סבירה |
|  פריטים | modules/05_logistics/ChecklistDialog.jsx:106 | ① | קצר — כותרת/תווית סבירה |
| , לא | modules/05_logistics/LogisticsPage.jsx:290 (×2) | ① | קצר — כותרת/תווית סבירה |
| דורש טיפול | modules/05_logistics/LogisticsPage.jsx:72 | ① | קצר — כותרת/תווית סבירה |
| האירוע | modules/05_logistics/LogisticsPage.jsx:435 (×2) | ① | קצר — כותרת/תווית סבירה |
| הגיע בפועל | modules/05_logistics/ChecklistDialog.jsx:928 | ① | קצר — כותרת/תווית סבירה |
| הגעה משוערת | modules/05_logistics/ChecklistDialog.jsx:512 | ① | קצר — כותרת/תווית סבירה |
| הוא מתועד ואינו עוצר את הפרויקט | modules/05_logistics/ChecklistDialog.jsx:108 | ① | תווית/כותרת/פעולה קצרה |
| המונים מציגים | modules/05_logistics/LogisticsPage.jsx:289 (×2) | ① | קצר — כותרת/תווית סבירה |
| הערה — {name} | modules/05_logistics/ChecklistDialog.jsx:867 | ① | קצר — כותרת/תווית סבירה |
| טוען את פריטי הפרויקט | modules/05_logistics/ChecklistDialog.jsx:372 | ① | תווית/כותרת/פעולה קצרה |
| יוצא עד יום העסקים הבא | modules/05_logistics/LogisticsPage.jsx:416 | ① | תווית/כותרת/פעולה קצרה |
| יחידה אחת | modules/05_logistics/ChecklistDialog.jsx:102 | ① | קצר — כותרת/תווית סבירה |
| כמות בפועל | modules/05_logistics/ChecklistDialog.jsx:511 (×2) | ① | קצר — כותרת/תווית סבירה |
| כמות בפועל — {name} | modules/05_logistics/ChecklistDialog.jsx:797 | ① | קצר — כותרת/תווית סבירה |
| כמות מתוכננת | modules/05_logistics/ChecklistDialog.jsx:510 (×2) | ① | קצר — כותרת/תווית סבירה |
| לצ'קליסט → | modules/05_logistics/LogisticsPage.jsx:102 | ① | קצר — כותרת/תווית סבירה |
| מה חסר | modules/05_logistics/LogisticsPage.jsx:501 (×2) | ① | קצר — כותרת/תווית סבירה |
| מוכנות | modules/05_logistics/LogisticsPage.jsx:437 (×2) | ① | קצר — כותרת/תווית סבירה |
| מוכנות לוגיסטית: | modules/05_logistics/ChecklistDialog.jsx:435 | ① | קצר — כותרת/תווית סבירה |
| מולא אוטומטית | modules/05_logistics/ChecklistDialog.jsx:89 | ① | קצר — כותרת/תווית סבירה |
| ממתין למשלוח | modules/05_logistics/LogisticsPage.jsx:73 | ① | קצר — כותרת/תווית סבירה |
| מצב הפרויקט: | modules/05_logistics/ChecklistDialog.jsx:427 (×2) | ① | קצר — כותרת/תווית סבירה |
| מצב הפריט | modules/05_logistics/ChecklistDialog.jsx:513 (×2) | ① | קצר — כותרת/תווית סבירה |
| מתוך | modules/05_logistics/ChecklistDialog.jsx:446 (×2) | ① | קצר — כותרת/תווית סבירה |
| נקי סינון | modules/05_logistics/LogisticsPage.jsx:99 (×2) | ① | קצר — כותרת/תווית סבירה |
| נרשם חוסר של  | modules/05_logistics/ChecklistDialog.jsx:101 | ① | קצר — כותרת/תווית סבירה |
| סגירה | modules/05_logistics/ChecklistDialog.jsx:580 (×4) | ① | קצר — כותרת/תווית סבירה |
| עדכון מצב | modules/05_logistics/ChecklistDialog.jsx:515 | ① | קצר — כותרת/תווית סבירה |
| עדכון מצב — {name} | modules/05_logistics/ChecklistDialog.jsx:850 | ① | קצר — כותרת/תווית סבירה |
| פריט | modules/05_logistics/ChecklistDialog.jsx:509 (×4) | ① | קצר — כותרת/תווית סבירה |
| צ׳קליסט הפרויקט | modules/05_logistics/ChecklistDialog.jsx:188 (×3) | ① | קצר — כותרת/תווית סבירה |

#### מודול 6 (projects) — 300 מחרוזות ייחודיות

| מחרוזת | קובץ:שורה | סיווג | הערה |
|---|---|---|---|
| אותר על המפה — משמש לדירוג הקרבה בשיבוץ | modules/06_projects/ProjectCardPage.jsx:490 | ④ | ממצא מאומת ידנית מול הקוד (ר׳ §3) |
| המדד: מאושרות ≥ נדרשות | modules/06_projects/TeamTab.jsx:211 | ④ | ממצא מאומת ידנית מול הקוד (ר׳ §3) |
| מההצעה — לא מספר סופי | modules/06_projects/ProjectCardPage.jsx:517 | ④ | ממצא מאומת ידנית מול הקוד (ר׳ §3) |
| ממוין: חסרים תחילה, ובתוכם לפי קרבת האירוע | modules/06_projects/ProjectsPage.jsx:79 | ④ | ממצא מאומת ידנית מול הקוד (ר׳ §3) |
| ההנחה זהה לזו שבהצעה — {Number(quote.applied_customer_discount) \|\| 0}% הנחת-לקוח ועוד {Number(quote.manual_discount) \|\| 0}% הנחה ידנית. מע"מ לפי השיעור שהוקפא באישור ההצעה. | modules/06_projects/ScopeChangeDialog.jsx:665 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| שלושת מצבי הפריט, לפי הסדר: טרם החל, הוזמן, מוכן. מי שמעדכנת אותם היא מנהלת הלוגיסטיקה, במסך שלה. כאן הם לקריאה בלבד. | modules/06_projects/LogisticsTab.jsx:432 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| "{s.model.name}" — הכמות המתוכננת תעודכן ל-{String(s.target)} במסך הלוגיסטיקה, עם הפניה לשינוי הזה. | modules/06_projects/ScopeChangeDialog.jsx:736 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| "{s.model.name}" — השורה תוסר ממסך הלוגיסטיקה, וההסרה תירשם בהיסטוריית שינויי-התכולה. | modules/06_projects/ScopeChangeDialog.jsx:731 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| "{s.product.item_name}" — תיפתח שורה חדשה במסך הלוגיסטיקה שמקורה הוא השינוי הזה. | modules/06_projects/ScopeChangeDialog.jsx:743 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {actualGuests != null ? <Ltr>{String(actualGuests)}</Ltr> : '—'} אורחים | modules/06_projects/ClosingTab.jsx:1247 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {actualHours != null ? <Ltr>{String(actualHours)}</Ltr> : '—'} שעות | modules/06_projects/ClosingTab.jsx:1241 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {marked}/{rows.length} דיילות סומנו | modules/06_projects/ClosingTab.jsx:789 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {project?.event_name} · {project?.customer_name}. שינוי כאן משנה את הפרויקט בלבד — ההצעה שהלקוח אישר נשארת כפי שהיא. | modules/06_projects/EditProjectDetailsDialog.jsx:243 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {project.customer_name} · פרויקט #{project.project_id} · נוצר מהצעה #{project.quote_id} | modules/06_projects/ProjectCardPage.jsx:226 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {round} · זימון {formatTimestamp(row.invite_sent_at)} | modules/06_projects/TeamTab.jsx:422 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {row.city && '${row.city} · '} {Number(row.rateSnapshot ?? 0)} ₪ לשעה | modules/06_projects/ClosingTab.jsx:938 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {String(ready)} מתוך {String(rows.length)} | modules/06_projects/LogisticsTab.jsx:266 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ⚠ הדרישה תרד ל-{String(hostessState.target)} דיילות. המערכת לא תשחרר אף דיילת מכאן — מנהלת הגיוס בוחרת את מי לשחרר במסך שלה, והמשוחררות יקבלו את מייל "חל שינוי בתכולה". | modules/06_projects/ScopeChangeDialog.jsx:1024 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ⚠ הלחיצה הזאת סוגרת את האירוע ואי-אפשר לבטל אותה. דוח-הסיכום נשלח ל {mailContact?.contact_name ? '${mailContact.contact_name}, ${project?.customer_name ?? ''}' : (project?.customer_name ?? 'לקוח')} · סקר-משוב יוצא ללקוח · הסטטוס עובר ל"ממתין לחשבונית" · הכרטיס ננעל לעריכה תפעולית · העלות בפועל קופאת · שעות הדיילות עוברות לדוח-השכר. | modules/06_projects/ClosingTab.jsx:797 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| 🔒 {MONEY_HIDDEN_SENTENCE} עמודת ההשפעה על ההכנסה וסך-השינויים מוצגים כ״—״. | modules/06_projects/LogisticsTab.jsx:522 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| 🗂️ לא נרשמו שינויי תכולה באירוע הזה {canAct && ( <div className="mt-2"> <button type="button" className="text-[12.5px] font-semibold text-teal-700" onClick={onOpen} data-testid="closing-change-link" > רישום שינוי שהתגלה באירוע </button> </div> )} | modules/06_projects/ClosingTab.jsx:1093 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אחרי האירוע, שינויים מוזנים בלשונית 'סגירת אירוע' | modules/06_projects/ProjectCardPage.jsx:66 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אין אירוע בעבודה כרגע | modules/06_projects/ProjectsPage.jsx:481 | ② | מצב-ריק |
| אין אירוע שממתין לסגירה | modules/06_projects/ProjectsPage.jsx:481 | ② | מצב-ריק |
| אין הצעה מקושרת | modules/06_projects/ProjectCardPage.jsx:522 (×2) | ② | מצב-ריק |
| אין כרגע פרויקט בסטטוס הזה | modules/06_projects/ProjectsPage.jsx:440 | ② | מצב-ריק |
| אין לך הרשאה לצפות בדיילות המשובצות. | modules/06_projects/ClosingTab.jsx:705 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין שינויים עדיין | modules/06_projects/LogisticsTab.jsx:312 | ② | מצב-ריק |
| אין שינויים עדיין. | modules/06_projects/LogisticsTab.jsx:456 | ② | מצב-ריק |
| אין שעות | modules/06_projects/ClosingTab.jsx:1043 | ② | מצב-ריק |
| אירועים שהלוגיסטיקה בהם טרם מוכנה | modules/06_projects/ProjectsPage.jsx:376 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אף פריט לוגיסטי אינו משתנה בשמירה הזו. | modules/06_projects/ScopeChangeDialog.jsx:723 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| בוטל ב-{formatTimestampFull(project.cancelled_at)} {project.cancelled_by && ( <> {' '} על-ידי <Ltr>{project.cancelled_by}</Ltr> </> )} | modules/06_projects/ProjectCardPage.jsx:656 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| בחירת "לא לשלוח שוב" פותחת מתחת לשורה שדה סיבה — חובה, ובלעדיו לא ניתן לשמור. הסימון נשמר מול {project?.customer_name ?? 'הלקוח'} ומשפיע רק על שיבוצים עתידיים אצל הלקוח הזה. | modules/06_projects/ClosingTab.jsx:758 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ביטול {daysBefore === null ? '—' : String(daysBefore)} ימים לפני האירוע. | modules/06_projects/CancelProjectDialog.jsx:425 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דוח-סיכום אירוע · חובה | modules/06_projects/ClosingTab.jsx:603 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דיילות — מספר הדיילות אינו משתנה בשמירה הזו. | modules/06_projects/ScopeChangeDialog.jsx:691 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| האירוע נסגר. הדוח נשלח ל{recipient}, והפרויקט עבר למנהלת הכספים. | modules/06_projects/ClosingTab.jsx:381 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הביטול לא בוצע — {err?.message ?? 'שגיאה לא צפויה.'} הפרויקט לא השתנה, והדיילות לא שוחררו. | modules/06_projects/CancelProjectDialog.jsx:396 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הגיעו כבר פריטים — לא ניתן להסיר | modules/06_projects/ScopeChangeDialog.jsx:77 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההצעה המאושרת אינה משתנה. סה"כ לפרויקט אחרי השינוי: {totalAfterChange !== null ? <Money exact amount={totalAfterChange} /> : <Ltr>—</Ltr>} . | modules/06_projects/ScopeChangeDialog.jsx:1065 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הורדת דוח-הסיכום מהאחסון נכשלה. | modules/06_projects/closingApi.js:67 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הזימונים מחדש לא נשלחו — אין לך הרשאה לצפות בדיילות, ולכן אין מכאן דרך לשלוח אליהן. | modules/06_projects/EditProjectDetailsDialog.jsx:207 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הכמות חייבת להיות מספר שלם. | modules/06_projects/ScopeChangeDialog.jsx:73 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הכרטיס נסגר תפעולית ב-{formatDate(String(closedStamp).slice(0, 10))} | modules/06_projects/TeamTab.jsx:305 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המיילים לא יצאו — ללקוח אין כתובת מייל זמינה. אפשר לשלוח שוב אחרי עדכון הכתובת. | modules/06_projects/ClosingTab.jsx:296 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הנפקת קישור-המשוב נכשלה. | modules/06_projects/api.js:418 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הסגירה נשמרה. {parts.join(' · ')} — אפשר לשלוח שוב. | modules/06_projects/ClosingTab.jsx:338 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| העלאת דוח-הסיכום נכשלה. | modules/06_projects/closingApi.js:35 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפיצוי לדיילות נקבע לפי מרחק-הזמן מהאירוע. | modules/06_projects/CancelProjectDialog.jsx:66 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפרויקט ייסגר, הדיילות ישוחררו, והעובדה תישמר בכרטיס — והפעולה אינה הפיכה. | modules/06_projects/CancelProjectDialog.jsx:526 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפריט כבר הוזמן — לא ניתן להסירו | modules/06_projects/ScopeChangeDialog.jsx:76 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפרמטר "{name}" חסר בהגדרות המערכת. | modules/06_projects/closingApi.js:124 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפרת-הסכם מצידו — אנחנו היינו מוכנים ומסוגלים לבצע. | modules/06_projects/CancelProjectDialog.jsx:65 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| התאריך הנוכחי: {isoToDmy(project?.final_event_date)} | modules/06_projects/EditProjectDetailsDialog.jsx:282 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| התאריך, השעה ומי ביצעה את הביטול — נחתמים אוטומטית עם האישור, ואינם ניתנים לעריכה. | modules/06_projects/CancelProjectDialog.jsx:496 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חובה לכתוב סיבה. היא נשמרת בכרטיס והיא ההסבר היחיד שיישאר אחרי הביטול. | modules/06_projects/CancelProjectDialog.jsx:56 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חובה למלא סיבה — היא מה שיסביר את החיוב הזה בעוד חודש. | modules/06_projects/ScopeChangeDialog.jsx:79 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חובה. בלי סיבה אי-אפשר לשמור. הסיבה נשמרת עם השינוי ומוצגת בהיסטוריה שבלשונית הלוגיסטיקה. | modules/06_projects/ScopeChangeDialog.jsx:1101 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| טבלת-הסגירה דורשת הרשאת צפייה במודול הדיילות. | modules/06_projects/ClosingTab.jsx:706 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| טרם אותר על המפה — דירוג הקרבה בשיבוץ יהיה ניטרלי | modules/06_projects/ProjectCardPage.jsx:491 | ② | מצב-ריק |
| טרם מוכן לשליחה | modules/06_projects/ClosingTab.jsx:785 | ② | מצב-ריק |
| טרם צורף קובץ | modules/06_projects/ClosingTab.jsx:645 | ② | מצב-ריק |
| יחסרו {String(newGap)} דיילות במקום {String(oldGap)} | modules/06_projects/ScopeChangeDialog.jsx:711 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| יירשם אוטומטית: {user?.fullName ?? user?.email ?? '—'} · {formatTimestamp(loadedAt.toISOString())} | modules/06_projects/ScopeChangeDialog.jsx:1108 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| יצירת קישור להורדת הדוח נכשלה. | modules/06_projects/closingApi.js:76 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כמות אורחים בפועל · חובה | modules/06_projects/ClosingTab.jsx:561 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כמות הדיילות חייבת להיות גדולה מאפס. | modules/06_projects/ScopeChangeDialog.jsx:70 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כמות חדשה — {model.name} | modules/06_projects/ScopeChangeDialog.jsx:474 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כמות של פריט חדש חייבת להיות גדולה מאפס. | modules/06_projects/ScopeChangeDialog.jsx:71 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כרטיס הפרויקט לא נטען. | modules/06_projects/ProjectCardPage.jsx:146 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא התקבל קישור-משוב — ייתכן שאין לך הרשאה. | modules/06_projects/api.js:422 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא ידוע אם {unknowns.join(' ו')} יצא — בדקי בתיבת "נשלחו" לפני שליחה חוזרת | modules/06_projects/ClosingTab.jsx:334 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא ידוע אם נשלח — לא התקבל אישור שליחה. | modules/06_projects/CancelProjectDialog.jsx:155 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא יישלח מייל לאף דיילת. גיוס הדיילות הנוספות נעשה במסך השיבוץ של מנהלת הגיוס. | modules/06_projects/ScopeChangeDialog.jsx:1061 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא ניתן לטעון | modules/06_projects/ProjectCardPage.jsx:290 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לסמן איכות — לא הגיעה, ואי-אפשר לשפוט מי שלא ראית. | modules/06_projects/ClosingTab.jsx:1000 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא נשלח — {prepError} | modules/06_projects/CancelProjectDialog.jsx:114 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא נשלח — אין הרשאה לכתובות המייל. | modules/06_projects/CancelProjectDialog.jsx:121 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא נשלח — לא נמצאה כתובת מייל. | modules/06_projects/CancelProjectDialog.jsx:134 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא שינית אף כמות — אין מה לשמור | modules/06_projects/ScopeChangeDialog.jsx:81 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| למשל: היכל התרבות, תל אביב | modules/06_projects/EditProjectDetailsDialog.jsx:302 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| למשל: הלקוח דחה את האירוע לרבעון הבא | modules/06_projects/CancelProjectDialog.jsx:475 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| למשל: רון גל הודיע ב-12/08 שיגיעו עוד 80 אורחים וביקש להוסיף 2 דיילות | modules/06_projects/ScopeChangeDialog.jsx:1086 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לעניין הפיצוי מתנהג כמו "הלקוח ביטל". | modules/06_projects/CancelProjectDialog.jsx:78 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לפריט אין שורת-לוגיסטיקה מקושרת — לא ניתן לעדכן אותו מכאן | modules/06_projects/ScopeChangeDialog.jsx:523 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לתיעוד ולדו"חות בלבד — אינו משנה את החיוב ללקוח | modules/06_projects/ClosingTab.jsx:589 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מאפס את הפיצוי לדיילות — 0% תמיד, גם בביטול של יום לפני. | modules/06_projects/CancelProjectDialog.jsx:72 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מדד הצוות יחזור מ-{banner.metricFrom} ל-{banner.metricTo}. | modules/06_projects/EditProjectDetailsDialog.jsx:255 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מדרגה {tier.min_qty}–{tier.max_qty ?? ''} | modules/06_projects/ScopeChangeDialog.jsx:587 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מה משתנה — מחירי היחידה מגיעים מההצעה המאושרת ואינם ניתנים לעריכה. משנים כמויות בלבד. | modules/06_projects/ScopeChangeDialog.jsx:945 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מה קרה — הסיבה תופיע בכרטיס הדיילת | modules/06_projects/ClosingTab.jsx:1016 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מה קרה בפועל — ברמת האירוע | modules/06_projects/ClosingTab.jsx:515 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מייל "האירוע בוטל" אל {o.name}: {o.text} | modules/06_projects/CancelProjectDialog.jsx:176 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מיילי העדכון לא נשלחו — אין לך הרשאה לצפות בדיילות, ולכן אין מכאן דרך לשלוח אליהן. | modules/06_projects/EditProjectDetailsDialog.jsx:219 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מיילי העדכון לא נשלחו — למנהלת הפרויקט חסר שם או טלפון, ואין איש-קשר לציין במייל. | modules/06_projects/EditProjectDetailsDialog.jsx:225 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מלחמה · אסון טבע · צו ממשלתי. לא: שינוי דעה של הלקוח. | modules/06_projects/CancelProjectDialog.jsx:71 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מקרה חריג שאינו אחד משני אלה — תארי אותו בשדה למטה. | modules/06_projects/CancelProjectDialog.jsx:77 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מרגע זה הפרויקט עובר לטיפול מנהלת הכספים. | modules/06_projects/ClosingTab.jsx:872 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| משמרת · קובע את מספר הדיילות הנדרשות | modules/06_projects/ScopeChangeDialog.jsx:100 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| משנים כמויות בלבד. ההצעה שהלקוח אישר נשארת כפי שהיא — השינוי נרשם בשורה נפרדת ומתווסף לחיוב. | modules/06_projects/ScopeChangeDialog.jsx:1158 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מתוכנן: {plannedRange ? <Ltr>{plannedRange}</Ltr> : '—'} · {String(plannedHours)} שעות | modules/06_projects/ClosingTab.jsx:543 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מתוכנן: {quoteMeta?.estimated_guests != null ? ( <Ltr>{String(quoteMeta.estimated_guests)}</Ltr> ) : ( '—' )} אורחים | modules/06_projects/ClosingTab.jsx:580 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נדרס ידנית · ברירת-מחדל {String(eventHours)} | modules/06_projects/ClosingTab.jsx:1048 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נוכחות היא עובדה — היא מזינה את ציון-האמינות בשיבוץ החכם. סימון-איכות הוא שיפוט — הוא קובע את מי נציע ל{project?.customer_name ?? 'לקוח'} בפעם הבאה. שתי שאלות שונות, ושתיהן חובה בכל שורה. | modules/06_projects/ClosingTab.jsx:689 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נכשל — המייל לא נשלח. | modules/06_projects/CancelProjectDialog.jsx:156 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| נסגר ב-{formatTimestampFull(closedAt)} {closedBy && ( <> {' '} על-ידי <Ltr>{closedBy}</Ltr> </> )} | modules/06_projects/ClosingTab.jsx:1225 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נשמרת בכרטיס הפרויקט וזמינה לדו"חות. חובה בכל אחד משלושת הסוגים. | modules/06_projects/CancelProjectDialog.jsx:490 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נתוני צוות הדיילות של הפרויקט לא נטענו. | modules/06_projects/TeamTab.jsx:128 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סבב {Number(row.assignment_number) \|\| 1} | modules/06_projects/TeamTab.jsx:419 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סגירת אירוע {closingDisabled && ( <span className="text-[11px] font-normal text-slate-400" data-testid="project-tab-closing-reason" > {closing.reason} </span> )} | modules/06_projects/ProjectCardPage.jsx:703 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סוג הביטול — חובה לבחור אחד | modules/06_projects/CancelProjectDialog.jsx:449 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סיבת "לא לשלוח שוב" — {row.name} | modules/06_projects/ClosingTab.jsx:1015 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סימוני-האיכות לא נשמרו — לפרויקט אין לקוח משויך. | modules/06_projects/ClosingTab.jsx:384 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סך שינויי התכולה: {signedShekelCents(money.preDiscount)} לפני הנחה. {money.discountPercent > 0 && ( <> {' '} אחרי הנחת הלקוח שנקבעה בהצעה (<Ltr>{'${money.discountPercent}%'}</Ltr>):{' '} <b> <Ltr>{signedShekelCents(money.afterDiscount)}</Ltr> </b> . </> )} {FROZEN_PRICE_SENTENCE} | modules/06_projects/LogisticsTab.jsx:529 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדיין אין פרויקטים במערכת. | modules/06_projects/ProjectsPage.jsx:281 | ② | מצב-ריק |
| עדכון סטטוס-הסקר לא נחת — ייתכן שאין לך הרשאה. | modules/06_projects/api.js:433 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדכון סטטוס-הסקר נכשל. | modules/06_projects/api.js:431 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדכון פרטי הפרויקט נכשל. | modules/06_projects/api.js:193 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| פיצוי לדיילות: {percent === null ? '—' : '${percent}%'} | modules/06_projects/CancelProjectDialog.jsx:198 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| פרויקט נוצר מעצמו ברגע שהצעת מחיר מאושרת — אין כאן יצירה ידנית. | modules/06_projects/ProjectsPage.jsx:282 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| פריט חדש נכנס לפי מדרגת-המחיר בקטלוג היום, ומקבל את הנחת ההצעה | modules/06_projects/ScopeChangeDialog.jsx:1006 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| פריטי הלוגיסטיקה לא משתנים. מה שכבר הוזמן נשאר מסומן כהוזמן — זו הראיה לחיוב ההוצאות שבוצעו לפני הביטול. | modules/06_projects/CancelProjectDialog.jsx:441 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| קובע את ברירת-המחדל בעמודת "שעות בפועל" של כל דיילת — וניתן לדרוס אותה פר-שורה | modules/06_projects/ClosingTab.jsx:547 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| רשימת-הסגירה השתנתה מאז שהמסך נטען. | modules/06_projects/ClosingTab.jsx:817 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שגיאה בטעינת איש הקשר של הלקוח. | modules/06_projects/api.js:152 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת הגדרות המערכת. | api/params.js:46 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת הגדרות הפיצוי. | modules/06_projects/cancellationApi.js:23 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת הלוגיסטיקה של הפרויקט. | modules/06_projects/api.js:87 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת יומן השינויים. | modules/06_projects/api.js:101 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת כתובות המייל של הדיילות. | modules/06_projects/cancellationApi.js:45 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת מבט-העל של הפרויקטים. | modules/06_projects/api.js:60 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת סימוני-האיכות. | modules/06_projects/closingApi.js:108 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת שיבוצי הפרויקט. | modules/06_projects/api.js:119 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה לא צפויה. | modules/06_projects/CancelProjectDialog.jsx:312 (×6) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שינוי מיקום אינו מבטל אישורים. הדיילות מקבלות עדכון, והנקודה על המפה נקבעת מחדש. | modules/06_projects/EditProjectDetailsDialog.jsx:305 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שינוי שנשמר בדיאלוג נרשם במסד מיד — גם אם הסגירה לא תושלם, השינוי יישאר רשום וייכנס לחיוב. | modules/06_projects/ClosingTab.jsx:99 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שינוי שעות אינו מבטל אישורים. הדיילות מקבלות עדכון שנוקב בשעות החדשות. | modules/06_projects/EditProjectDetailsDialog.jsx:336 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שלושת השדות חובה. בלעדיהם לא ניתן לשמור ולשלוח. | modules/06_projects/ClosingTab.jsx:516 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שמירת שינוי התכולה נכשלה. | modules/06_projects/ScopeChangeDialog.jsx:916 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שעות ביצוע בפועל · חובה | modules/06_projects/ClosingTab.jsx:522 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שעות בפועל — {row.name} | modules/06_projects/ClosingTab.jsx:1033 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תוספת או הפחתה שסוכמה בשטח ולא נרשמה מראש — נרשמת כאן, ונכנסת לחיוב. | modules/06_projects/ClosingTab.jsx:1089 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ‏PDF · JPG · PNG · עד {REPORT_MAX_BYTES / 1024 / 1024}MB. הקובץ נשלח ללקוח כקובץ מצורף | modules/06_projects/ClosingTab.jsx:660 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
|  ו | modules/06_projects/ClosingTab.jsx:332 (×2) | ① | קצר — כותרת/תווית סבירה |
| — כמו בהצעה המקורית | modules/06_projects/ScopeChangeDialog.jsx:644 | ① | קצר — כותרת/תווית סבירה |
| , ולכן | modules/06_projects/ScopeChangeDialog.jsx:709 | ① | קצר — כותרת/תווית סבירה |
| . הפרויקט | modules/06_projects/ScopeChangeDialog.jsx:715 | ① | קצר — כותרת/תווית סבירה |
| . מאושרות סופית היום: | modules/06_projects/ScopeChangeDialog.jsx:707 | ① | תווית/כותרת/פעולה קצרה |
| {failures.join(' ו')} לא יצא | modules/06_projects/ClosingTab.jsx:332 | ① | תווית/כותרת/פעולה קצרה |
| + הוספת פריט שאינו בהצעה | modules/06_projects/ScopeChangeDialog.jsx:992 | ① | תווית/כותרת/פעולה קצרה |
| ✎ עריכת פרטים | modules/06_projects/ProjectCardPage.jsx:452 | ① | קצר — כותרת/תווית סבירה |
| ✓ אין פריטים | lib/projectCard.js:212 (×5) | ① | קצר — כותרת/תווית סבירה |
| אורחים | lib/paramsRegistry.js:296 (×2) | ① | קצר — כותרת/תווית סבירה |
| אורחים מוערכים | modules/06_projects/ProjectCardPage.jsx:510 | ① | קצר — כותרת/תווית סבירה |
| אחרי הנחת הלקוח | modules/06_projects/LogisticsTab.jsx:331 | ① | קצר — כותרת/תווית סבירה |
| אחרי הנחת הלקוח שנקבעה בהצעה ( | modules/06_projects/LogisticsTab.jsx:540 | ① | תווית/כותרת/פעולה קצרה |
| אין. | modules/06_projects/TeamTab.jsx:434 | ① | קצר — כותרת/תווית סבירה |
| אירועים שחסרות בהם דיילות | modules/06_projects/ProjectsPage.jsx:363 | ① | תווית/כותרת/פעולה קצרה |
| איש קשר אצל הלקוח | modules/06_projects/ProjectCardPage.jsx:495 | ① | קצר — כותרת/תווית סבירה |
| בוטל | lib/projects.js:16 (×4) | ① | קצר — כותרת/תווית סבירה |
| בחירת מוצר מהקטלוג | modules/06_projects/ScopeChangeDialog.jsx:561 | ① | קצר — כותרת/תווית סבירה |
| בחירת קובץ | modules/06_projects/ClosingTab.jsx:647 | ① | קצר — כותרת/תווית סבירה |
| בחר/י מוצר מהקטלוג | modules/06_projects/ScopeChangeDialog.jsx:565 | ① | קצר — כותרת/תווית סבירה |
| בחרי נוכחות… | modules/06_projects/ClosingTab.jsx:956 | ① | קצר — כותרת/תווית סבירה |
| בטל את הפרויקט | modules/06_projects/CancelProjectDialog.jsx:255 | ① | קצר — כותרת/תווית סבירה |
| בטל הסרה | modules/06_projects/ScopeChangeDialog.jsx:433 | ① | קצר — כותרת/תווית סבירה |
| ביטול הפרויקט נכשל. | modules/06_projects/api.js:223 | ① | קצר — כותרת/תווית סבירה |
| ביטול פרויקט | modules/06_projects/CancelProjectDialog.jsx:525 (×2) | ① | קצר — כותרת/תווית סבירה |
| בסדר | lib/projectClosing.js:67 (×2) | ① | קצר — כותרת/תווית סבירה |
| בעבודה | modules/06_projects/ProjectsPage.jsx:63 | ① | קצר — כותרת/תווית סבירה |
| דוח-סיכום אירוע | modules/06_projects/ClosingTab.jsx:1252 | ① | קצר — כותרת/תווית סבירה |
| דוח-סיכום הועלה | modules/06_projects/ClosingTab.jsx:787 | ① | קצר — כותרת/תווית סבירה |
| דיילות ל- | modules/06_projects/ScopeChangeDialog.jsx:706 | ① | קצר — כותרת/תווית סבירה |
| דיילת | modules/06_projects/ClosingTab.jsx:714 (×5) | ① | קצר — כותרת/תווית סבירה |
| דיילת #{hostess.hostess_id} | modules/06_projects/CancelProjectDialog.jsx:112 | ① | תווית/כותרת/פעולה קצרה |
| הדרישה | modules/06_projects/ScopeChangeDialog.jsx:705 | ① | קצר — כותרת/תווית סבירה |
| הדרישה נשארת | modules/06_projects/ScopeChangeDialog.jsx:690 | ① | קצר — כותרת/תווית סבירה |
| הורדה | modules/06_projects/ClosingTab.jsx:620 (×3) | ① | קצר — כותרת/תווית סבירה |
| החלפת קובץ | modules/06_projects/ClosingTab.jsx:632 | ① | קצר — כותרת/תווית סבירה |
| היסטוריית הסבבים | modules/06_projects/TeamTab.jsx:471 | ① | קצר — כותרת/תווית סבירה |
| היסטוריית שינויי תכולה | modules/06_projects/LogisticsTab.jsx:452 | ① | תווית/כותרת/פעולה קצרה |
| הכול {String(total)} | modules/06_projects/ProjectsPage.jsx:424 | ① | קצר — כותרת/תווית סבירה |
| הכמות אינה יכולה להיות שלילית. | modules/06_projects/ScopeChangeDialog.jsx:72 | ① | תווית/כותרת/פעולה קצרה |
| הכנסה מתוכננת | modules/06_projects/ProjectCardPage.jsx:527 | ① | קצר — כותרת/תווית סבירה |
| הכנת המיילים נכשלה. | modules/06_projects/CancelProjectDialog.jsx:99 | ① | קצר — כותרת/תווית סבירה |
| הלקוח | modules/06_projects/ClosingTab.jsx:379 (×2) | ① | קצר — כותרת/תווית סבירה |
| הלקוח ביטל | lib/projectCard.js:13 (×2) | ① | קצר — כותרת/תווית סבירה |
| הסר פריט | modules/06_projects/ScopeChangeDialog.jsx:433 | ① | קצר — כותרת/תווית סבירה |
| הסרת השורה החדשה | modules/06_projects/ScopeChangeDialog.jsx:578 | ① | קצר — כותרת/תווית סבירה |
| הסתר ({rows.length} שורות) | modules/06_projects/TeamTab.jsx:478 | ① | תווית/כותרת/פעולה קצרה |
| הערת הלוגיסטיקה: | modules/06_projects/LogisticsTab.jsx:339 | ① | קצר — כותרת/תווית סבירה |
| הפרויקט חזר לציר הפעיל. | modules/06_projects/EditProjectDetailsDialog.jsx:180 | ① | תווית/כותרת/פעולה קצרה |
| הפרויקט לא נמצא | modules/06_projects/ProjectCardPage.jsx:172 | ① | קצר — כותרת/תווית סבירה |
| הפרש | modules/06_projects/ScopeChangeDialog.jsx:961 | ① | קצר — כותרת/תווית סבירה |
| הצג ({rows.length} שורות) | modules/06_projects/TeamTab.jsx:478 | ① | תווית/כותרת/פעולה קצרה |
| השינוי | modules/06_projects/LogisticsTab.jsx:466 | ① | קצר — כותרת/תווית סבירה |
| השפעה על ההכנסה | modules/06_projects/LogisticsTab.jsx:469 | ① | קצר — כותרת/תווית סבירה |
| השפעת השינויים על ההכנסה | modules/06_projects/LogisticsTab.jsx:300 (×4) | ① | תווית/כותרת/פעולה קצרה |
| התוספת לחיוב | modules/06_projects/ScopeChangeDialog.jsx:638 | ① | קצר — כותרת/תווית סבירה |
| זימונים מחדש נשלחו | modules/06_projects/EditProjectDetailsDialog.jsx:211 | ① | קצר — כותרת/תווית סבירה |
| חזרה | modules/06_projects/CancelProjectDialog.jsx:257 (×2) | ① | קצר — כותרת/תווית סבירה |
| חזרה למבט-העל → | modules/06_projects/ProjectCardPage.jsx:174 | ① | קצר — כותרת/תווית סבירה |
| חיוב | modules/06_projects/ScopeChangeDialog.jsx:1065 | ① | קצר — כותרת/תווית סבירה |
| חסרות | modules/06_projects/TeamTab.jsx:216 | ① | קצר — כותרת/תווית סבירה |
| יוסר | modules/06_projects/ScopeChangeDialog.jsx:512 | ① | קצר — כותרת/תווית סבירה |
| יישאר במצב "בתהליך" | modules/06_projects/ScopeChangeDialog.jsx:716 | ① | קצר — כותרת/תווית סבירה |
| יעבור למצב "מוכן לביצוע" | modules/06_projects/ScopeChangeDialog.jsx:716 | ① | תווית/כותרת/פעולה קצרה |
| כוח עליון | lib/projectCard.js:14 (×3) | ① | קצר — כותרת/תווית סבירה |
| כמות — פריט חדש | modules/06_projects/ScopeChangeDialog.jsx:598 | ① | קצר — כותרת/תווית סבירה |
| כמות אורחים בפועל | lib/projectClosing.js:158 (×2) | ① | קצר — כותרת/תווית סבירה |
| כמות בתוקף | modules/06_projects/ScopeChangeDialog.jsx:959 | ① | קצר — כותרת/תווית סבירה |
| כמות דיילות | modules/06_projects/LogisticsTab.jsx:484 | ① | קצר — כותרת/תווית סבירה |
| כמות הדיילות בפרויקט | modules/06_projects/ScopeChangeDialog.jsx:99 | ① | קצר — כותרת/תווית סבירה |
| כמות חדשה | modules/06_projects/ScopeChangeDialog.jsx:960 | ① | קצר — כותרת/תווית סבירה |
| כמות נדרשת | modules/06_projects/TeamTab.jsx:203 | ① | קצר — כותרת/תווית סבירה |
| לא הוגדר איש קשר | modules/06_projects/ProjectCardPage.jsx:441 | ① | קצר — כותרת/תווית סבירה |
| לא הוגדר/ה מנהל/ת פרויקט | modules/06_projects/ProjectCardPage.jsx:561 | ① | תווית/כותרת/פעולה קצרה |
| לא הוזנו שעות | modules/06_projects/ProjectCardPage.jsx:480 | ① | קצר — כותרת/תווית סבירה |
| לא היה בהצעה הסרה | modules/06_projects/ScopeChangeDialog.jsx:572 | ① | קצר — כותרת/תווית סבירה |
| לא נשלח אף זימון לדיילת | modules/06_projects/ProjectsPage.jsx:550 | ① | תווית/כותרת/פעולה קצרה |
| לוגיסטיקה ומוצרים | modules/06_projects/ProjectCardPage.jsx:299 (×2) | ① | קצר — כותרת/תווית סבירה |
| לכרטיס | modules/06_projects/ProjectsPage.jsx:538 | ① | קצר — כותרת/תווית סבירה |
| ללא שינוי | modules/06_projects/ScopeChangeDialog.jsx:542 | ① | קצר — כותרת/תווית סבירה |
| למסך הצעות מחיר → | modules/06_projects/ProjectsPage.jsx:284 | ① | קצר — כותרת/תווית סבירה |
| לסגירה | modules/06_projects/ProjectsPage.jsx:64 (×2) | ① | קצר — כותרת/תווית סבירה |
| לסגירה → | modules/06_projects/ProjectsPage.jsx:524 | ① | קצר — כותרת/תווית סבירה |
| לפני מע"מ | modules/06_projects/ProjectCardPage.jsx:549 (×2) | ① | קצר — כותרת/תווית סבירה |
| לפני מע"מ, אחרי הנחה של | modules/06_projects/ProjectCardPage.jsx:545 | ① | נבדק ידנית בהקשר — תווית/כותרת תקינה |
| לשונית הסגירה לא נטענה. | modules/06_projects/ClosingTab.jsx:241 | ① | תווית/כותרת/פעולה קצרה |
| מ- | modules/06_projects/ScopeChangeDialog.jsx:706 (×2) | ① | קצר — כותרת/תווית סבירה |
| מבטל... | modules/06_projects/CancelProjectDialog.jsx:255 | ① | קצר — כותרת/תווית סבירה |
| מדרג-הפיצוי חסר בהגדרות המערכת. | modules/06_projects/CancelProjectDialog.jsx:303 | ① | תווית/כותרת/פעולה קצרה |
| מה זה אומר | modules/06_projects/TeamTab.jsx:361 | ① | קצר — כותרת/תווית סבירה |
| מה יקרה כשתשמרי | modules/06_projects/ScopeChangeDialog.jsx:1046 | ① | קצר — כותרת/תווית סבירה |
| מה קרה עם כל דיילת | modules/06_projects/ClosingTab.jsx:688 | ① | קצר — כותרת/תווית סבירה |
| מה קרה, במילים שלך | modules/06_projects/ScopeChangeDialog.jsx:1077 | ① | קצר — כותרת/תווית סבירה |
| מההצעה | modules/06_projects/TeamTab.jsx:205 | ① | קצר — כותרת/תווית סבירה |
| מוכן לשליחה | modules/06_projects/ClosingTab.jsx:785 | ① | קצר — כותרת/תווית סבירה |
| מועד | modules/06_projects/ScopeChangeDialog.jsx:932 | ① | קצר — כותרת/תווית סבירה |
| מופיע לדיילות במייל האישור | modules/06_projects/ProjectCardPage.jsx:577 | ① | תווית/כותרת/פעולה קצרה |
| מחיר ליח' · קפוא | modules/06_projects/ScopeChangeDialog.jsx:958 | ① | קצר — כותרת/תווית סבירה |
| מי ביצעה | modules/06_projects/LogisticsTab.jsx:468 | ① | קצר — כותרת/תווית סבירה |
| מייל "האירוע בוטל" נשלח | modules/06_projects/CancelProjectDialog.jsx:171 | ① | תווית/כותרת/פעולה קצרה |
| מייל דוח-הסיכום | modules/06_projects/ClosingTab.jsx:102 | ① | קצר — כותרת/תווית סבירה |
| מייל הסקר | modules/06_projects/ClosingTab.jsx:103 | ① | קצר — כותרת/תווית סבירה |
| מייל הסקר נשלח ללקוח. | modules/06_projects/ClosingTab.jsx:432 | ① | תווית/כותרת/פעולה קצרה |
| מייל עדכון נשלח | modules/06_projects/EditProjectDetailsDialog.jsx:231 | ① | קצר — כותרת/תווית סבירה |
| מיילי "האירוע בוטל" נשלחו | modules/06_projects/CancelProjectDialog.jsx:171 | ① | תווית/כותרת/פעולה קצרה |
| מיילי עדכון נשלחו | modules/06_projects/EditProjectDetailsDialog.jsx:231 | ① | קצר — כותרת/תווית סבירה |
| מיילים | modules/06_projects/ScopeChangeDialog.jsx:1061 | ① | קצר — כותרת/תווית סבירה |
| מנהל/ת הפרויקט | modules/06_projects/ProjectCardPage.jsx:556 | ① | קצר — כותרת/תווית סבירה |
| מע"מ | modules/06_projects/ScopeChangeDialog.jsx:653 | ① | קצר — כותרת/תווית סבירה |
| מצוינת | lib/projectClosing.js:66 (×3) | ① | קצר — כותרת/תווית סבירה |
| משוב הלקוח | modules/06_projects/ProjectCardPage.jsx:582 (×3) | ① | קצר — כותרת/תווית סבירה |
| נוכחות | modules/06_projects/ClosingTab.jsx:715 (×2) | ① | קצר — כותרת/תווית סבירה |
| נוכחות — {row.name} | modules/06_projects/ClosingTab.jsx:946 | ① | קצר — כותרת/תווית סבירה |
| נענה | modules/06_projects/TeamTab.jsx:493 | ① | קצר — כותרת/תווית סבירה |
| נקה סינון | modules/06_projects/ProjectsPage.jsx:463 | ① | קצר — כותרת/תווית סבירה |
| נשלח. | modules/06_projects/CancelProjectDialog.jsx:145 | ① | קצר — כותרת/תווית סבירה |
| סבב | modules/06_projects/TeamTab.jsx:488 | ① | קצר — כותרת/תווית סבירה |
| סגירת האירוע נכשלה. | modules/06_projects/ClosingTab.jsx:366 (×2) | ① | קצר — כותרת/תווית סבירה |
| סה"כ עלות דיילות בפועל | modules/06_projects/ClosingTab.jsx:739 | ① | תווית/כותרת/פעולה קצרה |
| סטטוס גולמי | modules/06_projects/TeamTab.jsx:490 | ① | קצר — כותרת/תווית סבירה |
| סיבה | modules/06_projects/LogisticsTab.jsx:467 | ① | קצר — כותרת/תווית סבירה |
| סיבת הביטול | modules/06_projects/ProjectCardPage.jsx:652 | ① | קצר — כותרת/תווית סבירה |
| סיבת הביטול — חובה | modules/06_projects/CancelProjectDialog.jsx:466 | ① | קצר — כותרת/תווית סבירה |
| סיבת השינוי | modules/06_projects/ScopeChangeDialog.jsx:1076 | ① | קצר — כותרת/תווית סבירה |
| סימון-איכות | modules/06_projects/ClosingTab.jsx:716 (×2) | ① | קצר — כותרת/תווית סבירה |
| סכום השינוי | modules/06_projects/ScopeChangeDialog.jsx:640 (×2) | ① | קצר — כותרת/תווית סבירה |
| עדכון סטטוס-הסקר (הסקר עצמו נשלח) | modules/06_projects/ClosingTab.jsx:324 | ① | תווית/כותרת/פעולה קצרה |
| עודכן בשינוי-תכולה | modules/06_projects/TeamTab.jsx:205 | ① | קצר — כותרת/תווית סבירה |
| על-ידי | modules/06_projects/ClosingTab.jsx:1229 (×2) | ① | קצר — כותרת/תווית סבירה |
| עלות בפועל | modules/06_projects/ClosingTab.jsx:718 (×2) | ① | קצר — כותרת/תווית סבירה |
| עריכת פרטי האירוע | modules/06_projects/EditProjectDetailsDialog.jsx:242 | ① | קצר — כותרת/תווית סבירה |
| פרטי האירוע | modules/06_projects/ProjectCardPage.jsx:449 | ① | קצר — כותרת/תווית סבירה |
| פריטים מוכנים | modules/06_projects/LogisticsTab.jsx:246 (×3) | ① | קצר — כותרת/תווית סבירה |
| פתח שיבוץ חכם → | modules/06_projects/TeamTab.jsx:266 (×2) | ① | קצר — כותרת/תווית סבירה |
| צוות | modules/06_projects/ScopeChangeDialog.jsx:1048 | ① | קצר — כותרת/תווית סבירה |
| צוות דיילות | modules/06_projects/ProjectCardPage.jsx:288 (×2) | ① | קצר — כותרת/תווית סבירה |
| רישום שינוי שהתגלה באירוע | modules/06_projects/ClosingTab.jsx:1100 (×2) | ① | תווית/כותרת/פעולה קצרה |
| רענון הרשימה | modules/06_projects/ClosingTab.jsx:824 | ① | קצר — כותרת/תווית סבירה |
| רשימת הפרויקטים לא נטענה. | modules/06_projects/ProjectsPage.jsx:117 | ① | תווית/כותרת/פעולה קצרה |
| שולח… | modules/06_projects/ClosingTab.jsx:1328 | ① | קצר — כותרת/תווית סבירה |
| שומר ושולח… | modules/06_projects/ClosingTab.jsx:862 | ① | קצר — כותרת/תווית סבירה |
| שינוי תכולה | modules/06_projects/ProjectCardPage.jsx:249 (×2) | ① | קצר — כותרת/תווית סבירה |
| שינויי תכולה | modules/06_projects/LogisticsTab.jsx:169 | ① | קצר — כותרת/תווית סבירה |
| שינויי תכולה שהתגלו באירוע | modules/06_projects/ClosingTab.jsx:1088 | ① | תווית/כותרת/פעולה קצרה |
| שינויי-תכולה בכמות הדיילות | modules/06_projects/TeamTab.jsx:431 | ① | תווית/כותרת/פעולה קצרה |
| שלושת שדות-האירוע מולאו | modules/06_projects/ClosingTab.jsx:786 | ① | תווית/כותרת/פעולה קצרה |
| שמור ושלח זימון מחדש | modules/06_projects/EditProjectDetailsDialog.jsx:363 | ① | קצר — כותרת/תווית סבירה |
| שמור שינוי תכולה | modules/06_projects/ScopeChangeDialog.jsx:1131 | ① | קצר — כותרת/תווית סבירה |
| שנה כמות דיילות | modules/06_projects/TeamTab.jsx:314 (×2) | ① | קצר — כותרת/תווית סבירה |
| שעות ביצוע בפועל | lib/projectClosing.js:153 (×2) | ① | קצר — כותרת/תווית סבירה |
| שעות בפועל | lib/salaryReport.js:65 (×3) | ① | קצר — כותרת/תווית סבירה |
| שעות האירוע | modules/06_projects/EditProjectDetailsDialog.jsx:312 (×2) | ① | קצר — כותרת/תווית סבירה |
| תוספת לחיוב | modules/06_projects/ScopeChangeDialog.jsx:658 | ① | קצר — כותרת/תווית סבירה |
| תעלה | modules/06_projects/ScopeChangeDialog.jsx:706 | ① | קצר — כותרת/תווית סבירה |
| תעריף מוקפא | modules/06_projects/TeamTab.jsx:491 | ① | קצר — כותרת/תווית סבירה |
| תרד | modules/06_projects/ScopeChangeDialog.jsx:706 | ① | קצר — כותרת/תווית סבירה |

#### מודול 7 (dashboard) — 35 מחרוזות ייחודיות

| מחרוזת | קובץ:שורה | סיווג | הערה |
|---|---|---|---|
| החודש המוצג כולל פרויקט שאי-אפשר לחשב לו כספים — אין לו הצעת מחיר מקושרת, או שההצעה ריקה. יש להשלים אותה במסך הפרויקטים. | modules/07_dashboard/DashboardPage.jsx:188 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| ✓ אין פריטים הדורשים טיפול | modules/07_dashboard/AttentionPanel.jsx:66 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אין לך הרשאה לצפות במסך הבית. | modules/07_dashboard/DashboardPage.jsx:176 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| חסרים שדות ב-params של מסך-הבית: {missingParams.join(', ')}. | modules/07_dashboard/api.js:103 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסרים שדות בנתוני מסך-הבית: {missing.join(', ')}. | modules/07_dashboard/api.js:78 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא ניתן לחשב כספים לפרויקט | modules/07_dashboard/DashboardPage.jsx:187 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת מסך-הבית. | modules/07_dashboard/api.js:114 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שדה "{field}" חסר ערך (חזר null) בנתוני מסך-הבית. | modules/07_dashboard/api.js:83 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שדה "params" חסר או שגוי בנתוני מסך-הבית. | modules/07_dashboard/api.js:97 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שדה "profit_visible" אינו בוליאני בנתוני מסך-הבית. | modules/07_dashboard/api.js:88 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שדה "projects" אינו מערך בנתוני מסך-הבית. | modules/07_dashboard/api.js:94 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שדה "quotes_visible" אינו בוליאני בנתוני מסך-הבית. | modules/07_dashboard/api.js:91 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| +{extra} עוד | modules/07_dashboard/CalendarGrid.jsx:216 | ① | קצר — כותרת/תווית סבירה |
| א | modules/07_dashboard/CalendarGrid.jsx:33 | ① | קצר — כותרת/תווית סבירה |
| ב | modules/07_dashboard/CalendarGrid.jsx:33 | ① | קצר — כותרת/תווית סבירה |
| ג | modules/07_dashboard/CalendarGrid.jsx:33 | ① | קצר — כותרת/תווית סבירה |
| ד | modules/07_dashboard/CalendarGrid.jsx:33 | ① | קצר — כותרת/תווית סבירה |
| ה | modules/07_dashboard/CalendarGrid.jsx:33 | ① | קצר — כותרת/תווית סבירה |
| היום | lib/customerProjects.js:123 (×4) | ① | קצר — כותרת/תווית סבירה |
| הצג פחות | modules/07_dashboard/CalendarGrid.jsx:220 | ① | קצר — כותרת/תווית סבירה |
| ו | modules/07_dashboard/CalendarGrid.jsx:33 | ① | קצר — כותרת/תווית סבירה |
| חודש הבא | modules/07_dashboard/CalendarGrid.jsx:112 | ① | קצר — כותרת/תווית סבירה |
| חודש קודם | modules/07_dashboard/CalendarGrid.jsx:102 | ① | קצר — כותרת/תווית סבירה |
| חוסר בתוך {warningDays} יום | modules/07_dashboard/CalendarGrid.jsx:262 | ① | תווית/כותרת/פעולה קצרה |
| חוסר מעבר ל-{warningDays} יום | modules/07_dashboard/CalendarGrid.jsx:263 | ① | תווית/כותרת/פעולה קצרה |
| חוסר קרוב | lib/dashboard.js:268 (×2) | ① | קצר — כותרת/תווית סבירה |
| חוסר רחוק | modules/07_dashboard/CalendarGrid.jsx:263 | ① | קצר — כותרת/תווית סבירה |
| חיפוש פרויקט… | modules/07_dashboard/CalendarGrid.jsx:133 | ① | קצר — כותרת/תווית סבירה |
| לא התקבל מסך-בית מהשרת. | modules/07_dashboard/api.js:71 | ① | תווית/כותרת/פעולה קצרה |
| ללא חוסר | modules/07_dashboard/CalendarGrid.jsx:268 | ① | קצר — כותרת/תווית סבירה |
| מבוטל | modules/07_dashboard/CalendarGrid.jsx:246 (×2) | ① | קצר — כותרת/תווית סבירה |
| מה דורש טיפול | modules/07_dashboard/AttentionPanel.jsx:42 | ① | קצר — כותרת/תווית סבירה |
| מלא = הושלם · קו = חסר | modules/07_dashboard/CalendarGrid.jsx:286 | ① | נבדק ידנית בהקשר — תווית/כותרת תקינה |
| מסך הבית | components/layout/Sidebar.jsx:89 (×3) | ① | קצר — כותרת/תווית סבירה |
| ש | modules/07_dashboard/CalendarGrid.jsx:33 | ① | קצר — כותרת/תווית סבירה |

#### מודול 8 (finance) — 304 מחרוזות ייחודיות

| מחרוזת | קובץ:שורה | סיווג | הערה |
|---|---|---|---|
| "ויתור" = פעולה מפורשת (סכום 0 + הערת-חובה), לא מחיקה שקטה. "סגור ללא תשלום" = מסלול חוב-אבוד — הפרויקט מקבל תג "הסתיים — לא שולם"; הרווח נקפא גם בלי גבייה בפועל, כי הבסיס הוא צבירה. | modules/08_finance/ClosingWindowDialog.jsx:148 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| {proposal?.compensated_count ?? '—'} דיילות מאושרות-סופית · הביטול נעשה {formatHoursBeforeEvent(proposal?.hours_before_event)} שעות לפני האירוע {forceMajeure ? ( // ה25 — כוח-עליון מאפס פיצוי תמיד, ללא תלות בשעון. <> · הביטול סווג ככוח-עליון ⇐ <Ltr>{proposal?.compensation_pct ?? '—'}%</Ltr>.{' '} {FORCE_MAJEURE_COMP_NOTE}{' '} </> ) : manualOnly ? ( // 🔴 בסיווג "אחר" **אסור לצטט את הסולם**: הוא לא הופעל. השעות נשארות עובדה // מוצגת — הן נכונות, הן פשוט אינן קובעות כאן אחוז. (ה25) <>· הביטול סווג כ"אחר" ⇐ הסולם אינו מופעל, והסכום נקבע בשיקול-דעתך. </> ) : ( // ה24 — סולם-הביטול הסטנדרטי. <> ⇐ לפי מדרג-הביטול נותן <Ltr>{proposal?.compensation_pct ?? '—'}%</Ltr>.{' '} </> )} בלי רכיב-נסיעות — משמרת שבוטלה לא נסעה. | modules/08_finance/ClosingWindowDialog.jsx:661 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| נסיעות מחושבות לפי הפרמטר החי סכום_נסיעות_למשמרת נכון לרגע ההפקה — הסכום עדיין טעון אימות מול רואה-החשבון. | modules/08_finance/SalaryReportDialog.jsx:995 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| פיצוי-ביטול לדיילות שאושרו סופית בפרויקטים שבוטלו, לפי סולם דמי-הביטול — בלי בונוס ובלי נסיעות. | modules/08_finance/SalaryReportDialog.jsx:735 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| שורות שאינן בגוף הקובץ: {omittedFromFile === 1 ? ( 'שורה אחת' ) : ( <> <Ltr>{omittedFromFile}</Ltr> שורות </> )} בסכום נחתמו ונרשמו כדי שלא ייאספו שוב, ואינן נכללות בגוף הקובץ שנשלח (N-4). בקובץ עצמו {totals.fileLineCount} שורות. | modules/08_finance/SalaryReportDialog.jsx:1007 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
|  המשוב כאן כבר תקין; התשלום עדיין חסר. | modules/08_finance/ClosingWindowDialog.jsx:255 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
|  התשלום כאן כבר תקין; המשוב עדיין חסר. | modules/08_finance/ClosingWindowDialog.jsx:254 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| · הביטול סווג כ"אחר" ⇐ הסולם אינו מופעל, והסכום נקבע בשיקול-דעתך. | modules/08_finance/ClosingWindowDialog.jsx:673 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| · הביטול סווג ככוח-עליון ⇐ | modules/08_finance/ClosingWindowDialog.jsx:666 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| "מחיר מלא" = מחיר-הלקוח שהוקפא בהצעה, לא עלות — ורק שורות שכבר "הוזמן"/"מוכן" בלוגיסטיקה נכנסות. | modules/08_finance/ClosingWindowDialog.jsx:861 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {base} · לא כולל {missing} שטרם נקבעו | modules/08_finance/FinancePage.jsx:385 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {countLabel(summary.openCount, 'תיק', 'תיקים')} בטיפול | modules/08_finance/FinancePage.jsx:382 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {countLabel(summary.overdueCount, 'תיק', 'תיקים')} באיחור-תשלום | modules/08_finance/FinancePage.jsx:754 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {fallbackMessage} (תשובת השרת לא הייתה תקינה.) | modules/08_finance/api.js:77 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {project?.customer_name ?? ''} — מה חסר כדי לסגור את הפרויקט הזה, ומה הצעד הבא. | modules/08_finance/ClosingWindowDialog.jsx:2127 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {row.event_name}, פתיחת חלון סגירת-תיק{locked ? ' (נעול-לעיון)' : ''} | modules/08_finance/FinancePage.jsx:998 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ⇐ לפי מדרג-הביטול נותן | modules/08_finance/ClosingWindowDialog.jsx:676 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ⚠ ציון-משוב {String(entry.score.score)} — נדרש בירור טלפוני | modules/08_finance/FinancePage.jsx:1027 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| 🔒 חסום: {missing.join(', ו')} — שער-הארכוב דורש גם תשלום וגם משוב-פתור.{ok} | modules/08_finance/ClosingWindowDialog.jsx:257 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| 🔒 פרטי-הבנק מוצגים מהמאגר המוגן — נגישים בהרשאת 'כספים' בלבד. | modules/08_finance/SalaryReportDialog.jsx:1022 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| 🕓 יום {weekday}, {date} | modules/08_finance/PublicFeedbackPage.jsx:232 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ② סחורה שהוזמנה/הגיעה — במחיר מלא | modules/08_finance/ClosingWindowDialog.jsx:851 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אוספת את כל שורות-השכר שטרם שולמו עד סוף החודש שנבחר — פרויקטים שנסגרו תפעולית ופרויקטים שבוטלו בדמי-ביטול. | modules/08_finance/SalaryReportDialog.jsx:454 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אין הצעה אוטומטית — סיווג "אחר" | modules/08_finance/ClosingWindowDialog.jsx:204 | ② | מצב-ריק |
| אין כתובת מייל לחיוב בכרטיס הלקוח — לא ניתן לשלוח את החשבונית. | modules/08_finance/api.js:503 | ② | מצב-ריק |
| אין לך הרשאה לצפות בנתוני הכספים. | modules/08_finance/FinancePage.jsx:72 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין פרויקט התואם לסינון שבחרת. | modules/08_finance/FinancePage.jsx:73 | ② | מצב-ריק |
| אין פרויקט שהועבר לארכיון | modules/08_finance/FinancePage.jsx:870 | ② | מצב-ריק |
| אין פרויקט שממתין לחשבונית | modules/08_finance/FinancePage.jsx:868 | ② | מצב-ריק |
| אין פרויקט שממתין לתשלום | modules/08_finance/FinancePage.jsx:869 | ② | מצב-ריק |
| אין קובץ שמור — לא ניתן לשלוח שוב | modules/08_finance/SalaryReportDialog.jsx:1238 | ② | מצב-ריק |
| אין שינוי לשמור — עדכני ציון, סיבה או הערות. | modules/08_finance/ClosingWindowDialog.jsx:165 | ② | מצב-ריק |
| אין שעות לתשלום החודש. | modules/08_finance/SalaryReportDialog.jsx:887 | ② | מצב-ריק |
| אין תחשיב-מאזן לפרויקט מבוטל: הרווח כאן נגזר מדמי-הביטול בניכוי פיצוי-הצוות ועלות-הסחורה, ולא מהכנסות-האירוע — האירוע לא התקיים ולא נגבה עליו התשלום שבהצעה. | modules/08_finance/ClosingWindowDialog.jsx:1456 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אין תיקים פתוחים לגבייה כרגע | modules/08_finance/FinancePage.jsx:381 | ② | מצב-ריק |
| בונוס/נסיעות בשורות-פיצוי-ביטול: "{NOT_APPLICABLE}" ולא 0.00 ₪ — נוסחת-הפיצוי אינה כוללת רכיב-בונוס, ואין נסיעות למשמרת שבוטלה. | modules/08_finance/SalaryReportDialog.jsx:1002 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ביטול בסיווג "אחר" — אין הצעה אוטומטית. הביטול אינו בהכרח באשמת הלקוח, ולכן הסכום נקבע בשיקול-דעתך. התחשיב שמעל מוצג לעיון בלבד. | modules/08_finance/ClosingWindowDialog.jsx:731 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| במה נוכל להשתפר? (אפשר לסמן יותר מאחד) | modules/08_finance/PublicFeedbackPage.jsx:263 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| בקרת גבייה, סגירת-תיקים ודו"ח-שכר | modules/08_finance/FinancePage.jsx:70 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| גררי קובץ-חשבונית לכאן, או | modules/08_finance/ClosingWindowDialog.jsx:944 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דוח {generated.periodLabel} הופק ונשלח ל-{accountantEmail ?? 'רואה-החשבון'}. | modules/08_finance/SalaryReportDialog.jsx:395 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דוח {salaryPeriodLabel(row.period)} נשלח שוב. | modules/08_finance/SalaryReportDialog.jsx:1122 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דוח השכר לחודש {periodLabel} ייחתם ויישלח למשרד רואי-החשבון. השורות שייאספו לא ייאספו שוב לדוח הבא, ולא ניתן להפיק את אותו חודש פעמיים. אין ביטול לפעולה. | modules/08_finance/SalaryReportDialog.jsx:166 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דוח לחודש {periodLabel} כבר הופק (מספר {existingForSelected.report_id}, סטטוס-שליחה: {existingForSelected.send_status === 'failed' ? 'נכשל' : 'בהפקה'}). לא ניתן להפיק פעמיים אותו חודש — המערכת חוסמת זאת גם במקרה של לחיצה כפולה. | modules/08_finance/SalaryReportDialog.jsx:442 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דוח לחודש {periodLabel} כבר הופק. נשלח ב-{formatDate(existingForSelected.sent_date, '—')} אל {existingForSelected.sent_to ?? '—'}. לא ניתן להפיק פעמיים אותו חודש — המערכת חוסמת זאת גם במקרה של לחיצה כפולה. | modules/08_finance/SalaryReportDialog.jsx:438 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דוח שכר דיילות — {periodLabel ?? ''} | modules/08_finance/api.js:380 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דמי-ביטול — טרם נפתרו | modules/08_finance/FinancePage.jsx:76 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דמי-הביטול ייקבעו על 0 ₪, ההערה תישמר, והרווח ייקפא כהפסד רשום. אין ביטול לפעולה. | modules/08_finance/ClosingWindowDialog.jsx:211 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דמי-הביטול נשמרו. אפשר להעלות חשבונית ולשלוח. | modules/08_finance/ClosingWindowDialog.jsx:1933 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הדגש לשימור שהלקוח ציין: {detail.positive_feedback_reason} | modules/08_finance/ClosingWindowDialog.jsx:1305 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הדגש לשימור שהלקוח ציין: {detail.positive_feedback_reasons.join(', ')} | modules/08_finance/ClosingWindowDialog.jsx:1301 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הדגש לשימור: {detail.positive_feedback_reason} | modules/08_finance/ClosingWindowDialog.jsx:535 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הדגשים לשימור: {detail.positive_feedback_reasons.join(', ')} | modules/08_finance/ClosingWindowDialog.jsx:533 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הדוח לא הורכב — אך השורות כבר נחתמו. | modules/08_finance/SalaryReportDialog.jsx:868 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הדוח נחתם והמייל נשלח, אך שמירת קובץ ה-Excel באחסון נכשלה — לא ניתן יהיה לשלוח אותו שוב מההיסטוריה. | modules/08_finance/SalaryReportDialog.jsx:389 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הדוח נשלח, אך רישום השליחה ביומן נכשל. | modules/08_finance/SalaryReportDialog.jsx:392 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הוויתור נרשם ודמי-הביטול נקבעו על 0 ₪. | modules/08_finance/ClosingWindowDialog.jsx:1908 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הורדת הקובץ מהאחסון נכשלה. | modules/08_finance/api.js:349 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הורדת קובץ הדוח נכשלה. | modules/08_finance/SalaryReportDialog.jsx:1113 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| החשבונית לא נשלחה והפרויקט לא סומן כ"נשלח". יש לנסות שוב. | modules/08_finance/ClosingWindowDialog.jsx:212 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| החשבונית נשלחה ללקוח והפרויקט עבר ל"ממתין לתשלום". | modules/08_finance/ClosingWindowDialog.jsx:1634 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הלקוח לא השיב — השער עובר גם כך. ציון שיתקבל טלפונית עדיין ניתן להזנה כאן. | modules/08_finance/ClosingWindowDialog.jsx:1311 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הלקוח נתן ציון {feedbackScore} ונדרשים בירור טלפוני ובחירת סיבה | modules/08_finance/ClosingWindowDialog.jsx:249 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המייל יצא, אך רישום שורת-התיעוד (email_log) נכשל. | modules/08_finance/ClosingWindowDialog.jsx:1635 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המערכת אינה מפיקה חשבונית באופן אוטומטי. | modules/08_finance/ClosingWindowDialog.jsx:140 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המשוב שלכם נשמר ועוזר לנו להשתפר באירוע הבא. | modules/08_finance/PublicFeedbackPage.jsx:356 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| העלאת קובץ דוח השכר לאחסון נכשלה. | modules/08_finance/api.js:590 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| העלאת קובץ החשבונית נכשלה. | modules/08_finance/api.js:330 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הערת-פירוט (נשמרת עם הסכום) | modules/08_finance/ClosingWindowDialog.jsx:761 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפרויקט ייסגר כחוב אבוד: הרווח ייקפא גם בלי גבייה בפועל, והסיבה תישמר. אין ביטול לפעולה. | modules/08_finance/ClosingWindowDialog.jsx:209 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הקובץ גדול מדי — המגבלה היא 10MB. | modules/08_finance/api.js:314 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הקובץ גדול מדי לשליחה אוטומטית במייל — יש להקטין אותו (סריקה או צילום ברזולוציה נמוכה יותר) ולנסות שוב. שום דבר לא נשלח ולא נשמר. | modules/08_finance/api.js:530 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הקובץ לא נשמר, ולכן לא ניתן לשלוח את הדוח מההיסטוריה. יש להעתיק את ההודעה הזו לפני סגירת המסך. | modules/08_finance/SalaryReportDialog.jsx:880 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הרווח הסופי ייקפא בשקלים, התיק יינעל לצמיתות וקישור-המשוב של הלקוח יבוטל. אין ביטול לפעולה. | modules/08_finance/ClosingWindowDialog.jsx:207 | ② | אישור פעולה מסוכנת / אזהרה |
| הרווח-הסופי קפוא ואינו ניתן לעריכה. כל השדות שלמטה לעיון בלבד. | modules/08_finance/ClosingWindowDialog.jsx:151 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| השליחה החוזרת נכשלה. אפשר לנסות שוב מכאן. | modules/08_finance/SalaryReportDialog.jsx:1126 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| התיק נעול — דמי-הביטול נפתרו והרווח נקפא. | modules/08_finance/ClosingWindowDialog.jsx:501 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| התיק נעול — הועבר לארכיון. | modules/08_finance/ClosingWindowDialog.jsx:501 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| זהו דוח-השכר הראשון במערכת — הוא יאסוף כל שורה שטרם שולמה, ישנה ככל שתהיה. | modules/08_finance/SalaryReportDialog.jsx:752 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| זהו הסכום שהחברה משלמת בלי קשר לשאלה מי ביטל. ההחלטה שלך היא כמה מתוכו להעביר ללקוח — אפס (החברה סופגת) · הסכום המלא · או הסכום בתוספת הסחורה שכבר הוזמנה. | modules/08_finance/ClosingWindowDialog.jsx:653 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חוב-אבוד — הרווח נקפא כרגיל, בסיס-צבירה | modules/08_finance/ClosingWindowDialog.jsx:145 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חופשי — יישמר לצד הסכום הסופי | modules/08_finance/ClosingWindowDialog.jsx:768 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסום: אין כתובת מייל לחיוב בכרטיס הלקוח — לא ניתן לשלוח את החשבונית. יש להשלים אותה בכרטיס הלקוח. | modules/08_finance/ClosingWindowDialog.jsx:185 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסום: הסכום שייחתם חייב להיות גדול מ-0. לאיפוס מלא יש להשתמש בכפתור "ויתור על החוב" — ויתור הוא פעולה מפורשת, לא סכום 0. | modules/08_finance/ClosingWindowDialog.jsx:174 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסום: ויתור מחייב הערת-חובה — יש למלא את "הערת-פירוט" שמעל לפני הוויתור. | modules/08_finance/ClosingWindowDialog.jsx:175 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסום: יש לבחור ציון בין 1 ל-5, או לסמן "לא ענה לסקר". | modules/08_finance/ClosingWindowDialog.jsx:164 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסום: יש לבחור קובץ — שליחה בלי חשבונית אינה אפשרית (כרטיס-P1). | modules/08_finance/api.js:304 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסום: לא הצלחנו לטעון את פרטי החיוב של הלקוח — לא ניתן לשלוח את החשבונית. יש לרענן את המסך ולנסות שוב. | modules/08_finance/ClosingWindowDialog.jsx:194 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסום: ציון מתחת ל-{threshold} מחייב בחירת סיבת-בירור מהרשימה, אחרי בירור טלפוני. | modules/08_finance/ClosingWindowDialog.jsx:159 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חשבונית טרם נשלחה ולא נרשם תאריך-תשלום | modules/08_finance/ClosingWindowDialog.jsx:245 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חשבונית מס/קבלה מ-REG-IN — {project?.event_name ?? ''} | modules/08_finance/api.js:376 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| יצירת קישור להורדת הקובץ נכשלה. | modules/08_finance/api.js:355 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| יש להזין שנה בת ארבע ספרות (למשל 2026). | modules/08_finance/SalaryReportDialog.jsx:335 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| יש להכין אותה בתוכנת הנהלת-החשבונות ולהעלות כאן — PDF או תמונה, עד 10MB. | modules/08_finance/ClosingWindowDialog.jsx:142 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא הופק דוח לחודשים: {shownMissing.map((period) => salaryPeriodLabel(period)).join(' · ')} {extraMissing > 0 && ( <> {' '} (ועוד <Ltr>{extraMissing}</Ltr>) </> )} . כל שורה מהחודשים האלה שעומדת בתנאי-האיסוף תיכלל בדוח הזה. | modules/08_finance/SalaryReportDialog.jsx:758 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא ידוע — דמי-ביטול טרם נקבעו | modules/08_finance/FinancePage.jsx:100 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא נטענה כתובת של משרד רואי-החשבון (הפרמטר מייל_משרד_רואי_חשבון). אם היא חסרה בהגדרות-המערכת, ההפקה תיעצר לפני שנכתב משהו — לא יופק דוח, לא תיחתם אף שורה, ולא תישמר שורה בהיסטוריה שאפשר לשלוח ממנה. יש להשלים את הפרמטר בהגדרות-המערכת לפני הלחיצה; אם זו תקלת-טעינה זמנית, רענון המסך יציג את הכתובת. | modules/08_finance/SalaryReportDialog.jsx:772 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא ניתן היה לבדוק אם החודש כבר הופק ({historyError}) — הבדיקה הסופית תמיד תתבצע במסד בלחיצה על "ייצא ושלח". | modules/08_finance/SalaryReportDialog.jsx:572 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן להפיק דוח לחודש עתידי. | modules/08_finance/SalaryReportDialog.jsx:344 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן להרכיב את מייל דוח השכר — בדקי את תבנית המייל ואת כתובת רואי החשבון. | modules/08_finance/api.js:661 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן להרכיב את מייל החשבונית — בדקי את תבנית המייל ואת פרטי הלקוח. | modules/08_finance/api.js:544 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לחשב סטייה — חסרות שעות סופיות | modules/08_finance/ClosingWindowDialog.jsx:205 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לחשב פיצוי — חסרות שעות סופיות | modules/08_finance/ClosingWindowDialog.jsx:199 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לשלוח בלי לבחור דירוג — געו בכוכב ונסו שוב. | modules/08_finance/PublicFeedbackPage.jsx:143 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא נמצא פרויקט לחישוב דמי ביטול. | modules/08_finance/api.js:120 | ② | מצב-ריק |
| לא נמצאו נתוני כספים לפרויקט זה. | modules/08_finance/api.js:107 | ② | מצב-ריק |
| לא נשמר קובץ לדוח הזה — לא ניתן לשלוח אותו שוב מההיסטוריה. | modules/08_finance/api.js:718 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לדוגמה: מה אהבתם, ומה כדאי לשפר בפעם הבאה | modules/08_finance/PublicFeedbackPage.jsx:308 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| למשל: הלקוח נכנס לפירוק; הגבייה מוצתה | modules/08_finance/ClosingWindowDialog.jsx:1108 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| למשל: עיצוב גרפי לבמה שכבר הופק | modules/08_finance/ClosingWindowDialog.jsx:696 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מאפס את הסכום ל-0 ומחייב הערה — לא מחיקה שקטה | modules/08_finance/ClosingWindowDialog.jsx:144 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מה בלט לטובה? (אפשר לסמן יותר מאחד) | modules/08_finance/PublicFeedbackPage.jsx:264 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מס׳ פרויקט, לדוגמה: 15 | modules/08_finance/FinancePage.jsx:845 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נכשל | modules/08_finance/SalaryReportDialog.jsx:443 (×3) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| נרשם דוח מספר {result.reportId} במסד, וכל שורות-השכר שנאספו אליו כבר נחתמו על-שמו — הן לא ייאספו שוב לדוח הבא, ואי-אפשר להפיק את אותו חודש פעמיים. | modules/08_finance/SalaryReportDialog.jsx:869 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נשלחה {formatTimestampFull(detail.invoice_sent_at, '—')} | modules/08_finance/ClosingWindowDialog.jsx:576 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נשמר במסד: הסכום הסופי וההערה בלבד — שלושת הרכיבים שלמעלה נגזרים-מחדש לתצוגה בכל פתיחה, ולא נשמרים כעמודות נפרדות. | modules/08_finance/ClosingWindowDialog.jsx:150 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נתוני הכספים שהתקבלו מהשרת אינם בצורה צפויה. | modules/08_finance/FinancePage.jsx:230 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סגירת דוח השכר נכשלה. | modules/08_finance/api.js:686 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סגירת הדוח במסד נכשלה אחרי השליחה — יש לרענן ולבדוק את שורתו בהיסטוריה. | modules/08_finance/SalaryReportDialog.jsx:413 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סגירת הפרויקט ללא תשלום נכשלה. | modules/08_finance/api.js:266 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סוג הקובץ אינו נתמך — יש להעלות קובץ PDF או תמונה. | modules/08_finance/api.js:312 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סיבות-בירור: {detail.negative_feedback_reasons.join(', ')} | modules/08_finance/ClosingWindowDialog.jsx:528 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סיבת הסגירה ללא תשלום — חובה | modules/08_finance/ClosingWindowDialog.jsx:1100 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סיבת-בירור: {detail.negative_feedback_reason} | modules/08_finance/ClosingWindowDialog.jsx:530 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סיבת-הבירור — חובה בציון מתחת ל-{satisfactionThreshold} (ניתן לבחור יותר מאחת) | modules/08_finance/ClosingWindowDialog.jsx:1189 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סינון לפי מספר פרויקט | modules/08_finance/FinancePage.jsx:846 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עבודה — שעות בפועל × תעריף קפוא + בונוסים | modules/08_finance/ClosingWindowDialog.jsx:1386 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדכון סטטוס השליחה של הדוח נכשל. | modules/08_finance/api.js:761 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| פרויקט #{line.sourceProjectId} · {line.basisLabel} | modules/08_finance/SalaryReportDialog.jsx:917 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| פרטי חיוב — נעול לעיון | modules/08_finance/ClosingWindowDialog.jsx:546 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| פרטי חיוב · תשלום · משוב — נעול לעיון | modules/08_finance/ClosingWindowDialog.jsx:546 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| רישום שליחת החשבונית נכשל. | modules/08_finance/api.js:223 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| רק שורות שטרם נכללו בדוח קודם, שתאריך-האירוע שלהן עד {collectUntil} — ולכן שורות מחודשים קודמים שטרם נאספו ייכללו בדוח הזה גם הן. | modules/08_finance/SalaryReportDialog.jsx:739 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שגיאה בחישוב הצעת דמי הביטול. | modules/08_finance/api.js:118 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת היסטוריית דוחות השכר. | modules/08_finance/SalaryReportDialog.jsx:272 (×3) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת מסך הכספים. | modules/08_finance/api.js:93 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת נתוני הכספים של הפרויקט. | modules/08_finance/api.js:105 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת פרטי החיוב של הלקוח. | modules/08_finance/api.js:201 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת שורות דוח השכר. | modules/08_finance/api.js:171 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה לא-מזוהה בהרכבת הדוח. | modules/08_finance/SalaryReportDialog.jsx:877 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שוטף+{String(row.payment_terms_days)} | modules/08_finance/FinancePage.jsx:1064 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שורה חופשית בלי מעקב-סטטוס במסד — אינה נשמרת, ואינה נכנסת מעצמה לסכום שייחתם. | modules/08_finance/ClosingWindowDialog.jsx:714 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שורות הדוח עצמן אינן מוצגות כאן. הן נאספות ונחתמות ברגע ההפקה, ואי-אפשר לחשב אותן בלי לכתוב אותן. מיד אחרי הלחיצה תוצג כאן הטבלה המלאה, והקובץ יישמר בהיסטוריה שלמטה — להורדה ולשליחה חוזרת. הלחיצה על "ייצא ושלח" אינה הפיכה: אי-אפשר להפיק את אותו חודש פעמיים, והשורות שייאספו לא ייאספו שוב לדוח הבא. | modules/08_finance/SalaryReportDialog.jsx:794 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שימו לב: לדיילות הבאות אין פרטי-בנק שמורים בדוח שנשלח — {result.linesMissingBankDetails.join(', ')}. | modules/08_finance/SalaryReportDialog.jsx:1030 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שליחת דוח השכר נכשלה, והקובץ לא נשמר — לא ניתן לשלוח אותו שוב מההיסטוריה. הפרטים מוצגים במסך. | modules/08_finance/SalaryReportDialog.jsx:408 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שליחת דוח השכר נכשלה. הדוח נשמר; ניתן לשלוח אותו שוב מההיסטוריה. | modules/08_finance/SalaryReportDialog.jsx:407 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שם חברה, לדוגמה: קמפוס טכנולוגי צפון | modules/08_finance/FinancePage.jsx:835 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שמירת דמי הביטול נכשלה. | modules/08_finance/api.js:283 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שעות שבוצעו בפועל בפרויקטים שנסגרו תפעולית וטרם שולמו — שעות בפועל × התעריף הקפוא, בתוספת בונוס אישי ונסיעות. | modules/08_finance/SalaryReportDialog.jsx:730 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| REG-IN · משוב על האירוע | modules/08_finance/PublicFeedbackPage.jsx:156 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
|  (נעול-לעיון) | modules/08_finance/FinancePage.jsx:998 | ① | קצר — כותרת/תווית סבירה |
| , ו | modules/08_finance/ClosingWindowDialog.jsx:257 | ① | קצר — כותרת/תווית סבירה |
| (ועוד | modules/08_finance/SalaryReportDialog.jsx:763 | ① | קצר — כותרת/תווית סבירה |
| [חודש_דיווח_ושנה] | lib/emailTemplates.js:60 (×3) | ① | קצר — כותרת/תווית סבירה |
| [שם_לקוח_חברה] | lib/emailTemplates.js:37 (×3) | ① | קצר — כותרת/תווית סבירה |
| [שם_פרויקט] | lib/emailTemplates.js:19 (×16) | ① | קצר — כותרת/תווית סבירה |
| [שם_רואה_חשבון] | lib/emailTemplates.js:61 (×3) | ① | קצר — כותרת/תווית סבירה |
| {singular} אחד | modules/08_finance/FinancePage.jsx:374 | ① | קצר — כותרת/תווית סבירה |
| ✓ נשלח | modules/08_finance/SalaryReportDialog.jsx:1056 (×2) | ① | קצר — כותרת/תווית סבירה |
| ① פיצוי-צוות | modules/08_finance/ClosingWindowDialog.jsx:615 | ① | קצר — כותרת/תווית סבירה |
| ③ שירותים שבוצעו | modules/08_finance/ClosingWindowDialog.jsx:690 | ① | קצר — כותרת/תווית סבירה |
| איך היה האירוע? | modules/08_finance/PublicFeedbackPage.jsx:238 | ① | קצר — כותרת/תווית סבירה |
| אישור | components/ConfirmDialog.jsx:37 (×2) | ① | פועל-פעולה על כפתור |
| אישור סגירה ללא תשלום | modules/08_finance/ClosingWindowDialog.jsx:1121 | ① | תווית/כותרת/פעולה קצרה |
| בהפקה | modules/08_finance/SalaryReportDialog.jsx:443 (×2) | ① | קצר — כותרת/תווית סבירה |
| בודקת אם כבר הופק דוח לחודש זה | modules/08_finance/SalaryReportDialog.jsx:643 | ① | תווית/כותרת/פעולה קצרה |
| בוטל: | modules/08_finance/ClosingWindowDialog.jsx:489 | ① | קצר — כותרת/תווית סבירה |
| בונוס | lib/salaryReport.js:56 (×2) | ① | קצר — כותרת/תווית סבירה |
| בחרי סיבה | modules/08_finance/ClosingWindowDialog.jsx:1207 | ① | קצר — כותרת/תווית סבירה |
| בחרי קובץ | modules/08_finance/ClosingWindowDialog.jsx:990 | ① | קצר — כותרת/תווית סבירה |
| בפועל כמתוכנן | modules/08_finance/ClosingWindowDialog.jsx:1365 | ① | קצר — כותרת/תווית סבירה |
| בפועל מעל המתוכנן | modules/08_finance/ClosingWindowDialog.jsx:1364 | ① | קצר — כותרת/תווית סבירה |
| בפועל מתחת למתוכנן | modules/08_finance/ClosingWindowDialog.jsx:1363 | ① | קצר — כותרת/תווית סבירה |
| געו בכוכב כדי לדרג | modules/08_finance/PublicFeedbackPage.jsx:257 | ① | קצר — כותרת/תווית סבירה |
| דוחות שיופקו ויישלחו יופיעו כאן | modules/08_finance/SalaryReportDialog.jsx:1163 | ① | תווית/כותרת/פעולה קצרה |
| דירוג בין כוכב אחד לחמישה | modules/08_finance/PublicFeedbackPage.jsx:244 | ① | תווית/כותרת/פעולה קצרה |
| דמי-ביטול | modules/08_finance/FinancePage.jsx:75 (×3) | ① | קצר — כותרת/תווית סבירה |
| דמי-ביטול שנקבעו | modules/08_finance/ClosingWindowDialog.jsx:910 | ① | קצר — כותרת/תווית סבירה |
| הארכוב נכשל. | modules/08_finance/api.js:291 | ① | קצר — כותרת/תווית סבירה |
| הדגשים לשימור | modules/08_finance/PublicFeedbackPage.jsx:269 | ① | קצר — כותרת/תווית סבירה |
| הדוח האחרון שהופק: | modules/08_finance/SalaryReportDialog.jsx:748 | ① | קצר — כותרת/תווית סבירה |
| הועבר לארכיון | modules/08_finance/FinancePage.jsx:918 | ① | קצר — כותרת/תווית סבירה |
| הועבר לארכיון: | modules/08_finance/ClosingWindowDialog.jsx:490 | ① | קצר — כותרת/תווית סבירה |
| היסטוריית דוחות-שכר | modules/08_finance/SalaryReportDialog.jsx:1147 | ① | קצר — כותרת/תווית סבירה |
| הכנסות (הצעה-קפואה + שינויי-תכולה) | modules/08_finance/ClosingWindowDialog.jsx:1379 | ① | תווית/כותרת/פעולה קצרה |
| הלקוח לא השיב לסקר | modules/08_finance/ClosingWindowDialog.jsx:522 | ① | קצר — כותרת/תווית סבירה |
| המשוב טרם נפתר | modules/08_finance/ClosingWindowDialog.jsx:247 | ① | קצר — כותרת/תווית סבירה |
| המשוב נשמר. | modules/08_finance/ClosingWindowDialog.jsx:2107 | ① | קצר — כותרת/תווית סבירה |
| הסכום שייחתם (עריך) | modules/08_finance/ClosingWindowDialog.jsx:744 | ① | קצר — כותרת/תווית סבירה |
| הסתיים — לא שולם | modules/08_finance/ClosingWindowDialog.jsx:593 (×2) | ① | קצר — כותרת/תווית סבירה |
| העברה לארכיון | modules/08_finance/ClosingWindowDialog.jsx:1862 | ① | קצר — כותרת/תווית סבירה |
| הערות המנהלת מהשיחה | modules/08_finance/ClosingWindowDialog.jsx:1342 | ① | קצר — כותרת/תווית סבירה |
| הפקת דוח השכר נכשלה. | modules/08_finance/SalaryReportDialog.jsx:416 (×2) | ① | קצר — כותרת/תווית סבירה |
| הפקת דוח-שכר | modules/08_finance/FinancePage.jsx:71 (×2) | ① | קצר — כותרת/תווית סבירה |
| הפקת דוח-שכר חודשי | modules/08_finance/SalaryReportDialog.jsx:451 | ① | קצר — כותרת/תווית סבירה |
| הפרויקט נסגר ללא תשלום (חוב אבוד). | modules/08_finance/ClosingWindowDialog.jsx:1891 | ① | תווית/כותרת/פעולה קצרה |
| הצוות יקבל בפועל (משולם בדוח-השכר) | modules/08_finance/ClosingWindowDialog.jsx:643 | ① | תווית/כותרת/פעולה קצרה |
| הצעת דמי הביטול | modules/08_finance/ClosingWindowDialog.jsx:1587 | ① | קצר — כותרת/תווית סבירה |
| הקובץ לא נשמר באחסון | modules/08_finance/SalaryReportDialog.jsx:1222 | ① | קצר — כותרת/תווית סבירה |
| השליחה החוזרת נכשלה. | modules/08_finance/SalaryReportDialog.jsx:1132 | ① | קצר — כותרת/תווית סבירה |
| התיק הועבר לארכיון והרווח נקפא. | modules/08_finance/ClosingWindowDialog.jsx:1868 | ① | תווית/כותרת/פעולה קצרה |
| ויתור על החוב | modules/08_finance/ClosingWindowDialog.jsx:795 (×3) | ① | קצר — כותרת/תווית סבירה |
| ח.פ | modules/08_finance/ClosingWindowDialog.jsx:559 | ① | קצר — כותרת/תווית סבירה |
| חודש | modules/08_finance/SalaryReportDialog.jsx:478 | ① | קצר — כותרת/תווית סבירה |
| חודש להפקה: | modules/08_finance/SalaryReportDialog.jsx:462 | ① | קצר — כותרת/תווית סבירה |
| חודש שהופק: | modules/08_finance/SalaryReportDialog.jsx:833 | ① | קצר — כותרת/תווית סבירה |
| חלון סגירת-תיק | modules/08_finance/ClosingWindowDialog.jsx:2126 | ① | קצר — כותרת/תווית סבירה |
| חסום: יש להזין את הסכום שייחתם. | modules/08_finance/ClosingWindowDialog.jsx:172 | ① | תווית/כותרת/פעולה קצרה |
| חשבונית | modules/08_finance/ClosingWindowDialog.jsx:572 (×2) | ① | קצר — כותרת/תווית סבירה |
| חשבונית נשלחה | modules/08_finance/FinancePage.jsx:910 | ① | קצר — כותרת/תווית סבירה |
| ייצא ושלח | modules/08_finance/SalaryReportDialog.jsx:368 (×2) | ① | קצר — כותרת/תווית סבירה |
| ימי איחור | modules/08_finance/FinancePage.jsx:912 | ① | קצר — כותרת/תווית סבירה |
| ימים | lib/paramsRegistry.js:307 (×6) | ① | קצר — כותרת/תווית סבירה |
| יש לבחור קובץ-חשבונית לפני השליחה | modules/08_finance/ClosingWindowDialog.jsx:143 | ① | תווית/כותרת/פעולה קצרה |
| כוכב {star} | modules/08_finance/PublicFeedbackPage.jsx:250 | ① | קצר — כותרת/תווית סבירה |
| כולל מע"מ | modules/08_finance/FinancePage.jsx:90 | ① | קצר — כותרת/תווית סבירה |
| לא נבחר קובץ עדיין | modules/08_finance/ClosingWindowDialog.jsx:1005 | ① | קצר — כותרת/תווית סבירה |
| לא נרשם תאריך-תשלום | modules/08_finance/ClosingWindowDialog.jsx:245 | ① | קצר — כותרת/תווית סבירה |
| לא ענה לסקר | modules/08_finance/ClosingWindowDialog.jsx:1152 | ① | קצר — כותרת/תווית סבירה |
| מארכב... | modules/08_finance/ClosingWindowDialog.jsx:1526 | ① | קצר — כותרת/תווית סבירה |
| מה ייכלל בדוח של {periodLabel} | modules/08_finance/SalaryReportDialog.jsx:704 | ① | תווית/כותרת/פעולה קצרה |
| מה נכשל: | modules/08_finance/SalaryReportDialog.jsx:877 | ① | קצר — כותרת/תווית סבירה |
| מועד פירעון | modules/08_finance/FinancePage.jsx:911 | ① | קצר — כותרת/תווית סבירה |
| מייל לחיוב | modules/08_finance/ClosingWindowDialog.jsx:568 | ① | קצר — כותרת/תווית סבירה |
| מייל_משרד_רואי_חשבון | lib/paramsRegistry.js:724 (×2) | ① | קצר — כותרת/תווית סבירה |
| ממתין לחשבונית | lib/projects.js:13 (×3) | ① | קצר — כותרת/תווית סבירה |
| ממתין לתשלום | lib/projects.js:14 (×3) | ① | קצר — כותרת/תווית סבירה |
| מפיקה ושולחת… | modules/08_finance/SalaryReportDialog.jsx:648 | ① | קצר — כותרת/תווית סבירה |
| מתוכו באיחור-תשלום | modules/08_finance/FinancePage.jsx:99 | ① | קצר — כותרת/תווית סבירה |
| נאסף עד: | modules/08_finance/SalaryReportDialog.jsx:719 | ① | קצר — כותרת/תווית סבירה |
| נדרשת חשבונית זיכוי | modules/08_finance/ClosingWindowDialog.jsx:152 (×2) | ① | קצר — כותרת/תווית סבירה |
| נסגר תפעולית | modules/08_finance/FinancePage.jsx:77 | ① | קצר — כותרת/תווית סבירה |
| נסגר תפעולית: | modules/08_finance/ClosingWindowDialog.jsx:487 | ① | קצר — כותרת/תווית סבירה |
| נסו שוב | modules/08_finance/PublicFeedbackPage.jsx:361 | ① | קצר — כותרת/תווית סבירה |
| נסיעות | lib/salaryReport.js:57 (×2) | ① | קצר — כותרת/תווית סבירה |
| נסיעות (פרמטר × משמרות) | modules/08_finance/ClosingWindowDialog.jsx:1392 | ① | תווית/כותרת/פעולה קצרה |
| נקפא בשקלים ואינו ניתן לעריכה | modules/08_finance/ClosingWindowDialog.jsx:1431 (×2) | ① | תווית/כותרת/פעולה קצרה |
| נשלח — קובץ לא נשמר | modules/08_finance/SalaryReportDialog.jsx:1054 | ① | קצר — כותרת/תווית סבירה |
| נשלח אל | modules/08_finance/SalaryReportDialog.jsx:1173 | ① | קצר — כותרת/תווית סבירה |
| נשלח אל: | modules/08_finance/SalaryReportDialog.jsx:708 | ① | קצר — כותרת/תווית סבירה |
| נשלח בתאריך | modules/08_finance/SalaryReportDialog.jsx:1172 | ① | קצר — כותרת/תווית סבירה |
| נתוני הכספים של הפרויקט | modules/08_finance/ClosingWindowDialog.jsx:1577 | ① | תווית/כותרת/פעולה קצרה |
| סגור ללא תשלום | modules/08_finance/ClosingWindowDialog.jsx:807 (×3) | ① | קצר — כותרת/תווית סבירה |
| סגירה ללא תשלום | modules/08_finance/ClosingWindowDialog.jsx:592 (×2) | ① | קצר — כותרת/תווית סבירה |
| סה"כ לתשלום: | modules/08_finance/SalaryReportDialog.jsx:854 | ① | קצר — כותרת/תווית סבירה |
| סה"כ ממתין לגבייה | modules/08_finance/FinancePage.jsx:98 | ① | קצר — כותרת/תווית סבירה |
| סה"כ ששולם | modules/08_finance/SalaryReportDialog.jsx:1174 | ① | קצר — כותרת/תווית סבירה |
| סוגר... | modules/08_finance/ClosingWindowDialog.jsx:1121 | ① | קצר — כותרת/תווית סבירה |
| סומן שהלקוח לא ענה לסקר. | modules/08_finance/ClosingWindowDialog.jsx:2055 | ① | תווית/כותרת/פעולה קצרה |
| סחורה (כמות × עלות קפואה) | modules/08_finance/ClosingWindowDialog.jsx:1398 | ① | תווית/כותרת/פעולה קצרה |
| סטיית-תקציב — עבודה | modules/08_finance/ClosingWindowDialog.jsx:1413 | ① | קצר — כותרת/תווית סבירה |
| סיבות בירור | modules/08_finance/ClosingWindowDialog.jsx:1216 | ① | קצר — כותרת/תווית סבירה |
| סיבות לשיפור | modules/08_finance/PublicFeedbackPage.jsx:269 | ① | קצר — כותרת/תווית סבירה |
| סינון לפי שם חברה | modules/08_finance/FinancePage.jsx:836 | ① | קצר — כותרת/תווית סבירה |
| סכום דמי-הביטול הסופי | modules/08_finance/ClosingWindowDialog.jsx:729 | ① | תווית/כותרת/פעולה קצרה |
| סכום השורה הידנית | modules/08_finance/ClosingWindowDialog.jsx:707 | ① | קצר — כותרת/תווית סבירה |
| סכום לתשלום | modules/08_finance/FinancePage.jsx:913 | ① | קצר — כותרת/תווית סבירה |
| עד | modules/08_finance/FinancePage.jsx:819 | ① | קצר — כותרת/תווית סבירה |
| עדיין לא הופקו דוחות | modules/08_finance/SalaryReportDialog.jsx:1162 | ① | קצר — כותרת/תווית סבירה |
| עדכון תאריך התשלום | modules/08_finance/ClosingWindowDialog.jsx:1075 | ① | קצר — כותרת/תווית סבירה |
| עם השורה הידנית שלמעלה: | modules/08_finance/ClosingWindowDialog.jsx:885 | ① | תווית/כותרת/פעולה קצרה |
| פירוט דמי-הביטול המוצע | modules/08_finance/ClosingWindowDialog.jsx:845 | ① | תווית/כותרת/פעולה קצרה |
| פרויקט | lib/catalog.js:21 (×4) | ① | קצר — כותרת/תווית סבירה |
| פרויקטים שהסתיימו | modules/08_finance/FinancePage.jsx:107 | ① | קצר — כותרת/תווית סבירה |
| פרטי-בנק | lib/salaryReport.js:53 (×2) | ① | קצר — כותרת/תווית סבירה |
| ציון {tag.score} מתוך 5 | modules/08_finance/ClosingWindowDialog.jsx:1246 | ① | תווית/כותרת/פעולה קצרה |
| צפייה בדוח הקיים ↓ | modules/08_finance/SalaryReportDialog.jsx:585 | ① | קצר — כותרת/תווית סבירה |
| קובץ | modules/08_finance/SalaryReportDialog.jsx:1175 | ① | קצר — כותרת/תווית סבירה |
| רואה-החשבון | modules/08_finance/SalaryReportDialog.jsx:395 | ① | קצר — כותרת/תווית סבירה |
| רווח סופי | modules/08_finance/FinancePage.jsx:919 | ① | קצר — כותרת/תווית סבירה |
| רווח סופי — ביטול | modules/08_finance/ClosingWindowDialog.jsx:1446 | ① | קצר — כותרת/תווית סבירה |
| רווח סופי — קפוא | modules/08_finance/ClosingWindowDialog.jsx:1428 (×2) | ① | קצר — כותרת/תווית סבירה |
| רוצים לספר לנו עוד? (רשות) | modules/08_finance/PublicFeedbackPage.jsx:300 | ① | תווית/כותרת/פעולה קצרה |
| רישום התשלום נכשל. | modules/08_finance/api.js:233 | ① | קצר — כותרת/תווית סבירה |
| שולחת… | modules/08_finance/SalaryReportDialog.jsx:1244 | ① | קצר — כותרת/תווית סבירה |
| שולם | modules/08_finance/FinancePage.jsx:86 | ① | קצר — כותרת/תווית סבירה |
| שורה אחת | modules/08_finance/SalaryReportDialog.jsx:1010 | ① | קצר — כותרת/תווית סבירה |
| שורות | modules/08_finance/SalaryReportDialog.jsx:1013 | ① | קצר — כותרת/תווית סבירה |
| שורות בדוח: | modules/08_finance/SalaryReportDialog.jsx:846 | ① | קצר — כותרת/תווית סבירה |
| שורות מסך הכספים | modules/08_finance/FinancePage.jsx:205 | ① | קצר — כותרת/תווית סבירה |
| שלח | modules/08_finance/PublicFeedbackPage.jsx:322 | ① | פועל-פעולה על כפתור |
| שם הקובץ: | modules/08_finance/SalaryReportDialog.jsx:716 | ① | קצר — כותרת/תווית סבירה |
| שמור דמי-ביטול | modules/08_finance/ClosingWindowDialog.jsx:793 | ① | קצר — כותרת/תווית סבירה |
| שמור סטטוס | modules/08_finance/ClosingWindowDialog.jsx:1504 | ① | קצר — כותרת/תווית סבירה |
| שמור תשלום | modules/08_finance/ClosingWindowDialog.jsx:1075 | ① | קצר — כותרת/תווית סבירה |
| שמירת המשוב נכשלה. | modules/08_finance/api.js:257 | ① | קצר — כותרת/תווית סבירה |
| שנה | modules/08_finance/SalaryReportDialog.jsx:500 | ① | קצר — כותרת/תווית סבירה |
| שנה ציון | modules/08_finance/ClosingWindowDialog.jsx:1286 | ① | קצר — כותרת/תווית סבירה |
| שני {plural} | modules/08_finance/FinancePage.jsx:375 | ① | קצר — כותרת/תווית סבירה |
| ת"ז | lib/salaryReport.js:51 (×2) | ① | קצר — כותרת/תווית סבירה |
| תאריך קבלת התשלום נרשם. | modules/08_finance/ClosingWindowDialog.jsx:2024 | ① | תווית/כותרת/פעולה קצרה |
| תאריך קבלת תשלום | modules/08_finance/ClosingWindowDialog.jsx:1055 | ① | קצר — כותרת/תווית סבירה |
| תאריך תשלום | modules/08_finance/ClosingWindowDialog.jsx:584 | ① | קצר — כותרת/תווית סבירה |
| תבנית_מייל_דוח_שכר | lib/paramsRegistry.js:550 (×2) | ① | קצר — כותרת/תווית סבירה |
| תבנית_מייל_חשבונית_מס | lib/paramsRegistry.js:543 (×2) | ① | תווית/כותרת/פעולה קצרה |
| תחשיב-מאזן | modules/08_finance/ClosingWindowDialog.jsx:1372 | ① | קצר — כותרת/תווית סבירה |
| תיאור-שירות ידני | modules/08_finance/ClosingWindowDialog.jsx:695 | ① | קצר — כותרת/תווית סבירה |
| תיק | modules/08_finance/FinancePage.jsx:382 (×2) | ① | קצר — כותרת/תווית סבירה |
| תיקים | modules/08_finance/FinancePage.jsx:382 (×2) | ① | קצר — כותרת/תווית סבירה |
| תעריף | lib/salaryReport.js:54 (×2) | ① | קצר — כותרת/תווית סבירה |
| תקופה | modules/08_finance/SalaryReportDialog.jsx:1170 | ① | קצר — כותרת/תווית סבירה |
| תשלום | modules/08_finance/ClosingWindowDialog.jsx:1052 | ① | קצר — כותרת/תווית סבירה |
| תת-סכום (① + ②) | modules/08_finance/ClosingWindowDialog.jsx:876 | ① | קצר — כותרת/תווית סבירה |

#### מודול 9 (settings) — 68 מחרוזות ייחודיות

| מחרוזת | קובץ:שורה | סיווג | הערה |
|---|---|---|---|
| הגדרה ללא הגדרת-תצוגה | lib/paramsRegistry.js:741 (×2) | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
|  הדירוג שמנהלת השיבוץ תראה מחר ייראה אחרת, והיא לא תדע שמשהו השתנה. שינוי כדאי לתאם איתה מראש. | modules/09_settings/SmartMatchPane.jsx:55 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| , ב-{ownedGroups.length} קבוצות. | modules/09_settings/MySettingsPage.jsx:202 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {verdict.message} אפשר לשמור — אבל כדאי לבדוק את החוסר. | modules/09_settings/TemplateEditor.jsx:215 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ✱ חובה — בלעדיו השמירה נחסמת | modules/09_settings/TemplateEditor.jsx:261 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אין דיילות פעילות מתחת לרף הנוכחי | modules/09_settings/BelowMinWageList.jsx:117 | ② | מצב-ריק |
| אין הגדרות בבעלות התפקיד שלך | modules/09_settings/MySettingsPage.jsx:230 | ② | מצב-ריק |
| אין הגדרות שתואמות לחיפוש | modules/09_settings/MySettingsPage.jsx:221 (×2) | ② | מצב-ריק |
| אין הרשאה לערוך את "{forbidden.name}" — כל קבוצת השינויים לא נשלחה. | modules/09_settings/api.js:82 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין הרשאה לשמור העדפות התראות. | modules/09_settings/api.js:214 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין לך הרשאה לצפות ברשימת השכר — רק בעלת הפרמטר או מי שמחזיקה עריכה על "הגדרות מערכת". | modules/09_settings/api.js:130 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין משתמש מחובר. | modules/09_settings/api.js:176 | ② | מצב-ריק |
| בלי סימון — רשות, חוסר גורר אזהרה בלבד | modules/09_settings/TemplateEditor.jsx:264 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| בפועל כרגע: היענות {Math.round(effectiveWeights.responsiveness * 100)}% · קרבה {Math.round(effectiveWeights.proximity * 100)}% — מרכיב שכבוי יוצא מהחישוב, והנותרים מתחלקים ביניהם. | modules/09_settings/SmartMatchPane.jsx:220 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| גוף התבנית — {getParamEntry(selectedRow.param_name).label} | modules/09_settings/TemplateEditor.jsx:192 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הערכים שמנוע התמחור וההצעות קורא. שינוי משפיע על הצעות חדשות בלבד — הצעה שכבר אושרה שומרת את הערכים שהוקפאו בה. | modules/09_settings/ParamsTab.jsx:61 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הערכים שקובעים איך המערכת מדרגת מועמדות לשיבוץ. | modules/09_settings/ParamsTab.jsx:62 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| השמירה חסומה. אפשר להחזיר את המשתנה מהרשימה שלמטה. | modules/09_settings/TemplateEditor.jsx:209 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| השמירה חסומה. צריך למחוק את המשתנה מהטקסט — הוא לא קיים במערכת. | modules/09_settings/TemplateEditor.jsx:210 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| השמירה נכשלה ב"{label}" — {reason} | modules/09_settings/components/useParamsForm.js:77 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חיפוש לפי שם ההגדרה או שם הפרמטר במערכת | modules/09_settings/MySettingsPage.jsx:213 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ייתכן שאין לך הרשאה לשנות אותה | modules/09_settings/api.js:104 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ימי האזהרה חייבים להיות קטנים מימי התוקף — אחרת כל הצעה פתוחה מסומנת "פגה בקרוב" מרגע יצירתה | modules/09_settings/components/useParamsForm.js:63 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא ניתן לטעון את ההגדרות. | components/ProfileSettingsPage.jsx:291 (×3) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לטעון את נתוני הנוכחות. | modules/09_settings/SmartMatchPane.jsx:152 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| מה מותר להכניס בתבנית הזו — לחיצה מוסיפה לטקסט | modules/09_settings/TemplateEditor.jsx:235 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מי מתחת לשכר המינימום {headingThreshold != null && headingThreshold !== '' && ( <> {' ('} <Money amount={headingThreshold} exact /> {')'} </> )} | modules/09_settings/BelowMinWageList.jsx:94 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מרחק שבו ציון-הקרבה מגיע ל-0 חייב להיות קטן או שווה למרחק-הפסילה | modules/09_settings/components/useParamsForm.js:57 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שגיאה בזיהוי המשתמש המחובר. | modules/09_settings/api.js:174 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת ההגדרות שלך. | modules/09_settings/api.js:51 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת העדפות ההתראות. | modules/09_settings/api.js:189 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת נתוני הנוכחות. | modules/09_settings/api.js:158 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת רשימת הדיילות מתחת לשכר המינימום. | modules/09_settings/BelowMinWageList.jsx:75 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת רשימת ההגדרות. | modules/09_settings/api.js:38 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שיבוצים — עדיין אין מספיק נתונים כדי שהמרכיב הזה ישנה משהו | modules/09_settings/SmartMatchPane.jsx:66 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שינוי כאן משנה את הדירוג שתראי מחר במסך השיבוץ. | modules/09_settings/SmartMatchPane.jsx:56 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שלוש המשקולות חייבות להסתכם ל-1.00 | modules/09_settings/SmartMatchPane.jsx:205 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שמירת העדפות ההתראות נכשלה. | modules/09_settings/api.js:213 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שעות הפיצוי המלא חייבות להיות קטנות משעות הפיצוי החלקי — ככל שקרוב יותר לאירוע, הפיצוי גדול יותר | modules/09_settings/components/useParamsForm.js:61 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תצוגה מקדימה — טרם נשמר | modules/09_settings/BelowMinWageList.jsx:106 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תקלה לא צפויה בשמירה | modules/09_settings/components/useParamsForm.js:84 | ② | הודעת-שגיאה (פתיחה אופיינית) |
|  — חסר ✚ | modules/09_settings/TemplateEditor.jsx:52 | ① | קצר — כותרת/תווית סבירה |
| , בקבוצה אחת. | modules/09_settings/MySettingsPage.jsx:202 | ① | קצר — כותרת/תווית סבירה |
| {rows.length} הגדרות בבעלותך | modules/09_settings/MySettingsPage.jsx:201 | ① | תווית/כותרת/פעולה קצרה |
| ↳ משפיע: {entry.affects} | modules/09_settings/components/ParamRow.jsx:173 | ① | תווית/כותרת/פעולה קצרה |
| הגדרה | modules/09_settings/components/ParamRow.jsx:69 | ① | קצר — כותרת/תווית סבירה |
| הגדרה אחת בבעלותך | modules/09_settings/MySettingsPage.jsx:201 | ① | קצר — כותרת/תווית סבירה |
| ההגדרות נשמרו | components/ProfileSettingsPage.jsx:308 (×3) | ① | קצר — כותרת/תווית סבירה |
| ההגדרות שלי | components/layout/Topbar.jsx:72 (×2) | ① | קצר — כותרת/תווית סבירה |
| השרת דחה את השמירה | modules/09_settings/api.js:100 | ① | קצר — כותרת/תווית סבירה |
| טוען נתוני נוכחות… | modules/09_settings/SmartMatchPane.jsx:259 | ① | קצר — כותרת/תווית סבירה |
| ימי_אזהרה_הצעה_פגה | lib/paramsRegistry.js:358 (×3) | ① | קצר — כותרת/תווית סבירה |
| ימי_תוקף_הצעה | lib/paramsRegistry.js:303 (×3) | ① | קצר — כותרת/תווית סבירה |
| יש שדה עם ערך לא תקין | modules/09_settings/MySettingsPage.jsx:328 | ① | תווית/כותרת/פעולה קצרה |
| יש שדה עם ערך לא תקין בקבוצה הזו | modules/09_settings/ParamsTab.jsx:333 | ① | תווית/כותרת/פעולה קצרה |
| לא שינית כלום | modules/09_settings/components/SaveRow.jsx:49 | ① | קצר — כותרת/תווית סבירה |
| ערך | lib/projectFinance.js:53 (×2) | ① | קצר — כותרת/תווית סבירה |
| קבוצות ההגדרות | modules/09_settings/components/GroupList.jsx:15 | ① | קצר — כותרת/תווית סבירה |
| שורה זו אינה מוכרת למרשם התצוגה. | modules/09_settings/components/ParamRow.jsx:172 | ① | תווית/כותרת/פעולה קצרה |
| שורות-נוכחות מתוך | modules/09_settings/SmartMatchPane.jsx:73 | ① | קצר — כותרת/תווית סבירה |
| שורת-נוכחות אחת בלבד מתוך | modules/09_settings/SmartMatchPane.jsx:65 | ① | תווית/כותרת/פעולה קצרה |
| שיבוצים | modules/09_settings/SmartMatchPane.jsx:73 | ① | קצר — כותרת/תווית סבירה |
| שינוי כאן משנה שיבוצים אמיתיים. | modules/09_settings/SmartMatchPane.jsx:52 | ① | תווית/כותרת/פעולה קצרה |
| שינית | modules/09_settings/components/SaveRow.jsx:51 | ① | קצר — כותרת/תווית סבירה |
| שכר_מינימום_שעתי | lib/hostesses.js:18 (×4) | ① | קצר — כותרת/תווית סבירה |
| שעות_פיצוי_ביטול_חלקי | lib/paramsRegistry.js:404 (×3) | ① | תווית/כותרת/פעולה קצרה |
| שעות_פיצוי_ביטול_מלא | lib/paramsRegistry.js:415 (×3) | ① | קצר — כותרת/תווית סבירה |
| תקין | modules/09_settings/SmartMatchPane.jsx:215 | ① | קצר — כותרת/תווית סבירה |

#### lib (משותף) — 691 מחרוזות ייחודיות

| מחרוזת | קובץ:שורה | סיווג | הערה |
|---|---|---|---|
| כאן מוצג הסטטוס הגולמי כפי שנרשם — לא התווית הנגזרת שלמעלה | lib/projectTeam.js:22 | ④ | ממצא מאומת ידנית מול הקוד (ר׳ §3) |
| ממוין: בפנים · פתוח · יצא | lib/projectTeam.js:18 | ④ | ממצא מאומת ידנית מול הקוד (ר׳ §3) |
| ממוין: לפי קרבת האירוע | lib/projectLogistics.js:293 | ④ | ממצא מאומת ידנית מול הקוד (ר׳ §3) |
| ממוין: מה שרחוק ביותר ממוכן — תחילה | lib/projectLogistics.js:65 | ④ | ממצא מאומת ידנית מול הקוד (ר׳ §3) |
| — {opening}{after}, כלומר אין קישור חי: גם דיילת שתרצה לאשר עכשיו לא תוכל. הפעולה הבאה היא זימון חדש, לא המתנה. | lib/projectTeam.js:96 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| אחוז המע"מ שמתווסף לכל הצעת מחיר חדשה | lib/paramsRegistry.js:282 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| אחוז מהתשלום לדיילת המשולם כפיצוי בביטול פרויקט בטווח-הביניים | lib/paramsRegistry.js:373 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| דיילת שמרחקה מהאירוע גדול מהערך הזה לא מוצגת כמועמדת כלל | lib/paramsRegistry.js:616 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| החלון המורחב שייפתח כשלדיילת אין מספיק תשובות בחלון הרגיל (טרם בשימוש) | lib/paramsRegistry.js:662 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| היא חזרה בה אחרי שאושרה — כאן נפתח החוסר. שלא כמו שחרור, ביטול שלה כן נספר באמינות ההגעה שלה. | lib/projectTeam.js:67 | ③ | טקסט-הסבר ארוך — באנר/tooltip הבוחר לחשוף לוגיקה במפורש (לא ①/②) |
| המייל האוטומטי שיוצא לדיילת לפני המשמרת (טריגר: שעות_תזכורת_לדיילת) | lib/paramsRegistry.js:524 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| המייל שיוצא לדיילת כשהיא מועמדת למשמרת חדשה | lib/paramsRegistry.js:503 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| המייל שיוצא לדיילת כשהיא משוחררת ממשמרת שמעולם לא אושרה | lib/paramsRegistry.js:531 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| המייל שיוצא לדיילת כשמיקום או שעות האירוע שלה השתנו | lib/paramsRegistry.js:573 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| המייל שיוצא לדיילת כששיבוץ שלה בוטל, בעוד האירוע עצמו ממשיך | lib/paramsRegistry.js:517 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| המייל שיוצא לדיילת כששיבוצה נסגר סופית | lib/paramsRegistry.js:510 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| המייל שיוצא לכל דיילת ששובצה, כשהאירוע כולו מבוטל | lib/paramsRegistry.js:566 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| המייל שמבקש מהלקוח למלא סקר שביעות-רצון אחרי סגירת אירוע | lib/paramsRegistry.js:559 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| המייל שמלווה את דוח-השכר החודשי בשליחתו לרואה-החשבון | lib/paramsRegistry.js:552 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| המייל שמלווה הצעת-מחיר בשליחתה ללקוח | lib/paramsRegistry.js:538 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| המייל שמלווה חשבונית-מס בשליחתה ללקוח | lib/paramsRegistry.js:545 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| התוספת הקבועה שמשולמת לדיילת עבור נסיעות במשמרת | lib/paramsRegistry.js:317 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| התעריף המינימלי לשעת-עבודה של דיילת — משמש לבדיקת תעריפים ולרשימת דיילות מתחת לרף | lib/paramsRegistry.js:329 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| חייב להיות קטן או שווה למרחק-הפסילה | lib/paramsRegistry.js:628 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה "תשובות דמיוניות" ממוצע-החברה שוקל בציון של דיילת עם מעט היסטוריה — מונע קפיצה מדירוג אחד או שניים | lib/paramsRegistry.js:639 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה אורחים לכל דיילת אחת — משמש להמלצת המערכת על כמות הדיילות הנדרשת | lib/paramsRegistry.js:294 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה הציון גדל לכל שבוע שדיילת לא עבדה — מנוף קטן וחסום, לא תחליף לדירוג | lib/paramsRegistry.js:684 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה זימונים רצופים בלי מענה הופכים לתגית "לא ענתה" בכרטיס הדיילת | lib/paramsRegistry.js:705 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה חודשים אחורה ייספרו לחישוב ציוני היענות ואמינות (החישוב טרם משתמש בערך הזה) | lib/paramsRegistry.js:650 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה ימי-עסקים לפני האירוע פריט לוגיסטי שלא הוחל מסומן בענבר | lib/paramsRegistry.js:454 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה ימים אחרי הפקת חשבונית היא נחשבת באיחור | lib/paramsRegistry.js:349 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה ימים בלי אירוע עתידי הופכים לקוח ל"רדום" | lib/paramsRegistry.js:395 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה ימים הצעת מחיר תקפה לפני שהיא נחשבת פגה | lib/paramsRegistry.js:305 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה ימים לפני האירוע הפרויקט מסומן "אדום" במסכי הניהול | lib/paramsRegistry.js:384 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה ימים לפני שהצעת מחיר פגה מוצגת אזהרה במסך ההצעות | lib/paramsRegistry.js:360 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה מהציון נקבע לפי היענות לזימונים | lib/paramsRegistry.js:582 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה מהציון נקבע לפי מרחק מהאירוע | lib/paramsRegistry.js:604 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה מהציון נקבע לפי נוכחות בפועל במשמרות קודמות (הגעה מול אי-הגעה) | lib/paramsRegistry.js:593 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה שעות לפני המשמרת תישלח לדיילת תזכורת אוטומטית (השליחה האוטומטית טרם נבנתה — הערך נשמר ומחכה לה) | lib/paramsRegistry.js:432 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה שעות מרגע השליחה יש לדיילת לאשר או לדחות זימון לפני שהוא פג | lib/paramsRegistry.js:478 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כמה תשובות נדרשות לפני שמוצג ציון — פחות מזה מוצג "דיילת חדשה" | lib/paramsRegistry.js:673 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| כתובת היעד למשלוח אוטומטי של דוח-השכר החודשי | lib/paramsRegistry.js:726 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| מדליק או מכבה את שקלול מרכיב-האמינות בציון ההתאמה | lib/paramsRegistry.js:716 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| מספר השבועות המרבי שנספר לבונוס ההוגנות | lib/paramsRegistry.js:694 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| מספר השעות לפני האירוע שמתחתיו ביטול מזכה בפיצוי חלקי | lib/paramsRegistry.js:406 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| מספר השעות לפני האירוע שמתחתיו ביטול מזכה בפיצוי מלא | lib/paramsRegistry.js:417 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| מספר השעות לפני האירוע שמתחתיו זימון-משמרת נחשב "ליום האחרון" | lib/paramsRegistry.js:467 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| מספר השעות עד האירוע שמתחתיו הוא מסומן "דחוף" במבט-העל ובמיון | lib/paramsRegistry.js:490 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| ציון משוב שמתחתיו נדרשת סיבה ובירור טלפוני; לקוח שממוצע-המשוב שלו נמוך מהסף מסומן "טעון בירור" | lib/paramsRegistry.js:443 | ③ | טקסט-hint בעמודת "הערה" של מסך-הפרמטרים (מודול 9) — מוסבר ומתויג |
| — אין אף זימון פתוח. הפעולה הבאה היא זימון חדש. | lib/projectTeam.js:104 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| (אין סגירה תפעולית לפרויקט מבוטל) | lib/projectCard.js:77 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| (נפתחת בסריקה היומית — האירוע נסגר לסגירה מחר ב-02:00) | lib/projectCard.js:75 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {assigned} · {marked} סומנו | lib/closingDraft.js:170 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {assigned} · טרם סומנו | lib/closingDraft.js:169 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {assigned} · כולן סומנו | lib/closingDraft.js:168 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {confirmed}/{required} דיילות, {dayOfMonth} בחודש | lib/dashboard.js:212 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {count} דיילות כבר אושרו סופית לתאריך הקודם{named}. השמירה תבטל את האישור שלהן ותשלח להן זימון מחדש לתאריך החדש. | lib/projectCard.js:229 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {count} דיילות שוחררו אוטומטית וקיבלו הודעה | lib/projectTeam.js:198 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {daysWithoutAnswer} ימים ללא מענה, | lib/projectTeam.js:45 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {finallyApprovedCount} דיילות שאושרו סופית ישוחררו ויקבלו מייל "האירוע בוטל" | lib/projectCancellation.js:171 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {full}–{partial} שעות מזכות ב-{partialPct}% · | lib/projectCancellation.js:87 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {items.slice(0, -1).join(', ')} ו{items[items.length - 1]} | lib/projectClosing.js:129 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {itemsNotReady} פריטים טרם מוכנים | lib/projects.js:347 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {label} חייב להיות מספר בין 0 ל-100 (התקבל: {value}). | lib/pricing.js:56 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {label}: {missing.join(', ')} — {effects.join(', ')}. {action} בהגדרות המערכת. | lib/quotes.js:576 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {name}: שעות בפועל חייבות להיות בין 0 ל-{bound ?? '—'}. | lib/closingDraft.js:250 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {otherLiveCount} דיילות נוספות שטרם השיבו ישוחררו ויקבלו את אותו מייל | lib/projectCancellation.js:180 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {parts.join(' · ')}. אין בחירה מי — כולן משוחררות יחד. | lib/projectCancellation.js:188 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {pending} זימונים ממתינים למענה — וגם אם {answerers} יאשרו, עדיין חסרות {stillMissing} | lib/projects.js:144 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {pendingExpired} הזימונים הפתוחים פגו | lib/projectTeam.js:91 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {pendingLive} זימונים ממתינים למענה | lib/projectTeam.js:101 (×2) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {released}. אין מה לבחור ואין חוסר — האירוע אינו מתקיים. | lib/projectTeam.js:199 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {rowsText}, {hostessText}: הסטטוס הקובע לכל דיילת הוא של הסבב האחרון שלה. הסבבים הקודמים נשמרים ואינם נמחקים. | lib/projectTeam.js:173 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {targetQty} יחידות נכנסות בקטלוג למדרגת מחיר זולה יותר. | lib/projectChanges.js:239 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {total} פרויקטים קיימים ואינם מוצגים כרגע. | lib/projects.js:355 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| {wait}והקישור פג{when}. אין ממה לחכות — היא לא תוכל לענות; הפעולה הבאה היא זימון חדש. | lib/projectTeam.js:47 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ⚠ שינוי {hoursUntilEventValue} שעות לפני האירוע. | lib/projectChanges.js:221 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אושרה סופית — סוכם בטלפון | lib/assignmentActions.js:154 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אחוז ההנחה חייב להיות מספר בין 0 ל-100. | lib/customers.js:247 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אין אירוע שיוצא עד יום העסקים הבא. | lib/projectLogistics.js:285 | ② | מצב-ריק |
| אין אף זימון חי | lib/projectTeam.js:115 | ② | מצב-ריק |
| אין אף זימון פתוח | lib/projectTeam.js:116 | ② | מצב-ריק |
| אין דיילות משובצות — אין מה לשחרר ואין פיצוי. | lib/projectCancellation.js:186 | ② | מצב-ריק |
| אין הצעות שממתינות להחלטה | lib/quotes.js:967 | ② | מצב-ריק |
| אין התראה על אירועים קרובים | lib/quotes.js:571 | ② | מצב-ריק |
| אין התראה על הצעות שעומדות לפוג | lib/quotes.js:568 | ② | מצב-ריק |
| אין כתובת מייל לאיש הקשר | lib/email.js:195 | ② | מצב-ריק |
| אין לך הרשאה לצפות בנתונים כספיים. | lib/projectLogistics.js:64 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין לך הרשאה לצפות בפריטי ההצעה, ולכן לא ניתן לקבוע אם הרשימה ריקה כדין. | lib/projectLogistics.js:49 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין לך הרשאה לצפות בפריטי הלוגיסטיקה, ולכן לא ניתן לקבוע אם הרשימה ריקה כדין. | lib/projectLogistics.js:58 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין לך הרשאה לצפות בפריטי הלוגיסטיקה, ולכן לא ניתן לקבוע אם התור ריק כדין. | lib/projectLogistics.js:284 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין לך הרשאה לצפות בצוות הדיילות. | lib/projectTeam.js:16 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין לך הרשאה לשלוח | lib/email.js:191 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין לך הרשאה לשלוח הצעות | lib/quotes.js:826 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין לך הרשאת עריכה על "דיילות" — יש לפנות למנכ"ל להרחבת ההרשאה. | lib/hostesses.js:642 | ② | מצב-ריק |
| אין לך הרשאת עריכה על "הצעות מחיר" — יש לפנות למנכ"ל להרחבת ההרשאה. | lib/quotes.js:384 | ② | מצב-ריק |
| אין לקוחות שאישרו דיוור | lib/marketing.js:73 | ② | מצב-ריק |
| אין מה לבחור ואין חוסר — האירוע אינו מתקיים. | lib/projectTeam.js:194 | ② | מצב-ריק |
| אין עדיין פרויקט שהסתיים | lib/customerProjects.js:219 | ② | מצב-ריק |
| אישור סופי למשמרת — {project?.event_name ?? ''} | lib/shiftEmails.js:44 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אישרה זמינות וממתינה לאישור סופי ממך. | lib/projectTeam.js:61 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אנחנו ויתרנו עליה. שחרור אינו נספר לה לרעה בשום מקום. | lib/projectTeam.js:65 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| אצל מנהלת הכספים — אינו דורש ממך פעולה | lib/projects.js:95 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| בוטל — {CANCEL_TYPE_NAMES[cancelType]} | lib/projects.js:100 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ביטול האירוע — {project?.event_name ?? ''} | lib/shiftEmails.js:107 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| בסוג "הלקוח ביטל" אותו ביטול היה נותן {standardPercent}% — כאן הפיצוי מתאפס תמיד. | lib/projectCancellation.js:114 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| בסוג "הלקוח ביטל" אותו ביטול היה נותן גם הוא 0% — כאן, לעומת זאת, גם ביטול של יום לפני היה מאפס. | lib/projectCancellation.js:113 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| בפנים — אושרה סופית לאירוע. | lib/projectTeam.js:53 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| בפנים. היא אחראית המשמרת של האירוע — אחת לאירוע, ורק על מי שאושרה סופית. | lib/projectTeam.js:52 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| בשווי {formatMoney(metrics.openQuotesValue)} | lib/customers.js:179 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דוח שכר דיילות — {periodLabel} | lib/salaryReport.js:332 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דוח-סיכום האירוע — {project?.event_name ?? ''} | lib/shiftEmails.js:274 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דיילת אחת כבר אושרה סופית לתאריך הקודם{named}. השמירה תבטל את האישור שלה ותשלח לה זימון מחדש לתאריך החדש. | lib/projectCard.js:228 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דיילת אחת שאושרה סופית תשוחרר ותקבל מייל "האירוע בוטל" | lib/projectCancellation.js:169 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דיילת אחת שוחררה אוטומטית וקיבלה הודעה | lib/projectTeam.js:197 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דיילת נוספת אחת שטרם השיבה תשוחרר ותקבל את אותו מייל | lib/projectCancellation.js:178 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| דיילת נוספת כמעט אינה ניתנת לגיוס בטווח כזה, ותגים מודפסים דורשים ימים.  | lib/projectChanges.js:222 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| האירוע בתוך {hours} שעות — קישור חדש כבר לא ייפתח | lib/assignmentActions.js:110 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| האירוע התקיים והיא עבדה בו — השיבוץ הושלם. | lib/projectTeam.js:38 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| האירוע עבר ולא נסגר — לא נשלח בו אף זימון מעולם | lib/projects.js:108 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הביטול הוא {full}–{partial} שעות לפני האירוע. | lib/projectCancellation.js:104 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הביטול הוא יותר מ-{partial} שעות לפני האירוע. | lib/projectCancellation.js:102 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הביטול הוא פחות מ-{full} שעות לפני האירוע. | lib/projectCancellation.js:103 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הדיילת היחידה אישרה זמינות וממתינה לאישור סופי ממך | lib/projects.js:121 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הדיילת כבר מאושרת סופית לאירוע אחר באותו תאריך — לא ניתן לאשר אותה לשני אירועים ביום. | lib/hostesses.js:628 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הדיילת כבר ענתה — רענון קישור לא רלוונטי | lib/assignmentActions.js:113 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הדיילת לא תוכל לאשר או לדחות את המשמרת | lib/emailTemplates.js:94 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההגעה מתעכבת — הובטח ל- | lib/projectLogistics.js:300 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההצעה אושרה ונפתח פרויקט חדש עבור "{eventName}". | lib/quotes.js:45 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההצעה כבר {label} בינתיים — יש לרענן את המסך כדי לראות את מצבה העדכני. | lib/quotes.js:346 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההצעה כבר אינה בסטטוס "בתהליך" ולכן אינה ניתנת לעריכה — יש לרענן את המסך. | lib/quotes.js:361 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההצעה כבר טופלה בינתיים — יש לרענן את המסך כדי לראות את מצבה העדכני. | lib/quotes.js:347 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההצעה לא נמצאה — ייתכן שנמחקה או שאין לך הרשאה אליה. יש לרענן את רשימת ההצעות. | lib/quotes.js:387 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההצעה לא נשלחה. לחץ "שליחת ההצעה במייל" שוב, או הורד את הקובץ ושלח ידנית. | lib/quotes.js:828 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההצעה נעולה לשינויים — רק הצעה בסטטוס "בתהליך" ניתנת לעריכה או לדחייה. יש לרענן את המסך. | lib/quotes.js:366 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההצעה עצמה נעולה ואינה משתנה. כל שינוי נרשם כאן עם סיבה, ומעדכן את הכמות המתוכננת בטבלה שלמעלה. | lib/projectLogistics.js:67 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ההצעה תומחרה ל-{required} דיילות. דיילת נוספת היא עלות שהלקוח לא משלם עליה. | lib/assignmentActions.js:78 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הכול מוכן — לוודא שהסחורה יוצאת | lib/projectLogistics.js:296 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הכמות עומדת על {Number(required) \|\| 0} מאז אישור ההצעה{since}. כל שינוי יופיע כאן בשורה משלו — מה השתנה · בכמה · מי ביצע · מתי · והסיבה שנרשמה. ההצעה עצמה נשארת קפואה ואינה משתנה לעולם. | lib/projectTeam.js:212 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הלקוח לא יוכל להגיע לסקר שביעות-הרצון | lib/emailTemplates.js:98 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המדרג: יותר מ-{partial} שעות מזכה ב-0% · | lib/projectCancellation.js:86 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המחיר ליחידה נלקח מההצעה המקורית ואינו מחושב מחדש. | lib/projectLogistics.js:68 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המייל לא יזהה את שם החברה שאליה נשלחת החשבונית | lib/emailTemplates.js:101 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המייל לא יציין לאיזה חודש הדוח מתייחס | lib/emailTemplates.js:115 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המייל נשלח, אך רישום השליחה ביומן נכשל — המערכת לא תזכור שהמסמך נשלח ולא תזהיר לפני שליחה חוזרת. | lib/email.js:245 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המכסה מלאה — {approved} מתוך {required}. {subject} | lib/assignmentActions.js:77 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המשוב כבר התקבל, תודה | lib/feedback.js:31 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הנחה ידנית חייבת להיות בין 0 ל-100. | lib/quotes.js:290 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הסגירה נשמרה. מייל הסקר לא יצא — אפשר לשלוח שוב. | lib/closingDraft.js:283 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הסקר נשלח — טרם התקבלה תשובה | lib/projectCard.js:113 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הסקר נשלח בסגירת האירוע · הציון והסיבה מוזנים במסך הכספים | lib/projectCard.js:104 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| העדכון לא נשמר — הערך הוחזר לקודם. נסי שוב. | lib/projectLogistics.js:286 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפעולה שהמשתנה הזה מיועד לה לא תעבוד | lib/emailTemplates.js:129 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפקת דוח-השכר לא הושלמה — הקובץ לא הורכב. | lib/salaryReport.js:350 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפרויקט בוטל — לא ניתן לשנות תכולה. | lib/projectTeam.js:15 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפרויקט בוטל. {released} שיבוצים שוחררו, ופריטי הלוגיסטיקה לא השתנו. | lib/projectCancellation.js:126 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפרויקט בוטל. לא היו דיילות משובצות — לא שוחרר אף שיבוץ ולא נשלח אף מייל. | lib/projectCancellation.js:123 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפרויקט בוטל. שיבוץ אחד שוחרר, ופריטי הלוגיסטיקה לא השתנו. | lib/projectCancellation.js:125 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפרויקט יחזור לציר הפעיל — תג-הסטטוס ישתנה, ולשונית סגירת האירוע תינעל עד אחרי התאריך החדש. | lib/projectCard.js:242 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הצעה חייבת לכלול לפחות שורת דיילות אחת. | lib/quotes.js:304 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הקישור הזה אינו בתוקף יותר. אם עדיין מתאים לך — התקשרי למנהלת הגיוס. | lib/shiftInvite.js:38 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הרימי טלפון — אל תסתמכי על מייל. | lib/projectChanges.js:223 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| השדה "{fieldName}" אינו מספר תקין (התקבל: {value}). | lib/projectFinance.js:60 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| השכר השעתי חייב להיות לפחות {isolatedShekels(min)} (שכר מינימום) | lib/hostesses.js:152 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| השליחה בשיבוץ החכם נעשית ע"י מנהלת הגיוס. | lib/projectTeam.js:21 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| התאריך שבחרת כבר עבר — הסריקה היומית תעביר את הפרויקט ל"ממתין לסגירה". | lib/projectCard.js:32 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| התוספת מחויבת לפי המחיר שאושר בהצעה — לא לפי מחיר הקטלוג של היום. | lib/projectChanges.js:240 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| זימון אחד ממתין למענה — וגם אם תאשר, עדיין חסרות {stillMissing} | lib/projects.js:139 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| זימון למשמרת — {project?.event_name ?? ''} | lib/shiftEmails.js:40 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חובה להזין כמות אורחים בפועל. אם לא הגיע איש — הזיני 0. | lib/closingDraft.js:230 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חובה להזין שעות ביצוע — מספר בין 0.5 ל-24. | lib/closingDraft.js:229 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חובה למלא מיקום — הוא נשלח לדיילות ומשמש לדירוג הקרבה בשיבוץ. | lib/projectCard.js:24 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חובה לצרף דוח-סיכום. קבצי PDF, JPG או PNG בלבד, עד {mb}MB. | lib/closingDraft.js:234 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסר שדה "{fieldName}" בנתוני הכספים שהתקבלו מהשרת. | lib/projectFinance.js:56 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסר שדה "invoice_sent_at" בנתוני הכספים שהתקבלו מהשרת. | lib/projectFinance.js:136 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסרה חותמת-זמן להפקת הדוח — הקובץ לא הורכב. | lib/salaryReport.js:327 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסרים משתנים אופציונליים: {missingOptional.join(', ')} | lib/emailTemplates.js:181 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסרים פרמטרים של Smart Match בהגדרות המערכת: {names} | lib/smartMatch.js:116 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| חסרים שדות ב{context}: {missing.join(', ')}. | lib/projectFinance.js:77 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| טרם הוזמן אף פריט | lib/projectLogistics.js:116 | ② | מצב-ריק |
| טרם החל | lib/projectLogistics.js:21 (×4) | ② | מצב-ריק |
| טרם התקבל משוב | lib/projectCard.js:101 | ② | מצב-ריק |
| טרם מוכן | lib/projects.js:291 | ② | מצב-ריק |
| טרם מוכנים | lib/projects.js:291 | ② | מצב-ריק |
| טרם נשלח אף זימון לאירוע הזה. | lib/projectTeam.js:17 | ② | מצב-ריק |
| יוצא ביום {weekdayOf(eventDate)} — | lib/projectLogistics.js:511 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| יחס אורחים לדיילת חייב להיות גדול מ-0. | lib/quotes.js:273 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| יש להזין טלפון או אימייל לאיש הקשר. | lib/customers.js:282 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| יש למלא ערך — שדה ריק אינו 0 | lib/paramsRegistry.js:95 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כבר מסומנת אחראית משמרת אחרת לאירוע הזה | lib/assignmentActions.js:190 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כבר סומנה אחראית משמרת לאירוע הזה — יש להסיר את הסימון הקיים תחילה. | lib/hostesses.js:632 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כוח עליון מאפס פיצוי תמיד, ללא תלות במרחק-הזמן. | lib/projectCancellation.js:97 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כמות אורחים חייבת להיות גדולה מ-0. | lib/quotes.js:270 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כמות בפועל אינה יכולה להיות שלילית. | lib/projectLogistics.js:291 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כמות הדיילות חייבת להיות גדולה מ-0. | lib/quotes.js:278 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| כתובת זו כבר רשומה אצל {match.full_name} — להמשיך? | lib/hostesses.js:169 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ל"{companyName}" {what}{amount}. הן יישארו פעילות וימשיכו לפוג כרגיל. להעביר לארכיון בכל זאת? | lib/customers.js:181 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא בוצע שינוי בהצעה. היא תישלח שוב כפי שהיא, והתוקף לא יתאפס. להמשיך לשליחה? | lib/quotes.js:192 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא הגיעה — אישור מראש | lib/projectClosing.js:48 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא הוזמנו מוצרים לאירוע הזה — ההצעה כללה שירותי דיילות בלבד. | lib/projectLogistics.js:46 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא הצלחנו לשמור את המשוב. אפשר לנסות שוב. | lib/feedback.js:33 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא הצלחנו לשמור את התשובה. נסי שוב, או התקשרי למנהלת. | lib/shiftInvite.js:39 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא התקבל אישור שהמייל נשלח. בדוק בתיבת "נשלחו" שלך לפני שליחה חוזרת, כדי לא לשלוח פעמיים. | lib/email.js:225 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא זמינה {toDayMonth(range.start_date)}–{toDayMonth(range.end_date)} | lib/hostesses.js:196 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא ניתן היה לבדוק אם המסמך כבר נשלח ללקוח. | lib/email.js:239 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לאשר הצעה ללא שורות-דיילות | lib/quotes.js:355 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לאשר הצעה שתאריך-האירוע שלה עבר | lib/quotes.js:351 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן להפיק מסמכים ללקוחות | lib/quotes.js:562 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לוודא אם המסמך כבר נשלח ללקוח. לשלוח בכל זאת? | lib/email.js:240 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לסגור: חסרים {joinHebrewList(missing)}. | lib/projectClosing.js:200 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לסגור: לא שובצו דיילות לאירוע. | lib/projectClosing.js:148 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לערוך הצעה שאינה בתהליך | lib/quotes.js:360 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא נשלח אף זימון — איש לא נגע בפרויקט מאז שנוצר | lib/projects.js:116 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לא ענתה מעולם ({invites.length} זימונים) | lib/hostesses.js:560 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לדיילת לא יהיה טלפון ליצירת קשר בשטח | lib/emailTemplates.js:108 (×3) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| להצעה אין שורת דיילות — יש להוסיף שורת דיילות בעריכת ההצעה לפני האישור (אין אירוע בלי דיילות). | lib/quotes.js:357 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| להצעה שאושרה יש פריטי מוצר, ולכן רשימה ריקה כאן היא תקלה ולא מצב תקין. | lib/projectLogistics.js:60 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לוגיסטיקה {ready}/{total}, {dayOfMonth} בחודש | lib/dashboard.js:215 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| לכל פריט חייבים להיות מוצר וכמות גדולה מ-0. | lib/quotes.js:300 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מ-{finished.length} פרויקטים שהסתיימו | lib/customerProjects.js:225 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מדליק את שקלול מרכיב-האמינות בדירוג — הסדר שמנהלת השיבוץ תראה עשוי להשתנות | lib/paramsRegistry.js:719 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מייל הסקר לא יצא בסגירה — שליחה חוזרת מלשונית סגירת האירוע | lib/projectCard.js:109 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מלאי גם שעת התחלה וגם שעת סיום, או השאירי את שתיהן ריקות. | lib/projectCard.js:25 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ממתין להזנת שעות בפועל, כמות אורחים ודוח-סיכום | lib/projects.js:109 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ממתינה למענה — הקישור חי עוד {hoursLeft} שעות. | lib/projectTeam.js:59 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ממתינה למענה — הקישור חי עוד שעה אחת. | lib/projectTeam.js:58 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ממתינה למענה — הקישור עדיין חי. | lib/projectTeam.js:56 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מספר טלפון יכול להכיל ספרות וסימני-טלפון בלבד. | lib/customers.js:241 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מספר שורות הדוח אינו תואם את מה שנרשם במסד — הדוח לא הורכב. | lib/salaryReport.js:397 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מספר שלם גדול מאפס, או ריק לללא הגבלה | lib/pricing.js:248 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מעלה את הרף שבו נדרשת סיבה למשוב — מסך הכספים ידרוש אותה | lib/paramsRegistry.js:449 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מצב תקין. פרויקט בלי פריטי לוגיסטיקה נספר כמוכן לוגיסטית. | lib/projectLogistics.js:47 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| משנה את סדר המועמדות שמנהלת השיבוץ תראה מחר במסך ההתאמה | lib/paramsRegistry.js:588 (×3) | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| משנה את סכום המע"מ בהצעות מחיר חדשות — מסך בניית ההצעה יציג את הערך החדש מיד | lib/paramsRegistry.js:289 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| משנה את רשימת הדיילות שמתחת לשכר המינימום, ואת בדיקת התעריפים במודול הדיילות | lib/paramsRegistry.js:344 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| משנה מתי הצעת מחיר נחשבת פגה — משפיע על מסך ההצעות ועל הסינון בו | lib/paramsRegistry.js:312 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| משנה מתי זימון-משמרת נחשב פג — משפיע גם על מסך הצוות בפרויקט (מודול 6) | lib/paramsRegistry.js:485 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| משתנה לא מוכר בתבנית: {unknown.join(', ')} | lib/emailTemplates.js:171 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| מתוכם {noInviteCount} שלא נשלח בהם אף זימון | lib/projects.js:339 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נשלחו זימונים מחדש ל-{reinvitedCount} דיילות. | lib/projectCard.js:270 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| נתוני הלוגיסטיקה של הפרויקט לא נטענו. | lib/projectLogistics.js:61 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סימון 'לא לשלוח שוב' מחייב סיבה — היא תופיע בכרטיס הדיילת. | lib/closingDraft.js:245 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סירבה לזימון. זימון חוזר פותח סבב חדש — הסירוב נשמר בהיסטוריה. | lib/projectTeam.js:63 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סכום ההנחות ({applied}% + {manual}%) חורג מ-100%. | lib/pricing.js:118 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סכום משקולות Smart Match אינו חיובי — לא ניתן לדרג. | lib/smartMatch.js:133 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סכום שורות הדוח אינו תואם את הסכום שנרשם במסד — הדוח לא הורכב. | lib/salaryReport.js:389 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| סקר שביעות רצון — {project?.event_name ?? ''} | lib/shiftEmails.js:278 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדיין אין נתוני זמן-תגובה — הזווית תופעל כשדיילות יתחילו לענות דרך הקישור | lib/sortAngles.js:21 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדיין לא ידוע אם ל"{companyName}" יש הצעות פתוחות — נתוני ההצעות טרם נטענו. להעביר לארכיון בכל זאת? | lib/customers.js:174 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדכון על המשמרת — {project?.event_name ?? ''} | lib/shiftEmails.js:50 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| עדכון פרטי האירוע — {project?.event_name ?? ''} | lib/shiftEmails.js:111 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ערך חוקי: {head}, {decimalsPhrase(bounds.decimals)} | lib/paramsRegistry.js:146 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| פחות מ-{full} שעות מזכות ב-100% · | lib/projectCancellation.js:88 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| ציון משוב לא חוקי: {score} (מותר 1–5 בלבד). | lib/projectFinance.js:211 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| צירוף-נוכחות לא מוכר בשיבוץ: attendance_status={status}, lateness_level={lateness}, no_show_reason={reason} | lib/smartMatch.js:222 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| רענון יטען את הרשימה העדכנית — מה שהוקלד בלשונית יימחק ויהיה להזין מחדש. | lib/closingDraft.js:280 | ② | אישור פעולה מסוכנת / אזהרה |
| רשימת הנמענים ארוכה מדי — השתמשו בהעתקה | lib/marketing.js:72 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שגיאה: מספר ח.פ. חייב להכיל 9 ספרות בדיוק | lib/customers.js:219 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שורה שאינה מוצגת בקובץ נושאת סכום — הדוח לא הורכב. | lib/salaryReport.js:265 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שורת פיצוי-ביטול {position} הגיעה עם בונוס או נסיעות — נוגד את ה24/ה29. | lib/salaryReport.js:195 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שורת-שכר {position} ({hostessName}) חסרה סכום. | lib/salaryReport.js:224 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שורת-שכר {position} ({hostessName}) חסרה שעות. | lib/salaryReport.js:210 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שורת-שכר {position} ({hostessName}) חסרה תעריף. | lib/salaryReport.js:215 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שורת-שכר {position} הגיעה עם בסיס-חישוב לא מוכר — לא ניתן להרכיב את הקובץ. | lib/salaryReport.js:174 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שורת-שכר {position} חסרה שם או ת"ז — לא ניתן לשלוח דוח בלי זיהוי מלא. | lib/salaryReport.js:183 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שינוי הכמות נרשם כשינוי-תכולה עם סיבה; ההצעה נשארת קפואה. אין חסימת-זמן — שינוי מאוחר נרשם ומסומן כמאוחר. | lib/projectTeam.js:20 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שיעור המע"מ אינו מוגדר בהגדרות המערכת | lib/quotes.js:370 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שיעור המע"מ שבהגדרות המערכת אינו חוקי | lib/quotes.js:371 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שכר המינימום אינו מוגדר בהגדרות המערכת — לא ניתן לשמור דיילת. | lib/hostesses.js:147 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שלום [שם_איש_קשר], מצורף בזאת דוח-סיכום האירוע '[שם_פרויקט]' שהתקיים בתאריך [תאריך_אירוע]. נשמח לעמוד לרשותך בכל שאלה על האירוע ועל הדוח. בברכה, צוות REG-IN. | lib/shiftEmails.js:286 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שני פריטים טרם הוזמנו | lib/projectLogistics.js:470 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תאריך האירוע כבר עבר — לא ניתן ליצור הצעה לתאריך שחלף. | lib/quotes.js:266 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תאריך האירוע של ההצעה כבר עבר — יש לעדכן את התאריך בעריכת ההצעה לפני האישור. | lib/quotes.js:352 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תודה שהתפנית — המשרה כבר אוישה לאירוע הזה. נשמח לפנות אלייך בפעם הבאה. | lib/shiftInvite.js:37 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תודה שעדכנת. נשמח לפנות אלייך בפעם הבאה. | lib/shiftInvite.js:35 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תודה! רשמנו שאת מגיעה. פרטים סופיים יישלחו בקרוב. | lib/shiftInvite.js:34 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תווית סטטוס-פרויקט לא ממופה: "{label}" | lib/projects.js:39 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תקופת הדוח אינה תקינה — לא ניתן להרכיב את קובץ השכר. | lib/salaryReport.js:137 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תשובת ההפקה חסרה את נתוני-האימות של הדוח — הדוח לא הורכב. | lib/salaryReport.js:379 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| תשובת הפקת דוח-השכר אינה תקינה — חסרה רשימת השורות. | lib/salaryReport.js:242 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
|  וטרם הגיע | lib/projectLogistics.js:300 | ① | קצר — כותרת/תווית סבירה |
|  יחידות עדיין בדרך | lib/projectLogistics.js:488 | ① | קצר — כותרת/תווית סבירה |
|  נשלח זימון מחדש לדיילת אחת. | lib/projectCard.js:269 | ① | תווית/כותרת/פעולה קצרה |
|  פריטים טרם הוזמנו | lib/projectLogistics.js:471 | ① | קצר — כותרת/תווית סבירה |
| (נפתחת אחרי האירוע) | lib/projectCard.js:74 | ① | קצר — כותרת/תווית סבירה |
| [חתימת_שולח] | lib/emailTemplates.js:19 (×3) | ① | קצר — כותרת/תווית סבירה |
| [טלפון_מנהלת_פרויקט] | lib/emailTemplates.js:45 (×7) | ① | קצר — כותרת/תווית סבירה |
| [כתובת_אירוע_מלאה] | lib/emailTemplates.js:51 (×4) | ① | קצר — כותרת/תווית סבירה |
| [לינק_אישור_משמרת] | lib/emailTemplates.js:22 (×3) | ① | קצר — כותרת/תווית סבירה |
| [לינק_לשאלון_שביעות_רצון] | lib/emailTemplates.js:33 (×3) | ① | תווית/כותרת/פעולה קצרה |
| [עיר_אירוע] | lib/emailTemplates.js:28 (×2) | ① | קצר — כותרת/תווית סבירה |
| [שם_איש_קשר] | lib/emailTemplates.js:18 (×8) | ① | קצר — כותרת/תווית סבירה |
| [שם_דיילת] | lib/emailTemplates.js:22 (×17) | ① | קצר — כותרת/תווית סבירה |
| [שם_מנהלת_פרויקט] | lib/emailTemplates.js:52 (×4) | ① | קצר — כותרת/תווית סבירה |
| [שעת_התחלה] | lib/emailTemplates.js:26 (×5) | ① | קצר — כותרת/תווית סבירה |
| [שעת_סיום] | lib/emailTemplates.js:27 (×4) | ① | קצר — כותרת/תווית סבירה |
| [תאריך_אירוע] | lib/emailTemplates.js:19 (×11) | ① | קצר — כותרת/תווית סבירה |
| [תעריף_שעתי_דיילת] | lib/emailTemplates.js:29 (×2) | ① | קצר — כותרת/תווית סבירה |
| {confirmed} שובצו | lib/projects.js:252 | ① | קצר — כותרת/תווית סבירה |
| {count} הצעות ממתינות להחלטה | lib/quotes.js:968 | ① | תווית/כותרת/פעולה קצרה |
| {count} הצעות פתוחות | lib/customers.js:180 | ① | קצר — כותרת/תווית סבירה |
| {count} מהם בוטלו | lib/customerProjects.js:70 | ① | קצר — כותרת/תווית סבירה |
| {diff} מעבר לנדרש | lib/assignmentActions.js:87 | ① | קצר — כותרת/תווית סבירה |
| {hostessCount} דיילות על המסך | lib/projectTeam.js:172 | ① | תווית/כותרת/פעולה קצרה |
| {min} ומעלה | lib/paramsRegistry.js:129 | ① | קצר — כותרת/תווית סבירה |
| {pending} זימונים ממתינים למענה | lib/projects.js:146 | ① | תווית/כותרת/פעולה קצרה |
| {rowCount} שורות במסד | lib/projectTeam.js:171 | ① | תווית/כותרת/פעולה קצרה |
| {text} שעות | lib/projectCard.js:177 | ① | קצר — כותרת/תווית סבירה |
| {total} דיילות שובצו | lib/closingDraft.js:167 | ① | קצר — כותרת/תווית סבירה |
| {whenPart}, לא חויב | lib/dashboard.js:179 | ① | קצר — כותרת/תווית סבירה |
| ⚠ חסרה דיילת אחת | lib/projectTeam.js:84 | ① | קצר — כותרת/תווית סבירה |
| ⚠ חסרות {missing} דיילות | lib/projectTeam.js:84 | ① | תווית/כותרת/פעולה קצרה |
| ✓ אין דיילות | lib/projects.js:250 | ① | קצר — כותרת/תווית סבירה |
| ✓ הושלם | lib/projects.js:285 | ① | קצר — כותרת/תווית סבירה |
| ✓ מאויש | lib/projectCard.js:200 (×3) | ① | קצר — כותרת/תווית סבירה |
| ✓ מוכן | lib/projectCard.js:213 (×3) | ① | קצר — כותרת/תווית סבירה |
| ✓ מוכן לאירוע | lib/projects.js:115 | ① | קצר — כותרת/תווית סבירה |
| ✓ נסגר בהצלחה | lib/projects.js:97 | ① | קצר — כותרת/תווית סבירה |
| 3 חודשים | lib/listWindow.js:16 | ① | קצר — כותרת/תווית סבירה |
| אוגוסט | lib/dashboard.js:365 (×2) | ① | קצר — כותרת/תווית סבירה |
| אוקטובר | lib/dashboard.js:367 (×2) | ① | קצר — כותרת/תווית סבירה |
| אושרה | lib/quotes.js:330 | ① | קצר — כותרת/תווית סבירה |
| אושרה סופית | components/StatusTag.jsx:45 (×2) | ① | קצר — כותרת/תווית סבירה |
| אזל מהמלאי | lib/catalog.js:15 | ① | קצר — כותרת/תווית סבירה |
| אחד מהם בוטל | lib/customerProjects.js:70 | ① | קצר — כותרת/תווית סבירה |
| אחוז | lib/projectFinance.js:262 | ① | קצר — כותרת/תווית סבירה |
| אחוז מע"מ | lib/paramsRegistry.js:281 | ① | קצר — כותרת/תווית סבירה |
| אחוז פיצוי בביטול חלקי | lib/paramsRegistry.js:372 | ① | תווית/כותרת/פעולה קצרה |
| אחוז_מעמ | lib/paramsRegistry.js:280 (×2) | ① | קצר — כותרת/תווית סבירה |
| אחוז_פיצוי_ביטול_חלקי | lib/paramsRegistry.js:371 (×2) | ① | תווית/כותרת/פעולה קצרה |
| אחראית המשמרת | lib/shiftEmails.js:145 | ① | קצר — כותרת/תווית סבירה |
| אחראית משמרת | lib/projectTeam.js:24 | ① | קצר — כותרת/תווית סבירה |
| אחרי {hours} שעות | lib/projectTeam.js:93 | ① | קצר — כותרת/תווית סבירה |
| אחת מעבר לנדרש | lib/assignmentActions.js:87 | ① | קצר — כותרת/תווית סבירה |
| איחור דיילות | lib/feedback.js:72 | ① | קצר — כותרת/תווית סבירה |
| איחור_בינוני | lib/smartMatch.js:46 | ① | קצר — כותרת/תווית סבירה |
| איחור_הרבה | lib/smartMatch.js:47 | ① | קצר — כותרת/תווית סבירה |
| איחור_קצת | lib/smartMatch.js:45 | ① | קצר — כותרת/תווית סבירה |
| איחרה — בינוני | lib/projectClosing.js:35 | ① | קצר — כותרת/תווית סבירה |
| איחרה — קל | lib/projectClosing.js:33 | ① | קצר — כותרת/תווית סבירה |
| איחרה — רב | lib/projectClosing.js:40 | ① | קצר — כותרת/תווית סבירה |
| איכות תגים | lib/feedback.js:74 | ① | קצר — כותרת/תווית סבירה |
| איכות תגים וציוד | lib/feedback.js:82 | ① | קצר — כותרת/תווית סבירה |
| אישור ההצעה | lib/quotes.js:36 | ① | קצר — כותרת/תווית סבירה |
| אישור סופי שיבוץ | lib/paramsRegistry.js:509 | ① | קצר — כותרת/תווית סבירה |
| אישור_מראש | lib/smartMatch.js:51 | ① | קצר — כותרת/תווית סבירה |
| אישרה זמינות | components/StatusTag.jsx:46 (×2) | ① | קצר — כותרת/תווית סבירה |
| אף אחת לא שובצה | lib/projects.js:259 | ① | קצר — כותרת/תווית סבירה |
| אפור | lib/catalog.js:25 | ① | קצר — כותרת/תווית סבירה |
| אפריל | lib/dashboard.js:361 (×2) | ① | קצר — כותרת/תווית סבירה |
| אשר סופית ושלח פרטים | lib/assignmentActions.js:168 | ① | קצר — כותרת/תווית סבירה |
| אתמול | lib/customerProjects.js:125 | ① | קצר — כותרת/תווית סבירה |
| אתר | lib/catalog.js:7 | ① | קצר — כותרת/תווית סבירה |
| ב-{expiredOnText} | lib/projectTeam.js:46 | ① | קצר — כותרת/תווית סבירה |
| בוטל {dateLabel} | lib/customerProjects.js:138 | ① | קצר — כותרת/תווית סבירה |
| בטל סימון אחראית משמרת | lib/assignmentActions.js:184 | ① | תווית/כותרת/פעולה קצרה |
| ביטול לקוח | lib/projects.js:73 | ① | קצר — כותרת/תווית סבירה |
| ביטול משמרת | lib/paramsRegistry.js:516 | ① | קצר — כותרת/תווית סבירה |
| ביטול פנימי | lib/projects.js:74 | ① | קצר — כותרת/תווית סבירה |
| ביטלה אחרי אישור | components/StatusTag.jsx:50 (×2) | ① | קצר — כותרת/תווית סבירה |
| ביטלה_אחרי_אישור | lib/smartMatch.js:48 | ① | קצר — כותרת/תווית סבירה |
| בין {min} ל-{max} | lib/paramsRegistry.js:126 | ① | קצר — כותרת/תווית סבירה |
| בינוני | lib/projectFinance.js:194 (×2) | ① | קצר — כותרת/תווית סבירה |
| בינונית | lib/smartMatch.js:393 | ① | קצר — כותרת/תווית סבירה |
| בלי {token} {consequence} | lib/emailTemplates.js:161 | ① | תווית/כותרת/פעולה קצרה |
| בעוד {days} ימים | lib/customerProjects.js:126 (×3) | ① | קצר — כותרת/תווית סבירה |
| בעוד יומיים | lib/hostesses.js:407 (×2) | ① | קצר — כותרת/תווית סבירה |
| בפועל | lib/salaryReport.js:72 | ① | קצר — כותרת/תווית סבירה |
| בקרה והתראות | lib/paramsRegistry.js:23 | ① | קצר — כותרת/תווית סבירה |
| גולפוסט_מרחק_קמ | lib/paramsRegistry.js:626 (×2) | ① | קצר — כותרת/תווית סבירה |
| דו"חות | App.jsx:218 (×3) | ① | קצר — כותרת/תווית סבירה |
| דוח שכר | lib/paramsRegistry.js:551 | ① | קצר — כותרת/תווית סבירה |
| דוח-סיכום | lib/projectClosing.js:197 | ① | קצר — כותרת/תווית סבירה |
| דורש הרשאת כספים | lib/customerProjects.js:213 | ① | קצר — כותרת/תווית סבירה |
| דיילת אחת על המסך | lib/projectTeam.js:172 | ① | קצר — כותרת/תווית סבירה |
| דיילת אחת שובצה | lib/closingDraft.js:167 | ① | קצר — כותרת/תווית סבירה |
| דצמבר | lib/dashboard.js:369 (×2) | ① | קצר — כותרת/תווית סבירה |
| האחרון ב- | lib/projectLogistics.js:152 | ① | קצר — כותרת/תווית סבירה |
| האחרון היום,  | lib/projectLogistics.js:151 | ① | קצר — כותרת/תווית סבירה |
| האירוע בוטל | lib/paramsRegistry.js:565 | ① | קצר — כותרת/תווית סבירה |
| האירוע בוטל אצל הלקוח | lib/quotes.js:56 | ① | תווית/כותרת/פעולה קצרה |
| האירוע חוצה חצות | lib/projectCard.js:30 | ① | קצר — כותרת/תווית סבירה |
| האירוע כבר אויש במלואו | lib/assignmentActions.js:112 | ① | תווית/כותרת/פעולה קצרה |
| הבריזה | lib/smartMatch.js:49 | ① | קצר — כותרת/תווית סבירה |
| הגיעה | lib/projectClosing.js:32 (×2) | ① | קצר — כותרת/תווית סבירה |
| ההנחה הידנית | lib/pricing.js:112 | ① | קצר — כותרת/תווית סבירה |
| ההצעה כבר טופלה (סטטוס  | lib/quotes.js:339 | ① | תווית/כותרת/פעולה קצרה |
| ההצעה נדחתה. | lib/quotes.js:42 | ① | קצר — כותרת/תווית סבירה |
| הוגדל מ- | lib/projectLogistics.js:208 | ① | קצר — כותרת/תווית סבירה |
| הוזמן | lib/projectLogistics.js:22 | ① | קצר — כותרת/תווית סבירה |
| הוחזרה לטיפול | lib/quotes.js:332 | ① | קצר — כותרת/תווית סבירה |
| הופק בתאריך | lib/salaryReport.js:334 | ① | קצר — כותרת/תווית סבירה |
| הוקטן מ- | lib/projectLogistics.js:208 | ① | קצר — כותרת/תווית סבירה |
| הושלם | lib/hostesses.js:43 | ① | קצר — כותרת/תווית סבירה |
| הזולה ביותר | lib/sortAngles.js:23 | ① | קצר — כותרת/תווית סבירה |
| הזימון הפתוח היחיד פג | lib/projectTeam.js:88 | ① | תווית/כותרת/פעולה קצרה |
| החודש | lib/listWindow.js:15 | ① | קצר — כותרת/תווית סבירה |
| הלוגיסטיקה טרם מוכנה | lib/projects.js:128 | ① | קצר — כותרת/תווית סבירה |
| הלקוח לא השיב | lib/projectCard.js:114 | ① | קצר — כותרת/תווית סבירה |
| המייל לא יפנה אל איש-הקשר בשמו | lib/emailTemplates.js:90 (×2) | ① | תווית/כותרת/פעולה קצרה |
| המייל לא יפנה אל הדיילת בשמה | lib/emailTemplates.js:93 (×7) | ① | תווית/כותרת/פעולה קצרה |
| המייל לא נשלח. יש לנסות שוב. | lib/email.js:227 | ① | תווית/כותרת/פעולה קצרה |
| המיקום עודכן | lib/projectCard.js:262 | ① | קצר — כותרת/תווית סבירה |
| הנחת הלקוח | lib/pricing.js:111 | ① | קצר — כותרת/תווית סבירה |
| הסקר מולא | lib/projectCard.js:116 | ① | קצר — כותרת/תווית סבירה |
| הסתיים אתמול | lib/dashboard.js:178 | ① | קצר — כותרת/תווית סבירה |
| הסתיים ולא חויב | lib/dashboard.js:267 | ① | קצר — כותרת/תווית סבירה |
| הסתיים לפני {daysPassed} ימים | lib/dashboard.js:178 | ① | תווית/כותרת/פעולה קצרה |
| הפרויקט בוטל | lib/projects.js:102 | ① | קצר — כותרת/תווית סבירה |
| הצעה #{q.quote_id} | lib/dashboard.js:240 | ① | קצר — כותרת/תווית סבירה |
| הצעה אחת ממתינה להחלטה | lib/quotes.js:968 | ① | תווית/כותרת/פעולה קצרה |
| הצעה נעולה: | lib/quotes.js:364 | ① | קצר — כותרת/תווית סבירה |
| הצעה פתוחה אחת | lib/customers.js:180 | ① | קצר — כותרת/תווית סבירה |
| הצעה שפגה בקרוב | lib/dashboard.js:269 | ① | קצר — כותרת/תווית סבירה |
| הצעות אינן פגות אוטומטית | lib/quotes.js:565 | ① | תווית/כותרת/פעולה קצרה |
| הצעות ממתינות | lib/dashboard.js:106 | ① | קצר — כותרת/תווית סבירה |
| הצעת מחיר | lib/paramsRegistry.js:537 | ① | קצר — כותרת/תווית סבירה |
| הצעת מחיר מ-REG-IN | lib/quotes.js:887 | ① | קצר — כותרת/תווית סבירה |
| הקישור אינו בתוקף | lib/feedback.js:32 | ① | קצר — כותרת/תווית סבירה |
| הקישור בתוקף עוד {hoursLeft} שעות | lib/shiftInvite.js:106 | ① | תווית/כותרת/פעולה קצרה |
| הקישור בתוקף עוד שעה | lib/shiftInvite.js:104 | ① | קצר — כותרת/תווית סבירה |
| הקישור בתוקף עוד שעתיים | lib/shiftInvite.js:105 | ① | תווית/כותרת/פעולה קצרה |
| הקישור בתוקף פחות משעה | lib/shiftInvite.js:103 | ① | תווית/כותרת/פעולה קצרה |
| השנה | lib/listWindow.js:17 | ① | קצר — כותרת/תווית סבירה |
| השעות עודכנו | lib/projectCard.js:263 | ① | קצר — כותרת/תווית סבירה |
| התאמת דיילות | lib/paramsRegistry.js:26 | ① | קצר — כותרת/תווית סבירה |
| התאריך עודכן | lib/projectCard.js:261 | ① | קצר — כותרת/תווית סבירה |
| התקיים אתמול | lib/projects.js:185 | ① | קצר — כותרת/תווית סבירה |
| התקיים לפני {days} ימים | lib/projects.js:69 | ① | תווית/כותרת/פעולה קצרה |
| התקיים לפני יומיים | lib/projects.js:186 | ① | קצר — כותרת/תווית סבירה |
| זימון אחד ממתין למענה | lib/projectTeam.js:101 (×3) | ① | תווית/כותרת/פעולה קצרה |
| זימון משמרת | lib/paramsRegistry.js:502 | ① | קצר — כותרת/תווית סבירה |
| זימונים | lib/paramsRegistry.js:707 | ① | קצר — כותרת/תווית סבירה |
| חברה ממשלתית | lib/customers.js:18 | ① | קצר — כותרת/תווית סבירה |
| חברה פרטית | lib/customers.js:17 | ① | קצר — כותרת/תווית סבירה |
| חברת הפקה | lib/customers.js:19 | ① | קצר — כותרת/תווית סבירה |
| חובה למלא תאריך אירוע. | lib/projectCard.js:23 | ① | תווית/כותרת/פעולה קצרה |
| חודשים | lib/paramsRegistry.js:652 (×2) | ① | קצר — כותרת/תווית סבירה |
| חולה | lib/smartMatch.js:50 | ① | קצר — כותרת/תווית סבירה |
| חומר שיווקי מ-REG-IN | lib/marketing.js:19 | ① | קצר — כותרת/תווית סבירה |
| חוסר זמינות/לו"ז | lib/quotes.js:53 | ① | קצר — כותרת/תווית סבירה |
| חיובי | lib/paramsRegistry.js:129 | ① | קצר — כותרת/תווית סבירה |
| חלון_חישוב_חודשים | lib/paramsRegistry.js:647 (×2) | ① | קצר — כותרת/תווית סבירה |
| חלון_חישוב_מורחב_חודשים | lib/paramsRegistry.js:659 (×2) | ① | תווית/כותרת/פעולה קצרה |
| חמישי | lib/dates.js:97 | ① | קצר — כותרת/תווית סבירה |
| חסר סימון איכות ל-{name}. | lib/closingDraft.js:242 | ① | תווית/כותרת/פעולה קצרה |
| חסר סימון נוכחות ל-{name}. | lib/closingDraft.js:238 | ① | תווית/כותרת/פעולה קצרה |
| חסר פרמטר מערכת | lib/quotes.js:574 | ① | קצר — כותרת/תווית סבירה |
| חסרה דיילת אחת שאושרה סופית | lib/projectCard.js:203 | ① | תווית/כותרת/פעולה קצרה |
| חסרות {gap} דיילות שאושרו סופית | lib/projectCard.js:203 | ① | תווית/כותרת/פעולה קצרה |
| חסרים פרמטרי מערכת | lib/quotes.js:574 | ① | קצר — כותרת/תווית סבירה |
| חשבונית מס | lib/paramsRegistry.js:544 | ① | קצר — כותרת/תווית סבירה |
| טוב | lib/projectFinance.js:198 | ① | קצר — כותרת/תווית סבירה |
| טווח חישוב | lib/paramsRegistry.js:648 | ① | קצר — כותרת/תווית סבירה |
| טווח חישוב מורחב | lib/paramsRegistry.js:660 | ① | קצר — כותרת/תווית סבירה |
| טורקיז | lib/catalog.js:25 | ① | קצר — כותרת/תווית סבירה |
| טכני | lib/paramsRegistry.js:27 | ① | קצר — כותרת/תווית סבירה |
| טלפון: {phone} | lib/quotes.js:881 | ① | קצר — כותרת/תווית סבירה |
| יולי | lib/dashboard.js:364 (×2) | ① | קצר — כותרת/תווית סבירה |
| יום {weekday} | lib/shiftInvite.js:128 | ① | קצר — כותרת/תווית סבירה |
| יום אחד ללא מענה,  | lib/projectTeam.js:44 | ① | קצר — כותרת/תווית סבירה |
| יוני | lib/dashboard.js:363 (×2) | ① | קצר — כותרת/תווית סבירה |
| יוצא היום —  | lib/projectLogistics.js:510 | ① | קצר — כותרת/תווית סבירה |
| יחידה אחת עדיין בדרך | lib/projectLogistics.js:487 | ① | קצר — כותרת/תווית סבירה |
| יחס אורחים לדיילת | lib/paramsRegistry.js:293 | ① | קצר — כותרת/תווית סבירה |
| יחס_אורחים_לדיילת | lib/paramsRegistry.js:292 (×2) | ① | קצר — כותרת/תווית סבירה |
| ימי אזהרה לפני אירוע | lib/paramsRegistry.js:383 | ① | קצר — כותרת/תווית סבירה |
| ימי אזהרה לפני שהצעה פגה | lib/paramsRegistry.js:359 | ① | תווית/כותרת/פעולה קצרה |
| ימי עסקים | lib/paramsRegistry.js:456 | ① | קצר — כותרת/תווית סבירה |
| ימי_אזהרה_קדם_אירוע | lib/paramsRegistry.js:382 (×2) | ① | קצר — כותרת/תווית סבירה |
| ינואר | lib/dashboard.js:358 (×2) | ① | קצר — כותרת/תווית סבירה |
| יש לבחור לקוח. | lib/quotes.js:255 | ① | קצר — כותרת/תווית סבירה |
| יש לבחור סוג לקוח. | lib/customers.js:233 | ① | קצר — כותרת/תווית סבירה |
| יש להוסיף את השורה | lib/quotes.js:575 | ① | קצר — כותרת/תווית סבירה |
| יש להוסיף את השורות | lib/quotes.js:575 | ① | קצר — כותרת/תווית סבירה |
| יש להוסיף לפחות פריט אחד להצעה. | lib/quotes.js:296 | ① | תווית/כותרת/פעולה קצרה |
| יש להזין כתובת אימייל תקינה. | lib/customers.js:245 | ① | תווית/כותרת/פעולה קצרה |
| יש להזין מיקום. | lib/quotes.js:257 | ① | קצר — כותרת/תווית סבירה |
| יש להזין מספר טלפון תקין. | lib/customers.js:242 | ① | תווית/כותרת/פעולה קצרה |
| יש להזין מספר טלפון. | lib/customers.js:240 | ① | קצר — כותרת/תווית סבירה |
| יש להזין שם אירוע. | lib/quotes.js:256 | ① | קצר — כותרת/תווית סבירה |
| יש להזין שם איש קשר. | lib/customers.js:235 | ① | קצר — כותרת/תווית סבירה |
| יש להזין שם לאיש הקשר. | lib/customers.js:278 | ① | תווית/כותרת/פעולה קצרה |
| יש להזין שם לקוח (לפחות 2 תווים). | lib/customers.js:229 | ① | תווית/כותרת/פעולה קצרה |
| יש להזין שעת התחלה. | lib/quotes.js:258 | ① | קצר — כותרת/תווית סבירה |
| יש להזין שעת סיום. | lib/quotes.js:259 | ① | קצר — כותרת/תווית סבירה |
| יש להזין תאריך אירוע. | lib/quotes.js:264 | ① | תווית/כותרת/פעולה קצרה |
| יש להזין תעריף שעתי. | lib/hostesses.js:150 | ① | קצר — כותרת/תווית סבירה |
| יש להעלות קובץ תחילה | lib/marketing.js:71 | ① | קצר — כותרת/תווית סבירה |
| כוח עליון מזכה ב-0% תמיד. | lib/projectCancellation.js:89 | ① | תווית/כותרת/פעולה קצרה |
| כולן | lib/projects.js:142 | ① | קצר — כותרת/תווית סבירה |
| כחול | lib/catalog.js:25 | ① | קצר — כותרת/תווית סבירה |
| כל {total} הפריטים ← | lib/dashboard.js:330 | ① | קצר — כותרת/תווית סבירה |
| כמות הדיילות | lib/closingDraft.js:289 | ① | קצר — כותרת/תווית סבירה |
| כמות זו מופיעה כבר במדרגה אחרת | lib/pricing.js:242 | ① | תווית/כותרת/פעולה קצרה |
| כתובת המייל של איש הקשר אינה תקינה | lib/email.js:196 | ① | תווית/כותרת/פעולה קצרה |
| לא בוצע שינוי. | lib/projectCard.js:264 | ① | קצר — כותרת/תווית סבירה |
| לא הגיעה — הבריזה | lib/projectClosing.js:54 | ① | קצר — כותרת/תווית סבירה |
| לא הגיעה — חולה | lib/projectClosing.js:42 | ① | קצר — כותרת/תווית סבירה |
| לא התקבלו {context} מהשרת. | lib/projectFinance.js:71 | ① | תווית/כותרת/פעולה קצרה |
| לא זמין בתפקידך | lib/dashboard.js:68 | ① | קצר — כותרת/תווית סבירה |
| לא יכול להיות קטן מ"מכמות" | lib/pricing.js:250 | ① | תווית/כותרת/פעולה קצרה |
| לא לשלוח שוב | lib/closingDraft.js:149 (×3) | ① | קצר — כותרת/תווית סבירה |
| לא מוגדרת עלות למוצר | lib/quotes.js:375 | ① | קצר — כותרת/תווית סבירה |
| לא נבחרו נמענים לשליחה | lib/marketing.js:73 | ① | תווית/כותרת/פעולה קצרה |
| לא ענתה ל-{threshold} האחרונים | lib/hostesses.js:555 | ① | תווית/כותרת/פעולה קצרה |
| לא שובצו | lib/projects.js:252 | ① | קצר — כותרת/תווית סבירה |
| לא_לשלוח | lib/projectClosing.js:68 (×2) | ① | קצר — כותרת/תווית סבירה |
| לא_ענתה_ל_N | lib/paramsRegistry.js:703 (×2) | ① | קצר — כותרת/תווית סבירה |
| לאשר את {subjectLabel} בכל זאת? | lib/assignmentActions.js:75 | ① | תווית/כותרת/פעולה קצרה |
| לאשר בכל זאת? | lib/assignmentActions.js:75 | ① | קצר — כותרת/תווית סבירה |
| לבן | lib/catalog.js:25 | ① | קצר — כותרת/תווית סבירה |
| ללא | lib/catalog.js:26 | ① | קצר — כותרת/תווית סבירה |
| לפני {-days} ימים | lib/customerProjects.js:127 | ① | קצר — כותרת/תווית סבירה |
| לפני {Math.abs(days)} ימים | lib/hostesses.js:408 | ① | תווית/כותרת/פעולה קצרה |
| לצפייה בחומר השיווקי: {publicUrl} | lib/marketing.js:54 | ① | תווית/כותרת/פעולה קצרה |
| מ-{count} הצעות שאושרו | lib/quotes.js:961 | ① | תווית/כותרת/פעולה קצרה |
| מאושרת | lib/quotes.js:22 | ① | קצר — כותרת/תווית סבירה |
| מאי | lib/dashboard.js:362 (×2) | ① | קצר — כותרת/תווית סבירה |
| מהצעה אחת שאושרה | lib/quotes.js:961 | ① | קצר — כותרת/תווית סבירה |
| מוכן | lib/projectLogistics.js:23 | ① | קצר — כותרת/תווית סבירה |
| מוכן לביצוע | lib/projects.js:11 (×2) | ① | קצר — כותרת/תווית סבירה |
| מונה | lib/projectFinance.js:250 | ① | קצר — כותרת/תווית סבירה |
| מוצרים | lib/catalog.js:9 | ① | קצר — כותרת/תווית סבירה |
| מושבתת | lib/hostesses.js:39 | ① | קצר — כותרת/תווית סבירה |
| מחיר | lib/quotes.js:52 | ① | קצר — כותרת/תווית סבירה |
| מחיר גדול מאפס | lib/pricing.js:255 | ① | קצר — כותרת/תווית סבירה |
| מחר | lib/customerProjects.js:124 (×3) | ① | קצר — כותרת/תווית סבירה |
| מטר | lib/catalog.js:21 | ① | קצר — כותרת/תווית סבירה |
| מייל משרד רואי החשבון | lib/paramsRegistry.js:725 | ① | תווית/כותרת/פעולה קצרה |
| מייל: {email} | lib/quotes.js:883 | ① | קצר — כותרת/תווית סבירה |
| מינימום תשובות להצגת ציון | lib/paramsRegistry.js:672 | ① | תווית/כותרת/פעולה קצרה |
| מינימום_תשובות_להצגת_ציון | lib/paramsRegistry.js:671 (×2) | ① | תווית/כותרת/פעולה קצרה |
| מכנה | lib/projectFinance.js:251 | ① | קצר — כותרת/תווית סבירה |
| ממתין לסגירה | lib/projects.js:12 (×2) | ① | קצר — כותרת/תווית סבירה |
| ממתינה למענה | components/StatusTag.jsx:47 (×2) | ① | קצר — כותרת/תווית סבירה |
| מנהלת הפרויקט | lib/shiftEmails.js:145 | ① | קצר — כותרת/תווית סבירה |
| מנכ"ל | lib/constants.js:5 | ① | קצר — כותרת/תווית סבירה |
| מספר | lib/paramsRegistry.js:101 (×3) | ① | קצר — כותרת/תווית סבירה |
| מספר שלם | lib/paramsRegistry.js:102 | ① | קצר — כותרת/תווית סבירה |
| מספר שלם גדול מאפס | lib/pricing.js:240 | ① | קצר — כותרת/תווית סבירה |
| מפרויקט אחד שהסתיים | lib/customerProjects.js:225 | ① | קצר — כותרת/תווית סבירה |
| מצוין | lib/projectFinance.js:198 | ① | קצר — כותרת/תווית סבירה |
| מקצועיות הדיילות | lib/feedback.js:80 | ① | קצר — כותרת/תווית סבירה |
| מרחק שבו ציון-הקרבה מגיע ל-0 | lib/paramsRegistry.js:627 | ① | תווית/כותרת/פעולה קצרה |
| מרחק שמעבר לו הדיילת נפסלת | lib/paramsRegistry.js:615 | ① | תווית/כותרת/פעולה קצרה |
| מרכיב האמינות פעיל | lib/paramsRegistry.js:715 | ① | קצר — כותרת/תווית סבירה |
| מרכיב_אמינות_פעיל | lib/paramsRegistry.js:714 (×2) | ① | קצר — כותרת/תווית סבירה |
| מרץ | lib/dashboard.js:360 (×2) | ① | קצר — כותרת/תווית סבירה |
| משוב לקוח | lib/paramsRegistry.js:558 | ① | קצר — כותרת/תווית סבירה |
| משמרת | lib/catalog.js:21 | ① | קצר — כותרת/תווית סבירה |
| משקולת אמינות | lib/paramsRegistry.js:592 | ① | קצר — כותרת/תווית סבירה |
| משקולת היענות | lib/paramsRegistry.js:581 | ① | קצר — כותרת/תווית סבירה |
| משקולת קרבה | lib/paramsRegistry.js:603 | ① | קצר — כותרת/תווית סבירה |
| משקולת_אמינות | lib/paramsRegistry.js:591 (×2) | ① | קצר — כותרת/תווית סבירה |
| משקולת_היענות | lib/paramsRegistry.js:580 (×2) | ① | קצר — כותרת/תווית סבירה |
| משקולת_קרבה | lib/paramsRegistry.js:602 (×2) | ① | קצר — כותרת/תווית סבירה |
| משקל ממוצע-החברה | lib/paramsRegistry.js:638 | ① | קצר — כותרת/תווית סבירה |
| מתוכם 1 שלא נשלח בו אף זימון | lib/projects.js:338 | ① | תווית/כותרת/פעולה קצרה |
| מתוכנן | lib/salaryReport.js:73 | ① | קצר — כותרת/תווית סבירה |
| מתחת לעלות ({cost} ₪) | lib/pricing.js:257 | ① | תווית/כותרת/פעולה קצרה |
| נבחר מתחרה | lib/quotes.js:54 | ① | קצר — כותרת/תווית סבירה |
| נדחתה | lib/quotes.js:23 (×2) | ① | קצר — כותרת/תווית סבירה |
| נובמבר | lib/dashboard.js:368 (×2) | ① | קצר — כותרת/תווית סבירה |
| ניהול ותקשורת | lib/feedback.js:83 | ① | קצר — כותרת/תווית סבירה |
| ניהול לקוי | lib/feedback.js:75 | ① | קצר — כותרת/תווית סבירה |
| נפתחה בטעות | lib/quotes.js:58 (×2) | ① | קצר — כותרת/תווית סבירה |
| נתוני הכספים | lib/projectFinance.js:69 | ① | קצר — כותרת/תווית סבירה |
| סיבות ל"לא לשלוח שוב" | lib/projectClosing.js:192 | ① | תווית/כותרת/פעולה קצרה |
| סיבת "לא לשלוח שוב" אחת | lib/projectClosing.js:192 | ① | תווית/כותרת/פעולה קצרה |
| סימון-איכות אחד | lib/projectClosing.js:189 | ① | קצר — כותרת/תווית סבירה |
| סימון-נוכחות אחד | lib/projectClosing.js:186 | ① | קצר — כותרת/תווית סבירה |
| סימוני-איכות | lib/projectClosing.js:189 | ① | קצר — כותרת/תווית סבירה |
| סימוני-נוכחות | lib/projectClosing.js:186 | ① | קצר — כותרת/תווית סבירה |
| סירבה | lib/hostesses.js:33 | ① | קצר — כותרת/תווית סבירה |
| סכום ההנחות חורג מ-100%. | lib/quotes.js:292 | ① | תווית/כותרת/פעולה קצרה |
| סכום נסיעות למשמרת | lib/paramsRegistry.js:316 | ① | קצר — כותרת/תווית סבירה |
| סכום_נסיעות_למשמרת | lib/hostesses.js:19 (×2) | ① | קצר — כותרת/תווית סבירה |
| סמן כאחראית משמרת | lib/assignmentActions.js:184 | ① | קצר — כותרת/תווית סבירה |
| סמן: אישרה זמינות | lib/assignmentActions.js:150 | ① | קצר — כותרת/תווית סבירה |
| סמן: ביטלה אחרי אישור | lib/assignmentActions.js:199 | ① | תווית/כותרת/פעולה קצרה |
| סמן: סירבה | lib/assignmentActions.js:151 | ① | קצר — כותרת/תווית סבירה |
| סמן: סירבה (חזרה בה) | lib/assignmentActions.js:174 | ① | קצר — כותרת/תווית סבירה |
| סף אזהרת לוגיסטיקה | lib/paramsRegistry.js:453 | ① | קצר — כותרת/תווית סבירה |
| סף אירוע דחוף | lib/paramsRegistry.js:489 | ① | קצר — כותרת/תווית סבירה |
| סף זימון לפני אירוע | lib/paramsRegistry.js:466 | ① | קצר — כותרת/תווית סבירה |
| סף לקוח רדום | lib/paramsRegistry.js:394 | ① | קצר — כותרת/תווית סבירה |
| סף שביעות רצון | lib/paramsRegistry.js:442 | ① | קצר — כותרת/תווית סבירה |
| סף_לוגיסטיקה_ימי_עסקים | lib/paramsRegistry.js:452 (×2) | ① | תווית/כותרת/פעולה קצרה |
| סף_לקוח_רדום_ימים | lib/customerProjects.js:18 (×2) | ① | קצר — כותרת/תווית סבירה |
| סף_שביעות_רצון | lib/customers.js:40 (×2) | ① | קצר — כותרת/תווית סבירה |
| ספטמבר | lib/dashboard.js:366 (×2) | ① | קצר — כותרת/תווית סבירה |
| עבדה אצל הלקוח הזה | lib/sortAngles.js:15 | ① | קצר — כותרת/תווית סבירה |
| עד {decimals} ספרות אחרי הנקודה | lib/paramsRegistry.js:138 | ① | תווית/כותרת/פעולה קצרה |
| עד {max} | lib/paramsRegistry.js:130 | ① | קצר — כותרת/תווית סבירה |
| עד ספרה אחת אחרי הנקודה | lib/paramsRegistry.js:136 | ① | תווית/כותרת/פעולה קצרה |
| עד שתי ספרות אחרי הנקודה | lib/paramsRegistry.js:137 | ① | תווית/כותרת/פעולה קצרה |
| על סמך {count} משובים | lib/dashboard.js:116 | ① | תווית/כותרת/פעולה קצרה |
| על סמך משוב אחד | lib/dashboard.js:116 | ① | קצר — כותרת/תווית סבירה |
| עמותה | lib/customers.js:20 | ① | קצר — כותרת/תווית סבירה |
| עמידה בזמנים | lib/feedback.js:81 | ① | קצר — כותרת/תווית סבירה |
| עריכת ההצעה | lib/quotes.js:35 | ① | קצר — כותרת/תווית סבירה |
| ערך חוקי: {head} | lib/paramsRegistry.js:147 | ① | קצר — כותרת/תווית סבירה |
| ערך חוקי: כן או לא בלבד | lib/paramsRegistry.js:105 | ① | תווית/כותרת/פעולה קצרה |
| ערך חוקי: כתובת מייל תקינה | lib/paramsRegistry.js:108 | ① | תווית/כותרת/פעולה קצרה |
| ערך חוקי: קישור המתחיל ב-https:// | lib/paramsRegistry.js:110 | ① | תווית/כותרת/פעולה קצרה |
| פברואר | lib/dashboard.js:359 (×2) | ① | קצר — כותרת/תווית סבירה |
| פגה בעוד {daysLeft} ימים | lib/dashboard.js:249 | ① | תווית/כותרת/פעולה קצרה |
| פגה היום | lib/dashboard.js:247 | ① | קצר — כותרת/תווית סבירה |
| פגה מחר | lib/dashboard.js:248 | ① | קצר — כותרת/תווית סבירה |
| פיצוי-ביטול | lib/salaryReport.js:66 | ① | קצר — כותרת/תווית סבירה |
| פעילה | lib/hostesses.js:39 | ① | קצר — כותרת/תווית סבירה |
| פרויקט אחד קיים ואינו מוצג כרגע. | lib/projects.js:354 | ① | תווית/כותרת/פעולה קצרה |
| פרויקט הסתיים | lib/projects.js:15 (×2) | ① | קצר — כותרת/תווית סבירה |
| פרויקטים פעילים | lib/dashboard.js:85 | ① | קצר — כותרת/תווית סבירה |
| פרטי האירוע השתנו | lib/paramsRegistry.js:572 | ① | קצר — כותרת/תווית סבירה |
| פריט אחד ← | lib/dashboard.js:330 | ① | קצר — כותרת/תווית סבירה |
| פריט אחד טרם הוזמן | lib/projectLogistics.js:469 | ① | קצר — כותרת/תווית סבירה |
| פריט אחד טרם מוכן | lib/projects.js:347 | ① | קצר — כותרת/תווית סבירה |
| פתח זימון חדש | lib/assignmentActions.js:205 | ① | קצר — כותרת/תווית סבירה |
| ק"מ | lib/paramsRegistry.js:618 (×2) | ① | קצר — כותרת/תווית סבירה |
| קבוע_ריסון_m | lib/paramsRegistry.js:637 (×2) | ① | קצר — כותרת/תווית סבירה |
| קוד הפקה | lib/salaryReport.js:333 | ① | קצר — כותרת/תווית סבירה |
| קישור חדש כבר לא ייפתח | lib/assignmentActions.js:109 | ① | תווית/כותרת/פעולה קצרה |
| קרבה | lib/sortAngles.js:14 | ① | קצר — כותרת/תווית סבירה |
| קרובה | lib/smartMatch.js:393 | ① | קצר — כותרת/תווית סבירה |
| ראשון | lib/dates.js:97 | ① | קצר — כותרת/תווית סבירה |
| רביעי | lib/dates.js:97 | ① | קצר — כותרת/תווית סבירה |
| רווח חודשי משוער | lib/dashboard.js:97 | ① | קצר — כותרת/תווית סבירה |
| רחוקה | lib/smartMatch.js:393 | ① | קצר — כותרת/תווית סבירה |
| רצף אי-מענה | lib/paramsRegistry.js:704 | ① | קצר — כותרת/תווית סבירה |
| רשימת-הסגירה אינה מעודכנת | lib/closingDraft.js:274 | ① | תווית/כותרת/פעולה קצרה |
| שבועות | lib/paramsRegistry.js:696 | ① | קצר — כותרת/תווית סבירה |
| שביעות רצון (90 יום) | lib/dashboard.js:90 | ① | קצר — כותרת/תווית סבירה |
| שבת | lib/dates.js:97 (×2) | ① | קצר — כותרת/תווית סבירה |
| שוחררה | lib/hostesses.js:35 | ① | קצר — כותרת/תווית סבירה |
| שורה אחת במסד | lib/projectTeam.js:171 | ① | קצר — כותרת/תווית סבירה |
| שחור | lib/catalog.js:25 | ① | קצר — כותרת/תווית סבירה |
| שחרור ממשמרת | lib/paramsRegistry.js:530 | ① | קצר — כותרת/תווית סבירה |
| שחרר — המשרה אוישה | lib/assignmentActions.js:175 | ① | קצר — כותרת/תווית סבירה |
| שחרר מהאירוע (צמצום תקנים) | lib/assignmentActions.js:193 | ① | תווית/כותרת/פעולה קצרה |
| שיבוץ וזימונים | lib/paramsRegistry.js:24 | ① | קצר — כותרת/תווית סבירה |
| שינית את תאריך האירוע. | lib/projectCard.js:231 | ① | תווית/כותרת/פעולה קצרה |
| שיעור בונוס הוגנות לשבוע | lib/paramsRegistry.js:683 | ① | תווית/כותרת/פעולה קצרה |
| שיעור המע"מ | lib/pricing.js:113 | ① | קצר — כותרת/תווית סבירה |
| שיעור_בונוס_הוגנות_לשבוע | lib/paramsRegistry.js:682 (×2) | ① | תווית/כותרת/פעולה קצרה |
| שישי | lib/dates.js:97 (×2) | ① | קצר — כותרת/תווית סבירה |
| שכר מינימום שעתי | lib/paramsRegistry.js:328 | ① | קצר — כותרת/תווית סבירה |
| שלח את הקישור שוב | lib/assignmentActions.js:146 | ① | קצר — כותרת/תווית סבירה |
| שלישי | lib/dates.js:97 | ① | קצר — כותרת/תווית סבירה |
| שני | lib/dates.js:97 | ① | קצר — כותרת/תווית סבירה |
| שני הזימונים הפתוחים פגו | lib/projectTeam.js:90 | ① | תווית/כותרת/פעולה קצרה |
| שעה אחת | lib/projectCard.js:173 | ① | קצר — כותרת/תווית סבירה |
| שעה בפועל אחת שגויה | lib/projectClosing.js:195 | ① | קצר — כותרת/תווית סבירה |
| שעות בפועל שגויות | lib/projectClosing.js:195 | ① | קצר — כותרת/תווית סבירה |
| שעות לתזכורת לדיילת | lib/paramsRegistry.js:427 | ① | קצר — כותרת/תווית סבירה |
| שעות פיצוי חלקי מהאירוע | lib/paramsRegistry.js:405 | ① | תווית/כותרת/פעולה קצרה |
| שעות פיצוי מלא מהאירוע | lib/paramsRegistry.js:416 | ① | תווית/כותרת/פעולה קצרה |
| שעות_אירוע_דחוף | lib/hostesses.js:25 (×2) | ① | קצר — כותרת/תווית סבירה |
| שעות_סף_זימון_לפני_אירוע | lib/hostesses.js:24 (×2) | ① | תווית/כותרת/פעולה קצרה |
| שעות_תוקף_זימון | lib/hostesses.js:23 (×2) | ① | קצר — כותרת/תווית סבירה |
| שעות_תזכורת_לדיילת | lib/paramsRegistry.js:426 | ① | קצר — כותרת/תווית סבירה |
| שער_מרחק_קמ | lib/paramsRegistry.js:614 (×2) | ① | קצר — כותרת/תווית סבירה |
| שעתיים | lib/projectCard.js:174 | ① | קצר — כותרת/תווית סבירה |
| שתיהן | lib/projects.js:142 | ① | קצר — כותרת/תווית סבירה |
| תבניות מייל | lib/paramsRegistry.js:25 | ① | קצר — כותרת/תווית סבירה |
| תבנית המייל אינה מוגדרת במערכת | lib/email.js:197 | ① | תווית/כותרת/פעולה קצרה |
| תבנית_אישור_סופי_שיבוץ | lib/paramsRegistry.js:508 (×2) | ① | תווית/כותרת/פעולה קצרה |
| תבנית_זימון_משמרת | lib/paramsRegistry.js:501 (×2) | ① | קצר — כותרת/תווית סבירה |
| תבנית_מייל_אירוע_בוטל | lib/paramsRegistry.js:564 (×2) | ① | תווית/כותרת/פעולה קצרה |
| תבנית_מייל_ביטול_משמרת | lib/paramsRegistry.js:515 (×2) | ① | תווית/כותרת/פעולה קצרה |
| תבנית_מייל_הצעת_מחיר | lib/paramsRegistry.js:536 (×2) | ① | קצר — כותרת/תווית סבירה |
| תבנית_מייל_משוב_לקוח | lib/paramsRegistry.js:557 (×2) | ① | קצר — כותרת/תווית סבירה |
| תבנית_מייל_פרטי_האירוע_השתנו | lib/paramsRegistry.js:571 (×2) | ① | תווית/כותרת/פעולה קצרה |
| תבנית_מייל_שחרור_משמרת | lib/paramsRegistry.js:529 (×2) | ① | תווית/כותרת/פעולה קצרה |
| תבנית_תזכורת_משמרת | lib/paramsRegistry.js:522 (×2) | ① | קצר — כותרת/תווית סבירה |
| תודה שלקחתם רגע לספר לנו איך היה! | lib/feedback.js:30 | ① | תווית/כותרת/פעולה קצרה |
| תווית מצב-פריט לא ממופה: "{label}" | lib/projectLogistics.js:39 | ① | תווית/כותרת/פעולה קצרה |
| תוקף הצעת מחיר | lib/paramsRegistry.js:304 | ① | קצר — כותרת/תווית סבירה |
| תוקף זימון-משמרת | lib/paramsRegistry.js:477 | ① | קצר — כותרת/תווית סבירה |
| תזכורת משמרת | lib/paramsRegistry.js:523 | ① | קצר — כותרת/תווית סבירה |
| תמחור ותזמון | lib/paramsRegistry.js:22 | ① | קצר — כותרת/תווית סבירה |
| תנאי תשלום | lib/paramsRegistry.js:348 | ① | קצר — כותרת/תווית סבירה |
| תנאי_תשלום_ימים | lib/paramsRegistry.js:347 | ① | קצר — כותרת/תווית סבירה |
| תענה הכי מהר | lib/sortAngles.js:17 | ① | קצר — כותרת/תווית סבירה |
| תפקוד דיילות | lib/feedback.js:73 | ① | קצר — כותרת/תווית סבירה |
| תקציב לקוח | lib/quotes.js:55 | ① | קצר — כותרת/תווית סבירה |
| תקרת שבועות להוגנות | lib/paramsRegistry.js:693 | ① | קצר — כותרת/תווית סבירה |
| תקרת_שבועות_הוגנות | lib/paramsRegistry.js:692 (×2) | ① | קצר — כותרת/תווית סבירה |
| תשובות | lib/paramsRegistry.js:675 | ① | קצר — כותרת/תווית סבירה |
| תשובת ההפקה חסרה מזהה-דוח. | lib/salaryReport.js:355 | ① | תווית/כותרת/פעולה קצרה |

#### components (משותף) — 54 מחרוזות ייחודיות

| מחרוזת | קובץ:שורה | סיווג | הערה |
|---|---|---|---|
| אין לך הרשאה לצפות במסך זה. | components/layout/ProtectedRoute.jsx:60 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| אין ערוץ SMS במערכת | components/ProfileSettingsPage.jsx:348 | ② | מצב-ריק |
| ההתראות עצמן יישלחו כשמנוע ההתראות יעלה (מודול 10) | components/ProfileSettingsPage.jsx:333 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| המסך הזה עדיין בבנייה. | components/UnderConstruction.jsx:8 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הסיסמה החדשה ואימות הסיסמה אינם תואמים. | components/ProfileSettingsPage.jsx:182 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הסיסמה החדשה חייבת להכיל לפחות {MIN_PASSWORD_LENGTH} תווים. | components/ProfileSettingsPage.jsx:178 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| טרם התרשמת | components/RatingStars.jsx:103 | ② | מצב-ריק |
| לא הצלחנו לטעון את ההרשאות שלך. זו כנראה תקלה זמנית. | components/layout/ProtectedRoute.jsx:44 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| לא ניתן לטעון את הנתונים. | components/PermissionAwareEmpty.jsx:34 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| משהו השתבש | components/ErrorBoundary.jsx:34 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| עדכון הסיסמה נכשל. נסה שוב. | components/ProfileSettingsPage.jsx:204 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| קרתה שגיאה בלתי צפויה במסך. רענון הדף בדרך כלל פותר את זה. אם זה חוזר — פנה למנכ״ל. | components/ErrorBoundary.jsx:35 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| useConfirm חייב להיקרא בתוך <ConfirmProvider> | components/ConfirmDialog.jsx:30 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| useToast חייב להיקרא בתוך <ToastProvider> | components/ToastProvider.jsx:19 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| (עוד {hiddenCount} מחוץ לחלון) | components/ListWindow.jsx:32 | ① | תווית/כותרת/פעולה קצרה |
| {from}–{to} מתוך {total} | components/ListWindow.jsx:50 | ① | תווית/כותרת/פעולה קצרה |
| {rating} מתוך {STAR_COUNT} | components/RatingStars.jsx:103 | ① | תווית/כותרת/פעולה קצרה |
| {star} מתוך {STAR_COUNT} | components/RatingStars.jsx:51 | ① | תווית/כותרת/פעולה קצרה |
| אבטחה | components/ProfileSettingsPage.jsx:21 | ① | קצר — כותרת/תווית סבירה |
| אימות סיסמה חדשה | components/ProfileSettingsPage.jsx:237 | ① | קצר — כותרת/תווית סבירה |
| אישור פעולה | components/ConfirmDialog.jsx:35 | ① | קצר — כותרת/תווית סבירה |
| הבא | components/ListWindow.jsx:74 | ① | קצר — כותרת/תווית סבירה |
| הגדרות פרופיל | components/ProfileSettingsPage.jsx:31 (×2) | ① | קצר — כותרת/תווית סבירה |
| הדף לא נמצא | components/NotFound.jsx:14 | ① | קצר — כותרת/תווית סבירה |
| הכתובת שביקשתם אינה קיימת במערכת. | components/NotFound.jsx:15 | ① | תווית/כותרת/פעולה קצרה |
| הסיסמה הנוכחית שגויה. | components/ProfileSettingsPage.jsx:196 | ① | תווית/כותרת/פעולה קצרה |
| הסיסמה עודכנה בהצלחה. | components/ProfileSettingsPage.jsx:208 | ① | תווית/כותרת/פעולה קצרה |
| העדפות והתראות | components/ProfileSettingsPage.jsx:22 | ① | קצר — כותרת/תווית סבירה |
| הפרטים עודכנו בהצלחה. | components/ProfileSettingsPage.jsx:100 | ① | תווית/כותרת/פעולה קצרה |
| הקודם | components/ListWindow.jsx:58 | ① | קצר — כותרת/תווית סבירה |
| הרחבת התפריט | components/layout/Sidebar.jsx:67 (×2) | ① | קצר — כותרת/תווית סבירה |
| התנתקות | components/layout/MainLayout.jsx:43 | ① | קצר — כותרת/תווית סבירה |
| חזרה לדף הבית | components/NotFound.jsx:16 | ① | קצר — כותרת/תווית סבירה |
| חזרה למסך הבית | components/layout/ProtectedRoute.jsx:68 | ① | קצר — כותרת/תווית סבירה |
| חיפוש... | components/layout/Topbar.jsx:42 | ① | קצר — כותרת/תווית סבירה |
| טוען... | components/LoadingOrError.jsx:120 (×4) | ① | קצר — כותרת/תווית סבירה |
| יש להתחבר כדי לצפות במסך זה. | components/layout/ProtectedRoute.jsx:29 | ① | תווית/כותרת/פעולה קצרה |
| כיווץ התפריט | components/layout/Sidebar.jsx:67 (×2) | ① | קצר — כותרת/תווית סבירה |
| לשינוי תפקיד פנה למנכ"ל. | components/ProfileSettingsPage.jsx:113 | ① | תווית/כותרת/פעולה קצרה |
| מייל על פרויקטים חדשים | components/ProfileSettingsPage.jsx:332 | ① | תווית/כותרת/פעולה קצרה |
| מעדכן... | components/ProfileSettingsPage.jsx:254 | ① | קצר — כותרת/תווית סבירה |
| מציג: | components/ListWindow.jsx:20 | ① | קצר — כותרת/תווית סבירה |
| סגור | components/ui/dialog.jsx:60 | ① | פועל-פעולה על כפתור |
| סגירת ההתראה | components/ToastProvider.jsx:113 | ① | קצר — כותרת/תווית סבירה |
| סיסמה חדשה | components/ProfileSettingsPage.jsx:227 | ① | קצר — כותרת/תווית סבירה |
| סיסמה נוכחית | components/ProfileSettingsPage.jsx:217 | ① | קצר — כותרת/תווית סבירה |
| עדכון סיסמה | components/ProfileSettingsPage.jsx:254 | ① | קצר — כותרת/תווית סבירה |
| עמוד {page}/{pageCount} | components/ListWindow.jsx:68 | ① | תווית/כותרת/פעולה קצרה |
| פרטים אישיים | components/ProfileSettingsPage.jsx:20 | ① | קצר — כותרת/תווית סבירה |
| צא מהמערכת | components/layout/Topbar.jsx:81 | ① | קצר — כותרת/תווית סבירה |
| רענן את הדף | components/ErrorBoundary.jsx:38 | ① | קצר — כותרת/תווית סבירה |
| שגיאת רינדור לא-מטופלת: | components/ErrorBoundary.jsx:18 | ① | תווית/כותרת/פעולה קצרה |
| שמירת ההעדפה נכשלה. | components/ProfileSettingsPage.jsx:311 | ① | קצר — כותרת/תווית סבירה |
| SMS על שיבוץ ברגע האחרון | components/ProfileSettingsPage.jsx:347 | ① | תווית/כותרת/פעולה קצרה |

#### api (משותף) — 5 מחרוזות ייחודיות

| מחרוזת | קובץ:שורה | סיווג | הערה |
|---|---|---|---|
| הפרמטר {quoted} חסר בהגדרות המערכת. | api/params.js:63 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| הפרמטרים {quoted} חסרים בהגדרות המערכת. | api/params.js:64 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| שגיאה בטעינת היסטוריית השליחות. | api/email.js:91 (×2) | ② | הודעת-שגיאה (פתיחה אופיינית) |
| שגיאה בטעינת תבנית המייל. | api/email.js:71 | ② | הודעת-שגיאה (פתיחה אופיינית) |
| תבנית המייל "{name}" חסרה בהגדרות. | api/email.js:72 | ① | תווית/כותרת/פעולה קצרה |

#### contexts (משותף) — 2 מחרוזות ייחודיות

| מחרוזת | קובץ:שורה | סיווג | הערה |
|---|---|---|---|
| החשבון שאיתו התחברת אינו מורשה במערכת. פנה למנכ"ל. | contexts/AuthContext.jsx:114 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |
| useAuth חייב להיקרא בתוך <AuthProvider>. ודא שהרכיב עטוף ב-<AuthProvider> בעץ הרכיבים (ראה App.jsx). | contexts/AuthContext.jsx:228 | ② | משפט מלא — הודעת-שגיאה/אישור/מצב-ריק/באנר |

## §3 · קטגוריה ④ בהרחבה — 12 המחרוזות, כל אחת עם האבחנה

### קבוצה א׳ · משפחת "ממוין:" — 5 נוסחים לאותו רעיון, ואף אחד לא ברור לבד

**זו בדיוק המחרוזת שישי הצביע עליה מהמסך החי** — רק שבקוד היא כתובה **"ממוין"**, לא "ממוצע"
כפי שהוא ציטט. **וזו לא טעות-הקלדה שלו — זו ההוכחה החיה לממצא:** "ממוין: חסרים תחילה, ובתוכם
לפי קרבת האירוע" הוא משפט שקוצר עד כדי כך שקריאה מהירה על המסך (אפור בהיר, 12 פיקסל, בקצה שורת
המסננים) מפרשת "ממוין" בתור "ממוצע" — שתי מילים שאינן דומות בכתיב אך *מתפקדות* אותו דבר בעין
שסורקת מהר: מילת-פתיחה טכנית שאחריה נתון-מה. המשפט לא אומר **מה** "חסרים" (חסרים דיילות?
מסמכים? זה נכון רק כי המסך כבר נמצא בהקשר-דיילות/פרויקטים — אך שום מילה בכיתוב עצמו לא אומרת
זאת), ולא אומר למה הסדר הזה נבחר.

| # | הנוסח | קובץ | מודול |
|---|---|---|---|
| 1 | `ממוין: חסרים תחילה, ובתוכם לפי קרבת האירוע` | `modules/06_projects/ProjectsPage.jsx:79` (`SORT_LINE`) | 6 · פרויקטים |
| 2 | `ממוין: חסרים תחילה, לפי קרבת האירוע` | `modules/04_hostesses/OverviewTab.jsx:236` | 4 · דיילות |
| 3 | `ממוין: לפי קרבת האירוע` | `lib/projectLogistics.js:293` (`QUEUE_SORT_LINE`, מוצג ב-`LogisticsPage.jsx:404`) | 5 · לוגיסטיקה |
| 4 | `ממוין: מה שרחוק ביותר ממוכן — תחילה` | `lib/projectLogistics.js:65` (`SORT_LINE`, מוצג ב-ChecklistDialog) | 5 · לוגיסטיקה |
| 5 | `ממוין: בפנים · פתוח · יצא` | `lib/projectTeam.js:18` (`SORT_LINE`, מוצג ב-`TeamTab.jsx:339`) | 6 · פרויקטים |

**כולן מוצגות באותה צורה מדויקת** — `<span className="text-xs text-slate-400">…</span>` בקצה
שורת-הסינון — **וזה עיצוב מכוון וטוב**: הערת-קוד ב-`ProjectsPage.jsx:77-78` מסבירה שהיא קיימת
"כי סדר לא-מוסבר הוא חידה", וכותרות-העמודות **במכוון** לא לחיצות. **הבעיה אינה במיקום — היא
בניסוח**: הכיתוב מיישם היטב את הכוונה "תני למשתמשת לדעת שיש סדר", ונכשל בכוונה השנייה "ותני לה
להבין אותו בלי לחשוב".

🔑 **וזה לא ממצא חדש — הוא כבר תועד ופתוח:** `docs/specs/module_05_logistics/screens-approved.md`
סעיף ⬜ **"§⑧ פריט 8"** (שורות 404–408) קובע במפורש: **"שלושה נוסחים חיים בבית, ואף אחד אינו
מתאים"** — ומצטט את נוסחים 2, 1 ו-4 מהטבלה למעלה מילה-במילה. **הסעיף עדיין מסומן ⬜ (פתוח) —
כלומר ההכרעה לאחד את הניסוח טרם נפלה, והקוד החי נכון ל-07/09/2026 עדיין נושא את כל השלושה + עוד
שניים (5-ו-3, שהתיעוד הקיים לא מזכיר כלל — כלומר המספר האמיתי גדול מ-3, לא 3).**
**הממצא כאן אינו "מצאתי בעיה חדשה" — הוא "הבעיה שכבר נרשמה עדיין חיה, ועם ישי בעצמו כמוכיח שהיא
נושכת בפועל".**

### קבוצה ב׳ · שני ממצאים חדשים, לא מתועדים בשום `screens-approved.md`

**② `המדד: מאושרות ≥ נדרשות`** — `modules/06_projects/TeamTab.jsx:211`, שורת-משנה מתחת לאריח
"אושרו סופית". כדי להבין את המשפט צריך להסתכל **על אריח אחר לגמרי** ("כמות נדרשת", המספר בתוך
אריח שכן בשורה) ולהחזיק אותו בזיכרון מול הסימן `≥`. במקום להראות את שני המספרים יחד (כמו
שהאריח השכן, "חסרות", כבר עושה בקוד-צבע), המשפט מצפה מהקוראת לחשב בעצמה אם התנאי מתקיים.

**② `מההצעה — לא מספר סופי`** — `modules/06_projects/ProjectCardPage.jsx:517`, שורת-משנה מתחת
לשדה "אורחים מוערכים". השדה עצמו כבר אומר "מוערכים" (כלומר לא סופי) — אז המשפט חוזר על אותה
עובדה במילים אחרות, ובמקום להוסיף מידע הוא **פותח שאלה בלי לענות עליה**: אם זה "לא מספר סופי",
**איפה** המספר הסופי? (התשובה — מסך-הסגירה של מודול 6 — לא מופיעה כאן ולא ברמז-קישור).

### קבוצה ג׳ · שתי הערות-"note" תחת `<Section>` בכרטיס-הדיילת, שאחת מהן חושפת מינוח-פנימי

`HostessViewCard.jsx` בונה כותרות-סקציה עם `note` קטן מתחתן (`<Section title="…" note="…">`).
שלוש הסקציות בכרטיס נושאות note; שתיים מהן נופלות ל-④:

- **④ `לפי לקוח, לא רק ספירה שטוחה`** (שורה 323, מתחת לכותרת "עבדה אצל") — נכון ומוסיף מידע
  אמיתי (הצ'יפים למטה מקובצים לפי-לקוח, לא רק "עבדה N פעמים בסך-הכול"), **אבל** מי שעדיין לא
  ראה את הצ'יפים למטה לא יודע למה "ספירה שטוחה" הייתה הברירה הפשוטה יותר, וה"לא רק" מרמז
  שיש עוד ממד שהמשפט לא מפרט.
- **④ `שכבה 2 של Smart Match`** (שורה 345, מתחת לכותרת "העדפת-לקוחות") — **זה הממצא החזק
  בקבוצה הזו.** "שכבה 2" הוא מונח-ארכיטקטורה פנימי, מוגדר ומתועד היטב **במסמכי-המחקר של מודול 4**
  (`module4_smart_match_research.md` §"שכבה 2 · נעיצה", ו-`processes-approved.md:167,343`) —
  אבל שם הוא כלי-עבודה בין ישי לבין מי שבונה את האלגוריתם, לא מילה שנועדה למסך. **מנהלת-הגיוס
  שפותחת את כרטיס הדיילת לא קראה את מסמכי ה-Discovery של מודול 4 ואין לה שום דרך לדעת מה
  ההבדל בין "שכבה 1" ל"שכבה 2"** — הפאנל שמתחתיה ריק ומוסבר כ"עדיין לא זמין, נכתב ע"י מודול 6",
  כך שהמשתמשת רואה כותרת + מונח-קוד + פאנל ריק, בלי חוט מקשר.
- (רכה יותר, לשלמות) **`מה שהיא כרגע מחויבת אליו`** (שורה 311, מתחת ל"שיבוצים קרובים") — לא
  שגויה, אבל לא מוסיפה מידע מעבר לכותרת עצמה ("שיבוצים קרובים" כבר אומר את זה).

### קבוצה ד׳ · הערה שהמיקום שלה נכון (מאחורי מתג!) אבל התוכן עדיין ④

**`כאן מוצג הסטטוס הגולמי כפי שנרשם — לא התווית הנגזרת שלמעלה`** — `lib/projectTeam.js:22`
(`RAW_STATUS_NOTE`), מוצג ב-`TeamTab.jsx:480` **רק כש"היסטוריית הסבבים" פתוחה** (`{open && …}`).
זה **כן** ממלא את הכלל "③ יושבת מאחורי מתג" — אבל התוכן שמאחורי המתג מסביר **הבחנה טכנית
בין שני שדות במסד** ("גולמי" מול "נגזר") ולא עוזר למשתמשת להחליט או לפעול. זה למעשה ההוכחה
שהכלל "③ מקומה מאחורי מתג" הוא **תנאי הכרחי ולא מספיק**: מיקום נכון בלי ניסוח-בגובה-משתמשת
עדיין נופל ל-④, רק עם דלת סגורה יותר.

### מה משותף לכל 12 — ומה זה כן מלמד

בכל 12 המקרים המחרוזת **יושבת כשורת-משנה אפורה קטנה מתחת למשהו אחר** (אריח, כותרת-סקציה,
שדה-טופס) — אף אחת מהן אינה עומדת לבד במרכז המסך. **זה בדיוק מה שהופך אותן לקשות לתפוס בסקירה
רגילה:** הן קטנות מספיק כדי שהעין תדלג עליהן כ"עיצוב", אבל כשקוראים אותן בפועל הן טוענות
משהו (כלל, יחס, מקור-נתון) בלי לתת מספיק הקשר להבין את הטענה. **תיקון-על אחד שמכסה את רוב 12
המקרים:** subline שמנוסח כמשפט-עובדה-שלם ("X מגיע מ-Y ולא משתנה") ולא כרמז-מקוצר ("X — לא Y").

## §4 · כפילויות ומועמדות-איחוד

**294 מחרוזות ייחודיות מופיעות ב-2+ קבצים שונים** (694 מופעים "עודפים" מעל ה-2,311 הייחודיות).
מתוכן **17 הן טוקני-תבנית-מייל** (`[שם_דיילת]`, `[שם_פרויקט]` וכו') — כפילות **רצויה**, זו בדיוק
המטרה של מילון-משתנים משותף. **94 הן משפטים/הודעות אמיתיים באורך 15+ תווים** שחוזרים מילה-במילה
בכמה קבצים — ברובם המכריע זו כפילות **טובה**: הודעת-שגיאה משותפת שנכתבה פעם אחת ומיובאת בכמה
מסכים (עקרון-ה-SSOT של כלל-ברזל 14), לא "אותו דבר נכתב פעמיים בטעות".

### מה כן שווה בדיקה — לא זהה-בדיוק, אלא כמעט-זהה בניסוח שונה

**① משפחת "ממוין:"** — ר' §3 קבוצה א׳ למעלה. זו דוגמת-הדגל: **חמישה** ניסוחים לרעיון-מיון אחד,
כשלושה מהם (2/1/4 בטבלת §3) מכוונים לאותה עובדה-בדיוק (מיין דיילות-חסרות לפני מלאות, ואז לפי
קרבת-אירוע) בשלושה ניסוחים שונים בין מודול 4, 6 ולוגיסטיקה.

**② "שמירה נכשלה. נסה שוב." מול "שמירה נכשלה. נסו שוב."** — אותה הודעה בדיוק, בשתי צורות-פנייה:
`נסה` (זכר-יחיד, 3 קבצים: `ProfileSettingsPage.jsx` · `UsersManagementPage.jsx` ·
`CustomerFormDialog.jsx`) מול `נסו` (רבים, `ProductFormDialog.jsx:156`). אף אחת משתי הצורות
אינה `נסי` (נקבה-יחיד) — למרות שחמש המשתמשות הן נשים. פירוט מלא בסעיף 5.

**③ "אין נתונים עדיין"** — 4 קבצים (`StatTile.jsx` · `customerProjects.js` ·
`CustomersFilterSheet.jsx` · `CustomersPage.jsx`), ולצידה `"עדיין לא עבדה אצל אף לקוח"` /
`"אין לה כרגע שיבוץ פעיל"` / `"עדיין לא נוצר פרויקט ללקוח הזה"` — אותו רעיון ("אין X עדיין")
מנוסח מחדש בכל מסך בלי תבנית משותפת. לא שגוי, אבל מועמד טבעי ל-helper אחד
(`emptyStateText(entity)`) אילו נדרש עוד מסך כזה.

**④ שגיאות "טעינה נכשלה" עם דפוס-ניסוח זהה, בלי פונקציה משותפת** — הדפוס `"<פעולה> נכשל/ה.
<המשך אופציונלי>"` חוזר עשרות פעמים (`שמירת X נכשלה` · `טעינת X נכשלה` · `העלאת X נכשלה` ·
`מחיקת X נכשלה`) בכל מודול, לרוב עם `call:toError`/`call:toWriteError` משלו. זה **כן** SSOT
פר-מודול (`toError` ב-`api.js` של כל מודול), אבל אין helper *חוצה-מודולים* שמייצר את המשפט
מתבנית אחת — מי שמוסיף מודול חדש מקליד את התבנית מחדש בעצמו.

**מסקנה מעשית:** הכפילות הבעייתית האמיתית בקוד הזה היא לא "אותה מחרוזת נכתבה פעמיים" (זה תקין
ברובו) — היא **"אותו רעיון נכתב בכמה ניסוחים שונים"**, ומשפחת "ממוין:" היא הדוגמה החדה ביותר
כי היא גם משפחת-④ במקביל.

## §5 · חוסר-עקביות בפנייה ובמונחים

### 5א · לשון-פנייה (זכר/נקבה/רבים) — כבר תועד כחוב `🚧 מ12`, והמדידה כאן מכמתת אותו

חמש המשתמשות הן נשים. `docs/PROJECT_MASTER.md` שורה 717 כבר רושם חוב **`🚧 מ12 ← מ6`**:
*"לשון-הפנייה במחרוזות המשותפות היא זכר, וכל חמש המשתמשות נשים"* — עם דוגמה מדויקת:
‏`LoadingOrError.jsx` מקודד-קשיח `נסה שוב` (זכר) כברירת-מחדל, ומודול 6 העביר לזה `retryLabel`
פר-קורא כדי לא לשנות התנהגות משותפת בלי הכרעת-ישי. **הספירה המכנית כאן היא הראיה הכמותית
לחוב הזה** (לא ממצא חדש — אימות של קיים):

| ניסוח | זכר | נקבה | רבים |
|---|---|---|---|
| "נסה/י/ו שוב" | 25 (`נסה שוב`) | 29 (`נסי שוב`) | — |
| "בחר/י" | 41 | 4 | — |
| "פתח/י" (כפתור/כותרת) | 111\* | 2 | — |
| "שלח/י" | 153\* | 1 | — |
| "עדכן/י" | 28\* | 1 | — |
| "סמן/י" | 37\* | 1 | — |

\* מספרים אלה כוללים גם מופעי-שם-עצם/מקור (למשל "פתיחה", "לשלוח") שאותו חיפוש-מחרוזת גס תפס —
הכיוון (רוב מוחץ לזכר) ברור בכל זאת, ומדגים בדיוק את מה ש-`🚧 מ12` מתאר: המחרוזות
**שכל מודול כותב בעצמו** (מודול 5, 6, 8 בפרט) נוטות ברובן לנקבה (`S-28` — מודול 6 בלשון-נקבה
במפורש), בעוד **המחרוזות המשותפות** (`LoadingOrError`, הודעות-auth, `ProfileSettingsPage`) עדיין
בזכר — **בדיוק החלוקה שה-🚧 מתאר**, לא תמונה שונה.

### 5ב · תפקיד-CEO: "מנכ״ל" (זכר) מול "מנכ״לית" (נקבה) — ⚠️ ממצא חדש, לא מכוסה ב-`🚧 מ12`

**זה שונה מ-5א: לא לשון-פנייה (איך המערכת מדברת *אל* המשתמשת) אלא שם-תפקיד (איך המערכת קוראת
*למישהי*) — ולכן `🚧 מ12`, שמדבר במפורש על "לשון-פנייה", אינו מכסה אותו.**

**47 מופעים של "מנכ״ל" (זכר) מול 4 בלבד של "מנכ״לית" (נקבה)** ב-`src/` שאינו-בדיקות. שם-התפקיד
במסד עצמו הוא **הקבוע** `CEO_ROLE_NAME = 'מנכ"ל'` (`src/lib/constants.js:5`) — כלומר הזכר יושב
בשורש נתוני-המערכת (טבלת `roles`), לא רק בניסוח מקומי. **וזה מגיע ישירות למסך, לא רק לקוד:**

- `role.role_name` **מוצג כפי-שהוא** בעמודת-התפקיד של מסך "ניהול משתמשים"
  (`UsersManagementPage.jsx:304,355`) ובכותרת-העמודה של מסך "מטריצת הרשאות"
  (`PermissionsMatrixPage.jsx:140`) — כלומר **בשני מסכים** התפקיד של המנכ"לית **בפועל** אישה
  מוצג "מנכ"ל".
- וארבע הודעות-מערכת אמיתיות (לא הערות-קוד) קוראות למי שהיא פונה אליה — **גם אם היא עצמה
  המנכ"לית** — בלשון זכר: *"פנה למנכ"ל לצורך בירור"* (`MainLayout.jsx:39`, כשחשבון לא-פעיל),
  *"פנה למנכ"ל"* (`AuthContext.jsx:114`, שגיאת-אימות), *"לשינוי תפקיד פנה למנכ"ל"*
  (`ProfileSettingsPage.jsx:113`), *"פנה למנכ"ל"* (`ErrorBoundary.jsx:36`, מסך-קריסה כללי).
- 4 מופעי-הנקבה הקיימים (`customers.js:29`, `hostesses.js:21,48`) הם **הערות-קוד**, לא טקסט על
  המסך — כלומר **אפס** מהטקסט שהמשתמשת בפועל רואה כתוב בלשון-נקבה לתפקיד הזה.

**המבחן שישי יכול לבצע בעצמו:** לפתוח את "ניהול הרשאות" (Permissions Matrix) ולהסתכל על כותרת
העמודה של עצמו/המנכ"לית בפועל — היא כתובה "מנכ"ל".

### 5ג · "פרויקט" מול "אירוע" — לא מבולבל, אבל לא מוסבר, ובמסך אחד ממש מתנגש בעצמו

**הצלבה מול `docs/PROJECT_MASTER.md`/כרטיסי-מודול 6 מראה שיש כלל עקבי מאחורי זה:** "אירוע" =
העובדות של האירוע-עצמו (תאריך, מיקום, אורחים), "פרויקט" = רשומת-הניהול שעוטפת אותו (סטטוס,
צוות, סגירה) — הבחנה שקיימת גם בהערת-קוד ב-`ProjectsPage.jsx:12-13`. **הבעיה: ההבחנה הזו קיימת
רק בראש המפתחת/ישי, ואף מילה במסך לא מסבירה אותה למי שרואה את שני השמות מתחלפים.**

**והדוגמה החדה ביותר — אותו מסך, אותה כותרת עמודה:** `<h1>` של מסך מודול 6 עצמו הוא **"פרויקטים"**
(`ProjectsPage.jsx:353`, תואם את שם-הפריט בסרגל-הצד), אבל **עמודת-הזיהוי הראשית של אותה טבלה
בדיוק כותרתה `<Th>אירוע</Th>`** (שורה 492), ושלוש שורות-מסנן/מצב-ריק על אותו מסך אומרות
"אירועים שחסרות בהם דיילות" (363) · "אירועים שהלוגיסטיקה בהם טרם מוכנה" (376) · "אין אירוע
בעבודה כרגע" (481) — **בעוד הכותרת שמעליהן קוראת לרשימה "פרויקטים".** מי שנכנס למסך בפעם
הראשונה (או שופט בכנס ששואל "זה דוח-פרויקטים או דוח-אירועים?") רואה סתירה מילולית בתוך אותו
מסך, לא רק שוני-סגנון בין מסכים.

*(בדקתי ולא מצאתי: "דיילת"/"עובדת" כזוג-מתחרה — "עובדת" מופיע ב-`src/` **רק** כפועל ("עובדת
עכשיו") או כחלק מ"עובדה/עובדתי", ואף פעם לא כשם-עצם לדיילת. ההשערה של ישי כאן **לא אוששה**.)*

### 5ד · "חברה" — נושאת שתי משמעויות שונות באותו קוד (הערה קלה, לא ממצא-דגל)

**43 מופעי "חברה"**, ורובם (מודולים 2/3/8) מתכוונים ל**חברת-הלקוח** ("שם חברה", "חברה זו כבר
רשומה"). **אבל** במודול 4 (`SmartMatchPage.jsx:871`, `paramsRegistry.js:639`) "ממוצע-החברה"
מתכוון ל**REG-IN עצמה** (הממוצע הכללי על-פני כל הדיילות, כמרכך-סטטיסטי לדיילת עם מעט היסטוריה).
שתי המשמעויות רחוקות מספיק (מסכים שונים לגמרי) שהסיכוי לבלבול אמיתי נמוך — מסומן כאן להשלמת-
התמונה, לא כתביעה לתיקון.

## §6 · הפקודות שהרצתי (לשחזור)

1. `find src -type f \( -name "*.jsx" -o -name "*.js" \) ! -name "*.test.*"` → 146 קבצי-מקור.
2. סקריפט-Node עצמאי (`@babel/parser` + `@babel/traverse`, מותקנים כבר בריפו) שעובר על כל קובץ,
   בונה AST, ומחלץ כל `StringLiteral`/טקסט-JSX/`TemplateLiteral` שמכיל תו בטווח `֐-׿`;
   מרכיב-מחדש בלוקים שמפוצלים סביב `{ביטוי}` (ב-JSX וב-Template Literals) לפני שהוא רושם ערך,
   כדי לא לפצל משפט שלם לשברים.
3. דה-דופליקציה לפי ערך מדויק, קיבוץ לפי-קובץ/מודול, וסיווג-בסיס לפי אורך + מילות-מפתח
   (הודעת-שגיאה/מצב-ריק/אישור-מסוכן/hint).
4. **קריאה אנושית מלאה** של שתי הרשימות שנפלו בתפר (819 מחרוזות: 582 "④?" + 398 "①?"‏, עם חפיפה
   שנפתרה ידנית) — כולל קריאת הקוד המקורי סביב 6 מהממצאים (`ProjectsPage.jsx` · `TeamTab.jsx` ·
   `ProjectCardPage.jsx` · `HostessViewCard.jsx` · `OverviewTab.jsx` · `projectLogistics.js` ·
   `projectTeam.js`) לפני שנרשמו כ-④ סופית.
5. `grep -c "⑥"` על ארבעת קובצי `screens-approved.md` הקיימים (מודולים 4/5/6/8) — מספר מדויק,
   לא מדווח.
6. הצלבה מול `docs/specs/module_11_reports/processes-approved.md` (המילון-הנעול §🔒) — נמצא
   שהוא חל על מודול 11 (דוחות, טרם נבנה ב-`src/`) ולא על קוד קיים; שימש רק לבדיקת "האם מונח
   עתידי כבר מתנגש עם קיים" (`רדום`, `אדום` — לא מתנגשים, אימוץ עקבי).
7. חיפוש-ממוקד ל-5 (א)-(ד): `grep -rn` על "עובדת"/"מתרחק"/"מנכ\"ל"/"מנכ\"לית"/"חברה"/"לקוח" +
   ספירת "נסה שוב"/"נסי שוב" ו-6 זוגות-פועל נוספים לפי קובץ.
8. הצלבה מול `docs/PROJECT_MASTER.md` (חוב `🚧 מ12`) ומול `docs/specs/module_05_logistics/
   screens-approved.md` (סעיף `⬜ §⑧ פריט 8`) — כדי להבחין בין "ממצא חדש" ל"ידוע ופתוח".

**אין ממצאים בקטגוריה ⑤ (משהו-מעבר-למבוקש):** לא נבדק ולא נרשם דבר שלא נשאל עליו במפורש.


</div>
