import { describe, it, expect } from 'vitest'
import {
  flattenProductCost,
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

// ⚠️ הצורות שנבדקות כאן **נמדדו מול ה-REST החי** ב-31/07/2026 אחרי החלת סבב G, ולא נוחשו:
// למנכ"ל ולמנהלת-הפרויקטים חוזר `product_costs: {cost: 1200}` (אובייקט), ולמנהלת-הגיוס
// חוזר `product_costs: null` **על אותה שורת-מוצר עצמה** — כלומר ה-LEFT join שומר את המוצר
// בקטלוג. זו הסיבה שהפונקציה הזו חייבת להבדיל בין "אין הרשאה" לבין "עלות 0".
describe('flattenProductCost — שיטוח הצירוף ל-product_costs (§7.83↳, סבב G)', () => {
  it('אובייקט-עלות ⇒ ‏cost שטוח, ומפתח-הצירוף נעלם מהשורה', () => {
    const row = flattenProductCost({
      sku: '01WEB',
      item_name: 'אתר',
      product_costs: { cost: 1200 },
    })
    expect(row.cost).toBe(1200)
    expect(row).not.toHaveProperty('product_costs')
    expect(row.item_name).toBe('אתר')
  })

  it('🔒 בלי הרשאת-עלות (‏null) ⇒ ‏cost הוא null ולא 0 — "לא ידוע" ולא "לא עולה כלום"', () => {
    // זה הלב: `cost: 0` היה גורם ל-computeLinesCost להחזיר 0 ⇒ רווח גולמי = כל ההכנסה,
    // בלי שום שגיאה. אותה משפחה בדיוק כמו שומר-המע"מ (‏vatRate ?? 0).
    const row = flattenProductCost({ sku: '01WEB', product_costs: null })
    expect(row.cost).toBeNull()
    expect(row.cost).not.toBe(0)
  })

  it('עלות 0 אמיתית נשמרת כ-0 — מוצר בעלות אפס הוא מצב חוקי (‏CHECK מתיר >= 0)', () => {
    expect(flattenProductCost({ sku: 'X', product_costs: { cost: 0 } }).cost).toBe(0)
  })

  it('שורה חסרה מוחזרת כמות-שהיא ואינה מתפוצצת', () => {
    expect(flattenProductCost(null)).toBeNull()
    expect(flattenProductCost(undefined)).toBeUndefined()
  })

  it('מוצר בלי שורת-עלות כלל (מפתח-הצירוף חסר) ⇒ ‏null, ולא קריסה', () => {
    expect(flattenProductCost({ sku: 'X', item_name: 'ללא עלות' }).cost).toBeNull()
  })
})
