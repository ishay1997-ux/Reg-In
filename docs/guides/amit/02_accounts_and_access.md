<div dir="rtl">

# 🔑 שלב 02 — חשבונות וגישה

> מקומו בהיררכיית האמת: הוראות תפעוליות בלבד.
> צעדים שבוצעו מסומנים ✅.

## ① מה נשיג בשלב הזה

יש לך גישה לריפו ב-GitHub, עותק מקומי (`git clone`) על המחשב שלך, וקובץ `.env.local` עם המפתחות שמחברים אותך ל-Supabase המשותף. ⏱️ ~20 דקות (תלוי בישי לחלק).

## ② תנאי כניסה

- [ ] [01_install_tools.md](01_install_tools.md) הושלם — `git --version` עובד.
- [ ] יש לך חשבון GitHub (אם אין — הרשם ב-**github.com**, חינם).

## ③ חלוקת עבודה

| ישי | אתה | Claude |
|---|---|---|
| מזמין אותך כ-Collaborator בריפו ב-GitHub; שולח לך את תוכן `.env.local` **בערוץ פרטי** (וואטסאפ/הודעה ישירה — **לא** במייל רגיל ולא בריפו); מזמין אותך כ-Member לפרויקט Supabase | מקבל את ההזמנות, עושה `git clone`, יוצר `.env.local` | מוודא ש-`.env.local` לא נכנס ל-Git בטעות |

## ④ החלק שלך

1. קבל את הזמנת ה-Collaborator ב-GitHub (מייל/התראה) ואשר אותה.
2. קבל את הזמנת Supabase ואשר אותה (תראה את הפרויקט `Reg-In` ב-Dashboard שלך).
3. פתח טרמינל בתיקייה שבה אתה רוצה שהפרויקט יהיה, והרץ:
   ```
   git clone <הכתובת שישי ייתן לך>
   cd Reg-In
   ```
4. קבל מישי (בערוץ פרטי!) את הערכים של `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY`.
5. בתיקיית הפרויקט, צור קובץ בשם `.env.local` (בדיוק כך, עם הנקודה בהתחלה) והדבק בו:
   ```
   VITE_SUPABASE_URL=<מה שישי שלח>
   VITE_SUPABASE_ANON_KEY=<מה שישי שלח>
   ```
   (תבנית מלאה, כולל שדות E2E אופציונליים: `.env.example` בתיקיית הריפו.)

## ⑤ החלק של Claude

מוודא ש-`.env.local` מופיע ב-`.gitignore` ושהוא לא tracked (`git status` לא אמור להציג אותו).

## ⑥ 📋 הפרומפט להדבקה

```
היי Claude. סיימתי clone לריפו ויצרתי .env.local עם המפתחות שישי שלח לי.
תוודא ש-.env.local לא tracked ב-git ושהוא מוגדר נכון ב-.gitignore.
```

## ⑦ בדיקת קבלה

- [ ] `git remote -v` מציג את כתובת הריפו הנכונה.
- [ ] `git status` **לא** מציג את `.env.local` ברשימת הקבצים.
- [ ] ב-Supabase Dashboard אתה רואה את פרויקט `Reg-In`.

## ⑧ אם משהו השתבש

- **`git clone` נכשל / "repository not found"** — ודא שאישרת את הזמנת ה-Collaborator (בדוק במייל/ב-GitHub notifications).
- **`.env.local` מופיע ב-`git status`** — משהו לא תקין ב-`.gitignore`; עצור ותקרא ל-Claude מיד, **אל תעשה commit**.

</div>
