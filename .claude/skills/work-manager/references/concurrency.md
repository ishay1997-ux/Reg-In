# Concurrency and session-to-session communication

Loaded from work-manager SKILL.md when more than one session is (or is about to
be) alive. Rule 16 operationalized for the manager role.

## Before every write

- `git status` + mtimes + clock, **that same turn**. Fresh mtimes (~10 min) ⇒ a
  session is alive and writing ⇒ back off.
- While any builder lives: never touch `STATUS.md`, the LOG, or the plan file.
  **Queue your entries in the session scratchpad (outside the repo), not in your
  head** — a queue held in narration dies with the session; a scratchpad file
  survives a crash. Say you're queuing, and land the queue the moment the arena
  clears.
- Stage and commit **by explicit pathspec only** (`git add <paths>`), never
  `git add -A`. And the sharper trap behind it: on 31/07/2026 rounds got mixed
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
  be asserted. A builder once had to correct the manager's stale "fact" (710,
  31/07).
- **Exchange digests to Ishay — always**: every builder⇄manager exchange gets him
  2–3 lines, "הוא אמר X / עניתי Y" — never the full messages. It teaches him the
  flow and how you think (what he needs to audit *you*). Kill-switch: "בלי
  תקצירים".
- **You are a single point of failure — write the fallback into every prompt**:
  a builder with no manager reply within a reasonable time **stops and asks Ishay
  directly**, never proceeds alone.
- **Answering in Ishay's place**: the `ishay_response_playbook` memory file holds
  his precedents (trigger → his exact phrasing → why). Answer from it; unsure how
  *he* would answer ⇒ one story-question to him ⇒ record his answer there
  verbatim. Every escalation happens at most once.

## Documentation boundary — depth vs breadth (Ishay's ruling, 710, 01/08)

Builders WRITE only code-adjacent trap docs for files they themselves changed
(they hold the depth; you audit the diff and trim). Everything cross-cutting —
iron rules, skills, memory, the plan, lessons spanning files — builders REPORT
and **you** filter and write, if at all. Hard evidence: 710's 300-line skill
bloat was born from local-context sessions each adding "their" paragraph.
