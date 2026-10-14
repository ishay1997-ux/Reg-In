-- =============================================================================
-- מודול 8 · דוח שכר מקצה לקצה · מיגרציה 3 (A) — ניסיונות שליחה ויומן המיילים
-- =============================================================================
-- why: כל שליחה (לרו"ח או סיכום אישי לדיילת) נרשמת כ"ניסיון" עם מצב שמור: בתור → נשלח
-- כרגע → נשלח / נכשל / לא ידוע. "לא ידוע" הוא מצב אמיתי (התשובה מ-Make לא הגיעה), ואסור
-- להפוך אותו ל"נכשל" — זה היה מזמין מייל כפול לרו"ח (חוזה D12, D15). שני אינדקסים חלקיים
-- מבטיחים שלא יהיו שני ניסיונות פעילים לאותו דוח או לאותה דיילת בו-זמנית.
-- ב-email_log: ערך חדש 'unknown', סוג ישות 'payroll_review', ועמודה intended_recipient —
-- כי המייל נמסר לכתובת הבדיקה של ישי (D11), ושתי הכתובות צריכות להישמר כראיה.
--
-- 🔑 expand: טבלה חדשה, עמודה חדשה (null), CHECK מורחב (ריכוך). שום ערך קיים לא נפסל.
-- 🔒 D6: RLS דלוק, אפס policies, revoke מלא מ-anon/authenticated.
-- =============================================================================

create table public.payroll_mail_attempts (
  attempt_id            bigint      generated always as identity primary key,
  kind                  text        not null check (kind in ('accountant', 'personal_review')),
  report_id             integer     null references public.salary_reports (report_id),
  -- בלי FK במכוון: payroll_review_recipients נוצרת במיגרציה 7 (B), והסדר בין הבונים לא
  -- אמור לתלות בה את הטבלה הזו.
  recipient_id          bigint      null,
  operation_id          uuid        null,
  state                 text        not null default 'queued'
                                    check (state in ('queued', 'sending', 'sent', 'failed', 'unknown')),
  retry_reason          text        not null default 'initial'
                                    check (retry_reason in ('initial', 'known_failure_retry',
                                                            'unknown_reviewed_resend', 'reminder')),
  prior_attempt_id      bigint      null references public.payroll_mail_attempts (attempt_id),
  intended_recipient    text        not null,
  delivered_recipient   text,
  redirected            boolean,
  template_name         text,
  template_sha256_used  text,
  subject               text,
  artifact_sha256       text,
  transport_http_status integer,
  error_code            text,
  error_detail          text        check (error_detail is null or length(error_detail) <= 500),
  created_by            text,
  created_at            timestamptz not null default now(),
  sending_started_at    timestamptz,
  completed_at          timestamptz,
  email_log_id          bigint,
  constraint payroll_mail_attempts_kind_target check (
    ((kind = 'accountant') = (report_id is not null))
    and ((kind = 'personal_review') = (recipient_id is not null))
  )
);

comment on table public.payroll_mail_attempts is
  'מ8 — כל ניסיון שליחה של דוח השכר לרו"ח או של סיכום אישי לדיילת. מצב sending שעבר 120 שניות נקרא "לא ידוע" (D12). deny-all: רק דרך פונקציות DEFINER.';

-- ניסיון פעיל אחד לכל דוח / לכל נמענת.
create unique index payroll_mail_attempts_accountant_active_uq
  on public.payroll_mail_attempts (report_id)
  where kind = 'accountant' and state in ('queued', 'sending');

create unique index payroll_mail_attempts_personal_active_uq
  on public.payroll_mail_attempts (recipient_id)
  where kind = 'personal_review' and state in ('queued', 'sending');

create index payroll_mail_attempts_report_id_idx on public.payroll_mail_attempts (report_id, attempt_id);
create index payroll_mail_attempts_recipient_id_idx on public.payroll_mail_attempts (recipient_id, attempt_id);
create index payroll_mail_attempts_prior_attempt_id_idx on public.payroll_mail_attempts (prior_attempt_id);
create index payroll_mail_attempts_operation_id_idx on public.payroll_mail_attempts (operation_id);
create index payroll_mail_attempts_queued_idx on public.payroll_mail_attempts (state, attempt_id)
  where state in ('queued', 'sending');

alter table public.payroll_mail_attempts enable row level security;
revoke all on table public.payroll_mail_attempts from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- email_log: ערכים חדשים ב-CHECK (ריכוך) + כתובת היעד המקורית.
-- -----------------------------------------------------------------------------
alter table public.email_log drop constraint email_log_entity_type_check;
alter table public.email_log add constraint email_log_entity_type_check
  check (entity_type = any (array['quote', 'shift', 'project', 'project_report', 'invoice',
                                  'salary_report', 'payroll_review']));

alter table public.email_log drop constraint email_log_status_check;
alter table public.email_log add constraint email_log_status_check
  check (status = any (array['sent', 'failed', 'unknown']));

alter table public.email_log add column intended_recipient text null;

comment on column public.email_log.intended_recipient is
  'מ8 — הכתובת שאליה המייל נועד. recipient = הכתובת שאליה נמסר בפועל (אחרי שומר הבדיקה D11). null בשורות ישנות.';

-- קריאת יומן הסיכומים האישיים: כספים edit בלבד (באותו דפוס של שאר הישויות).
create policy email_log_select_payroll_review on public.email_log
  for select to authenticated
  using (
    entity_type = 'payroll_review'
    and exists (
      select 1 from public.permissions p
       where p.role_id = (select public.current_user_role_id())
         and p.module_id = (select modules.module_id from public.modules where modules.module_name = 'כספים')
         and p.permission_level = 'edit'
    )
  );
