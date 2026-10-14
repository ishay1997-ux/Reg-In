// מצב מרחב דוח השכר חי בכתובת (CLAUDE.md §4.2) — רענון, "חזור" וקישור ששותף מחזירים בדיוק
// לאותו חודש, לשונית, מסנן, חיפוש ועמוד. מפתחות (חוזה §4.1): period · kind · original · view ·
// filter · q · page · case · report · op · sheet (מתג התצוגה בטבלת הטיוטה).
//
// 🔴 **ה-setter מקבל גם פונקציה** (`update(prev => patch)`) — המוקש של CustomersPage
// (30/07): סטר שקיבל פונקציה כתב את גוף-הפונקציה כמחרוזת לכתובת, בשקט.
// `filter`, `q` ו-`page` נכתבים ב-`replace` (חוזה): הקלדה בחיפוש לא ממלאת את ההיסטוריה.

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FILTERS,
  KINDS,
  SHEETS,
  VIEWS,
  parseChoice,
  parsePeriodParam,
  parsePositiveInt,
} from './payrollModel'

const REPLACE_KEYS = new Set(['filter', 'q', 'page', 'sheet'])

function readState(params) {
  return {
    period: parsePeriodParam(params.get('period')),
    kind: parseChoice(params.get('kind'), KINDS, 'regular'),
    original: parsePositiveInt(params.get('original')),
    view: parseChoice(params.get('view'), VIEWS, null),
    filter: parseChoice(params.get('filter'), FILTERS, null),
    q: params.get('q') ?? '',
    page: parsePositiveInt(params.get('page')) ?? 1,
    caseId: parsePositiveInt(params.get('case')),
    reportId: parsePositiveInt(params.get('report')),
    opId: params.get('op') || null,
    sheet: parseChoice(params.get('sheet'), SHEETS, 'shift'),
  }
}

const PARAM_OF = {
  period: 'period',
  kind: 'kind',
  original: 'original',
  view: 'view',
  filter: 'filter',
  q: 'q',
  page: 'page',
  caseId: 'case',
  reportId: 'report',
  opId: 'op',
  sheet: 'sheet',
}

export function usePayrollUrl() {
  const [searchParams, setSearchParams] = useSearchParams()
  const state = useMemo(() => readState(searchParams), [searchParams])

  // `patch` — אובייקט חלקי או פונקציה מהמצב הנוכחי. `null`/`''` מוחקים מפתח.
  const update = useCallback(
    (patchOrFn) => {
      const resolve = (params) =>
        typeof patchOrFn === 'function' ? patchOrFn(readState(params)) : patchOrFn
      // ‏`replace` נקבע לפני הניווט (אפשרויות הניווט נקראות ברגע הקריאה, לא בתוך העדכון):
      // רק אם כל המפתחות שמשתנים הם מסנן/חיפוש/עמוד.
      const keys = Object.keys(resolve(searchParams) ?? {})
      const replace = keys.length > 0 && keys.every((key) => REPLACE_KEYS.has(key))
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(resolve(prev) ?? {})) {
            const param = PARAM_OF[key]
            if (!param) continue
            if (value === null || value === undefined || value === '') next.delete(param)
            else next.set(param, String(value))
          }
          return next
        },
        { replace },
      )
    },
    [searchParams, setSearchParams],
  )

  return [state, update]
}
