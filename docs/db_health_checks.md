# DB Health Checks — REG-IN

> **Machine-first (English; Hebrew only as data).** Thirteen read-only checks that answer one
> question: **did anything about the database's shape change without anyone deciding it should?**
> They are **not** a migration gate and **not** a test suite — nothing runs them automatically.
> Run them by hand around risky work: before and after a schema migration, before a module close,
> and after any parallel-session DB work.
>
> **Born 02/09/2026**, from two sessions cross-checking each other around the `N2` contact
> consolidation. **Written down because until that moment the battery existed only in chat** —
> the same failure mode that nearly lost an approved mockup the same morning.
> 🔴 **And it is written HERE, with a pointer from `supabase/migrations/CLAUDE.md`, on purpose:**
> that file auto-loads the moment a session touches a migration, which is exactly when this is
> needed. A file under `docs/` with no pointer from a load path is a file nobody reads
> (`docs/CLAUDE.md`, the placement rule).

## How to read a result — the rule that outranks every number below

🔴 **An empty list is never the output. The output is `checked N · failed 0`.**
"0 failures out of 19" and "0 failures out of 0" render identically, and the second one means the
check silently did not run. **Every check here prints its denominator.**
*(This is the DB restatement of a rule already live for browser measurements —
`e2e/CLAUDE.md`, "מדידה שהמכנה שלה 0 אינה ירוקה — היא לא רצה". 02/09/2026 established it holds
for SQL too, after a real near-miss on check 7.)*

🔑 **And the second rule, learned the same day: a criterion names things, it does not count them.**
"the list did not grow" passes while a genuine gap swaps places with a benign one. Every criterion
below that could be a count is written as **a named set** instead. A name not on the list is a
finding; a number that moved is nothing.

⚠️ **Numbers recorded here are a dated baseline, not a target.** They rise as modules land. What
must not change is the **failure count** and the **named sets**.

---

## 1 · Constraint inventory — quantitative

```sql
select count(*) filter (where c.contype='c') as check_constraints,
       count(*) filter (where c.contype='f') as foreign_keys,
       count(*) filter (where c.contype='u') as unique_constraints,
       count(*) filter (where c.contype='p') as primary_keys
  from pg_constraint c
  join pg_class t on t.oid=c.conrelid
  join pg_namespace n on n.oid=t.relnamespace
 where n.nspname='public';
```

**Baseline 02/09/2026 21:4X (after m9 phase 1): 67 · 35 · 11 · 27.** *(02/09 morning: 67 · 33 · 11 · 26 · 27/08: 66 · 32 · 11 · 25.)*
**Pass = no number went DOWN.** A drop means a constraint was removed, which is never accidental.

⚠️ **A partial unique INDEX is not a unique CONSTRAINT.** `customer_contacts_one_primary_per_customer`
added zero to the `u` column — correct, not a miss. Index-level facts belong to check 4.

## 2 · Constraint inventory — qualitative (the diff that matters)

```sql
select c.conrelid::regclass::text as tbl, c.conname, c.contype,
       pg_get_constraintdef(c.oid) as def
  from pg_constraint c
  join pg_class t on t.oid=c.conrelid
  join pg_namespace n on n.oid=t.relnamespace
 where n.nspname='public' and c.contype in ('f','c','u')
 order by 1,3,2;
```

**Pass = no row disappeared** versus the previous run. This is the one that catches a
`drop constraint` that rode along inside an unrelated migration — check 1 cannot, because a
simultaneous add masks it.

## 3 · RLS per table

```sql
select t.relname as tbl, t.relrowsecurity as rls_on,
       (select count(*) from pg_policy p where p.polrelid=t.oid) as policies
  from pg_class t join pg_namespace n on n.oid=t.relnamespace
 where n.nspname='public' and t.relkind='r'
 order by rls_on, policies, t.relname;
```

**Baseline 02/09/2026 21:4X (after m9 phase 1): 29 tables, `rls_on` true on 29/29, four with zero policies** *(the same four; `notification_preferences` arrived with its 3 self policies in the same migration)*. *(02/09 morning: 28 / 28.)*

🔴 **Pass is NOT "the zero-policy list did not grow" — that phrasing was wrong and was replaced.**
**Pass = `rls_on` is true everywhere, AND every zero-policy table is reachable through exactly one
known `security definer` function.** Deny-all plus a single gatekeeper function is a deliberate
pattern here, not an omission — so the criterion has to check the *reason*, not the count.

| Table | Its one gatekeeper |
|---|---|
| `login_attempts` · `login_rpc_calls` | `register_failed_login` (login flow) |
| `feedback_rpc_calls` | `feedback_rate_limit` |
| `project_changes` | `list_project_changes` (read) · `apply_scope_change` (write) |
| `seed_registry` | `seed_register` · `seed_backdate_quote` · `seed_backdate_project` · `seed_reset` (M7 demo seed, 03/09/2026 — `comment on table` states the deny-all intent) |

Verify the reason, don't assume it:

```sql
select p.proname, p.prosecdef
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.prokind='f'
   and pg_get_functiondef(p.oid) ilike '%<table_name>%';
```

⚠️ `prokind='f'` is required — `pg_get_functiondef` throws on aggregates.

## 4 · Foreign keys without a leading index

```sql
select c.conrelid::regclass::text as tbl, a.attname as fk_col
  from pg_constraint c
  join pg_namespace n on n.oid=c.connamespace
  join unnest(c.conkey) with ordinality k(attnum,ord) on ord=1
  join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum
 where c.contype='f' and n.nspname='public'
   and not exists (select 1 from pg_index i
                    where i.indrelid=c.conrelid and (i.indkey::int2[])[0]=a.attnum);
```

**Pass = exactly these two, by name: `permissions.module_id`, `users.role_id`.**
Both are tiny lookup tables (9 and 5 rows). **Do not "fix" them** — an index there costs writes and
buys nothing. A third name is a finding.

## 5 · 1NF — array and JSON columns

```sql
select table_name, column_name, data_type, udt_name
  from information_schema.columns
 where table_schema='public'
   and (data_type='ARRAY' or data_type in ('json','jsonb'))
 order by 1,2;
```

**Pass = zero rows.** `hostesses.languages` was the one offender; `N1` normalised it into
`hostess_languages` (33 rows — see check 13 for what the numbers there do and do not mean).
A row reappearing is a regression, not a new feature.

## 6 · Snapshot drift (2NF/3NF)

```sql
select count(*) as assignments_total,
       count(*) filter (where a.event_date is distinct from p.final_event_date) as event_date_out_of_sync,
       count(*) filter (where a.hourly_rate_snapshot is distinct from h.hourly_rate) as rate_differs
  from assignments a
  join projects p using(project_id)
  join hostesses h using(hostess_id);
```

**Pass = `event_date_out_of_sync` is 0.** *(Baseline 02/09: 27 · 0 · 0.)*
🚫 **`rate_differs` is NOT a gate.** It leaves 0 the moment anyone updates a hostess's rate, and
that is correct — the snapshot is a deliberate freeze. Reporting it as a failure trains people to
ignore this check.

## 7 · `updated_at` triggers

```sql
with has_col as (
  select table_name from information_schema.columns
   where table_schema='public' and column_name='updated_at'),
has_trg as (
  select distinct c.relname as table_name
    from pg_trigger t
    join pg_class c on c.oid=t.tgrelid
    join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and not t.tgisinternal
     and pg_get_triggerdef(t.oid) ilike '%updated_at%')
select (select count(*) from has_col) as tables_with_column,
       (select count(*) from has_col where table_name in (select table_name from has_trg)) as with_trigger,
       coalesce((select json_agg(table_name order by table_name) from has_col
                  where table_name not in (select table_name from has_trg)), '[]'::json) as missing;
```

**Baseline 02/09/2026 21:4X (after m9 phase 1): 20 · 20 · `[]`.** *(02/09 morning: 19 · 19.)* **Pass = `tables_with_column` equals `with_trigger`.**

🔴 **This check is why the denominator rule at the top exists.** An earlier version returned only
the `missing` list, and an empty result there means *either* "all good" *or* "no table has the
column at all" — indistinguishable. Print all three numbers, always.

⚠️ A new trigger must call `extensions.moddatetime`, not `public.moddatetime`
(`supabase/migrations/CLAUDE.md`), and `pg_get_triggerdef` prints the name without its schema — so
grepping the trigger definition for `extensions.` returns "not found" on a perfectly good trigger.

## 8 · `search_path` on functions

```sql
select p.proname, p.prosecdef,
       coalesce(array_to_string(p.proconfig,','),'(no search_path)') as config
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public'
 order by p.prosecdef desc, p.proname;
```

**Pass = zero rows reading `(no search_path)`.** *(Baseline 02/09 21:4X, after m9 phase 1: 45 functions — all configured; m9 added
`list_hostesses_below_min_wage`. 02/09 morning: 44 — 42 `security definer` + 2 invoker.)* **Count the failures, never the total** — the total has
already gone stale twice (29 → 37 → 44).

## 9 · Supabase advisors

Tool `get_advisors`, `type: security`, then `performance`.

**Pass = no finding outside these known families:**
- `rls_enabled_no_policy` — the five tables of check 3, each with its named gatekeeper (`seed_registry` joined 03/09/2026; advisors measured 49 findings that night, all in the known families).
- `anon_security_definer_function_executable` — six deliberately public functions:
  `check_login_lock`, `register_failed_login` (login, pre-auth) ·
  `get_shift_invite`, `respond_to_shift_invite`, `get_feedback_page`, `submit_feedback`
  (token-gated pages opened from an email link by someone who is not signed in).
- `auth_leaked_password_protection` — off, known.

🔴 **`authenticated_security_definer_function_executable` is EXCLUDED, permanently.**
It fires on every `security definer` function reachable by a signed-in user — that is, on **the
security model itself**, which is DEFINER functions with the permission check on the inside. It can
never reach zero without changing the architecture, so as a gate it is pure noise, and a gate nobody
can pass is a gate everybody ignores. **Check 11 replaces it** and tests the thing that actually
matters. *(Ruled 02/09/2026 by both sessions independently.)*

## 10 · No residue of a dropped column — three dimensions, not one

Replaced the N2 parent/child integrity check on 02/09/2026, when `N2ד` dropped
`customers.contact_name/phone/email` and took its parent away. **Generalised deliberately: this is
the check to run after ANY column drop, not a leftover from one refactor.**

🔴 **Reads are the easy half, and moving them WELL is what hides the other half.** The N2 rewire
moved every read to `primaryContact()` and looked finished — while the save path still WROTE the
three columns, because they were `NOT NULL`. **The precondition for a drop is that deployed code no
longer WRITES the column; "no longer reads it" is not the same claim and can be true while the drop
is still fatal.**

🔑 **And do not grep for the column name. Enumerate the queries.** The worst instance found on
02/09 was `rows.map((r) => r.email)` — a generic property on a variable named `r`. **No search for
`contact_name`, `customers.`, or the table name can reach it.** The method that works:

1. List every query that touches the table (`.from('<table>')`, RPC bodies, raw SQL in specs).
   **This is a finite list, which is what makes "I finished" a claim you can defend.**
2. For each, write down the SHAPE it returns.
3. Follow that value to every consumer — components, helpers, props, test fixtures — regardless of
   what the variable is called.

**Three dimensions, and all three must be clean:**

| Dimension | What to check | Real miss on 02/09 |
|---|---|---|
| **Reads** | every consumer of every query | `marketing.js` → empty BCC in production |
| **Writes** | `insert`/`update` payloads, RPC bodies | the `NOT NULL` that forced `N2ג` |
| **Tests / E2E** | fixtures, `page.route` mocks, direct DB setup, **and testids** | **2 of 3 blockers lived in `e2e/`** |

⚠️ **The third dimension is the one everyone forgets, and here it is not theory:** `grep` over `src/`
alone would have reported "zero residue" while `e2e/load-failure-guards` inserted the columns
directly (`42703` at the drop) and `e2e/quote-email` selected them for its candidate pool.
🔴 **And a fourth instance surfaced only when the suite was actually RUN:** `e2e/customers.spec.js`
still targeted `customer-form-contact-name`/`-phone`/`-email`, testids the N2 form rebuild had
deleted hours earlier. **It had been red since `53b562b` and nobody knew — `test:e2e` does not run in
CI** (root `CLAUDE.md`). ⇒ **After a drop, RUN the E2E suite. Reading it is not enough.**

**In the database:**

```sql
select (select count(*) from information_schema.columns
         where table_schema='public' and table_name='<table>'
           and column_name in ('<col1>','<col2>')) as columns_still_there,
       (select coalesce(json_agg(p.proname),'[]'::json)
          from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.prokind='f' and p.prosrc ~ '<col1>') as functions_referencing,
       (select coalesce(json_agg(polname),'[]'::json) from pg_policy pol
          join pg_class t on t.oid=pol.polrelid where t.relname='<table>'
           and pg_get_expr(pol.polqual,pol.polrelid) ~ '<col1>') as policies_referencing;
```

**Pass = `columns_still_there` is 0 and both lists are empty.**

🔴 **Two traps that produced a false alarm each on 02/09, in two different sessions, on the same day:**

**① Anchor the column name to a word boundary.** A residue regex written as `c\.contact_name`
matched **`cc.contact_name`** — where `cc` is the CHILD table, the correct place for the value to
live. It accused `replace_customer_contacts`, the very function that implements the migration.
Write `\ycontact_name\y`, and **then read the body before reporting anything.**
*(The mirror-image trap: an over-broad `<table>[^;]*\.(phone|email)` matched `auth.email()` and the
users table's `u.email`. Both directions cost a session's time; neither was a real finding.)*

**② Count checks are only valid while the test suite is NOT running.** `customers` and
`customer_contacts` are tables the E2E specs write to and clean up. A count taken mid-run catches a
transient row: on 02/09 a session measured `10 · 10 · 10`, reported it as *"a customer was created
after the drop and got a primary — proof the new path works forwards"*, and it was an
`e2e/customers.spec.js` fixture that its own `afterAll` deleted seconds later. **The real number was
9.** ⇒ **Before drawing a conclusion from an unexpected count, check `created_at` and check whether
a suite is running.**
⚠️ **Write the function regex TIGHT.** A broad one (`'<table>[^;]*\.(phone|email)'`) matched
`auth.email()` and the users table's `u.email` and falsely accused
`approve_quote_and_create_project` — a function that had silently broken quote approval once before,
so the false alarm was maximally alarming. **Match the column name as a word; then confirm by
reading the body.**

**N2's own closing numbers, 02/09/2026:** three columns gone · `customers` down to 9 columns ·
9 customers · 9 contact rows · 9 primaries · 0 without a primary · full E2E suite run, not just read.

## 11 · Every reachable DEFINER function has a permission gate inside

Replaces the excluded advisor family from check 9. **Three things make this correct, and all three
were learned by getting it wrong first:**

**① The gate has three idioms in this codebase, not one.** `assert_module_permission(...)` ·
`finance_assert_writable(...)` (a wrapper whose first statement is `assert_module_permission
('כספים', array['edit'])`) · and an inline `select 1 from public.permissions join users join modules`
with `auth.email()`. A flat search for the first idiom alone reports **25 false findings**.

**② So the test must be TRANSITIVE** — a function that calls a gated function is gated.

**③ And ACL outranks the body.** A function granted only to `postgres`/`service_role` is
unreachable from the browser; that closes the question and no body inspection is needed. Without
this, every internal helper ever added fails the gate.

```sql
with recursive fns as (
  select p.oid, p.proname, regexp_replace(p.prosrc,'\s+',' ','g') as src, p.prosecdef,
         exists (select 1 from pg_trigger t where t.tgfoid=p.oid and not t.tgisinternal) as is_trigger_fn,
         coalesce(array_to_string(p.proacl,','),'(default)') as acl
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prokind='f'
),
gated as (
  select oid, proname from fns
   where src ilike '%assert_module_permission%'
      or src ilike '%current_user_role_id%'
      or src ilike '%from public.permissions%'
  union
  select f.oid, f.proname from fns f
    join gated g on f.src ilike '%'||g.proname||'%'
   where f.oid <> g.oid
)
select f.proname, f.acl
  from fns f
 where f.prosecdef
   and not f.is_trigger_fn
   and (f.acl = '(default)' or f.acl like '%authenticated=%' or f.acl like '%anon=%')
   and not exists (select 1 from gated g where g.oid=f.oid)
 order by f.proname;
```

**Pass = exactly these eight names, and no others:**

| Function | Why it legitimately has no permission gate |
|---|---|
| `current_user_role_id` | The primitive every other gate is built on — gating it would be circular |
| `check_login_lock` · `register_failed_login` · `reset_login_attempts` | Pre-auth / self-scoped; there is no user yet to authorise |
| `get_shift_invite` · `respond_to_shift_invite` | Gated by a **token**, deliberately, for a hostess who is not a system user |
| `get_feedback_page` · `submit_feedback` | Same — token-gated public feedback page; both open with `feedback_rate_limit()` |

**A ninth name is a real finding.** Trigger functions are excluded because PostgREST cannot reach
them at all.

## 12 · ACL of every new `security definer` function

```sql
select p.proname, coalesce(array_to_string(p.proacl,' | '),'(default → PUBLIC)') as acl
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.prosecdef
 order by p.proname;
```

🩸 **A newly created function gets `EXECUTE` granted to PUBLIC by Postgres default**, and in
Supabase `anon` is granted **by name**, so `revoke ... from public` alone does not remove it.
This cost a follow-up migration once already (`H5` → `H5b`, 28/08/2026).
**Pass = no business function shows `anon=` or `(default → PUBLIC)`.**
Reference for a correctly closed one: `replace_customer_contacts` reads
`postgres=X | authenticated=X | service_role=X`.

## 13 · `hostesses.languages` normalisation holds (N1)

```sql
select (select count(*) from hostess_languages) as language_rows,
       (select count(distinct hostess_id) from hostess_languages) as hostesses_covered,
       (select count(*) from hostesses) as hostesses_total,
       (select count(*) from information_schema.columns
         where table_schema='public' and table_name='hostesses'
           and column_name='languages') as legacy_column_still_present;
```

**Baseline 02/09/2026: 33 · 20 · 26 · 0.** Paired with check 5 — check 5 proves the array column is
gone (`legacy_column_still_present` = 0 confirms it directly), this proves the data survived the
move rather than being dropped along with it.

🔴 **Read `hostesses_covered` and `hostesses_total` as two different facts, because they were
conflated once already.** 20 of 26 hostesses carry at least one language row; **six carry none, and
that is data, not a bug** — nobody ever entered a language for them. The first draft of this file
recorded "33 rows across 26 hostesses", which quietly asserts full coverage. **Caught by running the
query instead of copying the number.** => **Pass = `language_rows` did not drop and
`legacy_column_still_present` is 0.** `hostesses_covered` is a report.

---

## Provenance

Compiled 02/09/2026 by two sessions running the battery independently and comparing results. The
cross-check earned its keep: it caught the ambiguous empty result in check 7, the three gate idioms
and the ACL dimension in check 11, the count-versus-name flaw in check 3, and two functions missing
from check 11's allow-list. **Neither session found all four alone**, and in the two cases where a
query reported a finding, both sessions read the function bodies before reporting — and both times
the finding evaporated. **Read the code before you report a number from this file.**
