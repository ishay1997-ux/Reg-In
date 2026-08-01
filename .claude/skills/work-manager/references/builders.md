# Facing the builders — the plan gate · the done-review · failures

Loaded from situations 5 · 7 · 20. **The three neighbouring situations live in their own files and
load at their own moment:** writing a prompt → `prompts.md` · waiting on a round → `watching.md` ·
more than one session alive → `concurrency.md`.

---

## Situation 5 — a builder's plan arrived

**Trigger:** a message containing a plan. **You do not *read* it — you **verify** it, layer by layer.**
**Read:** every file the plan names · `PROJECT_MASTER §7` · the micro-guide · the directory's own
`CLAUDE.md` · and if the builder is mid-work, **the commit they branched from.**

### The six layers

1. **Claims against the repo — yourself.** Open every file the plan names.
   🔴 **An absence-claim is verified the way the SOURCE writes it, not the way the reporter searched** —
   a same-pattern "verification" confirms the blind spot, not the claim. *(Anchors: "§7.86 missing"
   grepped as `7.86` while the registry writes `86.`; and a Hebrew grep run over an English corpus.)*
2. **Hunt what the plan does NOT say** — Ishay's probes: *"מה עוד לא בדקת?"* · *"על מה עוד לא
   חשבת?"* · doubt with a counter-hypothesis attached (*"בדוק שוב — אולי X?"*). **Run them yourself:**
   the plan's own "what I didn't check" section was written by **the same mind** that wrote the plan
   ⇒ a floor, not a gate.
   **Priority: claims that would fail silently > fail loudly > cosmetic.**
3. **Against decisions already made and documented traps** — `§7` and the modules' `CLAUDE.md` files.
   A plan can be internally perfect and still **contradict a ruling from last week, or re-ask a
   question already answered.**
   **And against work already scheduled** — the micro-guide's remaining steps: overlap ⇒ **shrink to
   the unique residue** (shrink, never delete), and **name what is NOT covered and where it lives now.**
4. **World-standard fit** — **only on approach decisions:** *"מה מקובל היום במערכות דומות, ואיך זה
   מותאם לקוד הקיים?"* A mechanical trifle does not get this, or it becomes ceremony.
   ⚠️ **The builder is asked to answer it in his plan — and you check it yourself**, because he is
   justifying his own approach.
5. **His verification section** — does it **prove guards by reintroducing the failure**, and permission
   changes **in both directions**? Verification that writes to the live DB ⇒ **Ishay's eyes-on approval
   before the run** (there is no test environment, and a real data-loss incident already happened here).
6. **Result proof** — what evidence will show the thing **happened** (a rendered screen, a served
   asset), not that a command exited 0.

**6½. The intent filter.** Any finding or fix touching **user-visible product behaviour** gets one
more question before adjudication: **"מה המוצר התכוון כאן — ומה המקור?"** — answered from recorded
intent only: the frozen spec · §7 rulings · the approved mockup · the schema's own shape · the playbook.
🔴 **The source must answer DIRECTLY: a derivation, a stretch, or "it probably implies" is a guess
wearing a citation.** In doubt whether the source truly answers ⇒ **that IS "no source"** ⇒ it climbs
to Ishay as a story-question. *(A wasted question costs him seconds; a guessed intent costs a build.)*

*Anchor: the "panel bug" was over-scoped for a whole gate-cycle because no layer consulted the
schema's own three-status shape — the no-draft answer sat on disk the entire time, and **Ishay caught
it by holding the prompt.***

**A seventh layer — intent the sources do not hold — stays Ishay's, always.**

### Caps on the verdict
- **Visual output in the plan ⇒ capped at מאשר-בתנאי** until Ishay approved the mockup. **The manager
  cannot pass that gate in his name.** Closing product *decisions* is not closing the *look*.
- **Unfamiliar territory ⇒ demand a blind-spot pass first** (*"מה אנחנו כנראה מפספסים שלא נדע לשאול
  עליו?"*) — first-of-a-kind infra has no local precedent to check against.
- 🆕 **The plan contradicts your premise ⇒ stop, do not "approve with a note".** If the premise fell,
  **the justification for the whole round fell with it.** *(Anchor 01/08: a builder refuted the
  manager twice, by measurement.)*
- 🆕 **A plan you yourself shaped ⇒ a fresh-context critic.** You cannot review your own artifact;
  three independent sources say so **and the mechanism has never run.**
- 🆕 **Cannot verify it yourself ⇒ summon a specialist and tell Ishay you did.** Never hand him a plan
  he also cannot check — **you would both approve blind and he would be trusting you.**

### What comes out
**Verdict first** (מאשר / מאשר-בתנאי / לא) · findings ranked by severity · **and credit for what the
plan got right that was not obvious** — that is what gives your מאשר meaning.
**Nothing wrong ⇒ "אין הערות", plainly. A manufactured finding is worse than a blank page.**
🔴 **Every layer produces a finding or an explicit "אין הערות"** — so the verdict message itself shows
the whole gate ran.
**And answer explicitly the two investigation questions the builder aimed at you** ("which mines did
you not identify? what did you not check?"), including "none" when there are none.

---

## Situation 7 — "סיימתי" landed

🔴 **A numbered sequence, not a mood.** A repeated mechanical sequence is a pilot's checklist:
**skipping a step is a bug.**

1. **Disk first:** clean tree, commits exist. **"הסשן סיים" is a claim.**
2. **Commit scope** (`git show --stat`) — only its own lane's files.
3. **Read the actual diff, commit by commit** — not his summary of it.
4. **Run what you can run yourself:** tests, lint, greps.
   **Never repeat a reported number without reproducing it.** Say explicitly **"מדדתי"** vs
   **"על דיווחו"**.
   🔴 **And never hand him an expected number** — only a measurement method. *("Run it and report the
   count", not "there should be 71".) An expected number bends a checker toward confirmation instead
   of measurement.* **(Anchor 01/08 — the manager failed this.)**
5. **Hunt targeted suspects:** consumers of every changed shared function (grep) · removed filters ·
   new tri-state/nullable flows leaking "unknown" into a two-state screen · **test edits that paper
   over product behaviour.** **Anything document or visual it produced — your own document pass, full pages.**
6. **Compare against the approved plan:** a deviation not said out loud **is a finding even when the
   code is good** — silent narrowing and silent widening both count.
7. **Check documentation claims too** — a log line pointing at the wrong file sends a future session
   digging in the wrong place.

**Then the two closing probes — mandatory, no exemptions:**
> **"מה עוד לא בדקת?"** — exposes verification gaps a positive report hides.
> **"יש משהו נוסף או שסיימת?"** — exposes work held silently.

**Both stay mandatory even when the session pre-empts by asking "סיימתי?" first** — a reversed
question creates closure-feel while nobody digs. **"מה עוד יש לך לבדוק?"** makes him check **himself**.

- **Do not fear doubting a report — with a reason.** A claim that smells unverified gets *"אתה בטוח?
  בדוק שוב — אולי X?"* **A soothing acceptance neutralises the only control gate this project has.**
- 🆕 **Finishing far faster than the estimate raises scrutiny, not lowers it.** A good report drops
  your guard exactly when it should raise it.
- **A finding that turns out to be covered — withdraw it explicitly.** Crediting the builder's own
  catches is honest reporting too.
- 🆕 **Record the questions the builder asked in his first message** — they are the only feedback you
  ever get on your prompt quality, and right now they evaporate.
- 🆕 **Record when a builder refutes you** — it is a measurement of your own reliability, and you have
  no other.

**8. The next round opens a FRESH session** — Ishay's ruling 01/08: *"בנאי ישן — לא רוצה שתיתן לו
משימות."* **And do not wake a session you do not need right now** — every message wakes it and spends
his quota. 🚫 **Closing sessions is his, not yours.**

---

## Situation 20 — failures in the arena

### Something broke
**Trigger:** a test failed · Ishay says something is wrong.
**Run:** **reproduce before acting.** **Output:** the root cause **named** → fix → evidence.
*A fault fixed without its cause being named will come back.*
**Who fixes:** the builder **inside the same still-running round**; **anyone else ⇒ a fresh session** —
Ishay's ruling 01/08 ("בנאי ישן — לא רוצה שתיתן לו משימות"). 🔴 **"But he is still alive and he has the
context" is exactly the trap** — a session from an earlier round is stale, and the fix for its staleness
is a self-contained prompt, not its leftover memory. *(This line said the opposite until 01/08 22:3X.)*
🔴 **And if you broke it — you fix your own files only. Code is never you, not even in an urgent
fault.** *(Urgency is exactly when rules get broken and paid for.)*
**With Ishay:** honest attribution — if he broke it, "yes, and here is how we fix it"; if not, the
evidence. **Never reassurance.**

### A dead session with uncommitted work
**Trigger:** no reply **and** a dirty tree. *(The silence of a dead session looks exactly like the
silence of one that is working.)*
🚫 **Do not commit code you never reviewed** — committing is taking responsibility for unreviewed code.
**Do:** measure what is pending · **write the exact state to disk** · if it blocks another session ⇒
**`git stash` (reversible)** to clear the arena · hand the next session the list.

### 🆕 "עצור עבודה" — Ishay's word, five actions
**Covers: low quota · an emergency · a merge · "מספיק להיום".**
① every live session is told: **stop at a safe point** ② each commits what is safe by pathspec **and
writes a state report to disk** ③ you land your own pending writes ④ **a status report to Ishay**
⑤ the monitor is disarmed — **and said so in the handoff document.**

### A specialist comes back with a finding
**A specialist is a reporter like any other** — do not take it as given. **And the temptation is
strongest precisely because you summoned it for something you could not judge.**
**What you can do:** confirm each finding **points at real code** and that the claim is **falsifiable**.
🔴 **A finding still beyond your judgement climbs to Ishay stated exactly so:** *"מומחה אומר X.
**לא הצלחתי לאמת בעצמי.** ההמלצה שלו: Y."* **Never pretend you checked.**
