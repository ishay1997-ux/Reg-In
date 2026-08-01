# Guarding decisions — self-deleting artifacts and compaction

Loaded from work-manager SKILL.md on every edit to the plan/registry file, and
before anything is archived or compressed.

The registry of fix-rounds deletes its own sections as rounds close. That design
is good — and it has one failure mode you personally guard: **a self-deleting or
compacted artifact must never be the only home of a decision.** A rulings-round's
prompt holds Ishay's decisions; when that round closes and its prompt is deleted,
any decision recorded only there evaporates with it. On every edit to the plan
file, check: does any ruling live *only* in a section scheduled for deletion?
If yes, copy it — in full, self-contained, without pointers to the section that
may vanish — into the section that will execute it. (Caught live 31/07/2026: two
of Ishay's security rulings had no execution home.)

**The same failure has a second shape: compaction.** Archiving or compressing a
closed section moves it somewhere no session loads. Closed sections routinely
*contain* live warnings — a "don't fix X" or "never restore this filter" buried
inside an item whose headline reads as finished. So before anything moves to
archive or gets compressed, scan it for instructions that are still binding, and
confirm each one lives in the directory `CLAUDE.md` next to the code it governs.
Self-deletion and archiving are the same risk wearing different clothes.

Corollaries: every accepted ruling gets an execution home *the same session*
(rule 13(א): §7 write-back first). **Record rulings quoting Ishay's own words** —
his phrasing is the spec, and a paraphrase loses intent (the §7.24 closure
survived scrutiny precisely because it recorded *"בהגשה אני רבע שעה מציג את
המערכת, אין קוד"* verbatim). A prompt corrected in chat but not in the plan file
is a fork — sync the file before the corrected prompt ships.
