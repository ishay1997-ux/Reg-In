# Card: customer reports, polish for the conference

Deputy, 14.10 ~13:2x. Model: Opus, medium effort. The work needs UX judgment.

Ishay's words, 14.10 ~13:2x:
> *"בכל משטחי הלקוחות ממש חסר סוג לקוח לפי הרשימה הניפתחת... אם זול תכניס · וגם כתוב מה משמח זה מינוח לא מקצועי · וגם ממה חסר למנהלת להבין במה הם צריכים להשתפר על מה התלונות או שלא הבנתי את הגרפים"*

## Where
- Worktree `C:\Users\ishay\Reg-In-payroll-d`, new branch from origin/main. Coordinate with the deputy: another builder may be using this worktree. If it is busy, create a fresh worktree with `git worktree add`, then run `npm ci`.
- Rules:
  - Commit by explicit pathspec.
  - Do not push, merge or deploy.
  - Do not apply DB changes. Write a migration FILE only, and the deputy applies it.
  - Live DB: SELECT only.
- Files:
  - module 11 customer surfaces: `src/modules/11_reports/`, `reportsCatalog.js:207`;
  - copy: `src/lib/onboardingCopy.m11.customers.js`;
  - the RPCs in `supabase/migrations/*module11*`;
  - customer type: `customers.customer_type` with `CUSTOMER_TYPE_LABELS`, shown in `src/modules/02_customers/CustomerDetailsPage.jsx:828`.

## 🔴 Priority raised (14.10 ~13:0x): Ishay presents מ2 "מבט-על הנהלה" and מ3 "סגירת הצעות" on stage tomorrow. His new asks on these two:
> *"חסר לי גם פה לפי סוג לקוח פרטי ממשלתי וכו... וגם מסנן לבחירת שנה · תקן אותי אבל ב 2 הגרפים בסגירת הצעות בדרך כלל כותבים כמות גם?"*

Ruling 12:5x: **nothing in the reports changes without his approval**, and wording is the top priority. Phase 1 output for these items is "today → proposed", plus the size. The deputy brings it to him.

Investigate these FIRST, before the customer-feedback items below:
- **A. Customer-type filter on מ2 and מ3:**
  - Which RPCs feed them?
  - Do they accept a customer filter today?
  - Cost options, each with a size:
    - (i) the client filters by a customer_id list derived from type;
    - (ii) a new optional RPC param. That is a signature change, so a migration file plus check ①, and it must not break existing callers.
  - The labels come from `CUSTOMER_TYPE_LABELS`.
- **B. Year selector:** the period chips today are החודש · 3 חודשים · 12 חודשים · השנה · הכל. How do they map to p_from/p_to? Cost of adding "שנה: 2025 / 2026"? What does the comparison line ("אשתקד") do then?
- **C. The 2 charts on מ3 show amounts only** (e.g. "הצעות מחיר שנדחו לפי סיבה", y-axis in ₪). Industry practice is to show the count too: bar labels "12 · 287K ₪", or a toggle סכום / כמות, or the count in the tooltip. Is the count already returned by the RPC? Recommend one option and give its exact labels. Check the `dataviz` skill rules.
- **D. 🔴 Test customers leak into the customer dropdown on stage:** `UAT-2026-10-08` and `UAT-2026-10-08-b` are visible in the מ2 customer filter.
  - Find them (SELECT), what created them (probably the 08.10 UAT script), and which projects and quotes hang on them.
  - Find how the dropdown filters (active only?).
  - Propose the safest fix: rename to realistic names, deactivate/archive if there is a status, or exclude by flag. NO deletion.
  - Write a data script file with a backup, a gate and a reverse step, and send it to the deputy.

- **E. Rejection-reasons analysis on מ3 reads as "just many rows".** Ishay, 13:1x: *"חסר תרשים מתאים אולי עוגה? אממ מה שנראלך לגבי ניתוח של סיבות הדחיה של הצעות מחיר יש שם רק מלא שורות"*.
  - Ishay, 13:1x: it is the FIRST chart on מ3 (*"זה הגרף הראשון שם"*). Rework that chart. Bottom line from him: *"חשוב ש2 המשטחים האלא יהיו טובים"*.
  - Propose ONE visual that answers "על מה אנחנו מפסידים הצעות" at a glance.
  - Deputy's prior, to be checked against the `dataviz` skill: a pie is weak with 7 categories. Prefer sorted horizontal bars, each with count + share of the lost amount ("מחיר · 12 הצעות · 40%"). Group the long tail as "אחר". Collapse the detailed table under it ("פירוט לפי הצעה").
  - Deliver before → after with exact labels, a mock description, and the size.

## Phase 1: investigate (~20 min), then STOP and report to the deputy
1. **Wording.** List every visible occurrence of "מה משמח" / "מה מכעיס" (titles, chart labels, hints, catalog question). Propose professional Hebrew, e.g. `מה הלקוחות משבחים` / `על מה הלקוחות מתלוננים`, or `נקודות חוזק` / `נקודות לשיפור`. Follow the `ui-copy-and-onboarding-levels` skill.
2. **"What should we improve".** Open the customer-feedback surface the way a manager does. Read the code and the RPC, and if needed take a read-only screenshot of production as the CEO test user, `E2E_CEO_*` via Playwright.
   - Answer: can a manager see, within 10 seconds, the top complaints, how often each occurs, and the trend?
   - If not, why: is the negative-reasons table hidden, the graph unclear, or are counts missing?
   - Note Ishay's ruling of 23.09 (see the comment at `onboardingCopy.m11.customers.js:58`): the chart shows positives, and the negative reasons live in a table.
   - Propose the minimal change that answers "במה צריך להשתפר" at a glance.
3. **Customer type.** In which customer surfaces (module 11 and the customer list) is `customer_type` missing? What would it cost:
   - **client only**, if the RPC already returns it;
   - **RPC change**, a migration file;
   - **filter vs column vs grouping**.
   Give a size for each.

Report: findings with file:line, proposals with exact Hebrew strings, sizes, and which items fit TODAY (≤45 min total, no risky RPC rewrites).

## Phase 2: only after the deputy says go
Build the approved items. Add tests, run `npm run gate` and confirm exit 0, then report the SHAs.
