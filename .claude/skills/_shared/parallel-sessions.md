# Concurrency and session-to-session communication

Read this whenever more than one session is (or is about to be) alive. Iron rule 16
operationalized. **Nothing here depends on any particular role** — Ishay runs sessions in
parallel regardless of who is in them.

> *(Rescued 05/08/2026 from `work-manager/references/concurrency.md` when the work-manager
> role left the active track. Three bullets that were pure role-routing were pruned —
> exchange-digests, answering-in-Ishay's-place, and the manager framing in the header. The
> pre-removal original is preserved verbatim under `docs/archive/work-manager/`.)*

## Before every write

- `git status` + mtimes + clock, **that same turn**. Fresh mtimes (~10 min) ⇒ a
  session is alive and writing ⇒ back off.
- While any other session lives: never touch `STATUS.md`, the LOG, or the plan file.
  **Queue your entries in the session scratchpad (outside the repo), not in your
  head** — a queue held in narration dies with the session; a scratchpad file
  survives a crash. Say you're queuing, and land the queue the moment the arena
  clears.
- Stage and commit **by explicit pathspec — and the pathspec must be on the
  `commit`, not only the `add`:** `git commit -- <paths>`, never `git add -A`.
  **The index is shared:** another session's earlier `git add` rides along on
  *your* `git commit`. *(710's ledger 6: a one-file commit swept in
  nine builder files, including a migration.)*
  And the sharper trap behind it: on 31/07/2026 rounds got mixed
  *without* -A, because `STATUS.md` carried both sessions' uncommitted edits and
  one session committed it by name. Committing a shared file commits *everyone's*
  pending lines in it — check `git diff` of that file before staging.
- **Arena facts go stale within a single session** (710 evidence, 01/08): a file
  measured free at planning was staged by the parallel session minutes later.
  Re-measure ownership immediately before writing, never once at planning.
- The moment Ishay says a new session is about to start: land your pending writes
  and push immediately — clear the arena before it opens.
- New files in paths nobody else touches are always safe; shared files are not.
- A file changing under your read mid-edit is normal here: re-read, check whether
  it was a landed commit (rebase your edit on it) or live editing (back off).
- Stop-hook demands while another session works: judge whose debt it is. Yours ⇒
  comply. Another session's ⇒ explain to Ishay and wait. Never write merely to
  silence the hook.

## Direct session-to-session communication (Ishay's ruling, 01/08/2026)

Sessions talk **directly** — Ishay is not a courier. The mechanism in this
environment is the session-management MCP (load via ToolSearch:
`mcp__ccd_session_mgmt__list_sessions` to find the target,
`mcp__ccd_session_mgmt__send_message` to write to it,
`mcp__ccd_session_mgmt__search_session_transcripts` to research past sessions).
Fallback when the tools are unavailable: a message file in the session scratchpad
area agreed in the prompt.

- **Volatile facts age between writing and reading** (deploy state, who holds a
  file, arena): never assert them — timestamp ("נכון ל-20:52") or better, tell
  the session how to measure itself. Stable facts (rulings, documented traps) may
  be asserted. A session once had to correct another's stale "fact" (710,
  31/07).
- **You are a single point of failure — write the fallback into every prompt**:
  a session with no reply within a reasonable time **stops and asks Ishay
  directly**, never proceeds alone.

## Documentation boundary — depth vs breadth (Ishay's ruling, 710, 01/08)

A session WRITES only code-adjacent trap docs for files it changed itself — it holds the
depth. Everything cross-cutting — iron rules, skills, memory, the plan, lessons spanning
files — is **proposed to Ishay as a recommendation, not written unilaterally**. Hard
evidence: 710's 300-line skill bloat was born from local-context sessions each adding
"their" paragraph.

> ⚠️ **This bullet was re-targeted 05/08/2026 and needs Ishay's confirmation.** It
> originally read *"builders REPORT and **you** filter and write"* — the filter was the
> manager session. With that role gone, a blanket swap would have produced *"Ishay filters
> and writes"*, which is false: he does not write docs. The principle preserved above is
> the anti-bloat half (don't let every session append its own paragraph to shared files);
> **who now performs the filtering is an open question for Ishay, not a settled fact.**
