<div dir="rtl">

# ⏰ שלב — מודול 10: אוטומציות

> מקומו בהיררכיית האמת: `schema.sql` › אפיון › מוקאפים › מדריך זה. בסתירה — המדריך מפסיד.
> צעדים שבוצעו מסומנים ✅ — המדריך כתוב כאילו כלום לא קיים.

## ① מה נשיג בשלב הזה

מיילים ותזכורות אוטומטיות: תזכורת לדיילת 24 שעות לפני אירוע, פקיעת הצעת מחיר ללא מענה (30 יום), "שכחתי סיסמה" מלא, והפעלת Leaked Password Protection (חוב מודול 1).

## ② תנאי כניסה

- [ ] מודולים 3, 6, 8, 9 מוזגו (אוטומציות תלויות בהצעות, פרויקטים, כספים, פרמטרים).
- ⏳ **חוב מפורש ממודול 1** (מ-[docs/CHANGELOG.md](../../CHANGELOG.md) "חובות עתידיים"): הפעלת Leaked Password Protection + זרימת "שכחתי סיסמה" מלאה — היו מתוכננים למודול 10 מהתחלה.

## ③ חלוקת עבודה

| ישי | Claude |
|---|---|
| בונה ומכריע על שירות המייל (Resend/SendGrid/Supabase Edge Functions) | בונה בלופרינט, מיישם |

## ④ החלק שלך

1. `git checkout -b ishay/module-10-automations`.
2. הדבק פרומפט, אשר בלופרינט, בנה.
3. אם נדרש חשבון שירות מייל חיצוני — Claude ינחה אותך איזה חשבון לפתוח ואיפה להדביק מפתחות (ב-`.env.local`, **לא** בקוד).

## ⑤ החלק של Claude

בלופרינט: Cron/Scheduled Function לתזכורות ופקיעה, זרימת שכחתי-סיסמה מלאה (Supabase `resetPasswordForEmail`), הפעלת Leaked Password Protection ב-Supabase Auth settings, תבניות מייל בעברית RTL. **מציית לשפת העיצוב ולטבלת הצבעים ב-PROJECT_MASTER §4** (במיילים שיש להם ממשק). **מתחזק את `docs/micro_guides/module-10.md` חי לאורך כל הבנייה** (ה-Stop hook אוכף).

## ⑥ 📋 שלושת הפרומפטים להדבקה

**1) פתיחת מודול (פעם אחת):**
```
אנחנו בפרויקט REG-IN. קרא את CLAUDE.md, STATUS.md, docs/guides/ishay/05_module_10_automations.md,
docs/CHANGELOG.md (חלק "חובות עתידיים") ו-docs/PROJECT_MASTER.md.
אנחנו פותחים את מודול 10 — אוטומציות, על ענף ishay/module-10-automations.

קרא בעצמך את התבנית docs/templates/create_micro_guide_template.md ובצע אותה כלשונה עם:
MODULE_NUMBER=10 · MODULE_NAME=אוטומציות · RELEVANT_SECTIONS=חובות עתידיים ב-CHANGELOG · BRANCH_NAME=ishay/module-10-automations

הצג את הבלופרינט לאישורי; רק אחרי שאאשר — שמור אותו כ-docs/micro_guides/module-10.md.
```

**2) המשך בנייה (בכל סשן עבודה, עד שכל הצעדים ✅):**
```
אנחנו בפרויקט REG-IN. קרא את CLAUDE.md, STATUS.md ואת docs/micro_guides/module-10.md.
המשך מ"הצעד הפעיל" שבכותרת המצב. אמת בעצמך כל נקודת עצירה 🤖 (הרץ את פקודת האימות והצג ראיה),
ועצור לאישורי בכל נקודת 👤 ובסוף כל פזה. עדכן את מדריך המיקרו תוך כדי העבודה (סעיף 8 שלו).
בסוף הסשן: עדכן יומנים לפי הפרוטוקול ב-CLAUDE.md והסבר לי בעברית פשוטה איפה עצרנו ומה הבא.
```

**3) סגירת מודול (פעם אחת, כשכל הצעדים ✅):**
```
אנחנו בפרויקט REG-IN. קרא את CLAUDE.md, STATUS.md ואת docs/micro_guides/module-10.md.
קרא בעצמך את התבנית docs/templates/create_module_final_test_template.md ובצע אותה כלשונה עם:
MODULE_NUMBER=10 · MODULE_NAME=אוטומציות · BRANCH_NAME=ishay/module-10-automations
בסוף: בצע את סעיף ההתמדה (עדכון מדריך המיקרו + היומנים) והדפס לי את הוראות ה-PR בעברית.
```

## ⑦ בדיקת קבלה

- [ ] "שכחתי סיסמה" שולח מייל אמיתי עם קוד/קישור תקין.
- [ ] Leaked Password Protection מופעל ב-Supabase Auth (נבדק ב-Dashboard).
- [ ] תזכורת דיילת נשלחת (בדיקה עם אירוע מדומה קרוב).
- [ ] `npm run verify` ירוק.

## ⑧ אם משהו השתבש

- מייל לא מגיע → בדוק תיקיית ספאם, ואת מפתח ה-API של שירות המייל ב-`.env.local`.
- תקוע? → פרומפט חילוץ ב-[README](../../../README.md).

</div>
