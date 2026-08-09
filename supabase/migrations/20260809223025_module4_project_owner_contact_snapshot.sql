-- מודול 4 — מיגרציה G: snapshot של איש-הקשר בשטח על שורת-הפרויקט
--
-- 🔴 **מה זה פותר, ולמה זה חוסם:** מייל האישור-הסופי (`תבנית_אישור_סופי_שיבוץ`) מזריק
-- `[שם_מנהלת_פרויקט]` ו-`[טלפון_מנהלת_פרויקט]`. הכרעת-ישי `local-2` (08/08/2026) מפנה אותם
-- ל-`users.full_name`/`users.phone` דרך `projects.owner_email` — **ונמדד 09/08/2026 בדפדפן
-- מחובר שמנהלת הגיוס אינה יכולה לקרוא את השורה הזאת:** ה-policy `users_select_self_or_ceo`
-- מתירה קריאה **רק על עצמך או למנכ"ל**, והשאילתה חוזרת `200` עם `[]`.
-- ⇒ המייל היה יוצא לדיילת עם *"איש קשר בשטח: מנהלת הפרויקט -, טלפון: "*, **בלי שום שגיאה** —
-- מלכודת `{data:null, error:null}` המתועדת ב-`src/CLAUDE.md`.
-- 🚫 **ו-`fillEmailTemplate` אינו תופס את זה:** ה-placeholder **מוכר**, הוא פשוט מתמלא בריק.
--
-- 🔑 **למה snapshot ולא פתיחת-הרשאה** (הכרעת-קלוד בהאצלת-ישי 09/08 — *"מה שנראה לך נכון"*):
--   ① זהו **המופע השלישי של דפוס שכבר חי בטבלה הזאת** — `event_name` (§7.76) ו-`customer_name`
--      (`local-5`, מיגרציה `20260809122536`), ששתיהן נולדו מאותה בעיה בדיוק.
--   ② **אינו פותח משטח-אבטחה חדש:** פתיחת `users` לקריאה למי שיש לו 'דיילות' הייתה חושפת שם
--      וטלפון של **כל** משתמשי המערכת בשביל שני שדות.
--   ③ **וזה גם נכון מהותית:** מה שנכתב במייל שיצא צריך להישאר מה שנכתב בו. עדכון פרופיל מחר
--      אינו אמור לשנות למפרע מה נמסר לדיילת — **בדיוק הנימוק של `hourly_rate_snapshot`**
--      (*"הבטחנו לה תעריף במייל, ומייל הוא הבטחה"*, `§א2`).
--
-- ⚠️ **מה זה *אינו* פותר, ונאמר בקול:** דיילת-אחראית-משמרת שסומנה **גוברת** על מנהלת-הפרויקט
-- (`local-2`), ופרטיה נקראים מ-`hostesses` — טבלה שמנהלת הגיוס קוראת ממילא. שתי העמודות כאן
-- משרתות את **נתיב-הגיבוי**, שהוא דווקא הנפוץ: `spec.md:255` קובע שאחראית-משמרת מסומנת **רק
-- אחרי** שיש אישור סופי ⇒ **מייל-האישור הראשון בכל אירוע נשען תמיד על השדות האלה.**
--
-- ♻️ **הפיכוּת:** מלאה. שתי `drop column` מחזירות את המצב, ו-`create or replace` בגרסת
-- `20260809122536` מחזירה את ה-RPC. אין מחיקת-נתונים ואין שינוי-טיפוס.
--
-- 🚫 **בלי NOT NULL, במכוון:** ל-`users.phone` מותר להיות ריק, ופרויקט ישן יכול להצביע לבעלים
-- שאינו קיים. אילוץ כאן היה מפיל את ה-backfill ואת ההמרה. **החובה לא-להדפיס-ריק היא של
-- שכבת-המייל**, לא של הסכמה — היא תסרב לשלוח במקום להדפיס "טלפון: ".
--
-- 📋 צ'קליסט-העיצוב (`db_roadmap §1`): אין טבלה חדשה ⇒ אין policies חדשות (העמודות יורשות את
-- אלה של `projects`) · אין FK ⇒ אין C-1 · אין עמודות-זמן/כסף · אין השפעת-Seed · שער-הקלדה 👤.

-- ===== SECTION 1 — שתי עמודות ה-snapshot =====
alter table public.projects add column owner_name  text;
alter table public.projects add column owner_phone text;

-- ===== SECTION 2 — backfill לפרויקטים הקיימים =====
-- רץ כבעלים ולא דרך policy, ולכן **כן** רואה את `users` — בדיוק כמו ה-backfill של
-- `customer_name` במיגרציה A (ר' ההערה ב-`20260809134237:125`).
update public.projects p
   set owner_name  = u.full_name,
       owner_phone = u.phone
  from public.users u
 where u.email = p.owner_email
   and p.owner_name is null;

-- ===== SECTION 3 — ה-RPC של ההמרה כותבת את ה-snapshot מכאן והלאה =====
-- 🔴 **בלי זה ה-backfill מטפל בעבר בלבד, וכל פרויקט חדש נולד עם איש-קשר ריק** — בדיוק הכשל
-- ש-`customer_name` נתקל בו, ומאותו טעם ה-RPC נכתבת מחדש כאן.
-- ⚠️ **הגוף זהה מילה-במילה לגרסת `20260809122536`** (כולל שומר-המע"מ, שער-ההרשאה,
-- ‏`security definer set search_path = ''` ו-`left join` ללקוח), **למעט שתי העמודות החדשות
-- ב-INSERT ו-ה-`left join` ל-`users` שמזין אותן.**
-- 🔑 ‏`left join` ולא `join`: משתמש שאינו בטבלה (או שנמחק) היה מבליע את **כל** שורת-הפרויקט,
-- כלומר אישור-הצעה היה נכשל בגלל שדה-תצוגה. אותו לקח בדיוק כמו ה-`left join` ללקוח.
create or replace function public.approve_quote_and_create_project(p_quote_id int)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_caller_email text := (select auth.email());
  v_status text; v_event_date date; v_project_id int; v_hostess_count int; v_vat numeric;
  v_vat_text text;
begin
  if not exists (
    select 1 from public.permissions p
    join public.users u on u.role_id = p.role_id
    join public.modules m on m.module_id = p.module_id
    where u.email = v_caller_email and u.status = 'active'
      and m.module_name = 'הצעות מחיר' and p.permission_level = 'edit'
  ) then
    raise exception 'אין הרשאה: נדרשת עריכה על הצעות מחיר לאישור הצעה' using errcode = '42501';
  end if;

  select quote_status, estimated_event_date into v_status, v_event_date
    from public.quotes where quote_id = p_quote_id for update;
  if not found then raise exception 'הצעה % לא נמצאה', p_quote_id using errcode='P0002'; end if;
  if v_status <> 'in_progress' then
    raise exception 'ההצעה כבר טופלה (סטטוס %) — לא ניתן לאשר שוב', v_status using errcode='P0001'; end if;
  if v_event_date < current_date then
    raise exception 'לא ניתן לאשר הצעה שתאריך-האירוע שלה עבר (%)', v_event_date using errcode='P0001'; end if;

  select coalesce(sum(qs.qty),0) into v_hostess_count
    from public.quote_services qs join public.products pr on pr.sku = qs.sku
    where qs.quote_id = p_quote_id and pr.category = 'hostess';
  if v_hostess_count <= 0 then
    raise exception 'לא ניתן לאשר הצעה ללא שורות-דיילות (אין אירוע בלי דיילות)' using errcode='P0001'; end if;

  select param_value into v_vat_text from public.params where param_name = 'אחוז_מעמ';
  if v_vat_text is null or btrim(v_vat_text) = '' or btrim(v_vat_text) !~ '^[0-9]+(\.[0-9]+)?$' then
    raise exception 'שיעור המע"מ אינו מוגדר בהגדרות המערכת (פרמטר אחוז_מעמ) — לא ניתן לאשר הצעה'
      using errcode = 'P0001'; end if;
  v_vat := btrim(v_vat_text)::numeric;
  if v_vat < 0 or v_vat > 100 then
    raise exception 'שיעור המע"מ שבהגדרות המערכת אינו חוקי (%) — לא ניתן לאשר הצעה', v_vat
      using errcode = 'P0001'; end if;

  update public.quote_services qs set closing_unit_cost = pr.cost
    from public.products pr where qs.sku = pr.sku and qs.quote_id = p_quote_id;
  update public.quotes set quote_status='approved', vat_rate_snapshot = v_vat where quote_id = p_quote_id;

  insert into public.projects
    (quote_id, event_name, customer_id, customer_name, final_event_date, final_location,
     final_start_time, final_end_time, owner_email, owner_name, owner_phone,
     required_hostess_count, project_status)
  select q.quote_id, q.event_name, q.customer_id, c.company_name, q.estimated_event_date,
         q.estimated_location, q.estimated_start_time, q.estimated_end_time,
         v_caller_email, ou.full_name, ou.phone, v_hostess_count, 'not_started'
    from public.quotes q
    left join public.customers c on c.customer_id = q.customer_id
    left join public.users ou on ou.email = v_caller_email
   where q.quote_id = p_quote_id
  returning project_id into v_project_id;

  insert into public.logistics (project_id, sku, serial_number, planned_qty)
  select v_project_id, qs.sku, row_number() over (order by qs.line_number), qs.qty
    from public.quote_services qs join public.products pr on pr.sku = qs.sku
    where qs.quote_id = p_quote_id and pr.category <> 'hostess';

  return v_project_id;
end; $$;
revoke execute on function public.approve_quote_and_create_project(int) from public, anon;
