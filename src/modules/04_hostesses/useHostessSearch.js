import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// חיפוש נפרד לכל לשונית, בלי לאבד את המסנן או את כתובת החזרה לדוח.
export default function useHostessSearch(key) {
  const [params, setParams] = useSearchParams()
  const urlValue = params.get(key) ?? ''
  // BrowserRouter מעדכן כתובת במעבר רקע. הקלט חייב להתעדכן מיד כדי לא לאבד אותיות.
  // כתובת חדשה (גם אחורה/קדימה) מסנכרנת את הקלט לפני רינדור הילדים, בלי effect מאוחר.
  const [draft, setDraft] = useState(() => ({ source: urlValue, value: urlValue }))
  if (draft.source !== urlValue) setDraft({ source: urlValue, value: urlValue })
  const value = draft.source === urlValue ? draft.value : urlValue
  function setValue(valueOrFn) {
    const nextValue = typeof valueOrFn === 'function' ? valueOrFn(value) : valueOrFn
    setDraft({ source: urlValue, value: nextValue })
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (nextValue === '') next.delete(key)
        else next.set(key, nextValue)
        return next
      },
      { replace: true },
    )
  }
  return [value, setValue]
}
