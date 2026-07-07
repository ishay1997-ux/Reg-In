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

1. ✅ ~~**הכרעת §7.21 (מודל RLS)**~~ — **בוצע (06/07/2026):** הוכרע "הרשאה אך ורק לפי מטריצת role→module", נרשם ב-[PROJECT_MASTER §7.21](../../PROJECT_MASTER.md) כולל תבנית ה-policy המוכנה למודול 2.
2. ✅ ~~**בדיקת ה-Supabase**~~ — **בוצע (06/07/2026):** ישי אימת ב-Table Editor וגם Claude אימת דרך Supabase MCP — `modules`=9, `permissions`=45, `roles`=5. בנוסף: הוחלט (ישי, 06/07) **לא להחליף את סיסמאות משתמשי הבדיקה** — סיכון מקובל ומתועד, ר' [PROJECT_MASTER §7.24](../../PROJECT_MASTER.md); אם gitleaks ב-CI יתריע על ההיסטוריה — הטיפול הוא `.gitleaksignore`, לא רוטציה.
3. ✅ ~~שני קומיטים לפני ה-PR~~ — **בוצע (07/07):** ‏`594c26b` (תיקון הסייד-בר) + `ec408d4` (חבילת ה-docs: מדריך מיקרו מודול 2, טמפלטים, מדריך 04b) — קומטו ונדחפו. **נותר צעד קטן:** אם `git status` עדיין מציג קבצי docs פתוחים (עדכוני היומנים/הטמפלט מהסשנים האחרונים) — בקש מ-Claude, או בעצמך: `git add docs/ STATUS.md && git commit -m "docs: עדכוני יומנים וטמפלט סגירה" && git push`. רק אחר-כך פתח את ה-PR, כדי שהכל ייכנס אליו.
4. **פתיחת ה-PR:** כנס ל-GitHub → הריפו → **Pull requests** → **New pull request** → `base: dev` ← `compare: ishay/module-1-permissions` → תיאור קצר → **Create pull request**.
5. **חכה ל-CI** (סמן ירוק/אדום ב-PR). אם אדום — הדבק ל-Claude את הודעת הכשל.
6. **מיזוג:** אם עמית כבר בסבב סקירה — תן לו לאשר. אם לא — לחץ **Merge pull request** בעצמך, ותתעד שורה ב-CHANGELOG שהמיזוג בוצע בלי סקירת עמית (הוא עדיין לא בשלב הזה).

## ⑤ החלק של Claude

1. ✅ ~~מכריע/מתעד את §7.21~~ — **בוצע (06/07/2026, commit `6460fc4`).** נותר רק אימות הספירה ב-Table Editor ע"י ישי (צעד ④2).
2. ✅ ~~מתקן P0~~ — **בוצע (06/07/2026):** `engines` ב-`package.json`, הערת E2E ב-`.env.example`.
3. ✅ ~~מיישם את פריטי P1~~ — **בוצע (06/07/2026):** Error Boundary עוטף את `App.jsx`, E2E מורחב (8/8 ירוק), הערת migration, `lang="he" dir="rtl"`. (שינוי סיסמה נמצא כבר-ממומש — הממצא בבקרת הקוד היה מיושן.)
4. מריץ `regin-e2e-check` (או ישירות `npm run test:e2e`) ומדווח תוצאה.
5. מריץ `regin-pr-gate` — verify, ואם ירוק על ענף הפיצ'ר: commit+push.
6. מעדכן `STATUS.md` (מודול 1 → ✅), `docs/CHANGELOG.md` (שורה מתוארכת), `docs/CLAUDE_CODE_LOG.md` (רשומת סשן + "מצב נוכחי" מרוענן).

## ⑥ 📋 הפרומפט להדבקה

> הפרומפט המקורי של השלב כבר בוצע (P0/P1, §7.21, אימותים — הכל ✅ למעלה). מה שנותר: הקומיטים והדחיפה. הפרומפט המעודכן:

```
אנחנו בפרויקט REG-IN. קרא את CLAUDE.md, STATUS.md ואת docs/guides/ishay/01_close_module_1.md.
כל צעדי הסגירה של מודול 1 בוצעו; נותרו רק הקומיטים והדחיפה לפי צעד ④3 במדריך:
1) commit ראשון — src/components/layout/Sidebar.jsx בלבד (תיקון היישור, 07/07).
2) commit שני — כל קבצי ה-docs + STATUS.md (חבילת פתיחת מודול 2: מדריך מיקרו, PROJECT_MASTER,
   טמפלטים, מדריכים, יומנים).
3) ודא ש-git status נקי, הרץ npm run verify, ואם ירוק — git push.
בסוף: הדפס לי בעברית את הוראות פתיחת ה-PR (base: dev ← compare: ishay/module-1-permissions)
ומה לבדוק ב-CI.
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
