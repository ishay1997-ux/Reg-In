// S2 — עורך תבניות המייל (מודול 9, צעד 3.2). מוקאפ: docs/mockups/settings-screen/
// 02_params_tab_roles_and_states.html §3 (3א/3ב/3ג). חוזה-התוכן (מה מותר בכל תבנית,
// מה חוסם, מה מזהיר) חי ב-`src/lib/emailTemplates.js` — הרכיב הזה **לעולם לא** מחשב
// verdict בעצמו, רק קורא ל-`templateSaveVerdict` ומציג את מה שהיא מחזירה.
//
// 🔑 **חוזה-הפרופס נקבע ע"י ה-orchestrator** (כך `ParamsTab` תרכיב אותי בגל 2 דרך
// `paneComponents.templates`): `{ rows, values, onChange, canEdit, errors, onVerdict }`.
// אין לי `onSave` — כפתורי-השמירה/ביטול ("שינית N מתוך M") שייכים ל-`SaveRow` המשותף
// שבונה A ומתחבר בגל 2; אני רק **מדווח** את ה-verdict כלפי מעלה דרך `onVerdict(name, verdict)`
// כדי שהוא ידע מתי לנטרל את כפתור השמירה — בדיוק כפי שהבריף ביקש.
//
// שורה עם kind='templates' שאין לה חוזה ב-TEMPLATE_PLACEHOLDERS (Q-2 מחקה את שתי המועמדות;
// זהו רק רשת-ביטחון לעתיד) נופלת בשקט מרשימת-התבניות — לעולם לא נפתח עליה עורך.
//
// 🔴 **תוקן בחיווט-גל-2 (§10):** `rows` הם שורות-DB גולמיות בדיוק כמו בכל שאר `ParamsTab`
// (`param_name`/`param_value`/`param_type`/`owner_role_id` — הצורה שמשתמשת בה `ParamRow`),
// **לא** צורת-מרשם (`name`/`label`). תווית-התצוגה נשלפת מהמרשם (`getParamEntry`) ולא
// מגיעה בתוך השורה עצמה — אין עמודת-תיאור ב-`params` (seed decision #7, §2.8).

import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { TEMPLATE_PLACEHOLDERS, templateSaveVerdict } from '@/lib/emailTemplates'
import { getParamEntry } from '@/lib/paramsRegistry'
import Ltr from '@/components/Ltr'

function tokenTestId(token) {
  return token.replace(/[[\]]/g, '')
}

function TemplateChip({ token, required, missing, disabled, onInsert }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onInsert(token)}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[12.5px] disabled:cursor-not-allowed disabled:opacity-60',
        missing
          ? 'border-amber-200 bg-amber-50 font-semibold text-amber-800'
          : required
            ? 'border-teal-200 bg-teal-50 font-semibold text-teal-700'
            : 'border-slate-300 bg-white text-slate-600',
      )}
      data-testid={`settings-template-chip-${tokenTestId(token)}`}
    >
      <Ltr>{token}</Ltr>
      {required ? ' ✱' : ''}
      {missing ? ' — חסר ✚' : ''}
    </button>
  )
}

export default function TemplateEditor({ rows, values, onChange, canEdit, errors, onVerdict }) {
  // רק שורות שיש להן חוזה — שורה אחרת (למשל URL) לא פותחת עורך (§6 צעד 3.2).
  const templateRows = useMemo(
    () => (rows ?? []).filter((row) => Boolean(TEMPLATE_PLACEHOLDERS[row?.param_name])),
    [rows],
  )

  const [selectedName, setSelectedName] = useState(templateRows[0]?.param_name ?? null)
  const textareaRef = useRef(null)

  // השורה שנבחרה יכולה להיעלם (סינון/רענון) — נגזר-בזמן-render, לא effect+setState
  // (`react-hooks/set-state-in-effect` היא שגיאה קשיחה כאן, src/CLAUDE.md).
  const selectedRow =
    templateRows.find((row) => row.param_name === selectedName) ?? templateRows[0] ?? null
  const contract = selectedRow ? TEMPLATE_PLACEHOLDERS[selectedRow.param_name] : null
  const body = selectedRow ? (values?.[selectedRow.param_name] ?? '') : ''
  const verdict = selectedRow ? templateSaveVerdict(selectedRow.param_name, body) : null
  const editable = selectedRow ? Boolean(canEdit?.(selectedRow)) : false

  // מדווחים כלפי מעלה בכל שינוי-verdict, לא תוך-כדי render (אפקט, לא קריאה ישירה).
  useEffect(() => {
    if (selectedRow && verdict) onVerdict?.(selectedRow.param_name, verdict)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- תלוי בתוכן ה-verdict, לא בזהותו
  }, [selectedRow?.param_name, verdict?.status, verdict?.message])

  if (templateRows.length === 0) return null

  function insertToken(token) {
    if (!selectedRow || !editable) return
    const current = body
    const el = textareaRef.current
    if (!el) {
      onChange?.(selectedRow.param_name, `${current}${token}`)
      return
    }
    const start = el.selectionStart ?? current.length
    const end = el.selectionEnd ?? current.length
    const next = current.slice(0, start) + token + current.slice(end)
    onChange?.(selectedRow.param_name, next)
    // מחזירים פוקוס+סמן אחרי הטוקן שהוכנס, בתור-הבא — לא תוך-כדי ה-render הנוכחי.
    const caretPos = start + token.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caretPos, caretPos)
    })
  }

  return (
    <div
      className="grid grid-cols-[168px_minmax(0,1fr)] items-start gap-3"
      data-testid="settings-template-editor"
    >
      <div
        className="rounded-lg border border-slate-200 p-1.5"
        data-testid="settings-template-list"
      >
        {templateRows.map((row) => (
          <button
            key={row.param_name}
            type="button"
            onClick={() => setSelectedName(row.param_name)}
            className={cn(
              'block w-full rounded-md px-2.5 py-1.5 text-right text-[13px]',
              row.param_name === selectedName
                ? 'bg-teal-50 font-semibold text-teal-700'
                : 'text-slate-600',
            )}
            data-testid={`settings-template-item-${tokenTestId(row.param_name)}`}
          >
            {getParamEntry(row.param_name).label}
          </button>
        ))}
      </div>

      {selectedRow && (
        <div>
          <textarea
            ref={textareaRef}
            dir="rtl"
            rows={9}
            value={body}
            readOnly={!editable}
            disabled={!editable}
            onChange={(e) => onChange?.(selectedRow.param_name, e.target.value)}
            className={cn(
              'w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-[13.5px] leading-[2.1] text-slate-700',
              !editable && 'cursor-not-allowed text-slate-500',
            )}
            data-testid="settings-template-body"
          />

          {verdict?.status === 'blocked' && (
            <div
              className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[12.5px] leading-relaxed text-red-700"
              data-testid="settings-template-blocked"
            >
              <b>{verdict.message}</b>
              <br />
              השמירה חסומה. אפשר להחזיר את המשתנה מהרשימה שלמטה.
            </div>
          )}

          {verdict?.status === 'warning' && (
            <div
              className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[12.5px] leading-relaxed text-amber-800"
              data-testid="settings-template-warning"
            >
              <b>{verdict.message}</b>
              <br />
              אפשר לשמור — אבל כדאי לבדוק את החוסר.
            </div>
          )}

          {errors?.[selectedRow.param_name] && (
            <div
              className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[12.5px] text-red-700"
              data-testid="settings-template-form-error"
            >
              {errors[selectedRow.param_name]}
            </div>
          )}

          <div className="mt-3 border-t border-slate-200 pt-2.5">
            <div className="mb-1.5 text-xs text-slate-500">
              מה מותר להכניס בתבנית הזו — לחיצה מוסיפה לטקסט
            </div>
            <div className="flex flex-wrap gap-1.5">
              {contract.required.map((token) => (
                <TemplateChip
                  key={token}
                  token={token}
                  required
                  missing={verdict?.missingRequired?.includes(token)}
                  disabled={!editable}
                  onInsert={insertToken}
                />
              ))}
              {contract.optional.map((token) => (
                <TemplateChip
                  key={token}
                  token={token}
                  required={false}
                  missing={verdict?.missingOptional?.includes(token)}
                  disabled={!editable}
                  onInsert={insertToken}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-3.5 text-[11.5px] text-slate-500">
              <span>
                <b className="text-slate-700">✱ חובה</b> — בלעדיו השמירה נחסמת
              </span>
              <span>בלי סימון — רשות, חוסר גורר אזהרה בלבד</span>
            </div>
          </div>

          {!editable && (
            <div
              className="mt-3 text-[12px] text-slate-500"
              data-testid="settings-template-view-only"
            >
              צפייה בלבד
            </div>
          )}
        </div>
      )}
    </div>
  )
}
