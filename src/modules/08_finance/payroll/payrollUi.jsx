// חלקים קטנים שחוזרים בכל לשוניות מרחב דוח השכר. רק פריסה — בלי לוגיקה.

import { cn } from '@/lib/utils'

export function Th({ children, className }) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-slate-200 px-2 py-2 text-right text-xs font-semibold text-slate-600',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({ children, className }) {
  return (
    <td className={cn('border-b border-slate-100 px-2 py-2.5 align-top', className)}>{children}</td>
  )
}

const BANNER_TONES = {
  info: 'border-slate-200 bg-slate-50 text-slate-700',
  warn: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-800',
  ok: 'border-teal-200 bg-teal-50 text-teal-800',
}

// הודעת-מצב קבועה בתוך המסך (לא טוסט). שגיאה/אזהרה ⇒ `role="alert"`, השאר ⇒ `status`.
export function Banner({ tone = 'info', children, testId, className }) {
  const role = tone === 'error' || tone === 'warn' ? 'alert' : 'status'
  return (
    <div
      role={role}
      className={cn('rounded-lg border p-3 text-sm leading-relaxed', BANNER_TONES[tone], className)}
      data-testid={testId}
    >
      {children}
    </div>
  )
}

export function Card({ children, className, testId }) {
  return (
    <section
      className={cn('rounded-xl border border-slate-200 bg-white p-4 shadow-sm', className)}
      data-testid={testId}
    >
      {children}
    </section>
  )
}

// ערך שאינו רלוונטי (בונוס/נסיעות בשורת פיצוי) — `—`, לעולם לא 0.
export function NotApplicable() {
  return <span className="text-slate-500">—</span>
}
