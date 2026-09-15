<div dir="rtl">

# דוח פטורי אבטחה וחולשות תלויות (Security Waivers Register)

> **מקור אמת:** `scripts/audit-gate.mjs`  
> **מטרה:** תיעוד הנדסי ברור לכל חולשה שזוהתה ב-`npm audit` וקיבלה פטור מאושר, כולל הנימוק מדוע היא אינה מגיעה לסביבת הייצור (Runtime/Browser).

---

## עקרון השער (`scripts/audit-gate.mjs`)
- `npm run audit` רץ כחלק מ-`npm run gate`.
- חולשות ברמת `high` ו-`critical` חוסמות באופן ברירת-מחדל.
- פטור ניתן **אך ורק** לחבילות שאינן נכללות בבנדל הלקוח (`dist/`) ורצות ככלי פיתוח (Lint / Test CLI) בלבד.

---

## סטטוס פטורים פעילים

| מזהה GHSA | חבילה | שימוש במערכת | נימוק לפטור ובדיקת בנדל | תוקף / טריגר רענון |
|---|---|---|---|---|
| `GHSA-rgw5-rvv9-x895` | `brace-expansion` | `eslint-plugin-sonarjs` | כלי Lint פנימי בלבד; אפס מופעים ב-`dist/` | סגירת מודול / כנס סיום |
| `GHSA-7p8r-x3mc-p8w7` | `fast-uri` | shadcn CLI (`ajv`) | כלי CLI לפיתוח; אינו רץ בדפדפן; אפס מופעים ב-`dist/` | סגירת מודול / כנס סיום |
| `GHSA-mwp4-54f8-5fhr` | `ip-address` | shadcn CLI | אין שרת Express בייצור (SPA צד-לקוח); אפס מופעים ב-`dist/` | סגירת מודול / כנס סיום |
| `GHSA-8xcm-r25x-g524` | `undici` | `jsdom` (Vitest) + shadcn | סביבת בדיקות בלבד; הדפדפן משתמש ב-`fetch` מקורי | סגירת מודול / כנס סיום |
| `GHSA-5p4m-2wfm-xmqj` | `js-yaml` | `cosmiconfig` (shadcn) | קריאת קונפיג מקומי בלבד; אפס מופעים ב-`dist/` | סגירת מודול / כנס סיום |

</div>
