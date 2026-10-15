# Card: Builder B, input validations approved by Ishay (14.10 ~14:0x)

Model: Opus, medium effort (Ishay's rule for building).

- **Ishay's words:** *"אני מאשר הכל ואם יש זמן אולי תכניס את מה שדחית"*.
- **His corrections:**
  - Drop the duplicate-product warning (row 3). Ordering 50 tags in one colour and 50 in another is legitimate.
  - Discount: *"לא נגביל להנחת לקוח נגיד 30 אחוז? מקסימאלית מה מקובל תעשה ולידציות הגיוניות"*.

Source of every row, file:line and exact Hebrew: `C:\Users\ishay\payroll-work\validation-audit.md`. Read it in full.

## Where
Create your own worktree, because Builder A works in `Reg-In-payroll-d`:
1. `git -C C:\Users\ishay\Reg-In fetch origin`
2. `git -C C:\Users\ishay\Reg-In worktree add C:\Users\ishay\Reg-In-payroll-e -b ishay/validations origin/main`
3. `npm ci` in it.

Rules:
- Commit by explicit pathspec, one commit per row.
- No push, merge, deploy or migration apply. Live DB: SELECT only. Write migration FILES only.
- **Do NOT edit `EditProjectDetailsDialog.jsx`, `projectCard.js` or the payroll folder.** Builder A owns them.
- `QuoteBuilderPage.jsx` is shared: A adds one notice under the "משך האירוע" field. Keep your edits there minimal and away from that block, so the deputy's merge stays clean.

## Must do, in this order
1. **Row 15:** a visible, persistent error line under the recipient field in the quote document dialog. Also fix the wording "של איש הקשר" when the address was typed by hand.
2. **Row 1 + row 2:** guests, hostess count and line qty are whole numbers only (reuse `isValidPositiveInt`). The guests-per-hostess ratio uses the same 1–150 integer rule as settings (`paramsRegistry.js:302-309`).
3. **Row 5:** soft notice on closing hours vs planned (≥50% AND ≥2 h). Use the exact text in the audit.
4. **Row 12:** actual guests are whole numbers, plus a soft notice above ×3 planned.
5. **Row 10:** product cost > base price ⇒ soft notice. Base price > 100,000 ⇒ block.
6. **Row 6:** cancellation fee above the proposed amount ⇒ soft notice before saving.
7. **Row 4 + the discount rule (Ishay):**
   - Total discount (customer fixed + additional) **above 30% ⇒ soft notice**: `סך ההנחות {X}% — גבוה מהרגיל. כדאי לוודא שזו ההנחה הנכונה.`
   - Exactly 100% keeps the audit's notice. The existing >100 block stays.
   - Make 30 a **system param** (Hebrew name in the existing style, e.g. `סף_אזהרת_הנחה_אחוז`, label and description, bounds 5–90). Add it the same way Builder A adds `סף_אזהרת_משך_אירוע_שעות`: a migration FILE (insert-only, `on conflict do nothing`), with a code fallback of 30 if the param is missing.
   - Why soft and not a cap: CPQ tools commonly route large discounts to approval rather than forbid them. A hard block would stop legitimate deals.
8. **Row 8, hostess hourly rate (Ishay approved the thresholds):**
   - above ×2.5 the minimum wage ⇒ soft notice;
   - above ×10 ⇒ block.
   - Exact text in the audit. Reuse the minimum wage from params.
- **Row 3: NOT built** (Ishay).

## If time remains (Ishay: "אם יש זמן"), in this order, all client-side or copy, no DB
Rows 7, 11, 13, 14, 26, 19, 20, 21, 22, 24, 28, 25.
- Use the audit's exact text.
- Stop adding at 17:45 Israel time whatever remains, commit, and report. The deputy needs about 45 min to merge before the 19:45 freeze.

## Done means
- One test per row.
- `npm run gate` ends with exit 0. Run it as `npm run gate > file 2>&1; echo exit=$?`.
- A short report:
  - SHAs per row;
  - every new visible Hebrew string, verbatim;
  - the migration file path;
  - the rows not done, and why.
