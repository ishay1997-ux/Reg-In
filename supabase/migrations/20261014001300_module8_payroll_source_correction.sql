-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 13 (B) — תיקון מקור לפני ההפקה
-- =============================================================================
-- why: כשפנייה של דיילת מתקבלת ("עבדתי 8 שעות ולא 6.5"), צריך לתקן את המקור — השעות או
-- הבונוס של השיבוץ — לפני שהשעות ננעלות לדוח. לא עורכים שורת דוח, לא קובץ ולא סכום מוצג:
-- מתקנים את השיבוץ, והאיסוף (A) מחשב מחדש. כל תיקון נרשם עם ערך לפני/אחרי, סיבה ומבצע.
--
-- 🔑 מי רשאי (שינוי חוזה F5b, הכרעת הסגן 13.10 23:40 בהאצלת ישי: "אם נדרש לשנות הרשאות
-- אין לי בעיה מה שנראלך הגיוני"):
--   • 'פרויקטים' edit — כל שיבוץ שעוד לא נכלל בדוח (actor_authority='projects').
--   • 'כספים' edit בלבד — **רק דרך פנייה של הדיילת**: p_case_id חובה, הפנייה פתוחה או ממתינה
--     לתיקון, בסבב פתוח, של אותה דיילת, ושהשיבוץ (project_id, assignment_number) מופיע בשורות
--     של הפנייה. אחרת PERMISSION_DENIED (actor_authority='finance_case').
--   הנימוק (מהסגן): מקובל שמנהל השכר מתקן שעות לפני הרצת השכר עם תיעוד, בלי לקבל עריכה מלאה
--   של מודול הפרויקטים.
-- 🔑 סדר נעילות: _payroll_lock() → הפרויקט for share → השיבוץ for update (חוזה §2.2).
-- 🔑 לא נוגע בסבבי בדיקה: התיקון משנה את התקציר של הדיילת, והסבב יגלה את זה ברענון.
-- =============================================================================

-- בדיקת הרשאה שמחזירה אמת/שקר במקום לזרוק — אותה שאילתה כמו assert_module_permission.
create or replace function public._payroll_has_permission(p_module text, p_levels text[])
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (
    select 1
      from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = p_module)
       and p.permission_level = any (p_levels));
$$;

revoke execute on function public._payroll_has_permission(text, text[]) from public, anon, authenticated;


create or replace function public.correct_unclaimed_assignment(
  p_project_id integer, p_hostess_id bigint, p_assignment_number integer, p_field text,
  p_expected_value numeric, p_new_value numeric, p_reason text, p_case_id bigint default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  v_actor text := (select auth.email());
  v_authority text;
  v_reason text;
  c public.payroll_review_cases;
  v_review_status text;
  p public.projects;
  a public.assignments;
  v_current numeric;
  v_correction_id bigint;
  v_affected bigint[];
  v_case_ok boolean := false;
begin
  -- ① מי רשאי.
  if public._payroll_has_permission('פרויקטים', array['edit']) then
    v_authority := 'projects';
  elsif public._payroll_has_permission('כספים', array['edit']) then
    v_authority := 'finance_case';
  else
    perform public._payroll_raise('PERMISSION_DENIED', 'אין לך הרשאה לתקן את הנתונים האלה.', null);
  end if;

  v_reason := public._payroll_review_require_text(p_reason, 5, 'reason');
  if p_field is null or p_field not in ('actual_hours', 'personal_bonus') then
    perform public._payroll_raise('CORRECTION_NOT_SUPPORTED', 'אפשר לתקן כאן רק שעות או בונוס.', null);
  end if;
  if p_new_value is null then
    perform public._payroll_raise('CORRECTION_OUT_OF_BOUNDS', 'יש להזין ערך חדש.', null);
  end if;

  -- ② נעילות בסדר הקבוע.
  perform public._payroll_lock();
  select * into p from public.projects where project_id = p_project_id for share;
  select * into a from public.assignments
   where project_id = p_project_id and hostess_id = p_hostess_id and assignment_number = p_assignment_number
   for update;
  if a.project_id is null or p.project_id is null then
    perform public._payroll_raise('CORRECTION_NOT_SUPPORTED', 'השיבוץ לא נמצא.', null);
  end if;

  -- ③ הפנייה (חובה לכספים בלבד; רשות לפרויקטים).
  if p_case_id is not null then
    select * into c from public.payroll_review_cases where case_id = p_case_id for update;
    select v.status into v_review_status from public.payroll_reviews v where v.review_id = c.review_id;
  end if;
  -- coalesce: בלי פנייה כל ההשוואות הן null, ו-"not null" לא היה חוסם.
  v_case_ok := coalesce(c.case_id is not null
       and c.phase = 'pre_issue'
       and c.status in ('open', 'correction_pending')
       and v_review_status = 'open'
       and c.hostess_id = p_hostess_id
       and exists (select 1 from jsonb_array_elements(c.affected_rows) k
                    where (k ->> 'project_id')::int = p_project_id
                      and (k ->> 'assignment_number')::int = p_assignment_number), false);
  if v_authority = 'finance_case' and not v_case_ok then
    perform public._payroll_raise('PERMISSION_DENIED',
      'אפשר לתקן רק את השיבוץ שהדיילת ציינה בפנייה פתוחה.', null);
  end if;
  -- גם בעלת הרשאת פרויקטים: פנייה שצוינה חייבת להתאים לשיבוץ, אחרת היינו סוגרים פנייה זרה.
  if p_case_id is not null and not v_case_ok then
    perform public._payroll_raise('INVALID_ARGUMENT', 'הפנייה שצוינה לא שייכת לשיבוץ הזה או כבר טופלה.', null);
  end if;

  -- ④ כללי המקור.
  if a.salary_report_id is not null then
    perform public._payroll_raise('ALREADY_CLAIMED', 'השעות האלה כבר נכללו בדוח שכר ואי-אפשר לתקן אותן כאן.',
                                  jsonb_build_object('report_id', a.salary_report_id));
  end if;
  if a.assignment_status <> 'finally_approved' then
    perform public._payroll_raise('CORRECTION_NOT_SUPPORTED', 'אפשר לתקן רק שיבוץ מאושר סופית.', null);
  end if;
  if p.project_status = 'finished' then
    perform public._payroll_raise('PROJECT_ARCHIVED', 'הפרויקט כבר בארכיון ואי-אפשר לתקן את השעות שלו.', null);
  end if;

  v_current := case when p_field = 'actual_hours' then a.actual_hours else a.personal_bonus end;
  if v_current is distinct from p_expected_value then
    perform public._payroll_raise('STALE_VERSION', 'הנתונים השתנו. יש לרענן לפני תיקון.',
                                  jsonb_build_object('current', v_current));
  end if;

  if p_field = 'actual_hours' and (
       p_new_value < 0
       or (p.actual_hours is not null and p_new_value > p.actual_hours + 2)
       or (a.attendance_status = 'no_show' and p_new_value <> 0)) then
    perform public._payroll_raise('CORRECTION_OUT_OF_BOUNDS',
      'השעות צריכות להיות בין 0 לשעות האירוע ועוד שעתיים (ולדיילת שלא הגיעה — 0).',
      jsonb_build_object('max', p.actual_hours + 2));
  end if;
  if p_field = 'personal_bonus' and (p_new_value < 0 or p_new_value > 5000) then
    perform public._payroll_raise('CORRECTION_OUT_OF_BOUNDS', 'הבונוס צריך להיות בין 0 ל-5,000.', null);
  end if;

  -- ⑤ התיקון והיומן.
  if p_field = 'actual_hours' then
    update public.assignments set actual_hours = p_new_value
     where project_id = p_project_id and hostess_id = p_hostess_id and assignment_number = p_assignment_number;
  else
    update public.assignments set personal_bonus = p_new_value
     where project_id = p_project_id and hostess_id = p_hostess_id and assignment_number = p_assignment_number;
  end if;

  insert into public.payroll_source_corrections (project_id, hostess_id, assignment_number, case_id, field,
                                                 before_value, after_value, reason, actor_email, actor_authority)
  values (p_project_id, p_hostess_id, p_assignment_number, c.case_id, p_field, v_current, p_new_value,
          v_reason, v_actor, v_authority)
  returning correction_id into v_correction_id;

  if v_case_ok then
    update public.payroll_review_cases
       set status = 'resolved_accepted', revision = revision + 1, resolution_reason = v_reason,
           resolved_by = v_actor, resolved_at = now()
     where case_id = c.case_id;
  end if;

  -- סבבים פתוחים שהסיכום הנוכחי של הדיילת בהם כולל את השיבוץ — יצטרכו רענון.
  select coalesce(array_agg(distinct r.review_id), '{}') into v_affected
    from public.payroll_review_recipients r
    join public.payroll_reviews v on v.review_id = r.review_id
   where r.hostess_id = p_hostess_id and r.is_current and v.status = 'open'
     and r.rows @> jsonb_build_array(jsonb_build_object('project_id', p_project_id,
                                                        'assignment_number', p_assignment_number));

  insert into public.payroll_review_events (review_id, recipient_id, case_id, event_type, actor, payload)
  select x, null, c.case_id, 'source_corrected', v_actor,
         jsonb_build_object('correction_id', v_correction_id, 'field', p_field,
                            'before', v_current, 'after', p_new_value, 'authority', v_authority)
    from unnest(v_affected) x;

  return jsonb_build_object('ok', true, 'correction_id', v_correction_id,
                            'affected_review_ids', to_jsonb(v_affected));
end;
$$;

revoke execute on function public.correct_unclaimed_assignment(integer, bigint, integer, text, numeric, numeric, text, bigint)
  from public, anon, authenticated;
grant execute on function public.correct_unclaimed_assignment(integer, bigint, integer, text, numeric, numeric, text, bigint)
  to authenticated;
