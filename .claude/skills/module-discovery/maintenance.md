# Maintaining `module-discovery`

> **Read this only when you are revising the skill — never during a run.** The running session needs
> `SKILL.md` + `template.md` and nothing else; this file exists so that the procedure does not carry
> instructions addressed to a different reader.

**① Build from the interaction, not from its summary.** `discovery_lessons.md` is Claude's interpretation
of a conversation. The transcript holds more. Extract Ishay's own messages from the session `.jsonl`,
verdict each one **מיוצג / לא מיוצג**, and **"not represented" is a finding.** *(The extraction recipe is
in `discovery_lessons.md` §7.)*

**② Do not trim this file to obey "minimal instructions".** *(Ishay's ruling, 13/08/2026 — the first draft
of the previous version was written trimmed and **was measured to have dropped seven standing Ishay
rulings**, among them the closed cross-check list, the blind-spot block and the spec-folder contents.)*
**Minimality is a rule for the router (`SKILL.md`), not for the procedure.** ⇒ **Remove only duplication
you can prove is duplication** — and when you relocate a rule, **verify the destination contains the text**
before deleting the source.

**③ Splits already evaluated and rejected, with the reasons** *(`discovery_lessons.md` §14)* — do not
re-propose them without new measurement:
- **A separate mockup skill** — ❌ stages ד and ה merged, so it has no trigger of its own; a skill without
  a trigger loads only when someone remembers to ask, i.e. never.
- **Splitting into per-stage skills** *(`discovery-open` / `discovery-screens` / `discovery-spec`)* — ❌
  a Discovery is **one conversation opened once**, unlike blueprint→build→close which has three genuinely
  separate moments. **And a split reproduces the measured failure: content in one file that a session
  reading the other never sees.**
- **`discovery_lessons.md` as a skill** — ❌ it is the evidence, not the procedure. Read once, by whoever
  builds. **Stays in `docs/guides/`.**

**④ Before shipping this over `module-discovery`, five pointers elsewhere must move in the same turn —
verify each, do not trust this list:**
- **`_shared/discipline.md`** points the full research protocol at `.claude/skills/module-discovery/template.md` **§5**. It resolves to v1.
- **`.claude/hooks/check-docs-updated.sh`** hard-codes a `module-discovery` template path in its plan-standard check. **A hook is not a document; a stale path there blocks a session end.**
- **`docs/guides/module_playbook.md`** — three paste blocks name `.claude/skills/module-discovery/`.
- **`docs/guides/modules/module_NN_*.md`** — the ⑥0 blocks of at least modules 5 and 6 name the same path.
- **`STATUS.md`** records an open Ishay decision: *"שפת-הסקיל (אנגלית/עברית)"*. **This file is English. That question is still his.**

⚠️ **And this skill is three files, not two** — `SKILL.md` · `template.md` · this one. **The playbook's
contract is satisfied** (it names only the first two, and a run never needs this file), **but the sentence
below is about the shape Ishay pastes, not about the folder.**

**④ב The two-file shape is a contract, not a preference.** Ishay's `docs/guides/module_playbook.md` carries
paste blocks he uses by hand; they name **exactly** `SKILL.md` and `template.md` **beside it**, and they
name these strings literally: `"Stage 3 · Handoff"` · `"🛡️ Cross-check before handoff"` · **six**
cross-checks · **four** contract items with **item 3** as the hand-computed number · the `מצב` table at the
head of `screens-approved.md` · the glob `docs/specs/module_[NN]_*/`. **Renaming any of them breaks a
block Ishay pastes, and he will not see why.**

**⑤ The generic law.** Zero content from any one module leaks in unlabelled; every number is a measurement
recipe; two placeholders only. **The check is mechanical:**
```
grep -nE "module [0-9]|module_[0-9]|מ[0-9]|hostesses|Smart Match|דיילות" template.md
```
**Every hit outside an ⟦EX⟧ block is a finding.**
