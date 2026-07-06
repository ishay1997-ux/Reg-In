Hi Claude,

We are opening **Module [MODULE_NUMBER]: [MODULE_NAME]** (feature branch `[BRANCH_NAME]`).
Your task in this turn: act as Lead Software Architect and produce the module's **micro-guide** — the machine-actionable blueprint that a *future Claude session* will execute step by step.

### 🎯 Role & Audience (read this first — it shapes everything)
The micro-guide's **primary reader is a future Claude Code session with zero memory of this conversation**. Ishay/Amit will only: paste prompts, answer decision questions, and approve at phase boundaries. Therefore:
- Every step must be executable by Claude **without asking anything** that the guide could have answered.
- Write the guide in **full English** (machine-first precision). Hebrew appears ONLY as data — DB values (module/role names like 'לקוחות', 'מנכ"ל'), UI strings, and user-facing message texts. All chat reports to Ishay/Amit are always in **Hebrew**.
- Do not write for a human following a tutorial. Write for an agent: exact paths, exact commands, expected outputs, unambiguous stop conditions.

### ⚠️ Workflow & Plan Rules
1. **Plan-then-Approve:** present the full blueprint in chat for Ishay/Amit's review. Write `docs/micro_guides/module-[MODULE_NUMBER].md` to disk **only after explicit approval**.
2. **Grounding & Citations:** no chat memory, no assumptions. Every factual claim about existing code, DB, or config MUST cite a file path + line number you read in this turn.
3. **Hierarchy of Truth:** `docs/schema.sql` (highest) ➔ approved spec `docs/reference_spec/C5_*`+`C6_*` via `PROJECT_MASTER.md` ➔ mockups (`docs/mockups/`) ➔ previous micro-guides (lowest). Frozen spec files are never edited; intentional deviations are recorded in living docs with a "deviation from 5.x" note.
4. Read before writing: `CLAUDE.md`, `STATUS.md`, `docs/PROJECT_MASTER.md` (sections [RELEVANT_SECTIONS] **and** the full §7 registry), `docs/schema.sql`, the current codebase, and `docs/micro_guides/module-1.md` as the format exemplar.

### 🔄 Sequence & Dependency Validation
Before blueprinting, challenge the workflow itself: is building *this module now* sound given data-model cross-references? Missing prerequisites? Will this architecture strain upcoming modules? State your conclusion first.

### 🎯 Triage of Gaps & Questions
If you find contradictions/omissions/ambiguities between spec, schema, or mockups — halt and list them at the top under **"Questions & Assumptions for Ishay"**:
- 🛑 **Must decide NOW** — blocks Phase 1 (DB) or later phases of this module.
- ⏳ **Can decide LATER** — state at which future module/stage it becomes critical.
- 🧭 **Deviations from frozen spec** — record in living docs only, never edit `reference_spec/*`.
- 📌 **§7 cross-references** — cite item numbers that block (🛑) vs. relevant-but-deferred (⏳). Never restate their text.

### 🧠 Optimization Proposals (separate!)
You may suggest patterns/optimizations/edge-cases — but list them under a separate `"Claude's Optimization Proposals"` section for explicit approval. Do NOT bake unapproved suggestions into the numbered steps.

### 📜 Required Micro-Guide Structure (exactly these 9 sections)
Output file: `docs/micro_guides/module-[MODULE_NUMBER].md` (English filename — iron rule 11; English content per Role & Audience above).

1. **🟢 Live Status Header** — module, branch, owner, overall status, "Last updated", "**Active step: N**", and a step→status table using: ⬜ pending · 🔨 in progress · ✅ done · ⏸️ deferred (with target module) · ❌ blocked (with reason). This header is the single line of truth a fresh session reads first.
2. **📦 Context Packet for Claude** — module purpose in ≤3 lines; map of existing files to touch/reuse (paths + line refs); DB tables + relevant migrations; dependencies on other modules; spec sections (5.x) + mockup folders; environment facts (supabase client import path `@/supabaseClient`, dev server, RTL, etc.). Everything a zero-memory session needs to start working without exploration.
3. **🧭 Decisions Ledger** — table: §7 item / local decision · the ruling · who · date · which step it unblocks. Cite §7 numbers only.
4. **🛡️ Security & Auth Model Statement** (iron rule 9) — how this module leans on Module-1 auth: RLS policies per the §7.21 standard template (state the exact `module_name` string used in the policy), role/permission gates in UI (`SYSTEM_MODULES`/`isAllowed` patterns), session/OAuth handling, and explicitly accepted limitations.
5. **🏗️ Phase & Step Plan** — canonical phase order: **Phase 1 DB/RLS → Phase 2 Business Logic (`src/lib/` + `src/modules/NN_name/api.js` + unit tests; iron rule 14: UI never duplicates a formula) → Phase 3 UI → Phase 4 Control & Integration → Phase 5 QA & Handoff** (merge/adapt phases only with a stated reason). Every step specifies: **Goal · Files · What to do · Verification command + expected output · 🔻 stop-point tagged 🤖 or 👤**.
   - **🤖 (default):** Claude verifies by itself (SQL check, unit/E2E test, preview screenshot/snapshot) — reports the evidence and continues.
   - **👤 (human gate):** required ONLY at: end of every phase · §7/product decisions · before applying any migration (shared Supabase project!) · anything touching secrets/accounts/OAuth config · final DoD sign-off.
6. **📊 QA Matrix** — planned coverage per test type (Unit · Integration · E2E · Regression · UAT · Security/Pen · Performance · Usability · Compatibility) with an empty "as-run" column that the closing audit fills in. Align to the real infra: Vitest (`npm run test:run`), Playwright specs in `e2e/` (`npm run test:e2e`), CI (`.github/workflows/ci.yml`).
7. **✅ Definition of Done** — checkboxes: the canonical DoD from `docs/architecture_and_qa_roadmap.md` instantiated for this module + module-specific items (row counts, policies, flows). Includes: migration applied + `docs/schema.sql` snapshot updated + committed together (DB protocol in `CLAUDE.md`).
8. **🔄 Self-Update Protocol** — mandatory verbatim rules: (a) at every step transition, update the status header + step table **in the same session, before moving on**; (b) any deviation from the plan gets an inline "↳ as-built" note on the step + a line in section 9; (c) the repo's Stop hook (`.claude/hooks/check-docs-updated.sh`) blocks session end if module code under `src/modules/[MODULE_NUMBER]*_*/` changed but this guide didn't — keep it current, not as an afterthought; (d) end-of-session protocol in `CLAUDE.md` applies (CHANGELOG → CLAUDE_CODE_LOG → STATUS).
9. **📝 Deviations & Tech-Debt Log** — append-only dated lines; summarizes all "↳ as-built" notes and deferred items with their target module/milestone.

### ✍️ Machine-First Writing Rules
- Each step is self-contained: an agent landing on it cold can execute it from the step text + context packet alone.
- Prefer instructions + load-bearing skeletons (SQL policy templates, function signatures) over full code dumps — code is written live at build time, guided by the step. Include full SQL only where exactness is load-bearing (RLS policies, constraints).
- Every verification is a *command with an expected output* (e.g., `select count(*) from X;` → `N`), not "make sure it works".
- Hebrew comments in code follow iron rule 3 (why-first) — the guide states this once, not per step.

Now output: your Sequence Assessment, Questions & Assumptions (if any), Optimization Proposals, and the complete blueprint per the 9-section structure — in chat, for approval.
