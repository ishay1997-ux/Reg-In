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

בלופרינט: Cron/Scheduled Function לתזכורות ופקיעה, זרימת שכחתי-סיסמה מלאה (Supabase `resetPasswordForEmail`), הפעלת Leaked Password Protection ב-Supabase Auth settings, תבניות מייל בעברית RTL. **מציית לשפת העיצוב ולטבלת הצבעים ב-PROJECT_MASTER §4** (במיילים שיש להם ממשק).

## ⑥ 📋 הפרומפט להדבקה

**פתיחה:**
```
אנחנו בפרויקט REG-IN. קרא את CLAUDE.md, STATUS.md, docs/guides/ishay/05_module_10_automations.md,
docs/CHANGELOG.md (חלק "חובות עתידיים") ו-docs/PROJECT_MASTER.md.
אנחנו פותחים את מודול 10 — אוטומציות, על ענף ishay/module-10-automations.

בצע את התבנית הבאה (docs/templates/create_micro_guide_template.md) עם:
MODULE_NUMBER=10 · MODULE_NAME=אוטומציות · RELEVANT_SECTIONS=חובות עתידיים ב-CHANGELOG · BRANCH_NAME=ishay/module-10-automations
קרא בעצמך את קובץ התבנית docs/templates/create_micro_guide_template.md ובצע אותו כלשונו עם הפרמטרים שלמעלה (אין צורך שאדביק את תוכנו).
```

**סגירה:** `create_module_final_test_template.md` עם `MODULE_NUMBER=10`.

## ⑦ בדיקת קבלה

- [ ] "שכחתי סיסמה" שולח מייל אמיתי עם קוד/קישור תקין.
- [ ] Leaked Password Protection מופעל ב-Supabase Auth (נבדק ב-Dashboard).
- [ ] תזכורת דיילת נשלחת (בדיקה עם אירוע מדומה קרוב).
- [ ] `npm run verify` ירוק.

## ⑧ אם משהו השתבש

- מייל לא מגיע → בדוק תיקיית ספאם, ואת מפתח ה-API של שירות המייל ב-`.env.local`.
- תקוע? → פרומפט חילוץ ב-[README](../../../README.md).

</div>
