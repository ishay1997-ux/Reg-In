# Card: Checker 3, the final independent production check of the new payroll (14.10, dispatched ~18:3x)

**Role: checker (בודק).** You never built any of this. Your job is to find what is wrong, not to confirm that it works. A reassuring report without evidence is worse than a blank page.

**First action:** invoke `/human-walkthrough` through the Skill tool, and work as that skill directs: real screen, independent read-back. This card's limits win where they overlap.

- Live site: `https://reg-in-umber.vercel.app`, main @4c9cee71.
- DB `yfeovxppnfoafmfbdfvh`: **SELECT only**, through the Supabase MCP `execute_sql`.

## 🔴 Hard limits
- **19:45–21:00 FREEZE:** Ishay and Amit rehearse live at 20:00.
  - From 19:40, only DB SELECTs; no UI session at all.
  - Steps 4–5 (the storage probes) must finish before 19:30.
- **No writes of any kind.** Never click:
  - "צור סבב", "שלח", "אשר לפי תיעוד", "הפק ושלח", "שלח סיכום מעודכן", "תקן";
  - any save, on any screen.
- **Never touch September 2026.** Its review #2 is the stage state for tomorrow; looking is allowed. Never touch projects 1638, 1649, 1650, 1651, 1620 or 1615.
- **Browser:**
  - A Playwright spec at `C:\Users\ishay\Reg-In\e2e\zz-checker3-tmp.spec.js`, with `test.use({ channel: 'chrome' })` and a 1536×960 viewport.
  - Copy the login from `e2e/reports.spec.js:55-66`. The users are `E2E_CEO_*`, `E2E_FINANCE_*`, `E2E_STAFF_*`, `E2E_PROJECTS_*` and `E2E_RECRUIT_*`; the config loads them from `.env.local`. Never print or read them.
  - Run with `E2E_BASE_URL=https://reg-in-umber.vercel.app npx playwright test <spec> --reporter=list > <log> 2>&1; echo exit=$?`. Never pipe it into head/tail.
  - Delete the spec at the end; `git status --short e2e` must be empty.
- Check Hebrew in screenshots on an **enlarged crop**, never on the downscaled image.

## What to check, and how each is proven
1. **October 2026 draft (finance user):**
   - Open `/finance/payroll`, October. Screenshot it.
   - Download the draft XLSX, then open it with Python `openpyxl` from a script **outside** the repo. Check:
     - sheet 1 has one row per shift;
     - sheet 2 is named "סיכום לפי דיילת", with per-hostess totals equal to the sum of their sheet-1 rows. Compute both sides.
   - Check the toggle that shows sheet 2 on screen.
   - Find the line that explains zero-paid shifts ("N לא הגיעו · M ביטול בלי דמי ביטול"). Reconcile it by SELECT against `assignments` for October.
2. **Every way into payroll:**
   - Find every link and button that leads to payroll; grep `src/` for `/finance/payroll` and for "דוח שכר".
   - Open each one. No path may reach the removed old dialog or a direct "export and send".
   - SELECT `payroll_config` and prove that `legacy_writer` is disabled.
3. **History:**
   - July (report 16) and August (15) are visible, with their frozen rows.
   - July's original file downloads, and its sha256 equals the stored one. Read the stored hash by SELECT and compute the downloaded one.
   - August offers the labelled reconstruction.
4. **Storage protection (before 19:30):**
   - As the finance user, from the browser's supabase client, attempt an `upload` with `upsert: true` and a `remove` on an existing payroll artifact path in the `finance` bucket.
   - **Both must be denied.** If either succeeds, STOP at once and report it as critical; do not try again.
   - Prove there was no change: SELECT `storage.objects` for that path before and after (`updated_at`, metadata).
5. **Role matrix (before 19:30):**
   - Log in as each of the 5 users. Open `/finance/payroll` and record what each one sees: full workspace, history only, or blocked.
   - Compare with the permission rows. SELECT `role_permissions` / `permissions` for module 'כספים', and find the table names with `information_schema`.
6. **Public page probes, anonymous with no login, read-only:**
   - `/payroll-review/<garbage-token>` must show a clean "invalid or expired" state, not a crash.
   - Do not open any real token.

## Report (your final message)
- Per item: ✅ / ❌ / ◐, with the evidence: screenshot path, SELECT result, or computed numbers.
- Findings ranked **MUST** (wrong money, privacy or permission, crash) / **SHOULD** / **NICE**, each with the exact screen, the reproduction and a proposed fix.
- What you could not check, and why.
- Screenshots go to `C:\Users\ishay\payroll-work\checker3\`.
- Stop at **21:00** whatever remains. From 19:40 to 21:00, SELECTs and writing up only.
