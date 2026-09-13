<div dir="rtl">

# מודול 09 — הגדרות מערכת (System Settings Runbook)

> **ספר הפעלה תפעולי לעבודה על מודול 09 (פרמטרי מערכת, תבניות דוא"ל, שכר מינימום והעדפות התראות)**  
> נטען אוטומטית בעבודה על `src/modules/09_settings/`. מפה מלאה: [docs/CODE_MAP.md](../../../docs/CODE_MAP.md).

---

## 1. שערי איכות ופקודות הרצה מקומיות (Quality Gates & Commands)

| פקודה | תפקיד ופירוט | סף מעבר מחייב |
|---|---|:---:|
| `npx vitest run src/modules/09_settings/` | בדיקות יחידה ורכיבי מודול 09 | 100% ירוק |
| `npx vitest run src/lib/emailTemplates.test.js` | בדיקות תבניות דוא"ל ומשתני החלפה | 100% ירוק |
| `npm run lint` | בדיקת תקני קוד (רף מורכבות קוגניטיבית 20) | 0 אזהרות/שגיאות |

---

## 2. חוקי ברזל ארכיטקטוניים ואינווריאנטים (Architectural Invariants)

1. **מדיניות עריכה מול בעלות על פרמטרים (`params`):**  
   עדכון פרמטר מותר למשתמשת בעלת הרשאת `edit` על מודול `'הגדרות מערכת'` **או** כאשר שדה `owner_role_id` של הפרמטר תואם לתפקיד המשתמשת. בדיקת ההרשאה בקוד חייבת להתחשב בשני התנאים.
2. **נעילת בעלות מעורבת מקדימה (שער V-9):**  
   הפונקציה `updateParams(changes, { roleId, canEditAll })` מוודאת את תקינות ההרשאה על כל הפרמטרים באצווה טרם הפנייה למסד (`canEditAll || change.ownerRoleId === roleId`). קריאה עם `ownerRoleId` שגוי או `undefined` נחסמת עוד בצד הלקוח.
3. **שמירת ערכי פרמטרים כמחרוזת טקסטואלית (`text`):**  
   עמודת `params.param_value` היא תמיד מחרוזת. הפונקציה `updateParams` כותבת `String(value)`. המרת הטיפוסים מתבצעת על ידי הקורא בלבד באמצעות `paramBoolean` או `optionalNumber` מתוך `src/lib/paramsRegistry.js`.
4. **שמות תפקידים מדויקים ברמת בייט ב-`owner_role_id`:**  
   המיפוי לתפקידים במסד דורש התאמה מדויקת לשמות התפקידים בטבלת `roles`: `מנכ"ל`, `מנהלת פרויקטים`, `מנהלת כספים ולקוחות`, `מנהלת גיוס ושיבוץ`, `מנהלת לוגיסטיקה`. שימוש בשמות מקוצרים מחזיר `NULL` בשקט.
5. **זיהוי זהות משתמש בהעדפות התראות מתוך ה-Session:**  
   `getNotificationPreferences` ו-`saveNotificationPreferences` מושכות את המשתמש ישירות מתוך `supabase.auth.getSession()` (התואם ל-`auth.email()` ב-RLS) ואינן מקבלות כתובת דוא"ל כפרמטר פתוח. שורה חסרה מחזירה את שתי ההעדפות כ-`false`.

---

## 3. פנקס מלכודות שקטות במודול (Silent Traps Register)

| מלכודת שקטה | מדוע הבאג שורד קומפילציה ובדיקות | התוצאה והפתרון ההנדסי המחייב |
|---|---|---|
| **כשל שקט בעדכון פרמטר חסום ב-RLS** | שם פרמטר שגוי או חסימת RLS מחזירים `{ data: [], error: null }` ללא שגיאה | `updateParams` עוטפת כל `.update()` ב-`.select()` וקוראת ל-`assertRowsAffected` כדי לזרוק שגיאה על חוסר עדכון |
| **היעלמות תבנית דוא"ל חדשה מהמסך** | הוספת תבנית לטבלת `params` ללא הגדרת משתנים ב-`TEMPLATE_PLACEHOLDERS` | התבנית נספרת במונה הקבוצה אך מסוננת החוצה מ-`TemplateEditor` ונעלמת מהתצוגה ללא שגיאה |
| **טיפול בשגיאת הרשאה 42501 ב-RPC שכר מינימום** | פונקציית `list_hostesses_below_min_wage` זורקת `42501` למשתמש ללא הרשאת שכר | `api.js` ממפה קוד זה ל-`PARAMS_ERROR_CODE.BLOCKED`. ה-UI מסתיר את הפאנל לחלוטין במקום להציג באנר שגיאה שגוי |
| **אימות ערכים בוליאניים ממחרוזת** | מחרוזת `'false'` מומרת ב-`Boolean('false')` ל-`true` ב-JavaScript | פרמטר בוליאני מוערך כדלוק תמיד. חובה להשתמש בפונקציית `paramBoolean` המבצעת השוואה מפורשת מול `'true'` |

---

## 4. מוסכמות קוד ודפוסי מודול (Module Patterns)

1. **קונבנציית מזהי בדיקות (`data-testid`):**  
   כל אלמנטי הבדיקה במודול נושאים קידומת אחידה `settings-` (חל איסור על `param-` או `params-`).
2. **ספירת נוכחות מרוכזת:**  
   ספירת רשומות נוכחות (`countAttendanceRows`) מבוצעת בשאילתת לקוח יחידה על טבלת `assignments` לקבלת מונה אחיד (`{ total, withAttendance }`) ללא מרוצי רשת.

---

## 5. עוגני קבצים קריטיים (Critical File Anchors)

- **מסך הגדרות מערכת:** `src/modules/09_settings/SettingsPage.jsx`
- **לשונית פרמטרים ראשית:** `src/modules/09_settings/ParamsTab.jsx`
- **עורך תבניות דוא"ל:** `src/modules/09_settings/TemplateEditor.jsx`
- **שכבת נתוני הגדרות:** `src/modules/09_settings/api.js`
- **רשם פרמטרים ופענוח טיפוסים:** `src/lib/paramsRegistry.js`
- **תבניות דוא"ל ומשתנים:** `src/lib/emailTemplates.js`

</div>
