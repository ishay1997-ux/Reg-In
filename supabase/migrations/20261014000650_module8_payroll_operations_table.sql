-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 6b (A) — טבלת פעולות ההפקה
-- =============================================================================
-- why: "אשר והפק" הוא תהליך של כמה צעדים (צילום נתונים → בניית קובץ → העלאה → חתימה →
-- שליחה), וכל צעד יכול להיקטע. כל הפקה היא "פעולה" עם מזהה שהדפדפן יוצר (מפתח
-- אידמפוטנטיות): לחיצה כפולה, טאב שני או חידוש אחרי קריסה מגיעים לאותה פעולה.
-- נוצרת כאן, לפני מיגרציות 7–13 של B, כי בדיקת המוכנות והביטול של B קוראים אותה
-- (תיקון F8). ה-FK ל-payroll_reviews נוסף במיגרציה 14, אחרי ש-B יוצר את הטבלה.
--
-- 🔑 expand בלבד. 🔒 D6: RLS דלוק, אפס policies, revoke מלא מ-anon/authenticated.
-- =============================================================================

create table public.payroll_operations (
  operation_id            uuid        primary key,
  review_id               bigint      not null,
  period                  date        not null check (extract(day from period) = 1),
  report_kind             text        not null check (report_kind in ('regular', 'supplement')),
  original_report_id      integer     null references public.salary_reports (report_id),
  expected_version        text        not null,
  state                   text        not null default 'preparing'
                                      check (state in ('preparing', 'prepared', 'committed', 'failed', 'superseded')),
  failure_code            text,
  failure_detail          text        check (failure_detail is null or length(failure_detail) <= 500),
  actor_email             text,
  prepare_attempt         integer     not null default 0,
  reserved_report_id      integer,
  reserved_supplement_seq integer,
  generated_at            timestamptz,
  artifact_key            text,
  artifact_sha256         text,
  artifact_size           integer,
  artifact_mime           text,
  artifact_filename       text,
  report_id               integer     null references public.salary_reports (report_id),
  accountant_attempt_id   bigint      null references public.payroll_mail_attempts (attempt_id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.payroll_operations is
  'מ8 — פעולת הפקה סופית אחת (מפתח אידמפוטנטיות מהדפדפן). preparing → prepared → committed, או failed / superseded. deny-all: רק דרך פונקציות DEFINER.';

-- פעולה פעילה אחת לכל זהות דוח.
create unique index payroll_operations_active_identity_uq
  on public.payroll_operations (period, report_kind, coalesce(original_report_id, 0))
  where state in ('preparing', 'prepared');

create index payroll_operations_review_id_idx on public.payroll_operations (review_id);
create index payroll_operations_original_report_id_idx on public.payroll_operations (original_report_id);
create index payroll_operations_report_id_idx on public.payroll_operations (report_id);
create index payroll_operations_accountant_attempt_id_idx on public.payroll_operations (accountant_attempt_id);

-- updated_at זז בכל צעד: כך "בהכנה" שלא זז 120 שניות מזוהה כתקוע (next_action='resume').
create trigger payroll_operations_set_updated_at
  before update on public.payroll_operations
  for each row execute function extensions.moddatetime('updated_at');

alter table public.payroll_operations enable row level security;
revoke all on table public.payroll_operations from public, anon, authenticated;
