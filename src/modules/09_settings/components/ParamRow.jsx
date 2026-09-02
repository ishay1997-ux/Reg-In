// שורת-הגדרה אחת בטבלת-ההגדרות — הרכיב שמשמש את שלושת המשטחים של מודול 9 (הלשונית,
// "ההגדרות שלי", ופאנל ה-Smart Match), ולכן הוא `<tr>` ולא כרטיס: שלושת המוקאפים
// המאושרים מציירים את אותה טבלה בת שלוש עמודות (הגדרה · ערך · הערה).
//
// 🔤 **זוג ערך+יחידה בעטיפה אחת** — `18` ו-`%` יושבים בתוך `<Ltr>` יחיד ולא כשני
// אלמנטים אחים. זה כלל-הבית (`src/CLAUDE.md`, "מעבר-כיווניות"): שני חלקים שנכתבים
// בנפרד מתפצלים בשקט, והיחידה נוחתת בצד הלא-נכון של המספר בלי שום שגיאה. ‏`★` של
// `סף_שביעות_רצון` הוא בדיוק התו שהמשפחה הזו נתפסה עליו (מופע 8).
//
// ⌨️ `select()` בכניסה לשדה — כל שדה כאן נטען עם ערך קיים, ובלי זה כל הקלדה מחייבת
// למחוק ידנית קודם (‏`src/CLAUDE.md`; ישי דיווח על זה כמעצבן בשני שדות נפרדים).
//
// 🔢 **`type="text"` ולא `type="number"`, במכוון:** הולידציה האמיתית היא של המרשם
// (טווח · מספר ספרות · "ריק לעולם לא 0" — A-4), והיא צריכה להיות **נראית**. שדה-מספר
// של הדפדפן בולע קלט לא-חוקי בשקט ומחזיר מחרוזת ריקה, כלומר חצי ממשפחת-הטעויות לא
// הייתה מגיעה להודעה העברית בכלל. `inputMode` שומר על מקלדת-מספרים בנייד.
//
// 📐 **תא-הערך ממורכז** (הכרעת-ישי, אחרי שראה את פאנל Smart Match: קופסאות-מספר בגבהים/
// רוחבים שונים שיושבות במיקומים אופקיים שונים).
// 🔬 **שני ניסיונות קודמים נמדדו ונפסלו, וזה השלישי** (03/09/2026):
// ‏**‏(א) סלוט-יחידה קבוע** (רוחב קבוע ליחידה, מוצג גם ריק) — נעל את קצה-הקלט לאותו x, אבל
//   התוכן ה*נראה* (קלט בלי יחידה) ישב ~21-29px משמאל למרכז-הכותרת "ערך", כי המרכוז כלל גם
//   את הסלוט הבלתי-נראה. **‏(ב) מרכוז-הזוג כמקשה אחת** (קלט+פער+יחידה) — הנראות מתחת
//   לכותרת תקינה, אבל **רוחב היחידה משתנה משורה לשורה**, ולכן ה-`x` של תיבת-הקלט נדד:
//   ‏`getBoundingClientRect().left` נמדד 350.8 / 339.0 / 345.5 / 351.0 בתוך **אותה קבוצה** —
//   עד 12px הפרש, שנראה כמו קופסאות "רועדות" בעמודה.
// ✅ **‏(ג) מרווח-מראה סימטרי — הפתרון שנשאר:** אותה מחרוזת-יחידה בדיוק מרונדרת פעם שנייה
//   בצד ההפוך של הקלט כ-`invisible` (שומר-מקום; **לא** `hidden`, שאינו תופס מקום). הזוג
//   נעשה סימטרי סביב הקלט ⇒ **מרכז-הקלט = מרכז-התא בכל שורה**, בין אם יש יחידה ובין אם לא,
//   וללא תלות באורך היחידה. שתי הדרישות מתקיימות יחד: קצה-שמאל זהה בכל שורות הקבוצה, והקלט
//   יושב מתחת לכותרת "ערך". `aria-hidden` על המראה — קורא-מסך שומע את היחידה פעם אחת.
// ‏`shrink-0` + `whitespace-nowrap` על היחידה מונעים את שבירת-שני-המילים ("ימי עסקים" על
// `סף_לוגיסטיקה_ימי_עסקים`) כשהעמודה נדחקת.
//
// 📏 **עמודות-הטבלה `table-fixed` ברוחב אחיד** (ר' הכותרות ב-`ParamsTab`/`MySettingsPage`/
// `SmartMatchPane`) — ולכן שדה-הטקסט-הרחב (מייל) **אינו** יכול עוד להיות רחב מהעמודה:
// עד 03/09/2026 היה עליו `w-72 min-w-[18rem]`, והוא הרחיב את עמודת-הערך של קבוצת "טכני"
// עד ש**כותרת "ערך" שלה ישבה ב-315.8 בעוד שאר הקבוצות ב-424.2** — שתי טבלאות באותו מסך
// עם רשת אחרת. הוא ממלא היום את רוחב-התא (`w-full`), לא קובע אותו.

import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import Ltr from '@/components/Ltr'
import { cn } from '@/lib/utils'
import { getParamEntry, parseForDisplay } from '@/lib/paramsRegistry'

const NUMERIC_KINDS = new Set(['percent', 'int', 'decimal', 'weight'])
// טקסט-חופשי-רחב: מייל/קישור עלולים להיות ארוכים (`ishay1997@gmail.com` נחתך ברוחב
// המספרי-הרגיל) — נשארים רחבים גם אחרי הצרת-הריבוע של הקינדים המספריים.
const WIDE_TEXT_KINDS = new Set(['email', 'url'])

// ✅ גל 2 (צעד 3.4) — `TemplateEditor` כבר בחיווט (`paneComponents.templates`, ברירת-המחדל
// ב-`ParamsTab`/`MySettingsPage`), ולכן שורת-`templates` כבר לא עוברת כאן בזרימה הרגילה.
// התצוגה-לקריאה-בלבד למטה נשארת **רשת-ביטחון בלבד** (§2.8 "never hidden"): אם קורא עתידי
// ידרוס את `paneComponents` בלי `templates`, השורה עדיין מוצגת — בלי שדה-עריכה שעוקף את
// `templateSaveVerdict` (R-3) — במקום להיעלם.

// 📏 **רשת-העמודות של שלוש הטבלאות של המודול — מקור אחד.** הלשונית (`ParamsTab`),
// "ההגדרות שלי" (`MySettingsPage`) ופאנל ה-Smart Match מציירות את אותה טבלה בת שלוש
// עמודות, וכשהרשת חיה בשלושה עותקים היא **סוטה בשקט** — בדיוק המחלה שתועדה על `StatTile`
// ב-`src/CLAUDE.md`. ‏`table-fixed` הוא מה שמנתק את רוחב-העמודה מרוחב-התוכן: בלעדיו שדה
// רחב אחד (המייל, קבוצת "טכני") מזיז את כל הרשת של הטבלה שלו לבדה.
export const PARAMS_TABLE_CLASS = 'w-full min-w-[40rem] table-fixed border-collapse text-right'

export function ParamsTableHead() {
  return (
    <thead>
      <tr className="border-b border-slate-200 text-xs text-slate-500">
        <th className="w-[36%] py-2 pl-3 font-medium">הגדרה</th>
        {/* `pl-3` זהה לזה של תא-הערך: בלעדיו תיבת-הקלט יושבת 6px ימינה ממרכז הכותרת,
            כי הריפוד של התא מצמצם את תיבת-התוכן שלו ולא את זו של הכותרת (נמדד 03/09). */}
        <th className="w-[30%] py-2 pl-3 text-center font-medium">ערך</th>
        <th className="py-2 font-medium">הערה</th>
      </tr>
    </thead>
  )
}

export default function ParamRow({ row, value, onChange, canEdit, error }) {
  const name = row.param_name
  const entry = getParamEntry(name)
  const testId = `settings-value-${name}`
  const errorId = error ? `settings-error-${name}` : undefined
  const isTemplate = entry.kind === 'templates'
  const isBoolean = entry.kind === 'boolean'
  const isUnknown = entry.hint === 'הגדרה ללא הגדרת-תצוגה'
  const isWideText = WIDE_TEXT_KINDS.has(entry.kind)

  return (
    <tr
      className="border-b border-slate-100 align-top"
      data-testid="settings-row"
      data-param={name}
    >
      <td className="py-3 pl-3 text-sm text-slate-800">{entry.label}</td>

      <td className="py-3 pl-3">
        {isBoolean && (
          <div className="flex justify-center">
            <Switch
              checked={parseForDisplay(entry, value) === true}
              disabled={!canEdit}
              onCheckedChange={(next) => onChange(name, next ? 'true' : 'false')}
              aria-label={entry.label}
              data-testid={testId}
            />
          </div>
        )}

        {isTemplate && (
          <div
            className="max-h-32 w-full overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs whitespace-pre-wrap text-slate-600"
            data-testid={testId}
          >
            {value}
          </div>
        )}

        {!isBoolean && !isTemplate && (
          <div className="flex justify-center">
            <Ltr
              className={cn(
                'inline-flex items-center gap-1.5',
                isWideText && 'w-full max-w-full min-w-0',
              )}
            >
              {entry.unit && (
                <span
                  aria-hidden="true"
                  className="invisible shrink-0 text-xs whitespace-nowrap"
                  data-testid={`settings-unit-mirror-${name}`}
                >
                  {entry.unit}
                </span>
              )}
              <Input
                type="text"
                inputMode={NUMERIC_KINDS.has(entry.kind) ? 'decimal' : 'text'}
                dir="ltr"
                disabled={!canEdit}
                value={value ?? ''}
                onFocus={(e) => e.target.select()}
                onChange={(e) => onChange(name, e.target.value)}
                aria-label={entry.label}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={errorId}
                className={cn(
                  'h-9 rounded-lg border-slate-300 p-2 text-center text-sm',
                  NUMERIC_KINDS.has(entry.kind)
                    ? 'w-24 shrink-0'
                    : isWideText
                      ? 'w-full min-w-0'
                      : 'w-28 shrink-0',
                  error && 'border-red-500 focus-visible:ring-red-300',
                  !canEdit &&
                    'disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-100',
                )}
                data-testid={testId}
              />
              {entry.unit && (
                <span className="shrink-0 text-xs whitespace-nowrap text-slate-500">
                  {entry.unit}
                </span>
              )}
            </Ltr>
          </div>
        )}
      </td>

      <td className="py-3 text-xs text-slate-500">
        <p>{entry.hint}</p>
        {isUnknown && <p className="mt-1 text-amber-800">שורה זו אינה מוכרת למרשם התצוגה.</p>}
        {entry.affects && <p className="mt-1 text-amber-800">↳ משפיע: {entry.affects}</p>}
        {error && (
          <p id={errorId} role="alert" className="mt-1 font-medium text-red-600">
            {error}
          </p>
        )}
      </td>
    </tr>
  )
}
