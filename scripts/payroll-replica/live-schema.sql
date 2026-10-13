-- REG-IN · payroll replica · step 2: the live tables the payroll flow reads or writes.
--
-- Source: generated 13.10.2026 from the live catalog (project yfeovxppnfoafmfbdfvh, PG 17.6) with
-- SELECT-only queries over pg_attribute / pg_constraint / pg_index / pg_trigger / pg_policies.
-- NOT from docs/schema.sql: that file is an annotated snapshot last refreshed 16/09/2026 and is
-- not executable SQL.
--
-- Deliberate gaps (and why):
--   * Only 14 of the ~38 live tables. The rest are not read by any payroll function.
--   * FKs to tables that are not here are left out: projects.customer_id → customers,
--     projects.quote_id → quotes, logistics → products / quote_services / project_changes.
--   * Policies are reproduced only for the tables payroll touches, plus the four finance
--     policies on storage.objects (migration 4 rewrites three of them).
--   * `moddatetime` is the extensions.moddatetime stub from bootstrap.sql.

create sequence public.roles_role_id_seq;
create sequence public.modules_module_id_seq;
create sequence public.params_param_id_seq;
create sequence public.projects_project_id_seq;
create sequence public.salary_reports_report_id_seq;

create table public.roles (
  role_id integer default nextval('public.roles_role_id_seq'::regclass) not null,
  role_name text not null
);
create table public.modules (
  module_id integer default nextval('public.modules_module_id_seq'::regclass) not null,
  module_name text not null
);
create table public.permissions (
  role_id integer not null,
  module_id integer not null,
  permission_level text not null
);
create table public.users (
  email text not null,
  role_id integer not null,
  full_name text not null,
  status text default 'active'::text not null,
  phone text
);
create table public.params (
  param_id integer default nextval('public.params_param_id_seq'::regclass) not null,
  param_name text not null,
  param_value text not null,
  param_type text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  owner_role_id integer
);
create table public.hostesses (
  id_number text not null,
  full_name text not null,
  phone text not null,
  email text not null,
  city text not null,
  hourly_rate numeric not null,
  rating integer,
  status text default 'active'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  hostess_id bigint generated always as identity not null,
  address text,
  lat numeric,
  lng numeric,
  has_car boolean default false not null
);
create table public.hostess_bank_details (
  hostess_id bigint not null,
  bank_name text not null,
  bank_branch text not null,
  bank_account text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
create table public.projects (
  project_id integer default nextval('public.projects_project_id_seq'::regclass) not null,
  quote_id integer not null,
  owner_email text not null,
  final_event_date date not null,
  final_location text not null,
  required_hostess_count integer not null,
  project_status text default 'not_started'::text not null,
  invoice_sent boolean default false not null,
  feedback_status text default 'not_sent'::text not null,
  actual_guests integer,
  actual_hours numeric,
  cancel_reason text,
  payment_date date,
  feedback_score integer,
  negative_feedback_reason text,
  feedback_notes text,
  summary_report_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  event_name text,
  customer_id bigint,
  final_start_time time without time zone,
  final_end_time time without time zone,
  lat numeric,
  lng numeric,
  customer_name text,
  owner_name text,
  owner_phone text,
  cancelled_at timestamp with time zone,
  cancelled_by text,
  cancel_type text,
  operationally_closed_at timestamp with time zone,
  operationally_closed_by text,
  invoice_sent_at timestamp with time zone,
  feedback_token text,
  positive_feedback_reason text,
  negative_feedback_reasons text[] default '{}'::text[],
  positive_feedback_reasons text[] default '{}'::text[]
);
create table public.assignments (
  project_id integer not null,
  assignment_number integer not null,
  salary_report_id integer,
  assignment_status text default 'pending'::text not null,
  hourly_rate_snapshot numeric not null,
  actual_hours numeric default 0 not null,
  personal_bonus numeric default 0 not null,
  reminder_sent boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  hostess_id bigint not null,
  responded_at timestamp with time zone,
  invite_token text,
  invite_sent_at timestamp with time zone,
  travel_amount numeric(12,2) default 0 not null,
  is_shift_lead boolean default false not null,
  event_date date not null,
  attendance_status text,
  lateness_level text,
  no_show_reason text,
  released_from_status text,
  recommended_rank integer,
  recommended_rank_set_at timestamp with time zone
);
create table public.salary_reports (
  report_id integer default nextval('public.salary_reports_report_id_seq'::regclass) not null,
  sent_date date,
  report_file_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  period date not null,
  send_status text default 'pending'::text not null,
  total_amount numeric(12,2)
);
create table public.salary_report_lines (
  line_id bigint generated always as identity not null,
  report_id integer not null,
  hostess_id bigint not null,
  hostess_name text not null,
  id_number text not null,
  source_project_id integer not null,
  line_basis text not null,
  hours numeric(12,2) default 0 not null,
  rate numeric(12,2) not null,
  bonus numeric(12,2),
  travel numeric(12,2),
  line_total numeric(12,2) not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
create table public.email_log (
  email_log_id bigint generated always as identity not null,
  entity_type text not null,
  entity_id bigint not null,
  recipient text not null,
  template_name text,
  subject text,
  status text not null,
  error_message text,
  sent_by_email text,
  created_at timestamp with time zone default now() not null
);
create table public.logistics (
  project_id integer not null,
  sku text not null,
  serial_number integer not null,
  planned_qty integer not null,
  actual_qty integer default 0 not null,
  item_status text default 'not_started'::text not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  quote_service_line_id bigint,
  project_change_id bigint,
  color text,
  expected_arrival_date date,
  actual_arrival_date date,
  actual_qty_autofilled boolean default false not null
);
create table public.feedback_rpc_calls (
  ip inet not null,
  called_at timestamp with time zone default now() not null
);

alter sequence public.roles_role_id_seq owned by public.roles.role_id;
alter sequence public.modules_module_id_seq owned by public.modules.module_id;
alter sequence public.params_param_id_seq owned by public.params.param_id;
alter sequence public.projects_project_id_seq owned by public.projects.project_id;
alter sequence public.salary_reports_report_id_seq owned by public.salary_reports.report_id;

-- constraints (live names and definitions)
alter table public.roles add constraint roles_pkey PRIMARY KEY (role_id);
alter table public.roles add constraint roles_role_name_key UNIQUE (role_name);
alter table public.modules add constraint modules_pkey PRIMARY KEY (module_id);
alter table public.modules add constraint modules_module_name_key UNIQUE (module_name);
alter table public.permissions add constraint permissions_pkey PRIMARY KEY (role_id, module_id);
alter table public.permissions add constraint permissions_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(module_id) ON DELETE CASCADE;
alter table public.permissions add constraint permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;
alter table public.permissions add constraint permissions_permission_level_check CHECK ((permission_level = ANY (ARRAY['edit'::text, 'view'::text, 'blocked'::text])));
alter table public.users add constraint users_pkey PRIMARY KEY (email);
alter table public.users add constraint users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE RESTRICT;
alter table public.users add constraint users_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])));
alter table public.params add constraint params_pkey PRIMARY KEY (param_id);
alter table public.params add constraint params_param_name_key UNIQUE (param_name);
alter table public.params add constraint params_owner_role_id_fkey FOREIGN KEY (owner_role_id) REFERENCES public.roles(role_id) ON UPDATE RESTRICT ON DELETE SET NULL;
alter table public.params add constraint params_param_type_check CHECK ((param_type = ANY (ARRAY['pricing_timing'::text, 'control_alerts'::text, 'smart_match'::text, 'templates'::text, 'integration_tech'::text, 'shift_invites'::text])));
alter table public.hostesses add constraint hostesses_pkey PRIMARY KEY (hostess_id);
alter table public.hostesses add constraint hostesses_id_number_key UNIQUE (id_number);
alter table public.hostesses add constraint hostesses_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
alter table public.hostesses add constraint hostesses_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])));
alter table public.hostess_bank_details add constraint hostess_bank_details_pkey PRIMARY KEY (hostess_id);
alter table public.hostess_bank_details add constraint hostess_bank_details_hostess_id_fkey FOREIGN KEY (hostess_id) REFERENCES public.hostesses(hostess_id) ON UPDATE RESTRICT ON DELETE CASCADE;
alter table public.projects add constraint projects_pkey PRIMARY KEY (project_id);
alter table public.projects add constraint projects_feedback_token_key UNIQUE (feedback_token);
alter table public.projects add constraint projects_quote_id_key UNIQUE (quote_id);
alter table public.projects add constraint projects_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(email) ON DELETE RESTRICT;
alter table public.projects add constraint projects_operationally_closed_by_fkey FOREIGN KEY (operationally_closed_by) REFERENCES public.users(email) ON DELETE RESTRICT;
alter table public.projects add constraint projects_owner_email_fkey FOREIGN KEY (owner_email) REFERENCES public.users(email) ON DELETE RESTRICT;
alter table public.projects add constraint projects_cancel_type_check CHECK (((cancel_type IS NULL) OR (cancel_type = ANY (ARRAY['customer'::text, 'force_majeure'::text, 'other'::text]))));
alter table public.projects add constraint projects_closed_needs_report CHECK (((project_status <> ALL (ARRAY['awaiting_invoice'::text, 'awaiting_payment'::text, 'finished'::text])) OR (summary_report_url IS NOT NULL)));
alter table public.projects add constraint projects_project_status_check CHECK ((project_status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'ready'::text, 'event_finished'::text, 'awaiting_invoice'::text, 'awaiting_payment'::text, 'finished'::text, 'cancelled'::text])));
alter table public.projects add constraint projects_required_hostess_count_check CHECK ((required_hostess_count > 0));
alter table public.assignments add constraint assignments_pkey PRIMARY KEY (project_id, hostess_id, assignment_number);
alter table public.assignments add constraint assignments_invite_token_key UNIQUE (invite_token);
alter table public.assignments add constraint assignments_hostess_id_fkey FOREIGN KEY (hostess_id) REFERENCES public.hostesses(hostess_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
alter table public.assignments add constraint assignments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;
alter table public.assignments add constraint assignments_assignment_status_check CHECK ((assignment_status = ANY (ARRAY['pending'::text, 'confirmed_available'::text, 'declined'::text, 'finally_approved'::text, 'released'::text, 'approval_withdrawn'::text])));
alter table public.assignments add constraint assignments_attendance_shape CHECK ((((attendance_status IS NULL) AND (lateness_level IS NULL) AND (no_show_reason IS NULL)) OR ((attendance_status = 'arrived'::text) AND (lateness_level IS NULL) AND (no_show_reason IS NULL)) OR ((attendance_status = 'late'::text) AND (lateness_level IS NOT NULL) AND (no_show_reason IS NULL)) OR ((attendance_status = 'no_show'::text) AND (lateness_level IS NULL) AND (no_show_reason IS NOT NULL))));
alter table public.assignments add constraint assignments_attendance_status_check CHECK ((attendance_status = ANY (ARRAY['arrived'::text, 'late'::text, 'no_show'::text])));
alter table public.assignments add constraint assignments_no_show_zero_hours CHECK (((attendance_status IS DISTINCT FROM 'no_show'::text) OR (actual_hours = (0)::numeric)));
alter table public.assignments add constraint assignments_released_from_status_check CHECK (((released_from_status IS NULL) OR (released_from_status = ANY (ARRAY['pending'::text, 'confirmed_available'::text, 'declined'::text, 'finally_approved'::text, 'released'::text, 'approval_withdrawn'::text]))));
alter table public.salary_reports add constraint salary_reports_pkey PRIMARY KEY (report_id);
alter table public.salary_reports add constraint salary_reports_period_key UNIQUE (period);
alter table public.salary_reports add constraint salary_reports_period_first_of_month CHECK ((EXTRACT(day FROM period) = (1)::numeric));
alter table public.salary_reports add constraint salary_reports_send_status_check CHECK ((send_status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text])));
alter table public.assignments add constraint assignments_salary_report_id_fkey FOREIGN KEY (salary_report_id) REFERENCES public.salary_reports(report_id) ON DELETE RESTRICT;
alter table public.salary_report_lines add constraint salary_report_lines_pkey PRIMARY KEY (line_id);
alter table public.salary_report_lines add constraint salary_report_lines_hostess_id_fkey FOREIGN KEY (hostess_id) REFERENCES public.hostesses(hostess_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
alter table public.salary_report_lines add constraint salary_report_lines_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.salary_reports(report_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
alter table public.salary_report_lines add constraint salary_report_lines_source_project_id_fkey FOREIGN KEY (source_project_id) REFERENCES public.projects(project_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
alter table public.salary_report_lines add constraint salary_report_lines_line_basis_check CHECK ((line_basis = ANY (ARRAY['actual'::text, 'cancellation_compensation'::text])));
alter table public.email_log add constraint email_log_pkey PRIMARY KEY (email_log_id);
alter table public.email_log add constraint email_log_entity_type_check CHECK ((entity_type = ANY (ARRAY['quote'::text, 'shift'::text, 'project'::text, 'project_report'::text, 'invoice'::text, 'salary_report'::text])));
alter table public.email_log add constraint email_log_status_check CHECK ((status = ANY (ARRAY['sent'::text, 'failed'::text])));
alter table public.logistics add constraint logistics_pkey PRIMARY KEY (project_id, sku, serial_number);
alter table public.logistics add constraint logistics_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(project_id) ON DELETE CASCADE;
alter table public.logistics add constraint logistics_item_status_check CHECK ((item_status = ANY (ARRAY['not_started'::text, 'ordered'::text, 'ready'::text])));

-- indexes (live)
CREATE INDEX params_owner_role_id_idx ON public.params USING btree (owner_role_id);
CREATE INDEX projects_owner_email_idx ON public.projects USING btree (owner_email);
CREATE INDEX assignments_salary_report_id_idx ON public.assignments USING btree (salary_report_id);
CREATE INDEX assignments_hostess_id_idx ON public.assignments USING btree (hostess_id);
CREATE UNIQUE INDEX assignments_one_event_per_day ON public.assignments USING btree (hostess_id, event_date) WHERE (assignment_status = 'finally_approved'::text);
CREATE UNIQUE INDEX assignments_one_shift_lead_per_project ON public.assignments USING btree (project_id) WHERE is_shift_lead;
CREATE INDEX salary_report_lines_source_project_id_idx ON public.salary_report_lines USING btree (source_project_id);
CREATE INDEX salary_report_lines_hostess_id_idx ON public.salary_report_lines USING btree (hostess_id);
CREATE INDEX salary_report_lines_report_id_idx ON public.salary_report_lines USING btree (report_id);
CREATE INDEX idx_email_log_entity ON public.email_log USING btree (entity_type, entity_id, created_at DESC);
CREATE INDEX feedback_rpc_calls_ip_called_at_idx ON public.feedback_rpc_calls USING btree (ip, called_at);

alter table public.roles enable row level security;
alter table public.modules enable row level security;
alter table public.permissions enable row level security;
alter table public.users enable row level security;
alter table public.params enable row level security;
alter table public.hostesses enable row level security;
alter table public.hostess_bank_details enable row level security;
alter table public.projects enable row level security;
alter table public.assignments enable row level security;
alter table public.salary_reports enable row level security;
alter table public.salary_report_lines enable row level security;
alter table public.email_log enable row level security;
alter table public.logistics enable row level security;
alter table public.feedback_rpc_calls enable row level security;
