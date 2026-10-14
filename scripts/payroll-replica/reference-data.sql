-- REG-IN · payroll replica · step 4: reference data (roles, modules, permissions, params).
--
-- Source: live SELECT, 13.10.2026. Two deliberate substitutions, so no real address or long
-- text lands in the repo:
--   * `מייל_משרד_רואי_חשבון` → accountant@example.test
--   * template bodies other than `תבנית_מייל_דוח_שכר` → '[template body omitted]'
-- Every payroll-relevant value (travel 22.60, compensation thresholds 72 / 24 / 50 %, minimum
-- wage 35.4, the salary-report template) is the live value.

insert into public.roles (role_id, role_name) values
  (1, 'מנכ"ל'), (2, 'מנהלת פרויקטים'), (3, 'מנהלת כספים ולקוחות'),
  (4, 'מנהלת גיוס ושיבוץ'), (5, 'מנהלת לוגיסטיקה');
select setval('public.roles_role_id_seq', 5);

insert into public.modules (module_id, module_name) values
  (1, 'לקוחות'), (2, 'הצעות מחיר'), (3, 'פרויקטים'), (4, 'דיילות'), (5, 'לוגיסטיקה'),
  (6, 'כספים'), (7, 'דו"חות'), (8, 'ניהול הרשאות'), (9, 'הגדרות מערכת');
select setval('public.modules_module_id_seq', 9);

insert into public.permissions (role_id, module_id, permission_level) values
  (1,1,'edit'),(1,2,'edit'),(1,3,'edit'),(1,4,'edit'),(1,5,'edit'),(1,6,'edit'),(1,7,'edit'),(1,8,'edit'),(1,9,'edit'),
  (2,1,'edit'),(2,2,'edit'),(2,3,'edit'),(2,4,'edit'),(2,5,'view'),(2,6,'blocked'),(2,7,'view'),(2,8,'blocked'),(2,9,'blocked'),
  (3,1,'edit'),(3,2,'view'),(3,3,'view'),(3,4,'blocked'),(3,5,'blocked'),(3,6,'edit'),(3,7,'edit'),(3,8,'blocked'),(3,9,'blocked'),
  (4,1,'blocked'),(4,2,'blocked'),(4,3,'view'),(4,4,'edit'),(4,5,'blocked'),(4,6,'blocked'),(4,7,'view'),(4,8,'blocked'),(4,9,'blocked'),
  (5,1,'blocked'),(5,2,'blocked'),(5,3,'view'),(5,4,'blocked'),(5,5,'edit'),(5,6,'blocked'),(5,7,'view'),(5,8,'blocked'),(5,9,'blocked');

insert into public.params (param_name, param_type, param_value, owner_role_id) values
  ('ימי_תוקף_הצעה','pricing_timing','30',2),
  ('אחוז_מעמ','pricing_timing','18',3),
  ('יחס_אורחים_לדיילת','pricing_timing','50',4),
  ('שכר_מינימום_שעתי','pricing_timing','35.4',3),
  ('ימי_אזהרה_קדם_אירוע','control_alerts','14',2),
  ('שעות_תזכורת_לדיילת','control_alerts','24',4),
  ('מייל_משרד_רואי_חשבון','integration_tech','accountant@example.test',3),
  ('תבנית_מייל_הצעת_מחיר','templates','[template body omitted]',2),
  ('תבנית_זימון_משמרת','templates','[template body omitted]',4),
  ('תבנית_מייל_משוב_לקוח','templates','[template body omitted]',null),
  ('תבנית_מייל_חשבונית_מס','templates','[template body omitted]',3),
  ('תבנית_מייל_ביטול_משמרת','templates','[template body omitted]',4),
  ('תבנית_אישור_סופי_שיבוץ','templates','[template body omitted]',4),
  ('תבנית_תזכורת_משמרת','templates','[template body omitted]',4),
  ('תבנית_מייל_דוח_שכר','templates',
   E'שלום לצוות הנהלת חשבונות / [שם_רואה_חשבון],\nמצורף בזאת קובץ אקסל המרכז את שעות העבודה של צוות הדיילות של חברת REG-IN עבור חודש [חודש_דיווח_ושנה].\nהקובץ כולל פירוט תעריפים, שעות בפועל ובונוסים, לאחר שעבר בקרה ואישור במערכת. בכל שאלה או בירור בנוגע לנתונים, ניתן לפנות למחלקת הכספים.\nבברכה,\nמערכת REG-IN.',
   3),
  ('משקולת_היענות','smart_match','0.40',4),
  ('משקולת_אמינות','smart_match','0.35',4),
  ('משקולת_קרבה','smart_match','0.25',4),
  ('שער_מרחק_קמ','smart_match','80',4),
  ('גולפוסט_מרחק_קמ','smart_match','40',4),
  ('קבוע_ריסון_m','smart_match','3',4),
  ('חלון_חישוב_חודשים','smart_match','12',4),
  ('חלון_חישוב_מורחב_חודשים','smart_match','24',4),
  ('מינימום_תשובות_להצגת_ציון','smart_match','3',4),
  ('שיעור_בונוס_הוגנות_לשבוע','smart_match','0.02',4),
  ('תקרת_שבועות_הוגנות','smart_match','8',4),
  ('לא_ענתה_ל_N','smart_match','4',4),
  ('מרכיב_אמינות_פעיל','smart_match','true',4),
  ('סכום_נסיעות_למשמרת','pricing_timing','22.60',3),
  ('תבנית_מייל_שחרור_משמרת','templates','[template body omitted]',4),
  ('תבנית_מייל_אירוע_בוטל','templates','[template body omitted]',4),
  ('תבנית_מייל_פרטי_האירוע_השתנו','templates','[template body omitted]',4),
  ('סף_לקוח_רדום_ימים','control_alerts','120',null),
  ('שעות_פיצוי_ביטול_מלא','control_alerts','24',null),
  ('שעות_פיצוי_ביטול_חלקי','control_alerts','72',null),
  ('אחוז_פיצוי_ביטול_חלקי','control_alerts','50',null),
  ('תנאי_תשלום_ימים','pricing_timing','30',3),
  ('שעות_סף_זימון_לפני_אירוע','shift_invites','24',4),
  ('שעות_תוקף_זימון','shift_invites','48',4),
  ('שעות_אירוע_דחוף','shift_invites','72',4),
  ('סף_שביעות_רצון','control_alerts','3',3),
  ('סף_לוגיסטיקה_ימי_עסקים','control_alerts','10',5),
  ('ימי_אזהרה_הצעה_פגה','pricing_timing','7',2),
  ('מכפיל_מרווח_מתרחק','control_alerts','1.5',1),
  ('סף_סטיית_תקציב_אחוז','control_alerts','15',1),
  ('מקדם_אמינות_אדום','control_alerts','0.87',1),
  ('מקדם_אמינות_ענבר','control_alerts','0.95',1);
