// שורת-השמירה של קבוצת-הגדרות (מוקאפ סעיף 1 ו-8ד): "שינית N מתוך M" · ביטול · שמור.
//
// 🔢 **שני מספרים במשפט עברי אחד** — כל אחד מבודד לחוד ומופרד במילה עברית ("מתוך").
// הרצף `62% / 38%` שנשבר במופע התשיעי (`src/CLAUDE.md`) היה **שני מספרים צמודים**;
// כאן הם אינם צמודים, ולכן בידוד-לכל-אחד הוא הפתרון הנכון ולא פירוק-הרצף.
//
// 🔴 **אחרי כשל הכפתור הראשי אומר "נסי שוב"** (המוקאפ, 8ד) — ולא "שמור שינויים":
// המשתמשת לוחצת שוב על אותה אצווה, והשורות שכבר נכתבו יצאו ממנה מעצמן (הן כבר לא
// "שונו"). ‏A-2: המונה עצמו קיים כי טופס בן 13 שדות בלי חיווי-שינוי מזמין שמירה בשוגג.

import { Button } from '@/components/ui/button'
import Ltr from '@/components/Ltr'

export default function SaveRow({
  dirtyCount,
  total,
  onCancel,
  onSave,
  saving = false,
  disabled = false,
  failedMessage = '',
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
      {failedMessage ? (
        <span
          role="alert"
          className="text-sm font-semibold text-red-700"
          data-testid="settings-save-failed"
        >
          {failedMessage}
        </span>
      ) : (
        <span className="text-sm text-slate-500" data-testid="settings-dirty-count">
          שינית <Ltr>{dirtyCount}</Ltr> מתוך <Ltr>{total}</Ltr>
        </span>
      )}

      <span className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving || dirtyCount === 0}
          className="h-auto rounded-lg border-slate-300 px-4 py-2 text-slate-700"
          data-testid="settings-cancel-button"
        >
          ביטול
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={saving || disabled || dirtyCount === 0}
          className="h-auto rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          data-testid="settings-save-button"
        >
          {saving ? 'שומר...' : failedMessage ? 'נסי שוב' : 'שמור שינויים'}
        </Button>
      </span>
    </div>
  )
}
