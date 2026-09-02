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

import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import Ltr from '@/components/Ltr'
import { cn } from '@/lib/utils'
import { getParamEntry, parseForDisplay } from '@/lib/paramsRegistry'

const NUMERIC_KINDS = new Set(['percent', 'int', 'decimal', 'weight'])

// ✅ גל 2 (צעד 3.4) — `TemplateEditor` כבר בחיווט (`paneComponents.templates`, ברירת-המחדל
// ב-`ParamsTab`/`MySettingsPage`), ולכן שורת-`templates` כבר לא עוברת כאן בזרימה הרגילה.
// התצוגה-לקריאה-בלבד למטה נשארת **רשת-ביטחון בלבד** (§2.8 "never hidden"): אם קורא עתידי
// ידרוס את `paneComponents` בלי `templates`, השורה עדיין מוצגת — בלי שדה-עריכה שעוקף את
// `templateSaveVerdict` (R-3) — במקום להיעלם.

export default function ParamRow({ row, value, onChange, canEdit, error }) {
  const name = row.param_name
  const entry = getParamEntry(name)
  const testId = `settings-value-${name}`
  const errorId = error ? `settings-error-${name}` : undefined
  const isTemplate = entry.kind === 'templates'
  const isBoolean = entry.kind === 'boolean'
  const isUnknown = entry.hint === 'הגדרה ללא הגדרת-תצוגה'

  return (
    <tr
      className="border-b border-slate-100 align-top"
      data-testid="settings-row"
      data-param={name}
    >
      <td className="py-3 pl-3 text-sm text-slate-800">{entry.label}</td>

      <td className="py-3 pl-3">
        {isBoolean && (
          <Switch
            checked={parseForDisplay(entry, value) === true}
            disabled={!canEdit}
            onCheckedChange={(next) => onChange(name, next ? 'true' : 'false')}
            aria-label={entry.label}
            data-testid={testId}
          />
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
          <Ltr className="inline-flex items-center gap-1.5">
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
                'h-auto w-28 rounded-lg border-slate-300 p-2 text-sm',
                error && 'border-red-500 focus-visible:ring-red-300',
                !canEdit && 'disabled:opacity-60',
              )}
              data-testid={testId}
            />
            {entry.unit && <span className="text-xs text-slate-500">{entry.unit}</span>}
          </Ltr>
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
