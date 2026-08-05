# Module 4 — Discovery Log (live, written during the session)

> **What this is:** a running record of the Module-4 Discovery session (stage 2 of
> `docs/claude mega plans/regin_workflow_short_updated.md`). Written **as things happen**, not
> reconstructed at the end. Stage 3 builds the `module-discovery` skill from this file.
> **Not** a spec. Nothing here is approved unless it says "Ishay ruled".
>
> Format per entry: **what was covered · what Ishay corrected · where it stuck · what surprised us.**

---

## Session 1 — 05/08/2026, branch `ishay/discovery-prompt-fixes`

### Stage א — reading + overview map

**Read (targeted, not everything):** `PROJECT_MASTER` §1 · §3 · §5.10–5.12 · §6 (debts) · §7 (19
module-4 items) · `module4_smart_match_research` §9.12 + §11 (build spec) · C5 §5.5.6, §5.5.8,
§5.6.10–5.6.12, §5.7.2, §5.8.4–5.8.7 · `db_roadmap` (module-4 rows) · `guides/modules/module_04_hostesses.md`
· `mockup_descriptions.md` §7 · live DB via `supabase` MCP (read-only).

**Measured, not assumed:**

| Claim | Method | Result |
|---|---|---|
| Mockups: 43 PNG vs 5 HTML | `find docs/mockups -iname '*.png' \| wc -l` | **43 PNG · 5 HTML** — prompt's figures confirmed |
| `hostesses-screen/` | `ls` | **6 PNG**, zero HTML |
| §7 items tagged `מ4` | `grep -nE '^[0-9]+\. ' … \| grep 'מ4'` | **19** |
| Live `🚧 מ4` debts in §6 | `grep '🚧 מ4'` | **9 matches → 7 live** (2 are the closed blueprint-path debt: ✅ line 393 + 📄 archive line 394) |
| `hostesses` / `assignments` / `salary_reports` / `projects` | `pg_class.relrowsecurity` + `pg_policy` | **RLS on, 0 policies = deny-all — all four** |
| Row counts | `count(*)` | hostesses **0** · assignments **0** · salary_reports **0** · projects **3** · quotes 10 · customers 4 · params 20 |
| `hostesses` PK | `information_schema.columns` | still `id_number text NOT NULL` — **§7.64 surrogate migration NOT applied** |
| `params` smart_match rows | `select … from params` | **3 rows, old model**: `משקולת_1W_דירוג`=0.4 · `משקולת_2W_קרבה`=0.3 · `משקולת_3W_מהימנות`=0.3 |

### 🔴 What surprised us — findings that were not in the prompt

1. **The §7 head-tags are stale for at least two items.** The prompt's measuring method says
   "🟡 `פתוח` and 🔵 `להנהון` ⇒ need Ishay". Measured: **§7.15** head says `🟡 פתוח`, tail says
   **`סטטוס: 🟢 סגור`** (ruled 01/08/2026 — "לא קורה, לאירוע יש מספר דיילות וזהו"). **§7.69** head
   says `🔵 להנהון`, tail says **`🟠 סגור-מנגנון`** (ruled 01/08/2026 — fixed travel amount per shift;
   only the *amount* is open, and it needs an accountant, not Ishay).
   ⇒ **Reading only the head marker produces false "open" items.** Both must be read to the tail.
   *(This is the same failure class §0 already documents for this prompt: an earlier draft named three
   "open" items and all three were closed.)*
2. **After reading tails: exactly ONE §7 item is genuinely open for module 4 — §7.34**
   ("deactivating an in-use hostess — status guards"; the מ2 half was closed 30/07, the מ4/9 half was not).
3. **`projects` is deny-all too** — not just the three module-4 tables. Screen 5.10 (overview) reads
   `projects`; today every role gets an empty list with `error: null`. §11.6#12 of the research names
   RLS on `hostesses`/`assignments` only — **`projects` read-access is an unnamed dependency**.
4. **`params` still holds the pre-ruling weight model.** The ruled spec (§11.1) is
   0.40 היענות · 0.35 אמינות · 0.25 קרבה + five more parameters (80km gate, 40km goalpost, m=3,
   12/24-month window, min-3-responses). None exist. The three rows that do exist name a component
   (`דירוג`) that the ruling **removed** from the score.

### Ishay's rulings — 05/08/2026, after stage א was presented

1. 🔴 **MOCKUPS — ruling that overrides the prompt's stage ד default.** Verbatim: *"אנחנו בשיחה
   הולכים ליצור את כל המוקאפים אחד אחד עוברים על אחד מתקנים עד שאני מאשר ככה הלאה מוקאפים אלו
   יחליפו את הישנים."* ⇒ **every module-4 surface gets a new HTML mockup, one at a time, revised
   until he approves; the new ones replace the 6 existing PNGs.** The prompt's "מוקאפ-HTML נוצר למסך
   שההחלטות שינו אותו מהותית, לא לכל תמונה" and the measured 43-PNG/5-HTML precedent **do not apply
   here** — this is his explicit, contrary ruling and it stands.
2. **Purpose of the session, in his words:** *"ליצור את האפיון הסופי לאותו מודול"*. The frozen spec is
   *"ישן, לא מעודכן, נכתב על ידי שאין לי ידע מספיק רחב בעולם הזה"* — take it **בערבון מוגבל**, doubt it,
   *"למרות שלדעתי רובו נכון"*. ⇒ C5/C6 remain grade-2 truth **for the repo**, but for THIS session they
   are raw material, and the output supersedes them with documented "סטייה מ-5.x" notes.
3. 🔴 **Gate discipline, his words:** *"לא ממשיכים הלאה עד שאתה מתאר תהליך מההתחלה עד הסוף ואני מאשר…
   בלי הנחות וניחושים אם משו לא ברור זה הרגע שלנו ביחד."* Edge cases: *"רק מה שרלוונטי לפרויקט באמת —
   פה תכניס שיקול דעת."*
4. **Start point:** approved starting from the hostess-pool process — **conditional** on first settling
   whether any process/sub-process is missing (*"אלא אם יש תהליכים או תתי תהליכים שפיספסנו"*).
5. **External research:** authorised at Claude's discretion (*"אתה יודע שאתה יכול רק אם אתה צריך"*).
6. **§7.34 (deactivating a hostess):** NOT ruled — he asked back: *"נראלי לא מאפשרים להשבית לא? מה
   בדרך כלל עושים? מה הכי הגיוני"* ⇒ needs a world-practice answer + recommendation, then his ruling.
7. **`projects` deny-all:** *"מעולה, צריך רק לכתוב חוב מתאים להמשך"* ⇒ authorised to write a `🚧` line.
8. Stale §7 head-tags + the C5/mockup contradictions: *"סומך עליך שתדע מה לעשות עם זה"* / *"סומך עליך
   שתסדר את זה"* — delegated, not ruled.

### World research — 2 agents dispatched (split by domain, sources demanded)

Returned with cited findings. **Agent 1** (shift-staffing lifecycle: Ubeya · Nowsta · Instawork ·
Sidekicker · When I Work · Connecteam · Deputy · Workstaff · Quickstaff · Coople · ESHYFT · foundU ·
Shiftboard · Bullhorn) — 18 processes we do not have, plus 6 "searched for and did not find".
**Agent 2** (deactivating a worker holding future shifts + worker lifecycle states: Deputy · When I Work ·
Zoho Shifts · Connecteam · Workforce.com · 7shifts · Instawork · ESHYFT · TempWorks · Avionté ·
Salesforce · Workday · BambooHR · Shopify · EEOC/FLSA retention). Full results held in-session; the
ones that survive Ishay's relevance filter land in the final spec.

---

## Stage 1 — process-map alignment ("what did we miss") — 05/08/2026, CLOSED

**Covered:** the 18 world-practice findings from agent 1 + agent 2's deactivation research, filtered by
judgement against the three §1 filters, presented to Ishay recommendation-first as 4 decisions.
**Ishay approved all four**, plus he asked to see the filter itself ("*רציתי רגע שנבין למה התכוונת שלא
אפספס משו*") — so the full 18-row keep/drop table was shown to him, and he can veto any row.

### The four rulings (Ishay, 05/08/2026)

| # | Ruling | Where it lands |
|:-:|---|---|
| ① | **Declared unavailability is added.** Recruitment manager records blackout dates on the hostess card; Smart Match layer-1 gate gets a **fifth condition** ("has not declared unavailable on this date"). **Rationale that decided it, and it is not "the world does it":** 40% of the ruled score is *response rate* — a hostess abroad who declines 5 invitations is recorded as unreliable. **The gap corrupts an algorithm that is already ruled; it does not reopen it.** Deliberately reduced version: no worker app, the manager enters it. | new spec + schema addition (M4) |
| ② | **"Hostess withdraws after final approval" becomes a described sub-process.** Status `approval_withdrawn` was ruled 30/07 but nobody described what the manager does. **Nothing new is built** — `ready` already reverts (§7.43); the screen must make the hole loud, and she re-opens Smart Match. World anchor: four unrelated products state the same invariant — the shift stays the withdrawing worker's responsibility until a replacement actually accepts. | new spec (process card) |
| ③ | **`assignments.personal_bonus` is filled by the recruitment manager at assignment time**, as a fill lever; M8 only reads it into payroll. **Correction Ishay accepted:** his own idea (an event-wide bonus split among all who attended) is **not an alternative — it already exists** as `projects.project_bonus` + the C5 salary formula. Two different tools, both already in the schema. Boundary flagged, not ruled: who fills `project_bonus` (it sits on `projects` ⇒ M6). | new spec + §7-adjacent |
| ④ | **§7.34 (M4 half) — allow deactivation, never silently.** Full wording written back to `PROJECT_MASTER §7.34` this same session (iron rule 13א). Also settled: **no extra status field is needed** — "don't book her again" is already the per-client three-state marking (which matches the industry standard exactly), and "temporarily unavailable" is solved by ①. | ✅ `PROJECT_MASTER §7.34` |

### Three things Claude filtered out and then surfaced anyway (Ishay's question forced this — it was the right question)

- **(א) We deviate from the world on double-booking and it was never written down.** Every product checked treats a scheduling conflict as a **warn + allow override**; Ishay ruled a **hard DB constraint** (30/07, "אסור שזה יקרה"). The deviation is correct here — elsewhere an override costs a swap, here it costs **double pay to one person for one day** — but it must be documented as a deliberate deviation, because it is a good conference question.
- **(ב) The final-approval email template promises data that may not exist.** `תבנית_אישור_סופי_שיבוץ` interpolates `[כתובת_אירוע_מלאה]`, `[שם_מנהלת_פרויקט]`, `[טלפון_מנהלת_פרויקט]`. Live schema has `projects.final_location` (free text) and `projects.owner_email` — **no manager name, no phone.** Deferred to the screen stage, not a ruling.
- **(ג) A micro-version of "when am I working" was kept.** Not an app: the **hostess card shows her upcoming shifts**, because she phones and the manager has to answer. Deferred to the screen stage.

### 🏆 Conference asset found in the research (worth not losing)

Agent 1 searched for and **did not find** any product that ranks a worker by **responsiveness to
invitations**; all of them rank by behaviour on shifts already worked, and the researcher explicitly
noted responsiveness is "arguably more relevant". **In REG-IN it is 40% of the score.** This is a
sourced "we deliberately did something nobody does", not a copy.

### Also confirmed this round
- **`🚧 מ4` debt written to `PROJECT_MASTER §6`:** `projects` is deny-all and is the input to screen 5.10 — M4 must add a **read** policy per the §3 matrix (recruitment manager = view on "פרויקטים"), write stays with M6. Not recorded anywhere else; §11.6#12 lists `hostesses`/`assignments` only.
- **Working cadence re-confirmed by Ishay mid-round:** **up to 3–4 decisions per batch**, closed before the next batch opens.

---

## Stage 2 — process by process

### Process א׳ · Hostess-pool management — ✅ APPROVED by Ishay, 05/08/2026

**Covered:** full start-to-finish narrative in 4 scenes (intake → update → declared unavailability →
deactivation), validations, permissions, failure modes, connections. **Ishay: "הכל מוסכם".**

**What he corrected / added in the round:**
- Asked what "השבת בלי לשחרר" actually does → answered: **the assignment stands in full** (she is
  still counted, still gets the 24h reminder, still gets paid); the only change is no NEW invitations.
  **This is the common case, not an edge case** — *"I'm leaving at the end of the month but I'll do
  the מדיטק conference on 22/08."* ⇒ **ruled: label the two options by INTENT, not mechanics** —
  *"היא לא תגיע — שחרר אותה"* vs *"היא תשלים את מה שהתחייבה אליו"*.
- 🔴 **Caught Claude asking a question the research doc already answered** (see the retrospective below).
- **Field numbers he supplied (first time in this session):** **up to 50 hostesses in the system** ·
  **2–10 per event, usually 4–5.** ✅ Cross-checked: this **matches §9.5 exactly** ("2–5 למשמרת")
  and §9.7 ("לפעמים גם 10"). Nothing in the ruled algorithm moves.
- **Rating (`hostesses.rating`) — resolved, not by a new decision but by reading:** §6.5's rule
  (*"מה שהוא עובדה — מחשבים · מה שהוא שיפוט אנושי — משאירים לאדם · ולא ממצעים ביניהם"*) plus §6.2's
  evidence (Nature 2025: **85% of all 1–5 ratings are 5★**) mean the human-judgement channel is the
  **three-state per-client marking**, not a 1–5 field. ⇒ **Ruled: the field stays** (a brand-new
  hostess has zero history and the damping returns her to the company average, so it is her only
  signal) **but the column is NOT labelled "דירוג"** — that reads as the system's verdict when it is
  the manager's impression. **And the mockup's 4.9/4.7 decimals go — the column is `int`.**

### Process ב׳ · Assignment to an event — ⏸️ PRESENTED, AWAITING ISHAY

Full narrative delivered against live data (כנס לקוחות שנתי · מדיטק · 22/08/2026 · אקספו ת"א ·
18:00–22:00 · 6 needed · 17 days out): the four layers running behind the screen · reasoning chips
instead of a score · manual selection every round with no system-proposed default (C5:311) ·
responses via the public link · the override-and-dedup trap · the DB-level double-booking constraint ·
final approval + shift-lead marking · auto-release of the surplus · the 24h reminder · and four
failure modes (client shrinks · client grows · **hostess withdraws after final approval** · client
cancels the project).

**One item raised for Ishay, not yet ruled:** the hostess who **confirmed availability and was
auto-released**. §7.33 defines the release and is **silent on whether she is told** (verified).
**Claude's recommendation:** tell her — but **not** with the existing cancellation template
(*"המשמרת שלך בוטלה"* is false; she was never assigned). **Why it is not mere courtesy: response
rate is 40% of the score.** A hostess who says yes three times and never hears back stops answering,
and the system then records her as unreliable.

**Two declarations awaiting correction:** (1) the manager sends in **rounds**, deciding the count
afresh each time; (2) **shift lead is designated only after final approval exists.**

## 🔴 Retrospective Ishay demanded — "what made you miss it, and what was missing in my prompt?"

Claude asked Ishay a product question about `hostesses.rating` that **the research document had
already answered**. Ishay caught it; Claude did not.

**Root cause — and it is in the prompt, not only in Claude:** the Discovery prompt instructs, twice,
to read **"§9 ו-§11 בלבד"** of `module4_smart_match_research`, quoting the document's own header
(*"בונה את האלגוריתם? קרא §11 ודי"*). **That instruction is correct for a BUILD session and wrong
for this one.** §11 is a build spec — it deliberately carries the *what* without the *why* — while
this session exists to write the *why*, which Ishay must defend at a conference.

**Three lines that would have prevented it (to be written into the plan file):**
1. Replace *"§9 ו-§11 בלבד"* with **"§11 first to learn what was ruled; then §3 and §5–§6 for every
   component you are about to discuss."**
2. **"Before bringing Ishay a question — search the research doc and §7 for it. A question that
   already has an answer is not a question, it is a read that did not happen."** *(The prompt gives a
   detailed measuring method for the §7 registry and says nothing at all about the research doc.)*
3. **"A contradiction inside a document is a signal to read more of it, not a question for Ishay."**
   *(Claude saw §11.5 listing a "דירוג" column while the formula has no rating component — and turned
   the contradiction into a question instead of a search.)*

## 📌 Findings for STAGE 4 (blueprint adaptation) — Ishay: *"הבלופרינט כרגע שגוי, אני מתאים אותו אחרי שאני מסיים איתך"*

Recorded here so they wait for him rather than being rediscovered. Read of
`.claude/skills/module-blueprint/template.md` (85 lines, whole file, with Ishay's permission):

1. **The approved spec does not exist in the template's Hierarchy of Truth** (rule 3:
   `schema.sql` → C5/C6 → mockups → micro-guides). **Recommendation:** `schema.sql` stays first;
   **the approved module-4 spec replaces C5/C6 at grade 2 for module 4 only**; C5/C6 drop to
   historical source. This matches Ishay's own framing that the frozen spec is outdated.
2. 🔴 **The mandatory spec-coverage review would fight this spec.** Template line 15 has a
   fresh-context reviewer extract the required-list **"directly from its C5 screen(s)+process, C6
   table(s), and mockups"**, blind, then flag anything built-but-not-required as
   **"invented-beyond-spec"** and anything required-but-unbuilt as **"silent omission"**. If it keeps
   reading C5, it will flag **the score's three new components, declared unavailability, the shift
   lead and the distance gate as inventions**, and will **demand the delete icon** C5 draws.
   ⇒ **Stage 4 must repoint the extraction source at the approved spec.**
3. **The template runs its own 🎤 PM Interview with Ishay before blueprint approval** — the same
   walkthrough this session is doing. ⇒ the spec should record explicitly what was asked and ruled
   here, so stage 5's interview is a fast confirmation rather than a repeat.

## Language ruling (Ishay, 05/08/2026)
**The approved spec is written in HEBREW** so Ishay can read it; the blueprint/micro-guide stays
English. ✅ This is **not** an exception to the repo rule — it *is* the rule (`docs/CLAUDE.md`:
Hebrew for humans in `docs/guides/`+`reference_spec/`+`STATUS`, English for Claude in
`micro_guides/`+skills). This log stays English for the same reason; Ishay was offered a switch.

### Process ב׳ — ✅ CLOSED 05/08/2026 ~23:00, with six additions ruled during the round

| # | Ruling | Trigger |
|:-:|---|---|
| 1 | **Notify the hostess who confirmed availability and was auto-released** — with her own short message, **not** the existing cancellation template (*"המשמרת שלך בוטלה"* is false; she was never assigned). **Not courtesy: response rate is 40% of the score** — say yes three times, hear nothing, stop answering, get recorded as unreliable. §7.33 defines the release and is silent on notification (verified). | Claude |
| 2 | **Over-approval is a WARNING, never a block.** §7.33 already rules the count may temporarily exceed and that `ready` checks ≥ not =; **what was missing is what the manager sees — today, nothing.** At the 7th approval: *"המכסה מלאה — 6 מתוך 6. לאשר בכל זאת?"* + *"ההצעה תומחרה ל-6."* Counter turns warning. **The distinction to keep:** *block what must not happen* (one hostess, two events, same day → hard DB constraint, double pay) · *warn on what costs money* (a 7th is legitimate insurance against a no-show, or a scope increase not yet entered). And a hard block would just be gamed in three clicks. | **Ishay** |
| 3 | **Non-response stays OUT of the score — do not change it.** `pending` is outside the denominator. Silence is not refusal (bounced mail, spam folder), and the world tried penalising acceptance rates and retreated: DoorDash dropped the ≥50% gate, Uber withdrew under legal pressure, Instacart softened twice — the documented pattern is *"סף שורד, דירוג נופל"*. **But the manager must SEE it** ⇒ chip **`לא ענתה ל-4 הזימונים האחרונים`**. *(Agent 1 searched for pool-hygiene reporting of this kind and found it in NO scheduling product.)* | **Ishay** |
| 4 | **"פג תוקף" is a DERIVED state, not a 7th status.** §7.45's deadline exists and is ruled (earliest of: filled · **48h from send** · 24h before event) — the corner Ishay didn't remember is closed. What was NOT closed: the screen shows `ממתין` forever, so an invitation that died a week ago looks identical to one sent five minutes ago. ⇒ `ממתין` **AND** `now > invite_sent_at + 48h` = expired, computed at display. No migration, no touching the six ruled statuses. *(When I Work ships an explicit `Expired` state.)* **Why it matters: "3 ממתינות" means "give them time"; "3 פג תוקפן" means "send to three more, now" — same number, opposite actions.** | **Ishay** |
| 5 | **Resend = a BUTTON, never a timer** — which is also the answer to Ishay's "48 or 72?": there is no number, because there is no timer. Ubeya ships exactly this manual *"Resend confirmation"*; **agent 1 searched for configurable timed multi-wave escalation and found it in no product.** A timer would also fire after the position filled, and it would take the round-size decision away from the manager — which C5:311 makes permanently human. **Resend refreshes the token + `invite_sent_at` on the SAME row** — no new row, no new status, and no score effect (`pending` is outside the denominator). No cap on resends. 🔑 **Ishay's idea and ruling #4 are two halves of one feature:** without the display the button has no trigger; without the button the display is a dead end. | **Ishay** |
| 6 | 🔴 **The last 24 hours are a DIFFERENT MODE — and the finding that produced it:** §7.45 expires the token 24h before the event, so an invitation sent at T-20h **is born already dead**. ⇒ **exactly when she most needs to fill a hole, the invite-by-link path does not exist.** Not a bug — an untraced consequence of a correct rule. **Reality: she phones. Always.** ⇒ inside T-24h the row's primary action becomes **"אושרה סופית — סוכם בטלפון"** (not a new capability — C5:313 already gives her manual override; we surface it when it is the only tool), the phone number becomes an action, **and the final-approval email still goes out**. If she cannot fill it, the project **stays "בתהליך"** — a screen that hides a hole is worse than the hole. 🔑 **Free win: T-24h is already a system tick (the shift reminder) ⇒ one scheduled job, two outputs — reminders to the confirmed, and an alarm on the overview for any event still short.** **Why not simply drop the 24h expiry:** in those hours the manager must know *immediately*; email is asynchronous. **The link is right when there is time; the phone is right when there isn't.** | **Ishay** |
| 7 | **Shift lead who withdraws** → the marking is simply released; the manager marks another of the approved; **if she marks none, the on-site contact reverts to the projects manager.** | **Ishay** |
| 8 | **Hostess who confirmed availability and wants out BEFORE final approval** → she phones, **the manager moves her to `סירבה`.** No link path, no new status. | **Ishay** |

### 🔴 Second self-caught miss of the session — same class as the first

Claude raised "event-side coordinates" as an **open product question** ("who is responsible, what if it fails"). **§7.55 is tagged 🟢 סגור and was ruled 01/08/2026:** `lat`/`lng` columns added to `projects` · NULL rule = **neutral score + on-screen marking** (already ruled 29/07) · geocode service chosen at build time against current ToS, with **Nominatim (OSM) recorded as the default candidate, not a final choice**.
**The error, precisely: Claude conflated "not built" with "not decided".** §11.6 lists it as dependency #1 — which is true, it is unbuilt — and Claude presented an unbuilt-but-ruled item as an open question. **Same family as the `rating` miss earlier today.** ⇒ the prompt fix already recorded above gains a third line: **"a §7 item tagged 🟢 and a §11.6 dependency row are different claims — 'not built' is not 'not decided'."**
**Residue Claude decided itself (reversible, technical):** geocoding runs **lazily on first entry to an event's Smart Match screen**, cached to `projects.lat/lng` — so module 4 does not depend on module 6 doing it at project creation; when module 6 exists it can geocode earlier into the same column. Failure surfaces as the ruled marking, worded *"לא זוהתה כתובת האירוע — הציון אינו כולל מרחק"*.

### Scope ruling delegated to Claude and executed — `salary_reports` is NOT module 4
Ishay: *"מה שאתה חושב — רק לכתוב חובות מתאימים בלי חורים ומספיק מפורטים להמשך."* Decision, four verified reasons, what M4 delivers and what M8 must build: written in full to **`PROJECT_MASTER §6` as `🚧 מ8 ← מ4`**, and `§5.12`'s table list corrected with a pointer to it. **Not a deviation from the frozen spec** — C5 §5.6.12 never mentions a salary report (read and verified); it was a table-mapping error in a living doc.

### 📁 File-location ruling for the NEXT session (Ishay, 05/08/2026: *"לגבי קובץ לוג צריך להחליט מה המקום המתאים — לא מתאים עם המיקרו גייד"*)

**He is right, and the repo's own definition proves it:** `docs/CLAUDE.md` defines `docs/micro_guides/`
as *"מפת-הבנייה של המודול הפעיל — ה-SSOT ל'איך'"*. A discovery log is not a build map.

**Recommended layout — a folder per module under `docs/specs/`:**
```
docs/specs/module_04_hostesses/
    spec.md            ← the approved PRD — HEBREW, Ishay's document
    discovery-log.md   ← this file — ENGLISH, Claude's record of how the spec was reached
```
**Why together and not in separate trees:** the log is the *evidence behind* the spec. When someone asks
in two months *"why was X decided?"*, the answer must be one folder away, not in the build-map tree.
**On language:** the repo's rule is **reader-based**, and the folder mapping is shorthand for it — a
Hebrew spec and an English log can share a folder; each file states its reader in its header.
*(Ishay was offered a Hebrew log twice and did not take it — his reading happens in chat.)*

🔴 **Not moved tonight, deliberately — the move must be one clean operation.** Measured: **8 references
name the current path** — `STATUS.md:8` · `docs/CLAUDE_CODE_LOG.md:53` · and **six** inside
`docs/claude mega plans/regin_workflow_short_updated.md` (lines ~95, 289, 313, 495, 802, 868 — including
**stage 3's "🔴 המקור הראשון שלך"**, which is the pointer that makes the whole `module-discovery` skill
buildable). Moving the file without those eight is how a plan silently loses its own input.
⇒ **Do it as step 1 of the next session:** create the folder, `git mv`, update all eight, verify with
`grep -rn 'module-4-discovery-log'` returning only the new path. Then add a `docs/specs/` row to the
folder table in `docs/CLAUDE.md`.

### Where it stuck
*(nothing — both processes closed. Next: stage 3, screen by screen.)*

## /רעיונות-לבדיקה
> These are ideas that came up — **do not assume they are correct.** Each gets checked like any
> other option; an idea is not a ruling.

*(empty)*
