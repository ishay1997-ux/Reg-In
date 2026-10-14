// הורדת קובץ הטיוטה — handler אחד לשני מקומות: "הורד טיוטה" בלשונית הטיוטה ו"הורד את הקובץ
// שיישלח" באישור הסופי (בקשת ישי 14/10: "יש תצוגה מקדימה לפני שליחה ושם מראים מה ישלח?").
// אותו בונה, אותה גרסת תצוגה מקדימה, שם קובץ `_DRAFT`. הטוסט מופיע רק אחרי שהקובץ נבנה.

import { useState } from 'react'
import { useToast } from '@/components/ToastProvider'
import { downloadDraft } from './payrollFiles'

export function useDraftDownload(preview) {
  const toast = useToast()
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  async function download() {
    setDownloading(true)
    setError('')
    try {
      await downloadDraft(preview)
      toast.success('הטיוטה מוכנה להורדה')
    } catch (err) {
      setError(err?.message || 'הורדת הטיוטה נכשלה. נסה שוב')
    } finally {
      setDownloading(false)
    }
  }

  return { download, downloading, error }
}
