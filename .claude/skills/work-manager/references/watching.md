# Watching builders — the monitor, the cadence, and what silence means

Loaded from work-manager SKILL.md at the moment you start waiting on a round.
Nothing here runs at boot — with nothing running there is nothing to wait for.

## The monitor — persistent, never one-shot

**Don't wait to be told a session finished — watch for it.** Relaying "he's done"
through Ishay makes him a courier between two sessions.

⚠️ **Superseded design note (01/08/2026):** this skill originally defended a
one-shot monitor ("fires once and exits"). That was corrected against REG-IN's own
history: on 31/07 the test commit landed 21:46 and two doc commits followed at
21:55 and 22:21; earlier, 19:40 → docs at 19:52. The Stop hook here *forces*
doc-ripple commits after code — **a landing is always multi-commit**, and a
monitor that exits on the first one reports "נחת" while a third of the round is
still in flight. (710 hit the same failure: a docs commit missed by 55s.)

Arm with the `Monitor` tool and `persistent: true` — not `Bash run_in_background`
(a background loop dies unnoticed; a time cap expires *silently* and looks exactly
like "still working"). Keep `monitor-base.txt` in the **session scratchpad**
(named in your system prompt), not the repo.

```bash
BASE=$(cat "$SCRATCH/monitor-base.txt")   # update it after your own commits
while true; do
  sleep 120                               # ~2 min per fix round · 600–900 for long items
  CUR=$(git rev-parse HEAD); DIRTY=$(git status --porcelain --untracked-files=no)
  if [ "$CUR" != "$BASE" ] && [ -z "$DIRTY" ]; then
    echo "נחת: $BASE..$CUR"; git log --oneline "$BASE..$CUR"
    BASE=$CUR                             # 🚫 do NOT exit — doc-ripple commits follow
  fi
done
```

The load-bearing choices — **resist adding a fifth condition per incident**:

- **Both conditions together**: a commit alone can be mid-round; a clean tree alone
  is also true before anything started. "Clean" is a passing moment — re-arm and
  keep reporting; stop only when *you* decide the round is done.
- `--untracked-files=no`, because builders leave scratch files and without it the
  tree is never "clean" and the alert never fires.
- No `git fetch` — sessions share one disk; fetch only adds cost.
- Interval follows how fast you want to know, not cost.

🔴 **Attribution is yours.** Every commit in this repo is authored by the same git
identity — the loop cannot tell your commits from theirs. Refresh `BASE` after any
commit of your own, and **run `git log` on the range before reporting "it landed"**.
Reporting an alert without attributing it is passing on a rumor.

- A git watch only sees sessions that commit. Dashboard/Studio work can't be
  watched — say so and agree how you'll learn it finished.
- Add periodic heartbeats (dirty-file count + current tip) so silence ≠ "still
  working". A monitor dies with the conversation that armed it; a fresh manager
  session inherits no watch and must arm its own.

## Cadence — passive first, active at ~120%

Passive eyes (mtimes, commits, the monitor) cost the builder nothing; use them
freely. An active "תמונת-מצב קצרה?" costs an interruption — send it **only when
passive shows silence beyond ~120% of the item's own time estimate** (which is why
every prompt you write carries an estimate). **Calibration is local and lives in
the `manager_evidence_regin` memory file** — 710's numbers (docs ~30–40min ·
feature ~60–90min · heavy ~3h) were measured on 710 rounds; record REG-IN's own
as rounds close (Ishay's ruling, 01/08/2026: the principle transfers, the numbers
don't).

**After any status: change something or explicitly confirm "בכיוון, כלום לא
משתנה"** — a status that changed nothing was noise. Act by gap type: blocked →
clear the obstacle · ballooning → split/descope · affects another session →
update its picture. Never judge mid-work; never turn a status into an
interrogation.

## Pipe-masking — when you run checks yourself

`cmd | tail` reports **tail's** exit code, not the command's. A failing test run
read as green twice this way (710, 31/07 — shell behavior, not project behavior).
Check the command's own exit status, never the pipeline's.
