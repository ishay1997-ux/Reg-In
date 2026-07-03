
We have completed the implementation phase for **Module [MODULE_NUMBER]: [MODULE_NAME]** on branch `[BRANCH_NAME]`. 
Your task now is to act as our Senior QA Engineer, Security Auditor, and Release Manager to conduct a comprehensive end-of-module review.

Do NOT write new application features. Your goal is to stress-test our current state, evaluate compliance with the Micro-Guide, and give a formal verdict on code readiness.

### ⚠️ Audit Rules:
1. **Assessment Only:** This is a review and verdict, not an execution step. Do NOT run `git merge`, `git push`, or open a PR yourself — that decision and action stay with Ishay.
2. **Grounding & Citations:** Do not rely on chat memory or assumptions. Every claim about RLS policies, code state, or test results MUST cite the exact file and line (or the exact query you ran and its actual result) that you checked in this turn.

Please audit the implemented code, the database migrations/constraints, and the Phase 4 Verification Matrix. Present your evaluation structured exactly as follows:

### 1. 📋 Definition-of-Done Checklist Walkthrough
Go through every checkbox in the guide's Definition of Done section, one by one. For each item, mark it ✅ or ❌ with the specific evidence (file/line, query result, or manual test) that justifies the mark — not a general impression.

### 2. 🛡️ Security & RLS Stress-Test Evaluation
Review the Supabase RLS policies and constraints established in this module.
- Are there any logical data leaks where a lower-privileged role can read/write restricted data?
- Does the system strictly enforce the new 'active'/'inactive' soft-delete protocol across all UI filters and DB queries?
- For at least the highest-risk scenarios in the Phase 4 Verification Matrix, independently re-verify the result against the actual policy definition — do not just trust a ✅ already marked in the guide.
- **Auth/security model regression:** re-verify the login security model still holds — the OAuth authorization gate (unknown/inactive accounts signed out), the account-lockout counter, and password/session handling — not only table RLS.
- Call out any potential security vulnerabilities or bypasses.

### 3. 🧠 Claude's Architectural Review & Pro-Tips (Free Hand)
You have complete freedom to judge the quality of the written code and UI/UX.
- Propose any refactoring or optimization for state management, API calls, or performance.
- Evaluate the UX smoothness (loading states, error boundaries, responsive layout via shadcn/ui).
- If you notice areas where the code became messy or bloated during fixes, point them out.

### 4. 🧹 Housekeeping Check
- Confirm `docs/CHANGELOG.md` was updated for this module (DB changes and code changes).
- Confirm `git status` on the branch is clean of temporary/debug files (no stray `console.log`, commented-out code, or scratch files).
- Run `npm run lint` — must be clean (the only automated check in the repo).
- Run a live **preview smoke test** of the module's key flows (per the verification workflow) and share proof (screenshot / logs / network).
- Provide an **explicit list of every file changed** in this module (code, DB/schema, docs).

### 5. 📊 QA Coverage Matrix (functional + non-functional)
Fill this table for THIS module — mark each test type ✅ done / ⚠️ partial / ❌ none / N-A, with a one-line justification (what was actually run, or why it doesn't apply at this stage). Be honest about gaps and defer them to Section 6 — do not over-claim. This mirrors the professional QA taxonomy so the academic report can cite real coverage.

**Functional:** Unit · Integration · End-to-End (E2E) · Regression · UAT (User Acceptance).
**Non-functional:** Security/Penetration · Performance/Load · Usability (UI/UX) · Compatibility (cross-browser/device).

| Test type | Status | Evidence / why |
|---|---|---|
| Unit | | |
| Integration | | |
| E2E | | |
| Regression | | |
| UAT | | |
| Security/Pen | | |
| Performance/Load | | |
| Usability (UI/UX) | | |
| Compatibility | | |

Note which gaps are acceptable-for-now (state the future module/milestone that closes them) versus a real blocker (→ Section 6).

### 6. 🛑 Open Issues - MUST FIX NOW (Blockers)
List any critical bugs, incomplete specs, failed test scenarios from the matrix, or RLS gaps that **must be resolved immediately** before this code touches any shared branch. If none exist, state "None".

### 7. ⏳ Open Issues - HANDLE LATER (Technical Debt)
List lower-priority improvements, minor UX polish, or architectural hooks that we can safely defer to future modules. For each item, explicitly state **at which future module or deployment stage** this issue must be reopened and solved.

### 👑 Final Merge Verdict
Provide a definitive, binary recommendation: Can we merge this branch into `dev`/`main` right now?
- **[YES]** - If the module is fully stable, secure, and compliant with the Definition of Done.
- **[NO]** - If there is even one blocker from Section 6. Provide a clear, 2-sentence justification for your verdict.

Please run your audit and output the review report now.