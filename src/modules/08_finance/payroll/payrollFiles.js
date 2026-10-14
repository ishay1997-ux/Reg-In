// קבצים שנבנים בדפדפן ואינם נשמרים בשום מקום: טיוטה (חוזה §4.2) ושחזור לדוח ישן (W4).
// 🔴 שניהם **לא נשלחים ולא נשמרים** — הורדה מקומית בלבד. הקובץ הסופי נבנה בשרת (D9).

import {
  buildSalaryReportDraftDocument,
  buildSalaryReportReconstructionDocument,
  writeSalaryReportXlsx,
} from '@/lib/salaryReport'

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // ‏Chrome צריך את הכתובת עד שההורדה מתחילה — שחרור מיידי מבטל אותה לפעמים.
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

// כל השורות של התצוגה המקדימה, לא העמוד המוצג (אין "ייצוא עמוד חלקי").
export async function downloadDraft(preview) {
  const doc = buildSalaryReportDraftDocument(preview)
  const blob = await writeSalaryReportXlsx(doc)
  downloadBlob(blob, doc.fileName)
  return doc
}

export async function downloadReconstruction(report, lines, now) {
  const doc = buildSalaryReportReconstructionDocument(report, lines, {
    reconstructedAt: now.toISOString(),
  })
  const blob = await writeSalaryReportXlsx(doc)
  downloadBlob(blob, doc.fileName)
  return doc
}
