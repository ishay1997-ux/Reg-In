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

   > 🧩 **פרומפט לקלוד בדפדפן** (הדבק בתוסף הכרום כשאתה ב-GitHub):
   > ```
   > אני בריפו Reg-In ב-GitHub. פתח Pull Request חדש: base: dev ← compare: ishay/module-1-permissions.
   > כותרת: "Module 1: Users & Permissions — closed (audit passed)".
   > בתיאור כתוב בקצרה: מודול 1 סגור אחרי אודיט (06/07), כולל Auth+RLS+מטריצת הרשאות,
   > 16 בדיקות יחידה + 8 E2E ירוקות. צור את ה-PR והראה לי את סטטוס ה-CI.
   > ```

5. **חכה ל-CI** (סמן ירוק/אדום ב-PR). אם אדום — הדבק ל-Claude את הודעת הכשל.
6. **מיזוג:** אם עמית כבר בסבב סקירה — תן לו לאשר. אם לא — לחץ **Merge pull request** בעצמך, ותתעד שורה ב-CHANGELOG שהמיזוג בוצע בלי סקירת עמית (הוא עדיין לא בשלב הזה).

   > 🧩 **פרומפט לקלוד בדפדפן** (מיזוג, אחרי CI ירוק):
   > ```
   > אני בעמוד ה-PR של Reg-In ב-GitHub (base: dev ← ishay/module-1-permissions).
   > ודא שכל בדיקות ה-CI ירוקות. אם כן — לחץ Merge pull request ואשר.
   > אם משהו אדום או שיש conflict — עצור, אל תמזג, ותאר לי בדיוק מה אתה רואה.
   > ```

## ⑤ החלק של Claude

1. ✅ ~~מכריע/מתעד את §7.21~~ — **בוצע (06/07/2026, commit `6460fc4`).** נותר רק אימות הספירה ב-Table Editor ע"י ישי (צעד ④2).
2. ✅ ~~מתקן P0~~ — **בוצע (06/07/2026):** `engines` ב-`package.json`, הערת E2E ב-`.env.example`.
3. ✅ ~~מיישם את פריטי P1~~ — **בוצע (06/07/2026):** Error Boundary עוטף את `App.jsx`, E2E מורחב (8/8 ירוק), הערת migration, `lang="he" dir="rtl"`. (שינוי סיסמה נמצא כבר-ממומש — הממצא בבקרת הקוד היה מיושן.)
4. מריץ `regin-e2e-check` (או ישירות `npm run test:e2e`) ומדווח תוצאה.
5. מריץ `regin-pr-gate` — verify, ואם ירוק על ענף הפיצ'ר: commit+push.
6. מעדכן `STATUS.md` (מודול 1 → ✅), `docs/CHANGELOG.md` (שורה מתוארכת), `docs/CLAUDE_CODE_LOG.md` (רשומת סשן + "מצב נוכחי" מרוענן).

## ⑥ 📋 הפרומפט להדבקה

> הפרומפט המקורי של השלב כבר בוצע (P0/P1, §7.21, אימותים — הכל ✅ למעלה), וגם הקומיטים `594c26b`+`ec408d4` נדחפו. הפרומפט הנוכחי הוא **הרצת סגירה חוזרת**: מוודא שמדריך המיקרו מסונכרן לטמפלט, מריץ את אודיט הסגירה, סוגר קומיטים פתוחים ומדפיס את הוראות ה-PR:

```
אנחנו בפרויקט REG-IN. קרא את CLAUDE.md, STATUS.md ואת docs/micro_guides/module-1.md.
זו הרצת סגירה חוזרת של מודול 1 (האודיט המקורי עבר 06/07; מאז עודכן מדריך המיקרו לטמפלט החדש).
1) ודא שמדריך המיקרו docs/micro_guides/module-1.md תואם במלואו ל-9 הסעיפים של
   docs/templates/create_micro_guide_template.md — אם חסר משהו, השלם לפני שתמשיך.
2) קרא בעצמך את התבנית docs/templates/create_module_final_test_template.md ובצע אותה כלשונה עם:
   MODULE_NUMBER=1 · MODULE_NAME=משתמשים והרשאות · BRANCH_NAME=ishay/module-1-permissions
3) אם git status מציג קבצים פתוחים — קבץ אותם לקומיט docs אחד, הרץ npm run verify,
   ואם ירוק — git push.
בסוף: בצע את סעיף ההתמדה (מדריך מיקרו + יומנים, תאריך+שעה), והדפס לי בעברית את הוראות
פתיחת ה-PR + פרומפט מסירה 🧩 לתוסף הכרום (כלל ברזל 17) לפתיחת ה-PR בפועל.
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
