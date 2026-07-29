import { describe, it, expect } from 'vitest'
import {
  LINE_COLORS,
  NO_COLOR_LABEL,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_UNITS,
} from './catalog'

// ⚠️ הרשימות כאן הן העתק מילולי של אילוצי-ה-CHECK החיים ב-DB, כפי שנשלפו ב-29/07/2026
// בשאילתה על pg_constraint. תפקיד הבדיקות בקובץ הזה הוא **לתפוס דריפט**: ערך שמופיע ב-UI
// ולא קיים ב-CHECK אינו נכשל בזמן-הקלדה — הוא נכשל בשמירה, אצל המשתמש, כשגיאה סתומה.
const DB_CATEGORY_CHECK = ['site', 'hostess', 'product']
const DB_STATUS_CHECK = ['active', 'out_of_stock', 'inactive']
const DB_UNIT_CHECK = ['יחידה', 'פרויקט', 'משמרת', 'מטר']
const DB_COLOR_CHECK = ['לבן', 'שחור', 'אפור', 'טורקיז', 'כחול']

describe('PRODUCT_CATEGORY_LABELS — קטגוריות מוצר', () => {
  it('מכסה בדיוק את שלושת ערכי ה-CHECK, בלי חוסר ובלי עודף', () => {
    expect(Object.keys(PRODUCT_CATEGORY_LABELS).sort()).toEqual([...DB_CATEGORY_CHECK].sort())
  })

  it('מתרגם לתוויות העברית של מסמך-המוצרים', () => {
    expect(PRODUCT_CATEGORY_LABELS.site).toBe('אתר')
    expect(PRODUCT_CATEGORY_LABELS.hostess).toBe('דיילות')
    expect(PRODUCT_CATEGORY_LABELS.product).toBe('מוצרים')
  })
})

describe('PRODUCT_STATUS_LABELS — סטטוס מוצר', () => {
  it('מכסה בדיוק את שלושת ערכי ה-CHECK', () => {
    expect(Object.keys(PRODUCT_STATUS_LABELS).sort()).toEqual([...DB_STATUS_CHECK].sort())
  })

  it('מתרגם לתוויות עברית', () => {
    expect(PRODUCT_STATUS_LABELS.active).toBe('פעיל')
    expect(PRODUCT_STATUS_LABELS.out_of_stock).toBe('אזל מהמלאי')
    expect(PRODUCT_STATUS_LABELS.inactive).toBe('לא פעיל')
  })
})

describe('PRODUCT_UNITS — יחידות מידה', () => {
  it('זהה בית-בבית ל-CHECK ‏products_unit_check (הערכים עצמם כבר בעברית — אין תרגום)', () => {
    expect(PRODUCT_UNITS).toEqual(DB_UNIT_CHECK)
  })
})

describe('LINE_COLORS — צבעי שורת-הצעה (§7.41)', () => {
  it('זהה בית-בבית ל-CHECK ‏quote_services_color_check', () => {
    expect(LINE_COLORS).toEqual(DB_COLOR_CHECK)
  })

  it('‏"ללא" אינו אחד מהצבעים — הוא מייצג NULL ב-DB, לא ערך חוקי ב-CHECK', () => {
    expect(LINE_COLORS).not.toContain(NO_COLOR_LABEL)
    expect(NO_COLOR_LABEL).toBe('ללא')
  })
})
