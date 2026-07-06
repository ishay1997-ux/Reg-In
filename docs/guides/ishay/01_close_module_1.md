<div dir="rtl">

# 🔐 שלב — סגירת מודול 1 (משתמשים והרשאות)

> מקומו בהיררכיית האמת: `schema.sql` › אפיון › מוקאפים › מדריך זה. בסתירה — המדריך מפסיד.
> צעדים שבוצעו מסומנים ✅ — המדריך כתוב כאילו כלום לא קיים.

---

## ① מה נשיג בשלב הזה

מודול 1 (Google OAuth, נעילת חשבון, מטריצת הרשאות, ניהול משתמשים) עובר מ-"בנוי על המחשב שלך" ל**"ממוזג ל-`dev`, ה-CI ירוק, ובנוי לפי הכללים המחייבים לכל מודול עתידי"**. בסוף השלב: ל-`dev` יש קוד עובד שעמית יכול למשוך ולהמשיך ממנו.

## ② תנאי כניסה

- [x] הקוד קיים ועובד מקומית — ✅ אומת בסשן זה.
- [x] 3 קומיטים מקומיים על `ishay/module-1-permissions`, לא נדחפו — ✅ (ranked ahead of `origin/ishay/module-1-permissions` ב-3, מאחור ב-0).
- [x] `.claude/settings.json` (hook משותף) ו-`CLAUDE.md`/`STATUS.md`/`README.md` כבר נוצרו ונקומטו בענף הזה.
- [ ] `npm run verify` ירוק **כרגע** (יש להריץ ולוודא — לא הונח כעובדה).
- 🛑 **הכרעה נדרשת לפני שממשיכים:** [PROJECT_MASTER §7 פריט 21](../../PROJECT_MASTER.md) — מודל בעלות-דאטה ל-RLS. בלי הכרעה כאן, מודול 2 יתחיל לבנות policies בלי כלל אחיד.

## ③ חלוקת עבודה

| ישי | Claude | עמית |
|---|---|---|
| מכריע בשאלה הפתוחה (§7.21); בודק ב-Supabase Table Editor שמספר השורות ב-`modules`/`permissions` תקין; פותח PR ב-GitHub; לוחץ Merge אחרי שה-CI ירוק | מריץ `regin-pr-gate` (verify+push); מתקן P0/P1 נבחרים מ-[code_review_2026-07.md](../../code_review_2026-07.md); מריץ `regin-e2e-check`; מעדכן STATUS.md+CHANGELOG+CLAUDE_CODE_LOG | סוקר את ה-PR ב-GitHub ומאשר אותו (אם הוא כבר בשלב [amit/04](../amit/04_git_and_module_workflow.md) ומכיר את זרימת ה-PR; אם לא — ישי ממזג לבד ומתעד ⚠️ ב-CHANGELOG) |

## ④ החלק שלך

1. **הכרעת §7.21 (מודל RLS):** קרא את פריט 21 בסעיף 7 של [PROJECT_MASTER](../../PROJECT_MASTER.md) ("סתירות/פערים פתוחים"). ההחלטה הפשוטה ביותר (מומלצת להתחלה, אפשר להחמיר בהמשך): **הרשאה נקבעת אך ורק לפי מטריצת role→module** (בלי בעלות ברמת-רשומה) — כל מי שיש לו `edit`/`view` על מודול רואה/עורך את כל הרשומות של אותו מודול. תגיד ל-Claude את ההחלטה — הוא ירשום אותה ב-§7.21.
2. **בדיקת ה-Supabase (חשוב!):** Supabase Dashboard → **Table Editor** → `modules` — ספור שורות. אם 10 (יש שורת "מסך הבית") — תגיד ל-Claude "יש 10 שורות ב-modules, יש למחוק את מסך הבית" (ר' [PROJECT_MASTER §7.10](../../PROJECT_MASTER.md)). בדוק גם `permissions` — אמור להיות 45 (5×9).
3. **לאחר ש-Claude מדווח "verify ירוק ונדחף"**: כנס ל-GitHub → הריפו → **Pull requests** → **New pull request** → `base: dev` ← `compare: ishay/module-1-permissions` → תיאור קצר → **Create pull request**.
4. **חכה ל-CI** (סמן ירוק/אדום ב-PR). אם אדום — הדבק ל-Claude את הודעת הכשל.
5. **מיזוג:** אם עמית כבר בסבב סקירה — תן לו לאשר. אם לא — לחץ **Merge pull request** בעצמך, ותתעד שורה ב-CHANGELOG שהמיזוג בוצע בלי סקירת עמית (הוא עדיין לא בשלב הזה).

## ⑤ החלק של Claude

1. מכריע/מתעד את §7.21 לפי הנחיית ישי; אם 10 שורות ב-`modules` — כותב ומריץ מיגרציית תיקון (מחיקת שורת "מסך הבית") ומאמת שנשארו 9, ו-`permissions`=45.
2. מתקן P0 מ-[code_review_2026-07.md](../../code_review_2026-07.md): `engines` ב-`package.json`, הערת E2E ב-`.env.example`.
3. מיישם את פריטי P1 שנבחרו: Error Boundary ב-`src/App.jsx`, חיבור טאב "אבטחה" ל-`supabase.auth.updateUser({password})`, השלמת `e2e/permissions.spec.js` (בדיקת שינוי תא בפועל + הגנת self-lockout), הערת תיעוד ב-migration של `current_user_role_id()`. **מציית לשפת העיצוב ולטבלת הצבעים ב-PROJECT_MASTER §4 — בלי להמציא עיצוב חדש.**
4. מריץ `regin-e2e-check` (או ישירות `npm run test:e2e`) ומדווח תוצאה.
5. מריץ `regin-pr-gate` — verify, ואם ירוק על ענף הפיצ'ר: commit+push.
6. מעדכן `STATUS.md` (מודול 1 → ✅), `docs/CHANGELOG.md` (שורה מתוארכת), `docs/CLAUDE_CODE_LOG.md` (רשומת סשן + "מצב נוכחי" מרוענן).

## ⑥ 📋 הפרומפט להדבקה

```
אנחנו בפרויקט REG-IN. קרא את CLAUDE.md, STATUS.md, docs/guides/ishay/01_close_module_1.md,
docs/code_review_2026-07.md ו-docs/PROJECT_MASTER.md §7.

ההכרעה שלי לפריט §7.21 (מודל RLS): הרשאה אך ורק לפי מטריצת role→module (בלי בעלות ברמת-רשומה).
[אם בדקת את Supabase Table Editor, ספר לי גם: modules=___ שורות, permissions=___ שורות]

בצע את "החלק של Claude" בשלב הזה: תקן/יישם את פריטי P0 ו-P1 מ-code_review_2026-07.md,
הרץ E2E ו-verify, ואם ירוק — דחוף לענף.
בסוף: עדכן STATUS.md/CHANGELOG/CLAUDE_CODE_LOG לפי הפרוטוקול ב-CLAUDE.md,
והסבר לי בדיוק אילו בדיקות לעשות ב-Table Editor ואיך לפתוח את ה-PR.
```

## ⑦ בדיקת קבלה

- [ ] `npm run verify` ירוק (Claude מדווח).
- [ ] `modules` = 9 שורות, `permissions` = 45 שורות (בעצמך, ב-Table Editor).
- [ ] PR נפתח, CI ירוק ב-GitHub, ו-merge בוצע ל-`dev`.
- [ ] מ-checkout טרי של `dev`: `npm install && npm run dev` נפתח, כניסה עם Google עובדת, מטריצת ההרשאות נגישה למנכ"ל.
- [ ] `STATUS.md` שורת מודול 1 = ✅.

## ⑧ אם משהו השתבש

- **CI אדום ב-GitHub** — פתח את הלינק ל-run, העתק את ההודעה האדומה במלואה ל-Claude.
- **`git push` נדחה (rejected)** — `regin-pr-gate` יודעת לעצור ולדווח; אל תנחש, הדבק את השגיאה.
- **Conflict במיזוג** — אל תיבהל, אל תלחץ על כלום ב-GitHub; צלם מסך ותן ל-Claude.
- **`modules` עדיין מציג 10 אחרי "תיקון"** — ודא שרפרשת את הדף ב-Table Editor (F5), לא רק את הטאב.

</div>
