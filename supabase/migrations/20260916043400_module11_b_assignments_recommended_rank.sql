-- =============================================================================
-- מודול 11 · מיגרציה B · צעד 1.3 — assignments.recommended_rank (M11-4)
-- =============================================================================
-- why: `docs/db_roadmap.md` M11-4, שמקורו בכרטיס **ת5** ב-
-- `docs/specs/module_11_reports/processes-approved.md`. דוח 14א ("הוגנות השיבוץ") שואל
-- שאלה אחת שאי-אפשר לענות עליה מהמסד היום: **האם מנהלת-הגיוס לקחה את מי ש-Smart Match
-- דירג ראשונה?** הדרג עצמו מחושב היום בזיכרון המסך ומת עם הרינדור — ולכן הוא נשמר.
--
-- 🔴 **מה שהמיגרציה הזו עושה — ומה שהיא בפירוש אינה עושה:**
-- · מוסיפה **עמודה אחת, nullable**. זהו.
-- · 🚫 **אין `update`, אין מילוי-לאחור.** נמדד חי 16/09/2026: `select count(*) from assignments`
--   ⇒ **5,741 שורות** (`db_roadmap` M11-4 ו-`micro_guides/module-11.md` צעד 1.3 כותבים שניהם
--   "5,674 השיבוצים הזרועים" — הפער מדווח ולא מתוקן כאן, כי המספר המדויק אינו משנה את
--   ההתנהגות: **כל** השורות הקיימות נשארות NULL בכל מקרה).
--   🔑 **ולמה זה מהותי ולא הידור:** NULL כאן פירושו "לא הייתה המלצה", ומספר ממולא-לאחור היה
--   המצאה שדוח 14א מציג כאחוז-אימוץ. ⇒ הדוח מצהיר "נמדד מ-<תאריך>; N שיבוצים עד כה".
-- · 🚫 אין שינוי במפתח הראשי. נמדד ב-`pg_constraint` 16/09/2026:
--   `assignments_pkey primary key (project_id, hostess_id, assignment_number)` — **שלשה** (T4),
--   והיא נשארת כפי שהיא. עמודה חדשה אינה נוגעת בה.
--
-- ✍️ **מי יכתוב לעמודה (צעד 1.5, לא כאן):** `insertInviteRow` ב-
-- `src/modules/04_hostesses/api.js` — **פעם אחת, ברגע יצירת שורת-הזימון**.
-- 🔴 `writeInviteToken` **אינה נוגעת בדרג**: היא מסלול השליחה-החוזרת, ו-M11-4 עצמו דורש
-- "אינו נדרס בשליחה-חוזרת" — שני הדברים לא יכולים להתקיים יחד. (הסתירה תוקנה ב-
-- `processes-approved.md` ת5 בתאריך 11/09/2026 וב-`db_roadmap` M11-4 בתאריך 16/09/2026.)
-- מקור-הדרג הוא `ranked` (סדר-הציון של `rankCandidates`) ולא `candidates` (העדשה שהמנהלת
-- בחרה אחרי `sortByAngle`) — דוח 14א שואל על המלצת-המערכת.
-- כשל בכתיבת-הדרג **אינו מפיל את הזימון**: NULL + `console.warn` (ת5, "עמודה אינפורמטיבית").
--
-- 🏷️ **הנחתי — `recommended_rank_check (>= 1)`:** לא כתוב בשום מקור שהדרג חייב להיות ≥ 1.
-- הוא נגזר מ-`rankCandidates`, שמייצר מיקום ברשימה, ו-0 או מספר שלילי אינם מיקום.
-- האילוץ מוסיף רצפה ולא תקרה — מספר המועמדות משתנה מאירוע לאירוע, ותקרה הייתה ניחוש.
-- **אם ההכרעה היא שאין אילוץ — מוחקים את בלוק ה-`add constraint` לפני ההחלה.**
--
-- 🔁 **הפיכוּת:** `alter table public.assignments drop column recommended_rank`
-- (האילוץ וההערה נופלים עם העמודה).
-- **כלל-הפריסה (Expand-Contract):** `add column` nullable בלי default — **תוספת טהורה**.
-- הקוד הפרוס בייצור אינו יודע שהעמודה קיימת; `insert` קיים ממשיך לעבוד בדיוק כשהיה.
--
-- 🔻 **אימות אחרי ההחלה (קריאה בלבד):**
--   -- (א) information_schema: העמודה קיימת, is_nullable = YES, data_type = integer.
--   -- (ב) select count(*) from public.assignments where recommended_rank is not null ⇒ **0**.
--   -- (ג) pg_constraint: assignments_pkey עדיין (project_id, hostess_id, assignment_number).
-- =============================================================================

alter table public.assignments
  add column recommended_rank integer;

alter table public.assignments
  add constraint assignments_recommended_rank_check
  check (recommended_rank is null or recommended_rank >= 1);

comment on column public.assignments.recommended_rank is
  'מיקום הדיילת בדירוג Smart Match (ranked) ברגע שנוצרה שורת-הזימון. נכתב פעם אחת בלבד ע"י insertInviteRow, ואינו נדרס בשליחה-חוזרת. NULL = לא הייתה המלצה (זימון מחיפוש ידני, או שיבוץ שקדם למיגרציה) — ואין מילוי-לאחור, כדי שדוח 14א לא יציג אחוז-אימוץ מומצא. כרטיס ת5, M11-4.';
