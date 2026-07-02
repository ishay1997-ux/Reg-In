Hi Claude,

We are preparing to move to the next phase of the project: **Module [MODULE_NUMBER]: [MODULE_NAME]**.
Your task in this turn is to act as our Lead Software Architect and Product Manager, preparing the official blueprint and implementation strategy for this module.

### ⚠️ Workflow & Plan Rules:
1. **Plan-then-Approve:** Do NOT write application code yet, and do NOT write the final file to disk. Present the full structural blueprint within your plan for my formal review and green light.
2. **Grounding & Citations:** Do not rely on chat memory or assumptions. Every factual claim regarding the existing code, DB, or configuration MUST be backed by an explicit file path and line number citation that you read in this turn.
3. **Hierarchy of Truth:** You must strictly resolve all contradictions based on our established hierarchy: `docs/schema.sql` (Highest) ➔ `PROJECT_MASTER.md` / Approved Spec ➔ Visual Mockups ➔ Previous Micro-Guides (Lowest).

Please read `PROJECT_MASTER.md` (specifically sections [RELEVANT_SECTIONS]), review the existing codebase, and analyze data schemas and future module dependencies. 

Your thinking process and the resulting guide must fulfill the following mandates:

### 1. 🔄 Sequence & Dependency Validation
Before mapping out the guide, challenge our workflow. Verify if developing *this specific module right now* is logically sound based on data model cross-references. 
- Are there prerequisites from other modules we skipped? 
- Will this architecture break or overcomplicate upcoming modules? 
- State your conclusion on the workflow sequence clearly at the beginning.

### 2. 🧠 Architectural Suggestions & Pro-Tips (Separate Proposals)
You have the creative freedom to suggest optimizations, modern patterns (e.g., standardizing soft deletes as 'active'/'inactive' status, React Hook Form + Zod), or missing edge cases. 
**Crucial:** Do NOT bake these suggestions into the core numbered steps of the blueprint yet. List them under a separate section called `"Claude's Optimization Proposals"` so they can be explicitly approved or rejected.

### 3. 🎯 Triage of Gaps & Questions
If you identify any contradictions, omissions, or ambiguities between the text spec, database schema, or visual mockups, halt and list them at the top of your response under **"Questions & Assumptions for Ishay"**, strictly divided into:
- 🛑 **Must Decide NOW:** Blockers that must be settled for Phase 1 (DB) and Phase 2 (UI) of this module.
- ⏳ **Can Decide LATER:** Lower-priority items we can defer, explicitly stating *at which future module or deployment stage* they will become critical.

### 📜 Expected Blueprint Structure (Granular Steps & Stopping Points)
The blueprint you present for `docs/micro_guides/REG-IN_מדריך_מיקרו_מודול_[MODULE_NUMBER].md` must break down each phase into **granular, sequentially numbered Steps (צעדים)**. Every single step MUST end with a clear, verifiable **Stopping Point (נקודת עצירה)** to ensure we test before moving forward.

**Formatting Requirement:** The final output guide content must be written in **clear Hebrew**, properly formatted, and fully wrapped inside a `<div dir="rtl">` tag for perfect RTL scannability.

Structure outline:
- **Context & Scope:** Brief architectural alignment, hardcoded constraints vs. dynamic DB routing, and layout strategy.
- **Phase 1: Infrastructure & DB (Numbered Steps):** Schema validation, constraints, soft-delete mechanisms, and core Seed/mock data generation scripts.
- **Phase 2: UI & Frontend Development (Numbered Steps):** Layout, views, components (utilizing shadcn/ui and Lucide elements), form states, client-side validation schemas, and local state handling.
- **Phase 3: Control & Integration (Numbered Steps):** Gatekeeping, backend integrations, regression testing parameters, system boundaries, and strict Git/Branch management guidelines (ensuring code remains on the feature branch with no premature PRs).
- **Phase 4: QA & Handoff (The UX/Logic Verification Matrix):** A comprehensive table listing detailed test scenarios, explicit user roles executing them, actions, and expected behaviors/results (Frontend alerts, DB blockages, RLS enforcement).

Please output your Sequence Assessment, Questions (if any), and the complete structured Blueprint for the micro-guide now.