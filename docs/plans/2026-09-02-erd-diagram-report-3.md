# תוכנית: תרשים קשרי גומלין (סכמה רלציונית) ב-draw.io לדוח 3 – REG-IN

## הקשר (למה)

דוח 3 מכיל את "תרשים 6.08: תרשים קשרי גומלין – סכמה רלציונית (טבלאות)" שמבוסס על 15 הטבלאות של דוח 2.
המסד החי (Supabase, פרויקט `Reg-In`) מכיל היום 30 טבלאות ו-35 מפתחות זרים. צריך תרשים חדש שמשקף את המסד
כפי שהוא, מצויר **אך ורק לפי ספר הקורס 10645 (שובל)** – כך דרשה המנחה במטלת מנחה 2 ("לצורך אחידות ההצגה...
אך ורק לפי מה שנלמד בקורס 10645, שמסתמך על ספרו של פרופ' פרץ שובל"), וכך הכריע ישי: "הספר הוא מקור האמת ואין עליו ויכוח".

## הכרעות ישי (02/09/2026)

| נושא | הכרעה |
|---|---|
| סוג תרשים | טבלאות (סכמה רלציונית), לא ERD עם אליפסות |
| סגנון | **בדיוק כמו תרשים 7.22 (עמ' 444)**: חיצי F.K ממפתח זר אל מפתח האב. בלי מספרי ריבוי, בלי סוגי נתונים, בלי שמות על הקווים |
| כיוון טבלה | אנכי – שדה מתחת לשדה (התאמת סידור בלבד; בספר השדות אופקיים) |
| שפה | שמות טבלאות ושדות באנגלית כמו במסד – לא לתרגם |
| חותמות זמן | להשמיט `created_at`/`updated_at` + הערת שוליים |
| טבלאות טכניות | להשמיט `login_attempts`, `login_rpc_calls`, `feedback_rpc_calls` (הערה בתרשים). לכלול `email_log` ו-`notification_preferences` |
| עמודים | עמוד סקירה מלא + עמודי נושא ממוקדים (כפי שהמנחה הראתה: "מבט ממוקד") |
| נימוק | כל בחירת-ציור מגובה בעמוד מהספר |

## חוקי הציור – מהספר, עם עמודים

| רכיב | איך מציירים | מקור בספר (כרך ב) |
|---|---|---|
| טבלה (רלציה) | מלבן עם שם הטבלה בכותרת ומשבצת לכל שדה | תרשים 7.10 עמ' 407, תרשים 7.22 עמ' 444 |
| מפתח ראשי | קו תחתון תחת שם השדה; במפתח מורכב – כל חלק בקו תחתון | עמ' 406 ("מפתחות הרלציות מסומנים בקו תחתון"), עמ' 22 בסיכום; תרשים 7.22 – "מחקרים לפי שנים" |
| מפתח זר | חץ מהשדה הזר ברלציית-הבן אל שדה המפתח ברלציית-האב, עם התווית **F.K** ליד תחילת החץ | עמ' 406: "אילוצי שלמות הייחוס בצורת קווים עם ראשי חץ מהמפתחות הזרים ברלציות-הבן (מסומנים באותיות F.K) אל מפתחות רלציות-האב" |
| מפתח שהוא גם זר | קו תחתון **וגם** חץ F.K | תרשים 7.22 – "חוקרים ראשיים במחקרים", "חוקי משנה במחקרים" |
| שני חיצים בין אותו זוג טבלאות | לא כותבים שם קשר; שם השדה מבחין | תרשים 7.22 – "מחלקות" מכילה `מ"ז מרצה (מנהל)` ו"מרצים" מכילה `קוד מחלקה` – שני חיצים, אפס תוויות |
| ריבוי (1,N) | **אין** בתרשים טבלאות | קיים רק ב-ERD, עמ' 150–151 |
| סוגי נתונים | **אין** בתרשים | בספר סוגים מופיעים רק במילון הנתונים (יחידה 4) |
| ישות חלשה → טבלה | מפתח = מפתח החזקה + מפתח חלקי | סעיף 7.2.3.2 עמ' 433 |
| קשר M:N → טבלה | טבלה חדשה שמפתחה מורכב משני המפתחות | סעיף 7.2.3.3 סעיף 3, עמ' 437 |
| קשר 1:N → שדה זר | מפתח צד ה-1 נוסף כשדה בצד ה-N | עמ' 436 |
| קשר 1:1 → שדה זר | מפתח אחת הרלציות נוסף לשנייה | עמ' 435 |
| תכונה מרובת ערכים → טבלה נפרדת | מפתח = מפתח הישות + התכונה (`hostess_languages`) | עמ' 431 סעיף אחרון |
| תרשים גדול | מותר לחלק לחלקים / עמודים | סעיף 5.1.3 עמ' 168–169 |
| שחור-לבן | הספר בגווני אפור; נצייר מילוי לבן, קו שחור | תרשימים 7.10, 7.22 |

**חריגה מודעת אחת:** השדות מסודרים אנכית ולא בשורה אופקית (ל-`projects` יש 35 שדות). הסימון עצמו זהה – רק הסידור מסובב. יצוין במקרא.

## תוצר

קובץ חדש: `אפיון/ERD דוח 3 - סכמה רלציונית.drawio` (לא נוגעים ב-`DFD/DFD,ERD תרשימים.drawio` הישן).

עמודים בקובץ:
1. **סכמה רלציונית – מלא** – 27 טבלאות, 35 חיצי F.K, מקרא בפינה.
2. **הרשאות ומשתמשים** – `roles`, `modules`, `permissions`, `users`, `notification_preferences`, `params`.
3. **לקוחות, מוצרים והצעות מחיר** – `customers`, `customer_contacts`, `products`, `price_tiers`, `product_costs`, `quotes`, `quote_services`.
4. **פרויקטים ולוגיסטיקה** – `projects`, `project_changes`, `logistics`, `project_finance` (+ `quotes`, `quote_services`, `products`, `users`, `customers` כטבלאות-אב).
5. **דיילות, שיבוץ ושכר** – `hostesses`, `hostess_languages`, `hostess_bank_details`, `hostess_unavailability`, `customer_hostess_preference`, `assignments`, `salary_reports`, `salary_report_lines`, `email_log` (+ `projects`, `customers` כאב).
6. **מקרא ומקורות** – טבלת החוקים לעיל עם מספרי העמודים, הערות השוליים (חותמות זמן, 3 טבלאות שהושמטו, `email_log` בלי FK כי הקשר שלו גנרי `entity_type`/`entity_id` ואינו אילוץ במסד – עמ' 406 מצייר רק אילוצי שלמות ייחוס).

בעמודי הנושא טבלת-אב שהעמוד שלה אחר תצוין "(מפורט בעמוד N)" – ברוח עמ' 168.

## תוכן הטבלאות (27) – מקור: הסכמה שישי הדביק + שאילתת FK/אינדקסים מהמסד החי

סדר שדות בכל טבלה: מפתח ראשי → מפתחות זרים → שאר השדות בסדר המסד. חותמות זמן מושמטות.
`PK` = קו תחתון, `FK→x` = חץ F.K אל מפתח x.

- **roles**: role_id PK · role_name
- **modules**: module_id PK · module_name
- **permissions**: role_id PK FK→roles · module_id PK FK→modules · permission_level
- **users**: email PK · role_id FK→roles · full_name · status · phone
- **notification_preferences**: email PK FK→users · email_new_projects · sms_last_minute
- **params**: param_id PK · owner_role_id FK→roles · param_name · param_value · param_type
- **customers**: customer_id PK · company_number · customer_type · company_name · discount_percent · marketing_consent · status
- **customer_contacts**: contact_id PK · customer_id FK→customers · contact_name · phone · email · is_primary
- **products**: sku PK · item_name · description · category · unit · base_price · status · image_url
- **price_tiers**: sku PK FK→products · min_qty PK · special_price · max_qty
- **product_costs**: sku PK FK→products · cost
- **quotes**: quote_id PK · customer_id FK→customers · event_name · issue_date · recommended_hostess_count · estimated_guests · estimated_event_date · estimated_location · quote_status · pdf_url · applied_customer_discount · manual_discount · rejection_reason · notes · vat_rate_snapshot · rejection_notes · estimated_start_time · estimated_end_time · estimated_hours
- **quote_services**: line_id PK · quote_id FK→quotes · sku FK→products · line_number · qty · closing_unit_price · closing_unit_cost · color · notes
- **projects**: project_id PK · quote_id FK→quotes · customer_id FK→customers · owner_email FK→users · cancelled_by FK→users · operationally_closed_by FK→users · final_event_date · final_location · required_hostess_count · project_status · invoice_sent · feedback_status · actual_guests · actual_hours · cancel_reason · payment_date · feedback_score · negative_feedback_reason · feedback_notes · summary_report_url · event_name · final_start_time · final_end_time · lat · lng · customer_name · owner_name · owner_phone · cancelled_at · cancel_type · operationally_closed_at · invoice_sent_at · feedback_token
- **project_changes**: change_id PK · project_id FK→projects · sku FK→products · performed_by FK→users · change_group_id · color · change_target · delta_qty · unit_price_snapshot · unit_cost_snapshot · reason
- **logistics**: project_id PK FK→projects · sku PK FK→products · serial_number PK · quote_service_line_id FK→quote_services · project_change_id FK→project_changes · planned_qty · actual_qty · item_status · notes · color · expected_arrival_date · actual_arrival_date · actual_qty_autofilled
- **project_finance**: project_id PK FK→projects · final_profit · cancellation_fee · cancellation_fee_note · written_off · written_off_reason · invoice_file_url · archived_at
- **hostesses**: hostess_id PK · id_number · full_name · phone · email · city · hourly_rate · rating · status · address · lat · lng · has_car
- **hostess_languages**: hostess_id PK FK→hostesses · language PK
- **hostess_bank_details**: hostess_id PK FK→hostesses · bank_name · bank_branch · bank_account
- **hostess_unavailability**: unavailability_id PK · hostess_id FK→hostesses · start_date · end_date · note
- **customer_hostess_preference**: preference_id PK · customer_id FK→customers · hostess_id FK→hostesses · preference · preference_reason
- **salary_reports**: report_id PK · period · sent_date · report_file_url · send_status · total_amount
- **assignments**: project_id PK FK→projects · hostess_id PK FK→hostesses · assignment_number PK · salary_report_id FK→salary_reports · assignment_status · hourly_rate_snapshot · actual_hours · personal_bonus · reminder_sent · responded_at · invite_token · invite_sent_at · travel_amount · is_shift_lead · event_date · attendance_status · lateness_level · no_show_reason · released_from_status
- **salary_report_lines**: line_id PK · report_id FK→salary_reports · hostess_id FK→hostesses · source_project_id FK→projects · hostess_name · id_number · line_basis · hours · rate · bonus · travel · line_total
- **email_log**: email_log_id PK · entity_type · entity_id · recipient · template_name · subject · status · error_message · sent_by_email

סה"כ 35 חיצי F.K – בדיוק רשימת ה-FK שנשלפה מ-`pg_constraint` (02/09/2026).

## סידור עמוד 1 (אנטי-ספגטי)

עמודות משמאל לימין לפי כיוון התלות, כך שרוב החיצים הולכים לכיוון אחד ולא חוצים טבלאות:

```
[A] roles/modules/permissions     [B] customers          [C] projects (גבוה)   [D] products        [E] hostesses
    users / notification_prefs        customer_contacts      project_changes       price_tiers         hostess_languages / bank / unavailability
    params                            quotes                 logistics             product_costs       customer_hostess_preference
                                      quote_services         project_finance       email_log (עצמאי)   assignments → salary_reports → salary_report_lines
```

- כל חץ יוצא מהצד של שורת השדה הזר הפונה לטבלת-האב ונכנס לשורת המפתח של האב; לכל חץ נקודת יציאה/כניסה משלו (לפי השורה) כדי שקווים לא יתמזגו.
- קווים אורתוגונליים (`edgeStyle=orthogonalEdgeStyle`), תווית `F.K` קטנה בקצה שלצד הבן.
- שלושת החיצים projects→users יוצאים משלוש שורות שונות (owner_email / cancelled_by / operationally_closed_by) – ההבחנה לפי שם השדה, כמו בספר.
- מרווח בין עמודות ≥ 160px לתעלות חיצים; טבלאות באותה עמודה מרווחות אנכית ≥ 60px.

## מימוש

1. **סקריפט מחולל** ב-scratchpad: `gen_erd.py`
   - מילון טבלאות (רשימה לעיל) + רשימת FK (35) + קואורדינטות לכל טבלה לכל עמוד.
   - טבלה = `shape=table` של draw.io עם `tableRow` לכל שדה (כך חיצים נצמדים לשורה); כותרת = שם הטבלה; שדה PK עם `<u>`; מילוי לבן, קו שחור, גופן Helvetica 11.
   - חיצים = `mxCell edge=1 source=<row-cell של השדה הזר> target=<row-cell של המפתח באב>`, `endArrow=block`, תווית-ילד `F.K` ב-`mxGeometry relative` קרוב למקור.
   - עמוד 6 (מקרא ומקורות) כטקסט HTML בתאים.
   - כותב XML לא-דחוס ל-`אפיון/ERD דוח 3 - סכמה רלציונית.drawio`.
   - **Assert** בסקריפט: כל FK מהרשימה מופיע פעם אחת בדיוק; כל טבלה בעמוד 1; אין שני מלבנים חופפים (בדיקת חיתוך גיאומטרי).
2. **ייצוא לבדיקה ויזואלית**: `"C:\Program Files\draw.io\draw.io.exe" -x -f png -s 2 -p <i> -o page_i.png <file>` לכל עמוד → Read של התמונה → תיקון קואורדינטות עד שאין חיצים שחוצים טבלאות ואין תוויות שנחתכות. חוזרים על 1–2 עד שנקי.
3. **בדיקה מול המסד החי** (read-only): שאילתה על `information_schema.columns` לכל 27 הטבלאות; השוואה אוטומטית לרשימת השדות בסקריפט (פחות חותמות זמן) → חייב 0 הפרשים. שאילתת FK → 35 = 35.
4. שליחת ה-PNG של עמוד 1 + הקובץ לישי (SendUserFile).
5. זיכרון: לשמור feedback – "בפרויקט REG-IN הספר (שובל, 10645) הוא מקור האמת לתרשימים; כל הכרעת ציור מנומקת עם מספר עמוד".

## אימות (מה נחשב "גמור")

- [ ] 27 טבלאות, 35 חיצי F.K – נספר בסקריפט ובתמונה.
- [ ] כל שדה במסד (למעט created_at/updated_at) מופיע – השוואה אוטומטית ל-`information_schema`.
- [ ] כל PK בקו תחתון, כל FK עם חץ ותווית F.K, אפס מספרים/סוגים/שמות על קווים.
- [ ] PNG של כל עמוד נבדק בעיניים: אין חיץ שעובר דרך טבלה, אין טקסט חתוך, אין שני קווים מתלכדים.
- [ ] הקובץ נפתח ב-draw.io desktop בלי שגיאה (הייצוא עצמו מוכיח).
- [ ] עמוד "מקרא ומקורות" מכיל את טבלת העמודים לעיל.

## ממצאים לדווח לישי בסיום (לא בתחום העבודה, רק לידיעה)

- בדוח 3 סעיף 6 כתוב "מפתחות זרים (מסומנים בקו תחתון מקווקו)" – לא לפי הספר (בספר קו מקווקו = מפתח חלקי ב-ERD, עמ' 145–146; FK = חץ F.K עמ' 406). כדאי לתקן את המשפט כשמחליפים את תרשים 6.08.
- רשימת 15 הטבלאות בסעיף 6 של דוח 3 לא כוללת את 12 הטבלאות החדשות – התרשים החדש יהיה לא-תואם לטקסט עד שהסעיף יעודכן.
- המדריך `ERD מדריך ותיאור.docx` מכיל חוקים שאינם מהספר (אליפסה מקווקוות = תכונה נגזרת; כוכבית ל-FK).
