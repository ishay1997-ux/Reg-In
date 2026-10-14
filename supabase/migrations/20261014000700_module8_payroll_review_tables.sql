-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 7 (B) — טבלאות בדיקת הדיילות
-- =============================================================================
-- why: לפני שהשעות ננעלות לדוח, כל דיילת מקבלת סיכום אישי בקישור ומאשרת או מדווחת
-- טעות (§7.107). הטבלאות כאן שומרות את הבקשה, את הסיכום האישי שנשלח (שורות "בטוחות"
-- בלי בנק ובלי ת"ז), את הקישורים (רק גיבוב — לעולם לא הטוקן הגולמי), את התשובות, את
-- הפניות, את תיקוני המקור ואת יומן הפעולות.
--
-- 🔴 חוזה D6: RLS דלוק, **אפס policies**, ו-revoke מלא מ-anon/authenticated. כל קריאה
-- וכתיבה עוברת דרך פונקציות SECURITY DEFINER (מיגרציות 11–13). הטבלאות מחזיקות מייל
-- דיילת, ראיות וטקסט חופשי — ולכן גם משתמש מחובר לא נוגע בהן ישירות.
-- 🔑 מצבים נגזרים של הבקשה ("ממתין לתגובות", "מוכן") **אינם נשמרים** — הם היו מתיישנים.
-- 🔑 expand בלבד: טבלאות חדשות, שום קוד פרוס לא קורא אותן. נדרשת לפני מיגרציה 8 של A
-- (שקוראת את payroll_reviews).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. הבקשה — סבב בדיקה אחד לחודש/סוג/דוח-מקור
-- -----------------------------------------------------------------------------
create table public.payroll_reviews (
  review_id                bigint      generated always as identity primary key,
  period                   date        not null check (extract(day from period) = 1),
  report_kind              text        not null check (report_kind in ('regular', 'supplement')),
  original_report_id       integer     null references public.salary_reports (report_id),
  revision                 integer     not null default 1 check (revision >= 1),
  preview_version          text        not null,
  status                   text        not null default 'open'
                                       check (status in ('open', 'issuing', 'issued', 'cancelled')),
  manager_approved_version text,
  manager_approved_by      text,
  manager_approved_at      timestamptz,
  response_deadline        timestamptz,
  distributed_at           timestamptz,
  report_id                integer     null references public.salary_reports (report_id),
  cancelled_reason         text,
  created_by               text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint payroll_reviews_kind_original_check check (
    (report_kind = 'regular' and original_report_id is null)
    or (report_kind = 'supplement' and original_report_id is not null)
  )
);

comment on table public.payroll_reviews is
  'מ8 — סבב בדיקת דיילות לפני הפקת דוח שכר. מצבים נגזרים אינם נשמרים. deny-all: רק דרך פונקציות DEFINER.';

-- בקשה פעילה אחת לכל זהות דוח. coalesce כי null אינו שווה ל-null באינדקס ייחודי.
create unique index payroll_reviews_active_identity_uq
  on public.payroll_reviews (period, report_kind, coalesce(original_report_id, 0))
  where status in ('open', 'issuing');

create index payroll_reviews_original_report_id_idx on public.payroll_reviews (original_report_id);
create index payroll_reviews_report_id_idx on public.payroll_reviews (report_id);

create trigger payroll_reviews_set_updated_at
  before update on public.payroll_reviews
  for each row execute function extensions.moddatetime('updated_at');


-- -----------------------------------------------------------------------------
-- 2. הנמענת — סיכום אישי קפוא אחד לכל דיילת בכל גרסה
-- -----------------------------------------------------------------------------
-- hostess_id בלי FK במכוון: השורה היא ראיה היסטורית של מה שנשלח, ומחיקת דיילת לא
-- אמורה לחסום אותה או למחוק אותה (אותה החלטה כמו recipient_id ב-payroll_mail_attempts).
create table public.payroll_review_recipients (
  recipient_id      bigint        generated always as identity primary key,
  review_id         bigint        not null references public.payroll_reviews (review_id),
  hostess_id        bigint        not null,
  revision          integer       not null check (revision >= 1),
  digest            text          not null,
  rows              jsonb         not null check (jsonb_typeof(rows) = 'array'),
  total             numeric(12,2) not null,
  hostess_name      text          not null,
  is_current        boolean       not null default true,
  state             text          not null default 'awaiting'
                                  check (state in ('awaiting', 'hostess_approved', 'objection_open',
                                                   'manager_approved_no_response', 'manager_resolved',
                                                   'superseded')),
  decided_kind      text          check (decided_kind in ('hostess', 'manager')),
  decided_at        timestamptz,
  decided_by        text,
  decision_reason   text,
  decision_evidence text,
  contact_note      text,
  created_at        timestamptz   not null default now()
);

comment on table public.payroll_review_recipients is
  'מ8 — הסיכום האישי שנשלח לדיילת (שורות בטוחות, בלי בנק/ת"ז) והחלטתה. is_current=false = הוחלף בגרסה חדשה.';

create unique index payroll_review_recipients_current_uq
  on public.payroll_review_recipients (review_id, hostess_id)
  where is_current;

create index payroll_review_recipients_review_id_idx on public.payroll_review_recipients (review_id);


-- -----------------------------------------------------------------------------
-- 3. הקישורים — רק גיבוב sha256 של הטוקן, לעולם לא הטוקן עצמו (D10)
-- -----------------------------------------------------------------------------
create table public.payroll_review_tokens (
  token_id       bigint      generated always as identity primary key,
  recipient_id   bigint      not null references public.payroll_review_recipients (recipient_id),
  token_hash     bytea       not null unique,
  expires_at     timestamptz not null,
  revoked_at     timestamptz,
  revoked_reason text,
  created_at     timestamptz not null default now()
);

comment on table public.payroll_review_tokens is
  'מ8 — מאמת לקישור האישי: sha256 של הטוקן בלבד. הטוקן הגולמי מוחזר פעם אחת לפונקציית השרת ולא נשמר.';

create index payroll_review_tokens_recipient_id_idx on public.payroll_review_tokens (recipient_id);


-- -----------------------------------------------------------------------------
-- 4. התשובות — append-only. client_request_id ייחודי = לחיצה כפולה מחזירה אותה תשובה
-- -----------------------------------------------------------------------------
create table public.payroll_review_responses (
  response_id       bigint      generated always as identity primary key,
  recipient_id      bigint      not null references public.payroll_review_recipients (recipient_id),
  token_id          bigint      not null references public.payroll_review_tokens (token_id),
  action            text        not null check (action in ('approve', 'objection')),
  client_request_id uuid        not null unique,
  result            jsonb       not null,
  created_at        timestamptz not null default now()
);

comment on table public.payroll_review_responses is
  'מ8 — כל תשובה מהקישור האישי, כפי שנשמרה. לא מתעדכנת ולא נמחקת.';

create index payroll_review_responses_recipient_id_idx on public.payroll_review_responses (recipient_id);
create index payroll_review_responses_token_id_idx on public.payroll_review_responses (token_id);


-- -----------------------------------------------------------------------------
-- 5. הפניות — "יש טעות" לפני ההפקה או אחריה
-- -----------------------------------------------------------------------------
-- resolved_noted = "טופל מחוץ לדוח" (תיקון בודק 1, F5): התלונה התקבלה אבל מטופלת בהשלמה
-- או אצל רואה החשבון. לעולם לא מוצג כ"תוקן".
create table public.payroll_review_cases (
  case_id           bigint      generated always as identity primary key,
  review_id         bigint      not null references public.payroll_reviews (review_id),
  recipient_id      bigint      not null references public.payroll_review_recipients (recipient_id),
  hostess_id        bigint      not null,
  phase             text        not null check (phase in ('pre_issue', 'post_issue')),
  report_id         integer     null references public.salary_reports (report_id),
  -- F11 (הכרעת ישי 14.10 00:10, "רק משמרות ושעות"): הדיילת בודקת משמרות ושעות בלבד, ולכן אין
  -- קטגוריות של תעריף/בונוס/נסיעות. not_worked = "משמרת שלא עבדתי בה".
  category          text        not null
                                check (category in ('hours', 'missing_shift', 'not_worked', 'other')),
  affected_rows     jsonb       not null default '[]'::jsonb check (jsonb_typeof(affected_rows) = 'array'),
  missing_shift     boolean     not null default false,
  description       text        not null check (length(description) between 1 and 2000),
  -- מספר מוצע — רק לפנייה על שעות, ובין 0 ל-24 (F11).
  suggested_value   numeric     null,
  status            text        not null default 'open'
                                check (status in ('open', 'correction_pending', 'resolved_accepted',
                                                  'resolved_rejected', 'resolved_noted', 'closed_post_issue')),
  revision          integer     not null default 1 check (revision >= 1),
  resolution_reason text,
  resolved_by       text,
  resolved_at       timestamptz,
  response_id       bigint      null references public.payroll_review_responses (response_id),
  created_at        timestamptz not null default now(),
  constraint payroll_review_cases_suggested_check check (
    suggested_value is null or (category = 'hours' and suggested_value between 0 and 24)
  ),
  constraint payroll_review_cases_phase_report_check check (
    (phase = 'pre_issue' and report_id is null) or (phase = 'post_issue' and report_id is not null)
  )
);

comment on table public.payroll_review_cases is
  'מ8 — פנייה של דיילת ("יש טעות"). לפני ההפקה חוסמת את ההפקה עד החלטה; אחרי ההפקה נרשמת לטיפול ואינה משנה כסף.';

create index payroll_review_cases_review_id_idx on public.payroll_review_cases (review_id);
create index payroll_review_cases_recipient_id_idx on public.payroll_review_cases (recipient_id);
create index payroll_review_cases_report_id_idx on public.payroll_review_cases (report_id);
create index payroll_review_cases_response_id_idx on public.payroll_review_cases (response_id);


-- -----------------------------------------------------------------------------
-- 6. תיקוני מקור — יומן לפני/אחרי לכל תיקון שעות/בונוס שטרם נכנס לדוח
-- -----------------------------------------------------------------------------
create table public.payroll_source_corrections (
  correction_id     bigint      generated always as identity primary key,
  project_id        integer     not null,
  hostess_id        bigint      not null,
  assignment_number integer     not null,
  case_id           bigint      null references public.payroll_review_cases (case_id),
  field             text        not null check (field in ('actual_hours', 'personal_bonus')),
  before_value      numeric,
  after_value       numeric,
  reason            text        not null,
  actor_email       text        not null,
  -- בזכות איזו הרשאה תוקן (שינוי חוזה F5b, 13.10): 'projects' = עריכת פרויקטים ·
  -- 'finance_case' = עריכת כספים, ורק דרך פנייה של הדיילת על השיבוץ הזה.
  actor_authority   text        not null check (actor_authority in ('projects', 'finance_case')),
  created_at        timestamptz not null default now()
);

comment on table public.payroll_source_corrections is
  'מ8 — יומן תיקוני מקור (שעות/בונוס) לשיבוץ שטרם נכלל בדוח: ערך לפני, אחרי, סיבה ומי תיקן.';

create index payroll_source_corrections_case_id_idx on public.payroll_source_corrections (case_id);
create index payroll_source_corrections_assignment_idx
  on public.payroll_source_corrections (project_id, hostess_id, assignment_number);


-- -----------------------------------------------------------------------------
-- 7. יומן הבדיקה — כל פעולה של מנהלת/דיילת, כולל מפתחות אידמפוטנטיות של הפצה
-- -----------------------------------------------------------------------------
create table public.payroll_review_events (
  event_id     bigint      generated always as identity primary key,
  review_id    bigint      not null references public.payroll_reviews (review_id),
  recipient_id bigint      null references public.payroll_review_recipients (recipient_id),
  case_id      bigint      null references public.payroll_review_cases (case_id),
  event_type   text        not null,
  actor        text,
  payload      jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

comment on table public.payroll_review_events is
  'מ8 — יומן פעולות סבב הבדיקה (יצירה, אישור טיוטה, מועד אחרון, הפצה, החלטות). append-only.';

create index payroll_review_events_review_id_idx on public.payroll_review_events (review_id, created_at);
create index payroll_review_events_recipient_id_idx on public.payroll_review_events (recipient_id);
create index payroll_review_events_case_id_idx on public.payroll_review_events (case_id);
-- חיפוש מפתח אידמפוטנטיות של הפצה (distribute_begin): request_id בתוך ה-payload.
create index payroll_review_events_request_id_idx
  on public.payroll_review_events ((payload ->> 'request_id'))
  where payload ? 'request_id';


-- -----------------------------------------------------------------------------
-- 8. מונה הגבלת קצב לדף הציבורי — אותה צורה כמו feedback_rpc_calls, טבלה נפרדת
-- -----------------------------------------------------------------------------
-- טבלה נפרדת ולא שיתוף: רענון של דף הבדיקה לא אמור לאכול ממכסת דף המשוב (אותו נימוק
-- כמו ב-20260827155303).
create table public.payroll_review_rpc_calls (
  ip        inet        not null,
  called_at timestamptz not null default now()
);

comment on table public.payroll_review_rpc_calls is
  'מ8 — מונה הגבלת קצב לדף הבדיקה האישי (120/IP/שעה). deny-all.';

create index payroll_review_rpc_calls_ip_called_at_idx on public.payroll_review_rpc_calls (ip, called_at);


-- -----------------------------------------------------------------------------
-- 9. D6 — RLS דלוק, אפס policies, ושום הרשאת טבלה לתפקידי הלקוח
-- -----------------------------------------------------------------------------
alter table public.payroll_reviews            enable row level security;
alter table public.payroll_review_recipients  enable row level security;
alter table public.payroll_review_tokens      enable row level security;
alter table public.payroll_review_responses   enable row level security;
alter table public.payroll_review_cases       enable row level security;
alter table public.payroll_source_corrections enable row level security;
alter table public.payroll_review_events      enable row level security;
alter table public.payroll_review_rpc_calls   enable row level security;

revoke all on table
  public.payroll_reviews,
  public.payroll_review_recipients,
  public.payroll_review_tokens,
  public.payroll_review_responses,
  public.payroll_review_cases,
  public.payroll_source_corrections,
  public.payroll_review_events,
  public.payroll_review_rpc_calls
from public, anon, authenticated;
