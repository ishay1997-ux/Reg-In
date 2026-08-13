---
name: module-discovery
description: REG-IN — run a module's Discovery end-to-end and produce its approved spec set. Load whenever Ishay opens the product-definition phase of a module: "פתח דיסקברי למודול N", "בוא נעשה אפיון למודול N", "אנחנו עושים Discovery מלא למודול N", "בוא נאפיין את מודול N", or pastes the ⑥0 block from a step guide (docs/guides/modules/module_NN_*.md). Produces the module's docs/specs/module_NN_*/ set — processes-approved.md, spec.md, and (when the module has surfaces) screens-approved.md plus mockups — together with the write-backs to §6/§7/db_roadmap that other modules actually read. NOT for building (module-build), opening a blueprint (module-blueprint), closing a module (module-close), or ruling §7 items outside a Discovery (section7-rulings).
---

# module-discovery — define a REG-IN module before anything is built

**The full procedure lives verbatim in [`template.md`](template.md) beside this file — read it and
execute it.** This file carries what you must decide **before** the procedure starts: which archetype
the module is, which outputs that implies, and the five disciplines that fire in every stage.

*(Replaces the retired `docs/delete/prompt_module_discovery.md`. Written 13/08/2026 out of module 6's Discovery,
which ran in a single session — 38 rulings · 8 surfaces · 8 mockups · 5 files · 11 §7 items ·
17 DB requirements — **and equally out of the 14 after-the-fact repairs that session needed.**)*

## 🔴 Three facts that shape how this skill is built

**① The output is the *artefacts*, not the conversation.** **Work backwards from them:** what must
come out ⇒ what is the minimal process that produces it. *(Ishay's framing: **"המטרה של הסקיל זה
התוצרים של דיסקברי"**.)*

**② 🔴 Claude does not review what Claude wrote. Measured: zero.** A self re-read in module 6 returned
**0 findings**; a fresh-context reviewer returned **21, 6 of them blocking**. ⇒ **The fresh reviewer is
not an "if there's time" item — it is the only mechanism that works**, and it appears in the procedure
**twice**.

**③ 🔴 Not every module needs every output** *(Ishay's ruling 13/08/2026)*. ⇒ **The skill starts with
a classification, not with a stage.**

---

## 🚦 Stage 0א · Classify the module — the first thing you do

**Read the step guide** *(`docs/guides/modules/module_NN_*.md`)* **and its spec sections, then classify:**

| Archetype | Examples | What distinguishes it | Conditional outputs it fires |
|---|---|---|---|
| **🖥️ Screens** | 5 · 6 | owns a table · has surfaces · changes data | **everything** |
| **👁️ Read-only** | 7 · 11 | 🔴 **owns no table — reads and displays** | screens and mockups **yes** · processes **few** · 🚫 no column sweep ⇒ **source sweep** |
| **🔀 Others' columns** | 8 | 🔴 **writes into another module's table** | **security section ⑨ fires on everything** · contracts are most of the work |
| **⚙️ Engine** | 10 · 12 | 🔴 **may have no screens at all** | 🚫 no mockups ⇒ **work card · trigger map · rendered email template** |
| **🎛️ Settings** | 9 | tiny · parameter table · CEO only | sweep **row by row over the parameters** · "no numbers" is a legitimate output |

🔑 **The test that decides a borderline case: what does the module *change* in the world?** Data ⇒
screens · display ⇒ read-only · time/event ⇒ engine · configuration ⇒ settings. **A module can be two —
then both sets apply.**

⚠️ **And a classification is not an exemption.** **"I have no screens" does not cancel
`processes-approved.md`** — **an engine has a process, it is simply invisible.** *(Module 6 already set
the precedent: **"who starts it — and nobody"** — a process whose only initiator is `pg_cron`.)*

---

## 📦 The outputs matrix

| Output | When | What breaks without it |
|---|---|---|
| **`processes-approved.md`** | **always** | no product source of truth; the build rules for itself |
| **`spec.md` §"מה אסור לנחש"** | **always** | 🔴 **the one output whose content is measured facts that break a build silently** |
| **One status table** per file | **always** | a build session stops on work already done *(measured: 6 items both "closed" and "open")* |
| **Locked vocabulary** | **always** | two names for one thing ⇒ two entities in code |
| **DB requirements ⇒ `db_roadmap`** | **always** | 🔴 **this is the register the blueprint reads — not the spec** |
| **Cross-module contracts** | **always** *(count varies)* | **for module 7 this is nearly the whole module** |
| **`world-sources.md`** | **always — in inverse weight** | 🔑 **the less internal anchor there is, the more it matters.** מ11: *"את הדוחות אני המצאתי"* · מ10 has no spec section at all |
| **`screens-approved.md` + mockups** | **`M ≥ 1`** | — |
| **Column sweep** | **owns a table** | otherwise: **source sweep** — for every number on screen, who writes the column feeding it |
| **Reverse coverage vs `C5`/`C6`** | **has a section** | otherwise against whatever exists *(§1.8 · triggers · §7 items)* |
| **`discovery-log.md`** | **always** | 🚫 **and the build session does not read it** — its readers are the next Discovery and this skill's maintenance |

---

## 🔴 Five disciplines that fire in every stage and every module

**① Write to disk in the first round, not at the end.** **Measured: 1h42m passed before the first
write, and three rulings had to be recovered out of the chat afterwards.** **The target is
`processes-approved.md` — Hebrew, the file Ishay opens.** 🚫 **Not `discovery-log.md`** *(English — he
does not read it; measured that he asked about rulings that were written there)*.

**② A ruling is recorded verbatim with its date, the moment it is spoken.**
🔴 **And an idea is not a ruling:** "אולי כדאי" / "לדעתי" ⇒ **an idea — tested like any other option.**
*(Measured failure: "מעלה כרעיון" was recorded in a register as "הכרעת-ישי".)*
🆕 **And a third category — a delegated ruling**, which in module 6 was **a large share of the total**:
when he says "מה שתמליץ" — **you rule, and mark three things: ① "הכרעת-קלוד בהאצלה" ② the reasoning
and the anchor ③ "מותר לפתוח מחדש בלי טקס".**
⚠️ **The exact ratio is deliberately not stated here, because it is not cleanly measurable** — grep on
the delegation markers across module 6's approved set returns 7 `בהאצלה` and 10 `הכרעת-קלוד` against
38 rulings, i.e. **the marking itself is inconsistent.** *(A "17 of 38" figure was written here on
13/08 and withdrawn the same evening: it came from a session summary, not from a count.)*
🔑 **⇒ The actionable rule is the marking, not the ratio: mark every delegated ruling the same way, so
the next module can measure what this one could not.**

**③ A fix that adds a line without cleaning the old one is the most repeated failure.**
**Measured five times in one day**, including: a file declaring both "טרם נרשם" and "בוצע" on the same
subject · a claim retracted in one place and surviving in three others · and a `spec.md` instructing
the blueprint **not to read** a register that was already full.
> ⇒ **After every fix: `grep` for the old wording. A declaration in a file is not a closure — the token
> in the register is.**

**④ Measure, do not cite.** The live DB > `schema.sql` · the code > the docs.
🔴 **And the trap that broke two measurements in one day:** `schema.sql` is a snapshot in which **late
`ALTER` statements sit after the `CREATE TABLE` block** ⇒ **reading only the block returns "the column
does not exist" for a column that exists.**

**⑤ A real edge case versus an invented one.** **Real** arises from the business process · **invented**
from imagination. 🔑 **And the filter that closes an item in one line:** "קורה אצלך ש…?" — **and
"לא קורה" is a dated ruling of his.**

---

## 🗺️ The stages — the full procedure is in [`template.md`](template.md)

| Stage | What | Stop points |
|:-:|---|:--:|
| **0** | **Intake** — classify · three sweeps · **requirements ledger** · create the skeleton | 🛑 short |
| **1** | **Processes** — surface list · a card per process · cross-module contracts | 🛑 ×2 + per process |
| **2** | **Surfaces** *(conditional)* — card + mockup each, agent waves | 🛑 per surface |
| **3** | **Handoff** — `spec.md` · six cross-checks · write-back · fresh reviewer | 🛑 in two turns |

🔴 **The three sweeps run in stage 0, together, before any conversation.**
**Measured in module 6: all of them ran late and in reaction to Ishay's questions** — the column sweep
at **16:22**, after "stage 1 was complete" and while the drawing wave was already running. **The price:
an entire 9-agent wave to retrofit 8 late rulings into mockups that had already been drawn.**

---

## 🌊 Agent waves

**The law: rulings happen in the conversation with Ishay. Everything else — agents.**
🔑 **The sharpening without which it misleads: the agents are not an execution arm but a *discovery*
arm.** *(A control wave returned 21 findings on a file Claude wrote; a production wave found a bug in a
ruling made the same day.)*
🔴 **The precondition: the conversation comes first.** Without the document, 8 agents will invent 38
rulings of their own.

**The detail — `template.md` §6ב.**

---

## 📊 What was measured that day, so it does not repeat

| Failure | Price |
|---|---|
| 1h42m with no write to disk | 3 rulings recovered out of the chat |
| the three sweeps ran in reaction, not on initiative | 12 items · **an entire surface** · 15 of 30 columns · **a whole repair wave** |
| a document built by accretion | a 172-line structural repair |
| process-stage work done inside the screen stage | *"אתה קצת מציף אותי ואנחנו מאבדים דברים"* |
| reverse coverage ran **after** handoff | 2 requirements had fallen through |
| **4 of 6 structural findings were caught by Ishay** | **and that is the only measure showing whether this skill improves** |
