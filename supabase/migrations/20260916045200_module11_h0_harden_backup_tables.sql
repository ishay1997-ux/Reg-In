-- why: שש טבלאות-גיבוי (bak_*) שנוצרו בזריעת מ11 ב-09–10/09/2026 נמדדו 16/09/2026 04:4X
-- (צעד 1.1 של מ11, ריענון schema.sql מול pg_catalog) ככאלה שאין עליהן RLS ושלתפקידי anon
-- ו-authenticated יש עליהן SELECT/INSERT/UPDATE/DELETE/TRUNCATE — ברירת-המחדל של Supabase
-- לטבלה חדשה ב-public. הן עותקים מלאים של projects (כולל משוב), assignments, hostesses
-- (ת"ז, טלפון, מייל, כתובת) ו-project_finance — כלומר המידע שה-RLS של טבלאות-המקור מגן עליו
-- היה נגיש דרך מפתח ה-anon הציבורי. אף קוד ב-src/ · scripts/ · supabase/functions/ אינו
-- קורא מהן (grep 16/09/2026: 0 מופעים). הסגירה כאן היא הגנתית ומוסיפה בלבד: שלילת כל
-- ההרשאות משני התפקידים + הפעלת RLS בלי policies (= deny-all מכוון, כמו login_attempts).
-- מחיקת הטבלאות עצמן היא הכרעת-ישי (מדריך-המיקרו של מ11 §9 D-8 — הגיבוי בתוך המסד הוא
-- מנגנון-השחזור היחיד עד שייכתב סקריפט-זריעה), ולכן אינה נעשית כאן.
-- ⚠️ הכרעת-ישי 16/09/2026: שערי-ההקלדה מוותרים לסשן זה ("על כולם"); ההחלה על-ידי קלוד.

do $$
declare
  t text;
begin
  foreach t in array array[
    'bak_assignments_20260909',
    'bak_assignments_20260910',
    'bak_hostesses_20260909',
    'bak_project_finance_20260910',
    'bak_projects_20260909',
    'bak_projects_20260910'
  ]
  loop
    if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
               where n.nspname = 'public' and c.relname = t and c.relkind = 'r') then
      execute format('revoke all privileges on table public.%I from anon, authenticated', t);
      execute format('alter table public.%I enable row level security', t);
      execute format(
        'comment on table public.%I is %L',
        t,
        'גיבוי-זריעה של מ11 (09–10/09/2026). deny-all מכוון: RLS דלוק בלי policies + אפס הרשאות ל-anon/authenticated (הוקשח 16/09/2026). נקרא רק בתפקיד postgres/service_role. מחיקה = הכרעת-ישי (module-11.md §9 D-8).'
      );
    end if;
  end loop;
end $$;
