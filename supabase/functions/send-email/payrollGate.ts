// האם מותר לשלוח דוח-שכר דרך המסלול הישן (`entity_type: 'salary_report'`)? — חוזה השכר §3.3.
//
// 🔒 **שתי סיבות לסירוב:** (1) הכותב הישן כובה (`payroll_config.legacy_writer = 'disabled'`, אחרי
// המעבר); (2) הדוח נוצר בתהליך החדש (יש לו `operation_id`) — דוח כזה נשלח **רק** מפונקציית
// `payroll`, מתוך הניסיון שנשמר, עם הקובץ שנחתם. אחרת משתמשת-כספים יכלה לשלוח "דוח" בכל קובץ
// ולכל כתובת, ולעקוף את רישום הניסיונות.
// 🔒 **נעילה כשאין ודאות:** אם ההגדרות או הדוח לא נקראו — מסרבים. שליחת דוח-שכר לא יכולה לסמוך
// על "כנראה בסדר".

export interface LegacyPayrollState {
  configRead: boolean
  legacyWriter: string | null
  reportFound: boolean
  operationId: string | null
}

export const LEGACY_PAYROLL_SEND_DISABLED = 'LEGACY_PAYROLL_SEND_DISABLED'

export function legacyPayrollSendRefusal(state: LegacyPayrollState): string | null {
  if (!state.configRead || state.legacyWriter !== 'enabled') return LEGACY_PAYROLL_SEND_DISABLED
  if (!state.reportFound || state.operationId !== null) return LEGACY_PAYROLL_SEND_DISABLED
  return null
}
