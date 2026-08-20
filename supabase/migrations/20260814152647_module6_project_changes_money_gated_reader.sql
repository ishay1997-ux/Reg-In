-- מודול 6 — סגירת הפער הפיננסי היחיד שנשאר מפזה 1
--
-- why: screens-approved.md:809 מכריע במפורש, בעמודת "מה נעלם לה" של לשונית הלוגיסטיקה:
--   מנהלת לוגיסטיקה — "עמודת 'השפעה על ההכנסה' · אריח ההשפעה · שורת-הסיכום. חסומה מנתונים
--   פיננסיים". ו-:810 חוסם את מנהלת הגיוס מ"כל הכסף".
--   project_changes_select_by_permission נתנה SELECT על כל השורה לכל בעלת 'פרויקטים' —
--   כולל unit_price_snapshot ו-unit_cost_snapshot. RLS הוא ברמת-שורה ולא ברמת-עמודה,
--   ולכן policy לבדה אינה יכולה לקיים את ההכרעה.
--
-- שני חלקים, ואחד בלי השני חסר-ערך:
--   (1) הפונקציה מחזירה את ההיסטוריה עם הכסף מסונן לפי הקוראת.
--   (2) המדיניות הרחבה יורדת — אחרת הדפדפן קורא את הטבלה הגולמית והפונקציה היא קישוט.
--       הטבלה נשארת RLS-on בלי policy-קריאה => הנתיב היחיד הוא הפונקציה.
--
-- הדפוס אינו חדש: מופע שלישי של אותו שער — list_projects_overview (planned_revenue) ·
--   apply_scope_change (revenue_delta) · וזה. NULL ולא 0 (StatTile.jsx:25).
-- money_visible מוחזר במפורש כדי שהמסך יבחין בין "אין הרשאה" לבין "אין נתון" (S-26).
--
-- הוחל 14/08/2026 כשהטבלה החזיקה 0 שורות ואף מסך לא קרא אותה.
-- אומת בהתחזות בתוך טרנזקציה שגולגלה: דנה => 5.00/400.00, money_visible=true;
-- רונית => null/null, money_visible=false; ולשתיהן קריאה ישירה לטבלה מחזירה 0 שורות.

create or replace function public.list_project_changes(p_project_id integer)
  returns table (
    change_id           bigint,
    change_group_id     uuid,
    change_target       text,
    sku                 text,
    color               text,
    delta_qty           integer,
    unit_price_snapshot numeric,
    unit_cost_snapshot  numeric,
    revenue_delta       numeric,
    money_visible       boolean,
    reason              text,
    performed_by        text,
    created_at          timestamptz
  )
  language plpgsql stable security definer set search_path = ''
as $$
declare
  v_can_read_money boolean;
begin
  perform public.assert_module_permission('פרויקטים', array['edit', 'view']);

  select exists (
    select 1 from public.permissions p
     where p.role_id = (select public.current_user_role_id())
       and p.module_id = (select m.module_id from public.modules m where m.module_name = 'הצעות מחיר')
       and p.permission_level = any(array['edit', 'view'])
  ) into v_can_read_money;

  return query
  select c.change_id, c.change_group_id, c.change_target, c.sku, c.color, c.delta_qty,
         case when v_can_read_money then c.unit_price_snapshot end,
         case when v_can_read_money then c.unit_cost_snapshot  end,
         case when v_can_read_money then round(c.delta_qty * c.unit_price_snapshot, 2) end,
         v_can_read_money,
         c.reason, c.performed_by, c.created_at
    from public.project_changes c
   where c.project_id = p_project_id
   order by c.created_at desc, c.change_id desc;
end
$$;

revoke execute on function public.list_project_changes(integer) from public, anon;
grant  execute on function public.list_project_changes(integer) to authenticated;

drop policy "project_changes_select_by_permission" on public.project_changes;
