-- STUB — replica only, never a migration. Loaded by run.mjs ONLY when the real migration 7
-- (`*_module8_payroll_review_tables.sql`, owned by builder B) is not in supabase/migrations.
--
-- Minimal shape of B's review tables: just the columns A's functions read (payroll_preview,
-- payroll_report_list/detail, the legacy writer's PERIOD_IN_REVIEW check, payroll_attempt_claim,
-- payroll_commit). Once B's branch is merged, the real migration replaces this file.

create table public.payroll_reviews (
  review_id                bigint generated always as identity primary key,
  period                   date not null,
  report_kind              text not null,
  original_report_id       integer null references public.salary_reports (report_id),
  revision                 integer not null default 1,
  preview_version          text not null,
  status                   text not null default 'open',
  manager_approved_version text,
  response_deadline        timestamptz,
  report_id                integer null references public.salary_reports (report_id),
  updated_at               timestamptz not null default now()
);
create unique index payroll_reviews_active_identity_uq
  on public.payroll_reviews (period, report_kind, coalesce(original_report_id, 0))
  where status in ('open', 'issuing');

create table public.payroll_review_recipients (
  recipient_id bigint generated always as identity primary key,
  review_id    bigint not null references public.payroll_reviews (review_id),
  hostess_id   bigint not null,
  hostess_name text not null,
  is_current   boolean not null default true,
  state        text not null default 'awaiting'
);

create table public.payroll_review_cases (
  case_id           bigint generated always as identity primary key,
  review_id         bigint not null references public.payroll_reviews (review_id),
  recipient_id      bigint not null references public.payroll_review_recipients (recipient_id),
  hostess_id        bigint not null,
  phase             text not null,
  report_id         integer null references public.salary_reports (report_id),
  category          text not null,
  description       text not null,
  suggested_value   numeric,
  status            text not null default 'open',
  resolution_reason text,
  created_at        timestamptz not null default now()
);

alter table public.payroll_reviews enable row level security;
alter table public.payroll_review_recipients enable row level security;
alter table public.payroll_review_cases enable row level security;
revoke all on table public.payroll_reviews, public.payroll_review_recipients, public.payroll_review_cases
  from public, anon, authenticated;
