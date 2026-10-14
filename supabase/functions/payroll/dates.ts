// העתק של `formatTimestampFull` מ-`src/lib/dates.js` — `DD/MM/YYYY HH:MM` בשעון ישראל.
// ⚠️ שעון ישראל ולא UTC: חותמת של 01:10 בלילה בישראל רשומה במסד כ-22:10 של אתמול. בדיקת-השוויון
// (`dates.parity.test.js`) עוברת על רגעים סביב מעברי שעון-קיץ/חורף ומשווה מול המקור.

export function formatTimestampFull(iso: unknown, emptyText = ''): string {
  if (!iso) return emptyText
  const instant = new Date(iso as string)
  if (Number.isNaN(instant.getTime())) return emptyText
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant)
  const at = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${at('day')}/${at('month')}/${at('year')} ${at('hour')}:${at('minute')}`
}
