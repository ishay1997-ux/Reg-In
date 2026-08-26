# Module 8 (Finance & Event Closing) — Discovery Log

> Reader: the NEXT Discovery, not the build session. English per repo convention.
> Evidence trail per stage; the Hebrew ruling lives in `processes-approved.md` (SSOT).

## Session 1 — 26/08/2026 (Fable 5, ultracode)

### Stage 0 — intake (completed 26/08/2026 ~11:15)

- **Context:** module 5 is being BUILT in parallel on `ishay/module-5-logistics` (mid gate-1.6, uncommitted micro-guide edit). This session is read-only on m5 files; pathspec commits only; shared-register write-backs deferred until the m5 session is between phases (per module_08_finance.md §⑥ parallelism note, 26/08).
- **Folder check (0א🅰️):** `ls docs/specs/` → no `module_08_*` existed. Started from zero despite STATUS narrating otherwise for other modules.
- **Classification (0א🅱️):** dual archetype — Screens + Others'-columns. Not an engine (no cron; all transitions user-driven; the awaiting_invoice→…→finished transitions have NO writer today).
- **Method:** 4 parallel read-only sweep agents (Sonnet) via Workflow (`wf_5a4e86d7-5a9`), ~921K tokens, 4/4 landed, 0 errors. Raw outputs copied into `stage0-sweeps/`. Live-DB access verified (project `yfeovxppnfoafmfbdfvh`) — unlike the 26/08 00:12 session which had no MCP auth.
- **Ledger:** 141 rows (97 C5/C6 after declared merges + 28 contracts + 16 data findings) in `processes-approved.md`. 20 open items distilled for rulings rounds.

**Key surprises (full detail in stage0-sweeps/):**
1. M8's server side is ALREADY BUILT and 100% unused: `set_project_finance_fields` (gated 'כספים', 0 callers), `finance` bucket (4 policies, 0 objects), 3 seeded mail templates (invoice + salary never sent once — 0 email_log rows ever).
2. M6 already sends the feedback survey (`mark_feedback_survey_sent`, gate 'פרויקטים') — ruled §7.39/㉜; M8 only receives the score.
3. No RPC moves a project out of `awaiting_invoice`/`awaiting_payment` or into `finished` — M8's core transitions are unbuilt.
4. Ghost columns: `assignments.personal_bonus`/`salary_report_id` — zero touches anywhere (code + prosrc), 27/27 rows at defaults.
5. `feedback_status` CHECK values `completed`/`no_response` have no writer.
6. Live PII gap: hostess bank columns readable by any 'דיילות' view/edit role (open half of §7.63; precedent = product_costs split).
7. `deriveCustomerMetrics` averages ALL scored projects (no status filter) and the gap is live-reachable (finance RPC has no status gate).
8. Guide staleness caught: module_08_finance.md §② lists §7.57 as open — register shows 🟢 closed 12/07/2026 (manual, param not seeded). Also §7.79/§7.80 open items exist beyond the launch prompt's list.
9. C5-internal contradictions newly surfaced (not in §7): 3-way salary-file format; "חיוב על שינויים" revenue component absent from canonical formula; bonus-division method unspecified (mooted by §7.19 deletion); archive-gate vs "לא ענה" tension.

### Stage-0 harvest ledger (4 lines, per template)
1. Rounds: 0 with Ishay (stage is mechanical by design); he sent 4 mid-flight steering notes (stale mockups · bidirectional debts · diagrams+mirror tags · DB-changes captured after processes) — all absorbed without a stop.
2. Did not fire this stage: §5 world-research (fires in Stage 1) · design/browser tools (Stage 2) · reality-rulings register (no rulings yet).
3. Template wrong/missing: nothing measured yet; the ⟦EX⟧ "surface ≈ 85K tokens" not yet re-measured for m8.
4. Who caught structural findings: sweeps were agent+self work; Ishay's steering note "מה מודול 8 צריך להשלים לאחרים ומה אחרים לו" pre-empted the reverse-direction sweep (already planned per template — tie). Ratio to date: no Ishay-caught misses yet (stage had no human-facing output before Stop 1).

**Next:** Stop 1 presented in chat. Then Stage 1-א: process map + surface list (M) for approval. Boundary question queued first: salary-report screen M8 vs M11.
