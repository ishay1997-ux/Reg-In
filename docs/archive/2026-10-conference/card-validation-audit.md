# Card: input-validation audit across REG-IN (read-only)

Prepared by the deputy, 14.10 ~13:0x.

Ishay's words, 14.10 ~13:0x: *"יש עוד מקומות (בעצם בכל הזנה) שנדרש להוסיף בדיקות תקינות? זה חשוב לי"*. Context: the conference moderator asked what happens when an event's end time is earlier than its start time. Judges like validation.

Model: Sonnet, high effort. The job is mostly a mechanical inventory; the ranking rule is given below.

## Scope
Every user input in `src/` on `origin/main`, in `C:\Users\ishay\Reg-In-payroll-d`, read-only: forms, dialogs, inline edits, the public pages (hostess confirm, payroll review, feedback).

**Read-only.** No edits, no DB writes, no browser actions that write.

## For each input field, record
- screen and file:line
- field
- type
- what is validated today: client side (zod or a hand check) and server side (CHECK constraint, RPC raise)
- the message the user sees, verbatim
- **the gap**

A gap is any of these:
- no bound on a number (negative, zero, absurd);
- date/time logic (end before start, past date where it matters, outside the event);
- a format (phone, email, ID number with the Israeli check digit, bank account);
- a required field that is not marked;
- the client allows what the server rejects with a raw error;
- the server has no rule at all;
- duplicate entries (same hostess twice, same customer twice);
- free text with no length cap;
- a message that does not say how to fix it.

Also check consistency across sibling screens: the same value validated differently in two places.

Reuse: before proposing a check, look for an existing helper (`src/lib/*`, `zod` schemas, params ceilings) and name it.

## Ranking (in this order)
1. Can silently corrupt money or hours: price, rate, hours, discount, VAT, payroll inputs.
2. Visible on the conference route: the quote builder, the new quote, the project card, staffing, closing, finance, payroll, settings/params. The route is in `C:\Users\ishay\payroll-work\demo-route-15-10.md`.
3. Everything else.

## Output
Write `C:\Users\ishay\payroll-work\validation-audit.md` with:
- a table, one row per gap, with these columns: rank · screen · field · gap · proposed check (soft notice vs block) · exact Hebrew message · size (S < 15 min / M / L) · existing helper to reuse;
- a short list "already well validated", so the work is not redone;
- the 10 best candidates for TODAY: rank 1–2, size S, client-side or copy only, no DB change.

Return a 10-line summary.
