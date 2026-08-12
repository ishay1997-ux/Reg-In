-- why — `get_shift_invite`: **שער-הקריאה הציבורי של משטח 5.**
--
-- 🔴 **הפער שהמיגרציה הזאת סוגרת, ואיך הוא נשאר סמוי עד רגע הבנייה:**
--   ‏`screens-approved.md` משטח 5 §④ מחייב שהדף הציבורי יציג **שם הדיילת · שם האירוע ·
--   הלקוח · תאריך · שעות · מיקום · תעריף + נסיעות** — "בדיוק אותם שדות שכבר במייל".
--   אבל `20260809134237` השאירה את `assignments` **deny-all מוחלט ל-`anon`** (נכון וראוי),
--   והפונקציה הציבורית היחידה שנוצרה שם — `respond_to_shift_invite` — **כותבת בלבד**:
--   היא דורשת שהדיילת כבר בחרה, ומחזירה `{ok,status}`.
--   ⇒ **מצב "ממתין למענה", לב-המסך, לא היה ניתן לבנייה: הדף היה נפתח ריק.**
--   🔑 שני המסמכים נכונים כל אחד לחוד; החור נמצא **במרווח ביניהם** — בשאלה "אז מאיפה
--   הדף קורא את השם", ואותה שואלים רק כשכותבים את הקוד. נמצא 10/08/2026 בצעד 3.6.
--
-- ⚖️ **מודל-החשיפה — מה מוחזר ולמי, וזה החלק שדורש קריאה איטית:**
--   ① **טוקן לא-תקין ו-טוקן שפג מחזירים תשובה זהה בייט-בבייט** — `{ok:false}` ותו לא.
--      🔑 **זהות מבנית, לא רק "אותו נוסח על המסך"**: מי שמסתכל בתעבורת-הרשת גם הוא
--      אינו יכול להבחין. זו הדרישה של §③ תנאי-1 (מניעת ניחוש-טוקנים הדרגתי) ושל §⑤
--      ("קישור לא תקין" ≡ "אינו בתוקף", **בכוונה**).
--   ② **פרטים אישיים מוחזרים אך ורק במצב `pending`-ובתוקף** — כלומר רק כשיש לדיילת
--      החלטה אמיתית לקבל. 🚫 **טוקן שכבר נענה מפסיק להחזיר מידע לנצח**: הוא מחזיר
--      את שם-המצב בלבד (`confirmed`/`declined`/`filled`), בלי שם, בלי לקוח, בלי כתובת.
--      ⚠️ זה **הדוק יותר** ממה שהמוקאפ דורש, ובמכוון — מסכי-התוצאה שלו ממילא מציגים
--      משפט אחד בלי פרטים, ולכן ההידוק לא עולה כלום בתצוגה.
--   ③ **אפס כתיבה.** הפונקציה אינה מעדכנת, אינה מוחקת, ואינה נוגעת ב-`responded_at`.
--      ‏`assignments` נשארת deny-all ל-`anon` — זו דלת-קריאה שנייה לצד דלת-הכתיבה, לא
--      policy חדשה על הטבלה.
--
-- 🕓 **מדוע `pending` נבדק מול השעון ושאר הסטטוסים לא:** תנאי-הפקיעה (48ש׳ מהשליחה ·
--   24ש׳ לפני האירוע) הם תנאי-**פעולה** — הם שואלים "האם עוד אפשר לענות". מי שכבר ענתה
--   רואה את התשובה שלה גם שבוע אחר-כך; אין מה "לפוג" בעובדה שהיא כבר סירבה, וחסימה שם
--   הייתה מציגה לה "הקישור אינו בתוקף" אחרי שהיא בעצמה לחצה — כלומר שקר קטן.
--
-- 🔴 **החישוב חייב להישאר זהה בייט-להיגיון ל-`respond_to_shift_invite`** — אותם שני
--   תנאי-זמן, אותו `at time zone 'Asia/Jerusalem'` מול **שעת-ההתחלה בפועל** ולא מול חצות.
--   סטייה בין השתיים תיצור את המצב הגרוע ביותר: דף שמציג כפתורים פעילים, ולחיצה שנכשלת
--   בהודעה גנרית. *(אותו זיווג שכבר מתועד ב-`src/modules/04_hostesses/CLAUDE.md` לגבי
--   ‏`eventStartInstant` בצד ה-JS.)*
--
-- ⚠️ **הכרעה שקטה-לשעבר, נרשמת כאן במפורש:** `approval_withdrawn` ("ביטלה אחרי אישור",
--   נרשם ע"י המנהלת אחרי שיחת-טלפון) **אינו אחד משמונת המצבים של §⑤** — האפיון שותק לגביו.
--   הבחירה כאן: **התשובה הגנרית**, כי הקישור באמת אינו יכול עוד לעשות דבר, והנוסח הגנרי
--   מפנה לטלפון — שהוא בדיוק הערוץ שבו הביטול כבר נעשה. 🚫 לא נבחר "תודה שעדכנת", כי היא
--   לא עדכנה כאן. **פריט לשער 3.7 — ישי מכריע אם זה הנכון.**
--
-- ⚠️ **צפי-advisors — 🐞 הצפי שכתבתי כאן היה שגוי, והמדידה מתקנת אותו במקום.**
--   **מה שכתבתי:** ממצא אחד נוסף, "17 ⇐ 18". **מה שנמדד בפועל אחרי ההחלה: 15 ⇐ 17.**
--   שתי טעויות בשורה אחת: ① הבסיס היה **15** ולא 17 (‏`local-15`, 09/08: *"advisors 15 =
--   baseline"*) · ② הפונקציה מוסיפה **שני** ממצאים ולא אחד — `anon_security_definer…`
--   **וגם** `authenticated_security_definer…` — כי ה-`grant` הוא לשני התפקידים.
--   🔑 **וזה היה כתוב בריפו לפני שניחשתי:** ‏`docs/schema.sql`, על הפונקציה האחות ממש,
--   אומר *"⇒ **שני ממצאי-advisor** על הפונקציה הזו, לא אחד"*. **ניחשתי במקום לקרוא.**
--   שני הממצאים הם בדיוק מה שהוזמן — פונקציה שאנונימי חייב להריץ.
--
-- ⏳ **מגבלה ידועה שאינה נסגרת כאן, ונרשמת כדי שלא תתגלה בדיעבד:** אין הגבלת-קצב על
--   נקודת-הקצה. הטוקן הוא `crypto.randomUUID()` (‏`api.js:309`) ⇒ ניחוש אינו מעשי, אבל
--   מי שמחזיק טוקן אחד יכול למשוך את הפרטים שוב ושוב. **פריט לשער 3.7.**
--
-- reversibility: הפיכה במלואה — `drop function public.get_shift_invite(text)`.
--   שום שורה, עמודה, policy או grant קיימים אינם משתנים.

create or replace function public.get_shift_invite(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_row record;
  v_travel text;
  v_expires timestamptz;
begin
  -- 🔴 שליפה אחת. שים לב: **אין כאן תנאי-זמן ואין תנאי-סטטוס** — הם מוכרעים למטה,
  -- כדי שמצב-שנענה ומצב-שפג יטופלו בנפרד ובכל זאת ייראו זהים כלפי חוץ כשצריך.
  select a.assignment_status, a.invite_sent_at,
         h.full_name,
         p.event_name, p.customer_name, p.final_location,
         p.final_event_date, p.final_start_time, p.final_end_time,
         a.hourly_rate_snapshot,
         ((p.final_event_date + coalesce(p.final_start_time, time '00:00'))
            at time zone 'Asia/Jerusalem') as event_start
    into v_row
    from public.assignments a
    join public.hostesses h on h.hostess_id = a.hostess_id
    join public.projects  p on p.project_id  = a.project_id
   where a.invite_token = p_token;

  -- ① טוקן שאינו קיים. **אותה תשובה בדיוק** שתוחזר גם לטוקן שפג — ר' §⑤.
  if not found then
    raise log 'get_shift_invite: unknown token (masked)';
    return jsonb_build_object('ok', false);
  end if;

  -- ② סטטוסים סופיים — שם-המצב בלבד, **בלי ולו שדה אישי אחד**.
  if v_row.assignment_status in ('confirmed_available', 'finally_approved') then
    return jsonb_build_object('ok', true, 'state', 'confirmed');
  elsif v_row.assignment_status = 'declined' then
    return jsonb_build_object('ok', true, 'state', 'declined');
  elsif v_row.assignment_status = 'released' then
    -- `§ב6` — "תודה שהתפנית, המשרה כבר אוישה". הנוסח עצמו יושב בקוד-הלקוח.
    return jsonb_build_object('ok', true, 'state', 'filled');
  elsif v_row.assignment_status <> 'pending' then
    -- `approval_withdrawn` — ר' ההכרעה בכותרת. גנרי.
    raise log 'get_shift_invite: non-actionable status %', v_row.assignment_status;
    return jsonb_build_object('ok', false);
  end if;

  -- ③ מכאן: `pending` בלבד ⇒ שני תנאי-הזמן, זהים ל-`respond_to_shift_invite`.
  if v_row.invite_sent_at is null
     or v_row.invite_sent_at + interval '48 hours' <= now()
     or (v_row.event_start - interval '24 hours') <= now() then
    raise log 'get_shift_invite: expired token (masked)';
    return jsonb_build_object('ok', false);
  end if;

  -- ④ מועד-הפקיעה בפועל = **המוקדם מבין השניים**. הדף מציג ממנו "בתוקף עוד N שעות",
  -- ולכן חייב להיות אותו מספר שבאמת יחסום את הכתיבה — לא ה-48 שעות לבדן.
  v_expires := least(v_row.invite_sent_at + interval '48 hours',
                     v_row.event_start - interval '24 hours');

  -- ⑤ `local-3` — כל עוד הפרמטר `0`, המסך מדפיס "+ נסיעות" **בלי מספר**, כמו המייל.
  -- 🔴 נקרא כאן ולא בלקוח: `params` סגורה לאנונימי, וזו הדלת היחידה.
  select param_value into v_travel
    from public.params where param_name = 'סכום_נסיעות_למשמרת';

  return jsonb_build_object(
    'ok', true,
    'state', 'awaiting',
    'hostess_name',  v_row.full_name,
    'event_name',    v_row.event_name,
    'customer_name', v_row.customer_name,
    'event_date',    v_row.final_event_date,
    'start_time',    v_row.final_start_time,
    'end_time',      v_row.final_end_time,
    'location',      v_row.final_location,
    'hourly_rate',   v_row.hourly_rate_snapshot,
    'travel_amount', coalesce(v_travel, '0'),
    'expires_at',    v_expires
  );
end; $$;

-- 🔴 שנייה מבין שתי הפונקציות שאנונימי רשאי להריץ במודול הזה — והיחידה שקוראת.
revoke execute on function public.get_shift_invite(text) from public;
grant  execute on function public.get_shift_invite(text) to anon, authenticated;
