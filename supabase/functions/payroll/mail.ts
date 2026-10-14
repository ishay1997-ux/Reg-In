// גוף ונושא של מיילי השכר — העתק של כללי-המייל של האפליקציה, ועוד המייל האישי לדיילת.
//
// 🔗 המקורות (קריאה בלבד, ונעולים בבדיקת-שוויון `mail.parity.test.js`):
//    `src/lib/email.js` — `findUnknownPlaceholders`, `fillEmailTemplate`, `plainTextToEmailHtml`,
//                         `isAttachmentTooLarge`
//    `src/modules/08_finance/api.js` — `templateWithoutAccountantName`, `salaryReportEmailSubject`,
//                                      `buildSalaryReportEmailPayload` (הגוף)
// ⚠️ שום כלל כאן אינו חדש. מה שחדש: המייל האישי (חוזה §3.1 שלב 3) ודרישת-השדות-החובה, שזהה
//    להגדרת-התקינות של המסד (תיקון F9 לחוזה).

const PLACEHOLDER_PATTERN = /\[[^\]\n]+\]/g

const MAX_ATTACHMENT_BASE64_CHARS = 4_000_000

export function isAttachmentTooLarge(base64Length: number): boolean {
  return base64Length > MAX_ATTACHMENT_BASE64_CHARS
}

export function findUnknownPlaceholders(
  template: string,
  replacements: Record<string, string>,
): string[] {
  if (!template) return []
  const known = new Set(Object.keys(replacements ?? {}))
  const found = String(template).match(PLACEHOLDER_PATTERN) ?? []
  return [...new Set(found)].filter((token) => !known.has(token))
}

// ⚠️ סורקים את **התבנית** ולא את התוצאה: ערכים מוזרקים (שם עם `[דמו]`) הם דאטה לגיטימית.
export function fillEmailTemplate(template: string, replacements: Record<string, string>): string {
  if (!template) return ''
  if (findUnknownPlaceholders(template, replacements).length > 0) return ''
  return Object.entries(replacements ?? {}).reduce(
    (text, [token, value]) => text.split(token).join(String(value ?? '')),
    template,
  )
}

const LTR_ISOLATE_START = String.fromCharCode(0x2066) // LRI — Left-to-Right Isolate
const LTR_ISOLATE_END = String.fromCharCode(0x2069) // PDI — Pop Directional Isolate
const LTR_RUN_PATTERN = /[A-Za-z][A-Za-z0-9._\-'/:&?=#%+@~]*[!?.,;:]?/g

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeTextRuns(source: string): string {
  let escaped = ''
  let cursor = 0
  for (const match of source.matchAll(LTR_RUN_PATTERN)) {
    const index = match.index ?? 0
    escaped += escapeHtml(source.slice(cursor, index))
    escaped += LTR_ISOLATE_START + escapeHtml(match[0]) + LTR_ISOLATE_END
    cursor = index + match[0].length
  }
  return escaped + escapeHtml(source.slice(cursor))
}

function wrapRtl(escaped: string): string {
  return `<div dir="rtl" style="text-align:right">${escaped.replace(/\r\n|\r|\n/g, '<br>')}</div>`
}

// טקסט-פשוט ⇒ HTML עברי: מעברי-שורה, `dir="rtl"`, הברחה, ובידוד רצפים לטיניים (כתובת, קישור).
export function plainTextToEmailHtml(text: string): string {
  if (!text) return ''
  return wrapRtl(escapeTextRuns(String(text)))
}

// הטקסט הגלוי של הקישור במייל לדיילת: תווית עברית במקום כתובת ארוכה עם אסימון.
export const REVIEW_LINK_LABEL = 'לצפייה בסיכום השעות'

function escapeAttribute(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;')
}

// המייל לדיילת: כמו `plainTextToEmailHtml`, אבל הקישור הוא `<a href>` אמיתי.
// למה: כתובת עטופה בתווי-בידוד היא טקסט, ו-Gmail מזהה אותה כקישור רק לפעמים. ה-href הוא
// הכתובת המדויקת, בלי תווי-בידוד בתוכה — הבידוד חל רק על הטקסט שמסביב.
export function reviewTextToEmailHtml(text: string, link: string): string {
  if (!text) return ''
  const source = String(text)
  if (!link || !source.includes(link)) return plainTextToEmailHtml(source)
  const anchor = `<a href="${escapeAttribute(link)}">${REVIEW_LINK_LABEL}</a>`
  return wrapRtl(source.split(link).map(escapeTextRuns).join(anchor))
}

const ACCOUNTANT_NAME_TOKEN = '[שם_רואה_חשבון]'
const ACCOUNTANT_NAME_SEPARATOR = ' / '

export function templateWithoutAccountantName(template: string): string {
  return String(template ?? '')
    .split('\n')
    .map((line) => {
      if (!line.includes(ACCOUNTANT_NAME_TOKEN)) return line
      return line
        .split(ACCOUNTANT_NAME_SEPARATOR + ACCOUNTANT_NAME_TOKEN)
        .join('')
        .split(ACCOUNTANT_NAME_TOKEN + ACCOUNTANT_NAME_SEPARATOR)
        .join('')
        .split(ACCOUNTANT_NAME_TOKEN)
        .join('')
        .replace(/\s+([,.])/g, '$1')
        .replace(/ {2,}/g, ' ')
        .trim()
    })
    .join('\n')
}

export function salaryReportEmailSubject(periodLabel: string): string {
  return `דוח שכר דיילות — ${periodLabel ?? ''}`.trim()
}

export function reviewEmailSubject(periodLabel: string): string {
  return `סיכום שעות לבדיקה — ${periodLabel ?? ''}`.trim()
}

export const MONTH_TOKEN = '[חודש_דיווח_ושנה]'
export const HOSTESS_NAME_TOKEN = '[שם_דיילת]'
export const REVIEW_LINK_TOKEN = '[לינק_בדיקת_שעות]'
export const DEADLINE_TOKEN = '[מועד_אחרון_לתגובה]'

// השדות שבלעדיהם המייל ריק מתוכן: לרו"ח — החודש; לדיילת — ארבעתם (בלי קישור אין מה לבדוק).
export const ACCOUNTANT_REQUIRED_TOKENS = [MONTH_TOKEN]
export const REVIEW_REQUIRED_TOKENS = [
  HOSTESS_NAME_TOKEN,
  MONTH_TOKEN,
  REVIEW_LINK_TOKEN,
  DEADLINE_TOKEN,
]

export class TemplateError extends Error {
  code = 'TEMPLATE_INVALID'
  constructor(message: string) {
    super(message)
    this.name = 'TemplateError'
  }
}

function requireTokens(template: string, required: string[]): void {
  const missing = required.filter((token) => !template.includes(token))
  if (missing.length > 0) throw new TemplateError(`missing ${missing.join(' ')}`)
}

function fillOrThrow(template: string, replacements: Record<string, string>): string {
  const unknown = findUnknownPlaceholders(template, replacements)
  if (unknown.length > 0) throw new TemplateError(`unknown ${unknown.join(' ')}`)
  const text = fillEmailTemplate(template, replacements)
  if (!text) throw new TemplateError('empty')
  return text
}

export interface RenderedText {
  subject: string
  text: string
}

// גוף מייל-הרו"ח: בדיוק `buildSalaryReportEmailPayload` עם `accountantName = null` — מציין-המקום
// של שם-הרו"ח מוסר יחד עם המפריד שלו, ולעולם לא ממומצא (אין לשם מקור במערכת).
export function renderAccountantText(template: string, periodLabel: string): RenderedText {
  if (!template || !template.trim()) throw new TemplateError('empty')
  requireTokens(template, ACCOUNTANT_REQUIRED_TOKENS)
  const text = fillOrThrow(templateWithoutAccountantName(template), {
    [ACCOUNTANT_NAME_TOKEN]: '',
    [MONTH_TOKEN]: periodLabel,
  })
  return { subject: salaryReportEmailSubject(periodLabel), text }
}

export function renderReviewText(
  template: string,
  values: { hostessName: string; periodLabel: string; link: string; deadline: string },
): RenderedText {
  if (!template || !template.trim()) throw new TemplateError('empty')
  requireTokens(template, REVIEW_REQUIRED_TOKENS)
  const text = fillOrThrow(template, {
    [HOSTESS_NAME_TOKEN]: values.hostessName,
    [MONTH_TOKEN]: values.periodLabel,
    [REVIEW_LINK_TOKEN]: values.link,
    [DEADLINE_TOKEN]: values.deadline,
  })
  return { subject: reviewEmailSubject(values.periodLabel), text }
}
