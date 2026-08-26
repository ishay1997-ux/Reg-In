# Domain 3 — Post-Event Customer Feedback for B2B Event Services — World Practice Research

Module 8 Discovery, REG-IN. Method: search-first (WebSearch), every claim cited with source name +
what it says, or tagged "מהידע שלי, לא אומת" if unsourced. Fit assessment against THIS project's
actual shape: single finance manager, ~few B2B corporate clients per event cycle (not consumer
volume), no app for hostesses, Google Forms as the survey tool, tiny event count.

---

## Q1 — Timing: how soon after event, and does delay hurt response rate?

**Our existing ruling: send at event close, based on one study. Task: corroborate or complicate,
not overturn without strong sources.**

Findings:
- **Zuddl (event-survey vendor blog):** "Send the survey out as soon as possible after the event
  while it's still fresh in attendees' minds." Supports send-at-close.
- **SurveyMonkey / multiple event-survey sources (Explori, ASAE, EventUp Planner, TheySaid):**
  converge on a **24–48 hour window**, not the literal moment the event ends. ASAE: "never wait
  more than 24 hours... but send within a week if you can't sooner." EventUp Planner explicitly
  recommends capturing feedback "right after check-in, right after a session ends, right after the
  event wraps" — i.e., moment-of-event capture is itself a recognized variant, not just delayed
  email.
- **Virtual Events Institute:** "The further away from your event you collect feedback, the more
  you cannibalize your response rate" — directly supports "sooner is better," corroborating our
  ruling's direction.
- **Complication found:** SurveyMonkey / Customer Thermometer note a *nuance*: "avoid sharing it
  immediately after the event, as attendees may need more time to reflect" — this is the one voice
  pushing against literal same-moment send, favoring a short 24–48h buffer instead. This is a mild
  complication, not an overturn: it argues for "close of event / next morning," not for a multi-day
  delay.
- **Bain & Company (via CustomerGauge / Pelin summaries of NPS timing research):** "Ask too soon,
  customers haven't formed real opinions. Ask too late, they've forgotten." This is the standard
  NPS-timing framing — it does not name a specific hour count but backs the same "narrow window,
  not either extreme" shape.
- **Reminder cadence (i4a "48-Hour Survey Window", cross-corroborated by AONMeetings and generic
  reminder-template sources):** typical B2B pattern is **initial send at/near event close → reminder
  at 48–72h → final reminder ~day 7 → survey window closes**. A reminder sent 2–3 days after the
  initial send can lift response rate by 30%+ (Clootrack / Medallia-family sources on decline).

**Fit for REG-IN:** send-at-event-close is well supported as the *right side* of the timing
spectrum; the literature's only pushback is "maybe next-day-morning instead of literally the final
minute," which is a scheduling nuance, not a reason to move to days-later. **Verdict: corroborated,
mildly complicated (moment-of-close vs next-morning is a wash in the sources) — no basis to
overturn.** For our volume (few events, one finance manager sending manually, not automated), a
reminder cadence is a "nice to have" pattern from the literature, not something the current
one-shot Google Forms flow needs to adopt — see rejection section.

---

## Q2 — Low-score follow-up: is a mandatory call below a threshold a recognized practice?

**Our rule: mandatory phone call below 3 of 5.**

Findings:
- **Closed-loop feedback / service recovery is a named, standard CX discipline.** Qualtrics,
  Zonka, Alchemer, Responsly, GetThematic, SurveyGauge, HelloCustomer, InteractionMetrics all
  describe it as a defined process: acknowledge → own → say what will be done and by when → confirm
  once done.
- **Threshold-triggered routing is standard practice**, not an edge case we invented: "some systems
  can automatically open cases when an NPS score falls below a certain threshold" and "you should be
  able to set thresholds... to control what feeds into your closed-loop system" (Alchemer/Zonka-
  family sources).
- **Personal (phone) follow-up specifically, not just an email, is the recommended channel for
  recovery**, and the literature makes a clear case for it: "personal follow-ups are especially
  powerful for service recovery... customers who receive a thoughtful follow-up after a problem
  often become more loyal than if nothing had gone wrong at all" (paraphrasing the "service recovery
  paradox," a well-known CX concept — source: Qualtrics/Zonka-family summaries).
- **Sharpest, most quotable finding (Kayako/Kustomer-family CSAT sources):** "A customer who scores
  1 or 2 and receives no follow-up will almost certainly churn, but a customer who scores 1 or 2 and
  receives a personal response... may stay." This is squarely a phone/personal-touch argument, not
  an email-only one.
- **Timing of the recovery response matters too**, mirroring Q1: "a negative score ideally warrants
  a response within 24–48 hours... a reply after three weeks reads as an autoreply."
- **Threshold conventions found, translated to our 1–5 scale:**
  - **NPS (0–10 scale):** Detractors = 0–6, i.e., everything **below 7 of 10** (70%) triggers
    detractor status (Omniconvert, Qualaroo, Salesforce, Qualtrics, Questback — all converge on
    0–6/7–8/9–10). Scaled to a 1–5 range, "below 7/10" lands at roughly **below 3.5 of 5**.
  - **CSAT (1–5 scale) top-box convention:** 4–5 = "satisfied" (counted in the CSAT%), **1–3 =
    not satisfied** (SurveyMonkey/Formbricks/Suptask CSAT-calculator family). This is the
    closest direct analogue to our scale, and it draws the satisfied/unsatisfied line at
    **exactly our threshold: below 4, i.e. ≤3, is "not satisfied."**
  - Generic CSAT **alert** thresholds (percentage-based systems, e.g. Armatis/ceohangout/Gorgias-
    family sources) cite **60–70%** as the "needs intervention" alert line, which on a 1–5 scale is
    also in the 3–3.5 region.
  - No source states our literal "<3 of 5" as a named industry-wide alert number — the closest
    direct source is the **CSAT top-box convention that draws the same line (1–3 unsatisfied vs
    4–5 satisfied)**, which is a strong corroboration, not an exact citation of "3" as a magic
    number.

**Fit for REG-IN:** Mandatory phone call below 3/5 is a recognized, well-documented practice
(closed-loop / service recovery), and the threshold we chose sits exactly on the standard CSAT
top-box split line (1–3 = dissatisfied). **This is a strong match, not an invented rule.** The one
gap: nothing in the sources says the call must be *mandatory* (system-enforced) versus a strong
recommendation — that enforcement choice is ours to make, not something world practice rules on
either way.

---

## Q3 — Score-to-label mapping: is there a standard convention, and do dashboards color-code by band?

**Our mapping: 5=excellent, 4=good, 3=fair, <3=poor (implied).**

Findings:
- **Label convention is genuinely standard**, cross-corroborated by Retently, Zonka, SurveyKing,
  ChatableApps, poll-maker: "1=Poor... 5=Excellent" is described as "commonly used... in employee,
  customer, or training feedback," and multiple sources give the same 5-word ladder: **Poor – Fair
  – Good – Very Good – Excellent** (or the "Very Poor – Poor – Fair – Good – Very Good" balanced
  variant).
- **One direct complication:** SurveyKing-family source flags that "Poor – Fair – Good – Very Good –
  Excellent isn't a balanced scale, as almost all labels read positive" and recommends a symmetric
  ladder (Very Poor…Very Good) instead. Our mapping (5=excellent/4=good/3=fair/<3=poor, i.e. no
  distinct label for 2 vs 1) is closer to the *unbalanced* variant the source flags as a minor
  design weakness — worth naming, not worth rebuilding: at our volume a human (finance manager)
  reads every score, the label is a display convenience, not a statistical instrument.
- **Dashboard color-coding by band is standard and directly corroborated for both frameworks we're
  adjacent to:**
  - NPS dashboards: **green = promoter, yellow = passive, red = detractor** (Zonka, SurveySensum —
    two independent sources, same 3-color mapping).
  - CSAT dashboards: **green = healthy / yellow = at-risk / red = poor**, with one concrete example
    band-set cited (75–100 green / 50–74 yellow / <50 red) (smartsurvey/statisfy-family sources).
  - General dashboard-design guidance (dbkay, Grow.com) confirms red/yellow/green as *the*
    conventional traffic-light pattern for KPI dashboards, with the caveat "save it for things that
    actually behave like traffic lights" (i.e., don't overuse on metrics without a clear good/bad
    direction) — feedback score is exactly the kind of metric this convention is meant for.

**Fit for REG-IN:** the label ladder and the red/yellow/green color convention are both genuinely
standard, not something we're inventing. Mapping 5→green/excellent, 4→green-ish/good, 3→yellow/fair,
<3→red/poor onto a small dashboard card is squarely inside the world pattern.

---

## Q4 — Non-responders: attempts before "no response," and is blocking archive on feedback common?

**Our rule: archive gate blocks closing an event's finance record until feedback is resolved
(scored, or marked no-response after follow-up).**

Findings — reminder cadence:
- **Academic postal-survey literature** (PMC/NCBI sources on questionnaire non-response) finds
  **3 reminders** is a commonly cited threshold ("worth sending at least three reminders"; one
  design using 3 postal reminders + a phone follow-up reached 59.1% response) but also flags
  **diminishing/poor cost-effectiveness of the final reminder** — more reminders past a point isn't
  free.
- **Business/CX practice sources** (i4a, AONMeetings, generic reminder-template guides) converge on
  a **much shorter, two-reminder cadence for event-context surveys**: initial send → reminder at
  48–72h → final reminder ~day 7 → window closes. This is the practically relevant number for our
  context (business surveys, not academic postal research) — **effectively "2 follow-ups over about
  a week," not 3 reminders over weeks**, which is what the academic sources describe.
- **On blocking internal actions until a survey response arrives — this is the sharpest and most
  transferable finding of the whole domain:** searching support-ticketing practice (Freshdesk
  community discussion, Zendesk/GitLab/TeamSupport help docs) found that **the standard pattern is
  the reverse of a gate**: "most support platforms like Freshdesk don't have a built-in option for
  mandatory customer satisfaction review... tickets can typically be closed even if the customer
  hasn't provided a survey response." Zendesk's and GitLab's own documented default automation is
  to **send the satisfaction survey 24 hours AFTER the ticket is already solved/closed** — the
  survey follows closure, it does not gate it. Where teams want a hard requirement, it's described
  as a custom workaround ("an app triggered on ticket-close to check a survey exists"), not an
  out-of-the-box or commonly-adopted default.

**Fit for REG-IN:** the 2-reminder-over-a-week cadence (not 3 over weeks) is the better-fitting
convention for our context — matches the event-industry sources, and at our volume (a handful of
events, one person sending) a longer academic-style reminder campaign has no operational analogue
here. **On the archive gate specifically: this is the one place where world practice runs opposite
to our rule.** The dominant convention (multiple independent support-tool vendors, not one
opinion) is that closing the primary record and collecting the survey are decoupled — closure
proceeds, the survey (or its absence) is tracked separately, sometimes with a "no response" status
rather than a hard block. This is a finding worth bringing back for Ishay's ruling, not a reason to
silently change the rule — the existing REG-IN gate may still be intentional (finance-record
completeness before archive is a different concern than a support ticket's SLA clock), but it is
the one point in this domain where the common-world default and our current rule diverge, and
that's worth being explicit about rather than assuming they agree.

---

## Q5 — Single weighted score vs per-question scores (Google Forms, one number recorded)

**Context: survey lives in Google Forms (external), and only one number gets recorded into REG-IN.**

Findings:
- **What's lost, per multiple CX-tooling sources (QuestionPro/SurveyMonkey/onramp-family CSAT
  guides):** a single overall number can **hide sub-segment problems** — the concrete example
  given: "an overall CSAT of 78% sounds decent but customers who contacted support are at 55% while
  customers who didn't are at 90% — the overall number hid a serious problem." Also: no open-text
  context on *why* the score was given, and no ability to separate distinct dimensions (e.g. venue
  vs staff vs value-for-money) that a multi-question instrument (CSAT for service quality / CES for
  effort / NPS for loyalty) would keep apart.
- **What's gained, per Customer Thermometer's dedicated one-question-survey analysis:** **highest
  response rates of all survey formats** (survey fatigue eliminated), **much faster to build and
  send**, **no incentive economics** (a one-question ask doesn't "justify" an incentive the way a
  longer form might), and it "generates honest, gut-feel feedback" — respondents report feeling
  more positive about a quick single-question ask than a long form. The same source is explicit
  about the accuracy trade-off going the other way too: it does **not** provide the qualitative
  depth a longer instrument (or interviews/focus groups) would, and is *not* recommended as a
  substitute for those where deep diagnostic detail is the goal.
- **Concrete quantified tradeoff (SurveyMonkey-family source):** "customers spend ~75 seconds on
  single-question surveys but only ~30 seconds per question when more are added" — each added
  question measurably costs completion time/accuracy, which argues *for* single-question at low
  response-rate-tolerance contexts.
- **No source specifically validates "one number, no free text, entered by staff into a separate
  system" as its own defensible pattern** — the literature compares 1-question vs multi-question
  *survey design*, not the specific REG-IN shape of "external form + manual single-number
  transcription into the business system." That transcription-gap risk (typo, staff choosing not to
  transcribe a bad score) is not something any source addressed — **searched for and not found.**

**Fit for REG-IN:** one-number-per-event is a defensible, sourced convention **for the survey-design
side** (single-question surveys are real, recommended for speed/response-rate, explicitly
positioned as a trade against depth) — it is not an invented shortcut. What the literature does
flag as the real cost is exactly what our SSOT already can't provide from Google Forms: sub-segment
or per-dimension detail, and open-text "why." Since REG-IN's Module 8 need is a per-event health
signal for a single finance manager (not segment-level CX analytics), this is a case where the
"loss" the sources describe is a loss largely irrelevant to our scale — see Q5 in the fit
discussion above per the brief's own framing ("data nobody collects does not exist").

---

## Considered and rejected for this project

These are real, sourced conventions that solve a problem REG-IN does not have (scale,
multi-tenant/segment analytics, regulatory audit trail, or a support-ticket SLA clock) — listed with
the reason each doesn't transfer:

1. **Automated multi-stage reminder campaigns (email drip: T+0, T+48h, T+7d, auto-close).** Real
   and well-documented (i4a, AONMeetings, reminder-template sources) — but built for tools that send
   survey invites *automatically* at scale. REG-IN's Module 8 flow is one finance manager manually
   sending a Google Forms link to a handful of B2B contacts per event; there is no email-automation
   layer to hang a drip campaign on, and building one would be infrastructure for a volume (dozens+
   sends/month) we don't have. **Rejected: solves an automation-at-scale problem we don't have.**
2. **Sub-segment / cohort-level CSAT breakdown (e.g., "customers who contacted support" vs not).**
   Directly named in the Q5 research as what a single score loses — but it presumes enough
   respondent volume per segment to be statistically meaningful. With ~50 hostesses and a handful of
   B2B events, any per-event or per-client feedback set is small enough that a human (the finance
   manager) can read every individual score directly; segment analytics would be manufacturing
   precision the data volume can't support. **Rejected: analytics built for volume we don't have.**
3. **CES (Customer Effort Score) / multi-metric framework (NPS + CSAT + CES each for a different
   funnel stage).** A recognized enterprise CX pattern (Kustomer-family source: "CES to optimize
   booking flow, CSAT to grade agents, NPS for loyalty") — but it assumes multiple distinct customer
   touchpoints/teams each needing their own metric. REG-IN Module 8 has one touchpoint (post-event,
   one client contact, one score) and one owner (finance manager) reading it. **Rejected: solves a
   multi-team, multi-touchpoint measurement problem we don't have.**
4. **Hard system-enforced gate that blocks ticket/record closure until a CSAT response exists,
   framed as a desirable feature to build.** The support-tooling research found this explicitly
   described as a *non-default*, custom workaround that most platforms deliberately don't ship
   out-of-the-box — the dominant pattern decouples closure from survey completion. Noted above in
   Q4 as a finding to bring back, not silently rejected — but flagging here that "build a hard
   database-level block" specifically (as opposed to a soft status field) is the version of this
   pattern that world practice treats as the unusual choice, not the norm. **Not rejected outright —
   flagged for Ishay's ruling in Q4, since it's the one place our existing rule and the common
   default diverge.**
5. **Balanced/symmetric label ladders (Very Poor–Poor–Fair–Good–Very Good) to avoid the "almost all
   labels read positive" distortion SurveyKing flagged.** Real methodological critique, and cheap to
   adopt — but it's a survey-instrument design concern (respondents anchoring toward positive
   labels while answering), and our score isn't collected through a REG-IN-rendered label ladder at
   all — it's a single number transcribed from an external Google Form. The distortion this fixes
   happens (if at all) in Google's form, which REG-IN doesn't control. **Rejected here as
   out-of-scope for what REG-IN renders — worth knowing if the Google Form itself is ever
   redesigned, but not a Module 8 system decision.**

---

## What was searched for and NOT found

- **No source gives an exact, named industry number for "call below 3 of 5" as a stated rule** (the
  strongest corroboration found was the CSAT top-box convention drawing the same 1–3-vs-4–5 line —
  reported above in Q2 as corroboration-by-equivalent-convention, not a literal citation of "3").
- **No source addresses the specific REG-IN shape of Q5** — an external survey tool (Google Forms)
  feeding a single manually-transcribed number into a separate business system, and the specific
  risk of that transcription step (typo, selective non-entry of bad scores). This is a real gap:
  the literature discusses single-question **survey design**, never the **integration/manual-entry**
  pattern our actual pipeline uses.
- **No source names a standard "no-response" status field or workflow specific to event-industry
  post-event CSAT** (as opposed to general support-ticket CSAT, which was found). Event-specific
  sources (Zuddl, Explori, ASAE, EventUp Planner, i4a) discuss maximizing response rate but not what
  to do with the events that never respond, beyond generic "send reminders."
- **No direct case study of a company our size (single admin, B2B events, ~few dozen events/year)**
  running any of this — everything found is either enterprise CX tooling (Qualtrics/Medallia/Zonka-
  scale) or academic survey-methodology research (postal questionnaires). This is worth naming
  explicitly per the brief's instruction: import the *practice*, not the *scale* the practice was
  built for.

---

## Source list (representative — full citations inline above per finding)

Zuddl, SurveyMonkey (multiple articles), Customer Thermometer (2 articles), Explori, ASAE, Pelin,
CustomerGauge, Virtual Events Institute, i4a, AONMeetings, Clootrack, Medallia-family, Alchemer,
Qualtrics (closed-loop CX), Zonka Feedback (2 articles), GetThematic, Responsly, HelloCustomer,
InteractionMetrics, SurveyGauge, Kayako, Kustomer, Gorgias, Armatis, ceohangout, Retently,
SurveyKing, ChatableApps, poll-maker, Omniconvert, Qualaroo, Salesforce, Contentsquare, Questback,
Perspective AI, SurveySensum (2 articles), dbkay, Medium/Grow.com, statisfy, smartsurvey,
Formbricks, Suptask, QuestionPro, onramp, PMC/NCBI (3 academic reminder-cadence studies), Freshdesk
community, Zendesk/GitLab/TeamSupport help docs.
