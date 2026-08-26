# Module 8 Discovery — Domain 1: Invoicing & Collections for a Small Israeli B2B Services Company

Research agent output. All claims below are either sourced (site + what it says) or explicitly
tagged `מהידע שלי, לא אומת`. Organized by the 5 assigned questions, then a dedicated
"considered and rejected" section, then a "searched for, did not find" section.

---

## Q1 — Invoice types 2025–2026, and does the allocation-number reform affect a company REG-IN's size?

### The three document types (definitions)
- **חשבונית מס (tax invoice)**: issued by an עוסק מורשה/חברה בע"מ, documents the transaction for VAT
  purposes; lets a business customer deduct input VAT. Must be issued at the **tax liability date**
  — which for a service is typically **when the service is delivered**, regardless of when payment
  actually arrives.
  Source: [hyp.co.il — חשבונית מס, חשבונית עסקה וקבלה 2026](https://hyp.co.il/blog/tax-invoice/)
- **חשבונית עסקה (transaction invoice)**: a payment-demand / transaction-confirmation document. Any
  business may issue one; it does **not** allow the recipient to deduct input VAT.
  Source: same hyp.co.il article; also [kolzchut — הוצאת חשבונית מס, חשבונית עסקה וקבלה](https://www.kolzchut.org.il/he/%D7%94%D7%95%D7%A6%D7%90%D7%AA_%D7%97%D7%A9%D7%91%D7%95%D7%A0%D7%99%D7%AA_%D7%9E%D7%A1,_%D7%97%D7%A9%D7%91%D7%95%D7%A0%D7%99%D7%AA_%D7%A2%D7%A1%D7%A7%D7%94_%D7%95%D7%A7%D7%91%D7%9C%D7%94)
- **קבלה (receipt)**: documents that payment was actually received; must be issued **immediately upon
  receiving payment**.
  Source: hyp.co.il (same article).
- **חשבונית מס/קבלה (combined)**: a single document used **only when payment is simultaneous** with
  the transaction (e.g. cash/card at the moment of sale). It cannot substitute for the two-document
  flow when payment is deferred.
  Source: hyp.co.il (same article).

### Which document does a small events company send after an event, with deferred payment (30–60 days)?
**Sequence confirmed by source (hyp.co.il):**
1. At service completion (event day) → issue **חשבונית מס** now, regardless of when payment will
   land — the tax point is service delivery, not payment.
2. When payment actually arrives (30–60 days later, per שוטף+30/60 terms) → issue a **קבלה**
   separately.
3. A combined חשבונית מס/קבלה is **not** appropriate here because payment isn't simultaneous with the
   service.

**Fit for REG-IN:** this is a clean **two-step, two-timestamp pattern** — "invoice sent" (חשבונית מס
issued at event-close) and "payment received" (קבלה issued later) — which maps directly onto the
already-ruled module scope (manual invoice upload+send, payment-date tracking) as two distinct
tracked events/dates rather than one. This is import-worthy: track both dates, not one.

### Does the 2024+ allocation-number (מספר הקצאה) reform affect a company REG-IN's size?
**Threshold by year** (amount is **before VAT**, applies per invoice):
| Effective from | Threshold (₪, before VAT) |
|---|---|
| May 2024 | 25,000 |
| January 2025 | 20,000 |
| January 2026 | 10,000 |
| **June 2026** | **5,000** |

Sources: [morning/Green Invoice — מודל חשבוניות ישראל (2026 guide)](https://www.greeninvoice.co.il/magazine/israel-invoice/); corroborated by search snippets from [VUZ — מאיזה סכום חובה ב-2026](https://vuz.co.il/knowledge-center/allocation-number-thresholds-2026/), [hgj.co.il](https://hgj.co.il/%D7%9E%D7%A1%D7%A4%D7%A8-%D7%94%D7%A7%D7%A6%D7%90%D7%94-%D7%9C%D7%97%D7%A9%D7%91%D7%95%D7%A0%D7%99%D7%AA-2026/), [ACI](https://aci.org.il/knowledge/allocation-number-input-tax-2026/), [Baker Tilly](https://bakertilly.co.il/blog-invoices-2026.html).

- Applies to **all customers** (not just B2B/government) once an invoice's pre-VAT amount exceeds
  the threshold; below threshold, no obligation.
- The number is obtained through a real-time online request to the Tax Authority at the moment the
  invoice is issued, and without it the **recipient** cannot deduct input VAT on that invoice.
- The obligation sits on the **issuer** (whoever produces the חשבונית מס) — practically this means
  Green Invoice / חשבשבת / whichever certified software actually issues the document must support
  it, not the operational tracking system.

**Open item for the main session (cannot be resolved by web research):** whether this reform is even
*relevant* to REG-IN depends on the company's typical **per-event invoice amount** (2-5 hostesses ×
per-event rate). If typical invoices sit under 5,000 ₪ before VAT, the reform is currently
irrelevant to REG-IN regardless of which platform issues the invoice. This is REG-IN pricing data I
don't have access to — flag to Ishay: "יש אירועים שהחיוב עליהם עובר 5,000 ₪ לפני מע״מ?" A "לא" closes
this as a non-issue; a "כן" still doesn't create system work, since (per the ruled flow, see Q5) the
actual invoice + allocation-number request happens in the external accounting software, not in REG-IN.

---

## Q2 — Standard B2B payment terms in Israel (שוטף+30/60) and חוק מוסר תשלומים לספקים

### How common are שוטף+30/45/60/90 terms?
"שוטף+30/45/60/90" (payment due N days after the end of the calendar month in which the invoice was
issued) is described as **the standard payment-term convention in the Israeli market** between
suppliers and business customers, and sometimes with public bodies too.
Source: [Nimble Finance — מה זה שוטף פלוס](https://nimble-finance.com/%D7%9E%D7%94-%D7%96%D7%94-%D7%A9%D7%95%D7%98%D7%A3-%D7%A4%D7%9C%D7%95%D7%A1-%D7%9B%D7%9C-%D7%9E%D7%94-%D7%A9%D7%A6%D7%A8%D7%99%D7%9A-%D7%9C%D7%93%D7%A2%D7%AA-%D7%A2%D7%9C-%D7%A9%D7%99%D7%98%D7%AA/); search-snippet corroboration from [hon.co.il](https://www.hon.co.il/%D7%A9%D7%95%D7%98%D7%A3-%D7%A4%D7%9C%D7%95%D7%A1-30-45-60-%D7%9E%D7%94-%D7%90%D7%95%D7%9E%D7%A8-%D7%94%D7%97%D7%95%D7%A7/) and [danieli-law.co.il](https://danieli-law.co.il/%D7%9E%D7%94%D7%95-%D7%A9%D7%95%D7%98%D7%A3-%D7%A4%D7%9C%D7%95%D7%A1-30-%D7%91%D7%AA%D7%A0%D7%90%D7%99-%D7%AA%D7%A9%D7%9C%D7%95%D7%9D-%D7%94%D7%A1%D7%91%D7%A8-%D7%A4%D7%A9%D7%95%D7%98-%D7%95%D7%A7/).

### What does חוק מוסר תשלומים לספקים (2017) actually say — and does it apply to REG-IN's situation?
Confirmed via [kolzchut — המועד האחרון לתשלום תמורה לספקים](https://www.kolzchut.org.il/he/%D7%94%D7%9E%D7%95%D7%A2%D7%93_%D7%94%D7%90%D7%97%D7%A8%D7%95%D7%9F_%D7%9C%D7%AA%D7%A9%D7%9C%D7%95%D7%9D_%D7%AA%D7%9E%D7%95%D7%A8%D7%94_%D7%9C%D7%A1%D7%A4%D7%A7%D7%99%D7%9D_%D7%A2%D7%91%D7%95%D7%A8_%D7%A1%D7%97%D7%95%D7%A8%D7%94_%D7%90%D7%95_%D7%A9%D7%99%D7%A8%D7%95%D7%AA):
- The law's mandatory payment-date ceilings **only bind the payer** when the payer is: government
  bodies, local authorities, statutory entities (Bank of Israel, ISA, etc.), budgeted higher-ed
  institutions, government-budgeted bodies, or (in a separate track) private licensed/large
  businesses.
- **A supplier serving a private individual who is not a business is explicitly excluded** from the
  law's protection.
- **When both parties are ordinary small/medium businesses with no government/institutional status,
  the law's mandatory terms do NOT apply** — payment terms between them are freely negotiated.
- Where it does apply and payment is late: the payer owes הצמדה (indexation) + ריבית (interest) from
  the due date; after **3 months** of delay, an additional statutory late-payment interest kicks in
  — but per the source, this can be waived if the payer did not have negotiating-power advantage over
  the supplier (i.e., the law is specifically aimed at protecting the *weaker* party in an unequal
  relationship).
- Public-sector variants: שוטף+30 for many municipalities' methods; שוטף+45 as a general default;
  שוטף+80 specifically for engineering/construction contracts.
  Source (public-sector specifics): search-snippet corroboration from [Ettorney](https://www.ettorney.co.il/%D7%97%D7%91%D7%A8%D7%95%D7%AA-%D7%91%D7%9C%D7%95%D7%92/%D7%97%D7%95%D7%A7-%D7%9E%D7%95%D7%A1%D7%A8-%D7%94%D7%AA%D7%A9%D7%9C%D7%95%D7%9E%D7%99%D7%9D-%D7%9C%D7%A1%D7%A4%D7%A7%D7%99%D7%9D-%D7%9E%D7%AA%D7%99-%D7%A6%D7%A8%D7%99%D7%9A/).

**Practical read for REG-IN:** REG-IN's B2B customers are (per the module scope) other businesses —
most are presumably not government/large-regulated entities, so the statutory ceilings likely do
**not** bind them; the שוטף+N terms REG-IN would record are **contractually agreed, not legally
imposed**. This matters for the system: there's no legal enforcement mechanism to encode — just a
field for "what we agreed" (e.g. שוטף+30/45/60) and a computed/derived due-date from it. If some of
REG-IN's customers ARE government/large institutions (worth a quick "יש לך לקוחות ממשלתיים/עירייה?"
check with Ishay), the statutory ceiling becomes a **soft cap** worth surfacing, not enforcing.

---

## Q3 — Late payment handling in small companies

### Reminder cadence / escalation
A concrete example cadence (search-snippet + partial fetch), source [Horizon — איך לנהל נכון חובות
לקוחות](https://horizon.org.il/collect/how-to-manage-accounts-receivable/) and the search-result
summary drawn from it:
- **5 days before due date**: automatic reminder.
- **Day after due date passes**: personal email.
- **After 7 days overdue**: phone call.
- **After 30 days overdue**: formal written warning letter.
- **After 60 days overdue**: decision point — freeze services to that customer, or escalate to legal
  process.

A separate collections-process guide, [Shopenlaw — המדריך השלם לגביית חובות
מלקוחות](https://shopenlaw.com/%D7%94%D7%9E%D7%93%D7%A8%D7%99%D7%9A-%D7%94%D7%A9%D7%9C%D7%9D-%D7%9C%D7%92%D7%91%D7%99%D7%99%D7%AA-%D7%97%D7%95%D7%91%D7%95%D7%AA/)
describes the same shape without exact day-counts: reminders → calls → written demand letter (from
the business itself) → attorney warning letter → lawsuit/enforcement — explicitly advising **not to
let it drag on** once amounts are meaningful.

### Is interest/הצמדה actually charged in practice by small suppliers?
**Mixed / not conclusively resolved — flagging honestly rather than asserting either way:**
- The Horizon source frames extended customer credit informally as **"a free loan"** every time a
  45-day-term invoice is issued — implying that in practice, many small businesses **do not**
  mechanically charge interest/indexation on late B2B payments; they treat it as a cash-flow cost to
  manage (weekly aging review), not a chargeable line item.
- Conversely, both the legal/collections guides ([Shopenlaw](https://shopenlaw.com/%D7%94%D7%9E%D7%93%D7%A8%D7%99%D7%9A-%D7%94%D7%A9%D7%9C%D7%9D-%D7%9C%D7%92%D7%91%D7%99%D7%99%D7%AA-%D7%97%D7%95%D7%91%D7%95%D7%AA/))
  and the חוק מוסר תשלומים context (Q2) treat "ריבית פיגורים והשלכות איחור" as a standard clause to
  put in a **contract up front** — but that's guidance for *what a contract should say*, not evidence
  of what small suppliers actually invoice/collect day-to-day.
- **No source found that quantifies** how often small Israeli suppliers actually charge and collect
  interest on late B2B payments in practice (see "searched for, did not find" below).

**Fit read:** this is a genuine open question, not a researchable fact — worth a direct "קורה אצלך
שאתה בפועל גובה ריבית/הצמדה על תשלום מאחר, או שזה נשאר על הנייר?" to Ishay rather than assuming either
way.

### What minimal tracking does a system this size need — aging buckets or just a date?
Source: [Horizon — איך לנהל נכון חובות לקוחות](https://horizon.org.il/collect/how-to-manage-accounts-receivable/).
- Recommends explicit aging buckets: **not yet due / 1–30 days / 31–60 days / 61–90 days / 90+ days**,
  reviewed in a **fixed 20-minute weekly meeting** ("which invoices entered the first delinquency
  bucket this week, who crossed the 60-day line, is the overdue portfolio growing faster than sales").
- The source frames this as applicable to "any business selling on invoice terms, **from revenue in
  the hundreds of thousands of shekels annually**" — i.e., even the source's own low bar for "you need
  this" assumes a business with dozens+ of open invoices at a time.

**Fit for REG-IN (import practice, reject the justification):** the *practice* worth importing is
**"sort open invoices by staleness so nothing silently ages past 60 days unnoticed"** — that's cheap
and universally useful. The *justification* for a formal 5-bucket categorization + dedicated weekly
ritual is built for a portfolio with many concurrent open invoices across many customers; REG-IN's
own environment brief describes tiny volume ("you re-sort, you don't filter"). **Recommendation:**
a single computed field (`ימי איחור` = today − due_date, shown on a sortable list) delivers the same
visibility as 4 discrete bucket categories, without building bucket-boundary logic nobody needs at
this volume. See rejection list below.

---

## Q4 — Refund/credit policy when a project is cancelled AFTER a quote was approved

### Consumer-protection cancellation-fee rules do NOT apply here — REG-IN's customers are businesses
Search results surfaced Israel's consumer cancellation-fee regime (5% of price or 100 ₪, whichever
is lower; 14-day cooling-off window; 7-business-day pre-event cutoff) — e.g.
[kolzchut — ביטול רכישה שנעשתה בבית העסק](https://www.kolzchut.org.il/he/%D7%91%D7%99%D7%98%D7%95%D7%9C_%D7%A8%D7%9B%D7%99%D7%A9%D7%94_%D7%A9%D7%A0%D7%A2%D7%A9%D7%AA%D7%94_%D7%91%D7%91%D7%99%D7%AA_%D7%94%D7%A2%D7%A1%D7%A7_%D7%95%D7%94%D7%97%D7%96%D7%A8%D7%AA_%D7%94%D7%9E%D7%95%D7%A6%D7%A8).
**This is תקנות הגנת הצרכן — it governs a business selling to a private consumer.** REG-IN's module 8
customers are other **businesses** (B2B), which places this entire regulatory framework **out of
scope** — see rejection list.

### How do Israeli event suppliers actually structure cancellation terms (the convention, not the law)?
Tiered/graduated cancellation-fee ladders by days-before-event are a documented **industry
convention**, e.g. (from a workshop/festival platform's published cancellation policy):
- 70–90 business days before event → 10% of price
- 46–70 business days before → 25%
- 26–45 business days before → 35%
- 8–25 business days before → 45%

Source: [Eventbuzz — מדיניות ביטולים](https://eventbuzz.co.il/lp/cancelP?id=591ac53aa56da13b308b7dc2)
(search-snippet). **Caveat:** this example is drawn from a consumer-facing
festival/workshop-ticketing context, not a corporate B2B event-services vendor — I could not find a
B2B-specific published cancellation ladder for an events/staffing company. The *shape* of the
convention (a graduated percentage ladder keyed to days-before-event) is a real, transferable
pattern; the specific percentages/breakpoints above are not verified as typical for B2B corporate
event staffing specifically.

### Does a company that has NOT yet invoiced need anything at all?
No source directly addresses this because it's really a chain of two already-sourced facts (Q1 +
credit-note mechanics below), not a separate convention:
- If the quote was approved but **no חשבונית מס has been issued yet** (the ruled REG-IN flow — invoice
  is issued manually, presumably around/after the event, not at quote-approval time) — there is
  **no VAT document to reverse**. Cancelling before invoicing is a business-status change only
  (project marked cancelled), not a financial-document event.
- If an invoice **was already issued** before the cancellation became known, the correction mechanism
  is a **חשבונית זיכוי (credit note)** — a formal offsetting document issued against the original tax
  invoice, per Income Tax Commissioner guidance on ניהול ספרים. Where the customer won't return the
  original invoice or is unreachable, a חשבונית זיכוי is still issued against it.
  Source: [hyp.co.il — ביטול חשבונית או קבלה באינטרנט](https://hyp.co.il/blog/correcting-the-invoice/)
  (search-snippet); corroborated by [kolzchut — הוצאת חשבונית מס, חשבונית עסקה
  וקבלה](https://www.kolzchut.org.il/he/%D7%94%D7%95%D7%A6%D7%90%D7%AA_%D7%97%D7%A9%D7%91%D7%95%D7%A0%D7%99%D7%AA_%D7%9E%D7%A1,_%D7%97%D7%A9%D7%91%D7%95%D7%A0%D7%99%D7%AA_%D7%A2%D7%A1%D7%A7%D7%94_%D7%95%D7%A7%D7%91%D7%9C%D7%94).

**Fit for REG-IN:** the "was an invoice already sent?" fork is the load-bearing distinction, and it
lines up cleanly with what REG-IN already tracks (invoice-sent status per Q1/Q5). No-invoice-yet →
system just needs a cancelled-status field. Invoice-already-sent → the finance manager needs to be
prompted/reminded that a חשבונית זיכוי is owed (produced externally, per Q5 — REG-IN would only need
to flag "invoice was sent, project now cancelled, credit note needed" as a visible state, not
generate the document itself).

---

## Q5 — Is "operational system tracks status only, actual invoice produced in dedicated accounting software" normal practice?

**Short answer: yes, this is a common and recognizable pattern — and there's a concrete regulatory
reason for it, not just convenience.**

### Evidence the pattern is common
- Green Invoice (חשבונית ירוקה, the leading Israeli invoicing platform per its own marketing —
  "165,000 עצמאים") explicitly markets **one-click export to חשבשבת and ריווחית**, and documents
  integration with external CRM/ERP systems via API "לאוטומציה מלאה של התהליכים" — i.e. the
  established pattern is: **something else** (CRM/ops tool) drives the process, and Green
  Invoice/חשבשבת is the system of record for the actual legal document.
  Source: [invoice4u — התממשקות עם חשבשבת/ריווחית](https://www.invoice4u.co.il/market/hashavshevet/); [Green Invoice — תוספים לעסק](https://www.greeninvoice.co.il/add-ons/integrations/).
- A CRM-vendor's own advisory content states plainly: **"CRM systems are not accounting management
  systems"** and that even CRMs offering invoicing features "cannot provide the desired results in
  the accounting domain" — recommending integration with a dedicated invoicing/accounting tool
  instead of building it in-house.
  Source: [ISRAEL CRM — כיצד לבחור מערכת להנהלת חשבונות ולשלב אותה עם CRM](https://israelcrm.co.il/%D7%9B%D7%99%D7%A6%D7%93-%D7%9C%D7%91%D7%97%D7%95%D7%A8-%D7%9E%D7%A2%D7%A8%D7%9B%D7%AA-%D7%9C%D7%94%D7%A0%D7%94%D7%9C%D7%AA-%D7%97%D7%A9%D7%91%D7%95%D7%A0%D7%95%D7%AA-%D7%95%D7%9C%D7%A9%D7%9C%D7%91/).
- Counter-example worth noting honestly: **SUMIT** is marketed as an all-in-one business-management
  platform (CRM + inventory + expenses) that **does** issue the full set of official documents itself
  (חשבונית מס, חשבונית מס/קבלה, קבלה, הצעת מחיר, תעודת משלוח, הזמנת רכש, חשבונית זיכוי) with legally
  sequential numbering — so "one combined system" is also a real, marketed model in this space, not
  purely theoretical. Source: SUMIT's own help-center content (search-snippet,
  [help.sumit.co.il](https://help.sumit.co.il/he/articles/11814848-%D7%A0%D7%99%D7%94%D7%95%D7%9C-%D7%97%D7%91%D7%A8%D7%94-%D7%91%D7%9E%D7%A2%D7%A8%D7%9B%D7%AA-sumit)).
  This doesn't contradict REG-IN's ruled flow — it just shows the split-system pattern isn't the
  *only* pattern in the market, it's one legitimate option among a few (and REG-IN's choice is
  already ruled, so this is background, not a live decision).

### The regulatory reason the split pattern exists
Software meant for **managing a computerized accounting system** ("מערכת חשבונות ממוחשבת") — when
intended for **sale, rental, or use by another party** (including free use by others) — **must be
registered** with the Tax Authority under הוראות ניהול ספרים (appendix ה, סעיף 36), including
conformance to the מבנה אחיד (uniform structure) output format.
Sources: [gov.il — בקשה לרישום תוכנה המיועדת לניהול מערכת חשבונות ממוחשבת](https://www.gov.il/he/service/itc-application-for-registration-software-computer-account-systems); [Nevo — הוראות מס הכנסה (ניהול פנקסי חשבונות), תשל״ג-1973](https://www.nevo.co.il/law_html/law01/255_179.htm); search-snippet corroboration via [gov.il registry FAQ pages](https://www.gov.il/he/pages/audiences-software-faq) (this specific FAQ page itself returned HTTP 403 on direct fetch — see "did not find" below — so the "for another party, including free use" phrasing is from the search snippet, not a page I read in full).

**This is a real, checkable mechanism, not a guess:** a purpose-built invoicing platform (Green
Invoice, SUMIT, חשבשבת) carries the compliance burden of being a registered, audited
document-numbering system. A bespoke internal tool that only **tracks** invoice-sent/paid status —
never itself issuing the legal document — plausibly sidesteps that registration/compliance burden
entirely, because it never becomes "a system for managing the accounting records" in the regulatory
sense; it's directory data pointing at documents issued elsewhere.

**One nuance not fully resolved:** whether a system built **only for one company's own internal use**
(never sold/rented/lent to any other business) is exempt from registration regardless of whether it
issues invoices, is not something I could confirm with certainty — the primary gov.il FAQ page
resisted fetching. Tag: `מהידע שלי מהתוצאות שכן נטענו, לא אומת במלואו`. It doesn't change the
conclusion for REG-IN though, since REG-IN's ruled flow avoids producing the invoice document at all
— so the registration question is moot for REG-IN specifically, regardless of how that nuance
resolves.

**Conclusion for Q5:** REG-IN's ruled flow (track invoice-sent + payment-date, produce the actual
invoice elsewhere) **matches common, recognized practice** — it's the same shape as CRM-tools
integrating with Green Invoice/חשבשבת rather than reimplementing invoicing, and it has a real
regulatory rationale (avoiding becoming a registered accounting-records system), not just "we didn't
get to it."

---

## Considered and rejected for this project

Practices found during research that solve a real problem *somewhere* but not one REG-IN has, per
the "import the practice, never the justification" rule.

1. **Consumer-protection cancellation-fee regime (5%/100₪ cap, 14-day cooling-off, 7-business-day
   pre-event cutoff) — REJECTED.** This is תקנות הגנת הצרכן, which by its own text governs a business
   selling to a **private consumer**, and explicitly excludes the reverse. REG-IN's module 8 scope is
   B2B billing of business customers — this regulatory framework simply doesn't attach to REG-IN's
   transactions. Importing it would be solving a problem (protecting a private consumer from an
   unequal business) that doesn't exist in REG-IN's customer relationships.

2. **חוק מוסר תשלומים לספקים as an enforceable payment-deadline mechanism inside the system —
   REJECTED as a system feature (kept only as informational context).** The law only binds a payer
   that is government/large-regulated; a small company invoicing another small/medium business
   negotiates freely, and the law offers no violation-reporting duty relevant to REG-IN's own system
   (the reporting-to-Small-Business-Authority path is the *supplier's* legal recourse against a large
   payer, not something the software needs to automate). Building compliance/enforcement logic around
   this law would be infrastructure for a scale of counterparty (government contracts, formal
   violation reporting) REG-IN likely doesn't have — worth a quick "יש לך לקוחות ממשלתיים/עיריות?"
   check with Ishay before fully closing this, since if the answer is yes, the שוטף+N ceiling becomes
   a soft flag worth showing (see Q2), not a rejection.

3. **Formal 4-bucket aging-report engine + dedicated weekly collections ritual (30/60/90+, à la
   Priority Zoom / ERP accounts-receivable modules) — REJECTED, practice imported in simplified
   form.** The sourced justification for this pattern (Horizon) is explicitly framed for a portfolio
   of many concurrent open invoices across many customers ("revenue in the hundreds of thousands of
   shekels annually" is the source's *own* low bar). REG-IN's actual environment is a handful of
   customers and a modest event cadence — a single finance person can read a list sorted by "days
   overdue" without discrete bucket-category machinery. **Practice imported instead:** compute and
   surface `ימי איחור` per open invoice, sortable — the visibility Horizon's buckets exist to deliver,
   without engineering bucket boundaries this volume doesn't need.

4. **In-system invoice document generation with מבנה אחיד compliance, sequential legal numbering,
   and allocation-number API integration — REJECTED (out of scope by prior ruling, and correctly
   so).** This is exactly the registered-accounting-system machinery discussed in Q5. Building it
   would mean REG-IN itself becomes a system requiring Tax Authority registration and ongoing
   compliance upkeep (מבנה אחיד exports, sequential-numbering audits) — solving a regulatory-compliance
   problem that the already-ruled "invoice issued in Green Invoice/חשבשבת, REG-IN just tracks
   status" flow deliberately routes around. Confirms the existing ruling rather than opening it.

5. **Formula-driven interest/הצמדה auto-calculation on overdue invoices — NOT rejected outright,
   flagged as unconfirmed fit.** Evidence on whether small Israeli suppliers actually charge this in
   practice was genuinely mixed (see Q3) — one source frames extended B2B credit as an informally
   accepted "free loan," others treat a late-interest clause as standard contract boilerplate.
   Building an auto-calculating indexation/interest engine imports a *formal collections-law* practice
   that may not match how a single finance manager with a handful of customers actually operates.
   **Not resolved by research — needs Ishay's own answer**, not an import decision either way: "קורה
   אצלך שבפועל אתה גובה ריבית/הצמדה על תשלום שמאחר, או שזה נשאר על הנייר ולא קורה בפועל?"

---

## Searched for, did not find

- **A B2B-specific (not consumer/ticketing) published cancellation-fee ladder for an Israeli
  corporate event-staffing or event-production company.** The graduated-percentage examples found
  (Eventbuzz) are from a consumer-facing festival/workshop-ticketing context. I did not find a
  published B2B corporate-events equivalent — the *shape* of graduated-by-days-before-event fee
  ladders is a transferable pattern, but the specific percentages are not confirmed as B2B-typical.
- **Quantified/statistical evidence on how many small Israeli B2B suppliers actually charge and
  collect ריבית/הצמדה on late payments in practice** (vs. how many just chase the payment without a
  formal interest charge). Every source found was qualitative advisory content, not a survey or
  Tax-Authority/CBS statistic.
- **Direct confirmation (from the primary source) of whether a system built strictly for one
  company's own internal use, never sold/rented to any other business, is exempt from the "מרשם
  תוכנות לניהול מערכת חשבונות ממוחשבת" registration requirement.** The gov.il FAQ page
  (https://www.gov.il/he/pages/audiences-software-faq) returned HTTP 403 on direct fetch; the
  "for another party, including free use" phrasing is drawn from the search-result snippet only,
  not a page I read end-to-end. As noted in Q5, this doesn't change REG-IN's situation either way
  since REG-IN's ruled flow never issues the invoice document itself.
- **REG-IN's own typical per-event invoice amount** (needed to know whether the 2026 allocation-number
  ₪5,000 threshold is even in range for REG-IN's invoices) — this is internal pricing data no web
  search can supply; flagged to the main session as a fact to pull from REG-IN's own quote/pricing
  data or ask Ishay directly, not a research gap.
- **icount.co.il's own explanation page** (`icount.co.il/blog/invoice-differences/`) — returned
  HTTP 403 on WebFetch; substituted with the hyp.co.il article which covers the same ground and was
  fetchable in full.
