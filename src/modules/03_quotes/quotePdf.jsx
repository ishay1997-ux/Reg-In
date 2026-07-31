// מנוע ה-PDF של הצעת המחיר — פונקציה טהורה: נתוני-הצעה ⇒ מסמך/Blob.
// §7.12: אין אחסון של ה-PDF ואין pdf_url — המסמך נוצר בזמן-אמת בכל בקשה. הקובץ הזה עומד
// בפני עצמו בכוונה (בלי React-hooks, בלי supabase, בלי router): מודול 10 מרים אותו כמות-שהוא
// לשרת כדי לשלוח מייל אוטומטי, ותלות ב-UI הייתה חוסמת את זה.
import { Document, Page, Text, View, Image, Font, StyleSheet, pdf } from '@react-pdf/renderer'
import heeboRegular from '@/assets/fonts/Heebo_400Regular.ttf?inline'
import heeboBold from '@/assets/fonts/Heebo_700Bold.ttf?inline'
import regInLogo from '@/assets/reg-in-logo.png?inline'
import { computeQuoteTotals, formatShekelWhole, parseVatPercent } from '@/lib/pricing'
import { NO_COLOR_LABEL } from '@/lib/catalog'

// ── מוקש 1: פורמט הגופן ────────────────────────────────────────────────────
// ‏fontkit של react-pdf קורא TTF/OTF בלבד. קובצי woff/woff2 (מה שכל חבילת-גופנים מודרנית
// מספקת) **לא זורקים שגיאה** — הם עוברים register בהצלחה ואז מדפיסים ג'יבריש או כלום.
// לכן הגופן כאן הוא TTF מקומי (‏src/assets/fonts, רישיון OFL), מוטמע כ-data-URI דרך ‎?inline
// ולא נטען ברשת: גופן שנכשל בטעינה שקטה הוא בדיוק אותה תקלה בלבוש אחר.
Font.register({
  family: 'Heebo',
  fonts: [
    { src: heeboRegular, fontWeight: 400 },
    { src: heeboBold, fontWeight: 700 },
  ],
})

// עברית לא נשברת באמצע מילה; המקפן של react-pdf מיועד לאנגלית ומייצר חיתוכים שגויים.
Font.registerHyphenationCallback((word) => [word])

const TEAL = '#0D9488'
const INK = '#1E293B'
const MUTED = '#64748B'
const LINE = '#E2E8F0'
const RULE = '#CBD5E1'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Heebo',
    fontSize: 9.5,
    color: INK,
    textAlign: 'right',
    paddingTop: 30,
    paddingBottom: 42,
    paddingHorizontal: 40,
  },
  head: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { width: 120, height: 43.7, objectFit: 'contain' },
  docTitle: { fontSize: 20, fontWeight: 700, color: TEAL, marginBottom: 7, textAlign: 'left' },
  metaBox: { borderWidth: 1, borderColor: RULE, borderRadius: 4, minWidth: 175 },
  metaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  metaRowLast: { borderBottomWidth: 0 },
  metaKey: { color: MUTED, fontSize: 8.5 },
  rule: { height: 2.5, backgroundColor: TEAL, borderRadius: 1, marginTop: 9, marginBottom: 11 },

  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: TEAL,
    textAlign: 'right',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#CCFBF1',
    marginBottom: 8,
  },
  pairs: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  pair: { flexDirection: 'row-reverse', width: '50%', paddingVertical: 3.5, paddingLeft: 16 },
  pairKey: { color: MUTED, width: 80, textAlign: 'right' },
  pairVal: { fontWeight: 700, flex: 1 },

  th: {
    flexDirection: 'row-reverse',
    backgroundColor: TEAL,
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 5,
  },
  tr: {
    flexDirection: 'row-reverse',
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  trAlt: { backgroundColor: '#F8FAFC' },

  totals: { width: '60%', marginRight: 'auto' },
  totalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 4.5,
    paddingHorizontal: 9,
  },
  totalDiscount: { color: '#B45309' },
  totalPreVat: { borderTopWidth: 1, borderTopColor: RULE },
  grand: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    backgroundColor: TEAL,
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: 12,
    borderRadius: 4,
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 9,
  },

  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRightWidth: 2.5,
    borderRightColor: TEAL,
    paddingVertical: 6,
    paddingHorizontal: 10,
    lineHeight: 1.5,
  },
  term: { flexDirection: 'row-reverse', color: '#475569', marginBottom: 4, lineHeight: 1.5 },
  termText: { flex: 1, textAlign: 'right' },
  bullet: { width: 9, textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 6,
    fontSize: 7.5,
    color: '#94A3B8',
  },
})

// רוחבי עמודות הטבלה — סכומם 100%. מוגדרים פעם אחת כדי שהכותרת והשורות לא יוכלו להיפרד.
const CELL_GAP = { paddingHorizontal: 5 }
const COLS = {
  sku: '13%',
  name: '27%',
  qty: '7%',
  color: '11%',
  notes: '18%',
  unit: '12%',
  total: '12%',
}

// ── מוקש 2: כיווניות ────────────────────────────────────────────────────────
// אלגוריתם ה-bidi מסדר **רצפי-תווים**, לא "אסימונים לוגיים". אסימון לטיני/מספרי מורכב
// ("18:00–22:00", "‎-315 ₪", "B-REG-TAG") שמשורשר לתוך מחרוזת עברית מתהפך: 18:00–22:00
// יודפס 22:00–18:00 — נכון תחבירית, שגוי עסקית. ‏<Text> מקונן עם direction:'ltr' **לא**
// מתקן את זה (נבדק), וגם לא תווי-הבידוד LRI/PDI — הם מודפסים כג'יבריש.
// מה שכן עובד: הערך יושב ב-<Text> **משלו** עם direction:'ltr'. לכן כל ערך לטיני/מספרי
// במסמך הזה עובר דרך <Ltr>, ולעולם לא משורשר לתווית עברית באותה מחרוזת.
function Ltr({ children, style }) {
  return <Text style={[{ direction: 'ltr' }, style]}>{children}</Text>
}

function Pair({ label, value, ltr }) {
  return (
    <View style={styles.pair}>
      <Text style={styles.pairKey}>{label}</Text>
      {ltr ? (
        <Ltr style={[styles.pairVal, { textAlign: 'right' }]}>{value}</Ltr>
      ) : (
        <Text style={styles.pairVal}>{value}</Text>
      )}
    </View>
  )
}

function TotalRow({ label, value, style }) {
  return (
    <View style={[styles.totalRow, style]}>
      <Text>{label}</Text>
      <Ltr>{value}</Ltr>
    </View>
  )
}

// dd/mm/yyyy — הפורמט של כל המערכת. Date או מחרוזת ISO; ריק ⇒ מקף, לא "Invalid Date".
export function formatDate(value) {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

// "18:00:00" מה-DB ⇒ "18:00". טווח מוצג רק כששני הקצוות קיימים.
export function formatTimeRange(start, end) {
  const trim = (t) => (typeof t === 'string' && t.length >= 5 ? t.slice(0, 5) : null)
  const a = trim(start)
  const b = trim(end)
  if (!a || !b) return null
  return `${a}–${b}`
}

// §7.12 + F15: התנאים הם טקסט קבוע, לא נתון. יושבים כאן ולא במסך כדי שלא יוכלו להשתנות
// בין מה שנראה על המסך לבין מה שהלקוח מקבל.
// הכרעת-ישי 29/07/2026 (בצ'אט, תוך-כדי צעד 3.1): במקום לדחוס הכול לעמוד אחד — עמוד 1 הוא
// ההצעה עצמה, ועמוד 2 הוא "תנאים כלליים" גנריים כמקובל בשוק. שני התנאים הראשונים הם
// מהטמפלט המקורי (quote_template_draft.docx); היתר נוסחו כאן והם placeholder עד ניסוח
// משפטי של החברה.
export const QUOTE_TERMS = [
  'המחירים כוללים את הציוד והשירותים המפורטים בהצעה זו בלבד.',
  'אישור הצעה זו מהווה חתימה על הסכם התקשרות מול REG-IN.',
  'ההצעה תקפה 30 יום ממועד הפקתה, אלא אם צוין אחרת.',
  'המחירים בשקלים חדשים; מע"מ מחושב בשורת הסיכום על פי השיעור בתוקף במועד ההפקה.',
  'תוספות ושינויים שיתבקשו לאחר האישור יתומחרו בנפרד ויעוגנו בעדכון בכתב.',
  'ביטול הזמנה לאחר אישורה כפוף לחיוב בגין עלויות שכבר הוצאו בפועל.',
  'אספקת השירותים מותנית בקבלת מלוא פרטי האירוע מהלקוח במועד סביר מראש.',
]

function LinesTable({ lines }) {
  return (
    <View>
      <View style={styles.th} fixed>
        <Text style={{ ...CELL_GAP, width: COLS.sku }}>קוד פריט</Text>
        <Text style={{ ...CELL_GAP, width: COLS.name }}>תיאור השירות</Text>
        <Text style={{ ...CELL_GAP, width: COLS.qty }}>כמות</Text>
        <Text style={{ ...CELL_GAP, width: COLS.color }}>צבע</Text>
        <Text style={{ ...CELL_GAP, width: COLS.notes }}>הערות</Text>
        <Text style={{ ...CELL_GAP, width: COLS.unit, textAlign: 'left' }}>מחיר יחידה</Text>
        <Text style={{ ...CELL_GAP, width: COLS.total, textAlign: 'left' }}>סה&quot;כ</Text>
      </View>
      {lines.map((line, i) => (
        <View key={line.sku ?? i} style={[styles.tr, i % 2 === 1 && styles.trAlt]} wrap={false}>
          <Ltr style={{ ...CELL_GAP, width: COLS.sku, textAlign: 'right', color: '#475569' }}>
            {line.sku ?? '—'}
          </Ltr>
          <Text style={{ ...CELL_GAP, width: COLS.name }}>{line.itemName ?? '—'}</Text>
          <Ltr style={{ ...CELL_GAP, width: COLS.qty, textAlign: 'right' }}>
            {String(line.qty ?? 0)}
          </Ltr>
          <Text style={{ ...CELL_GAP, width: COLS.color, color: line.color ? INK : '#94A3B8' }}>
            {line.color || NO_COLOR_LABEL}
          </Text>
          <Text style={{ ...CELL_GAP, width: COLS.notes, color: MUTED }}>{line.notes ?? ''}</Text>
          <Ltr style={{ ...CELL_GAP, width: COLS.unit, textAlign: 'left' }}>
            {formatShekelWhole(line.unitPrice)}
          </Ltr>
          <Ltr style={{ ...CELL_GAP, width: COLS.total, textAlign: 'left' }}>
            {formatShekelWhole(Number(line.qty ?? 0) * Number(line.unitPrice ?? 0))}
          </Ltr>
        </View>
      ))}
    </View>
  )
}

// ── מוקש 3: מע"מ חסר ────────────────────────────────────────────────────────
// ‏`quote?.vatRate ?? 0` היה כאן עד 31/07/2026, והוא **עקף את דוקטרינת "ריק אינו 0"** של
// ‏pricing.js: פרמטר `אחוז_מעמ` שנמחק מ-`params` (מסלול אמיתי — §7.84 קובע שהשורות נערכות
// ידנית ב-Table Editor) הפיק ללקוח משלם מסמך שכתוב בו `מע"מ (0%)` וסכום נמוך ב-~15%,
// **בלי שום שגיאה**. מסמך שגוי שנראה תקין גרוע ממסמך שלא הופק.
// המנוע מסרב, ולא המסך שמעליו, כי הוא נקודת-החנק היחידה: שלושת המסכים מגיעים אליו,
// ומודול 10 ירים אותו לשרת לשליחה אוטומטית — שם אין מסך שיגן.
export const MISSING_VAT_MESSAGE =
  'שיעור המע"מ אינו מוגדר בהגדרות המערכת — לא ניתן להפיק מסמך ללקוח. יש להוסיף את הפרמטר אחוז_מעמ בהגדרות המערכת.'

// קוד-שגיאה סינתטי כדי שהקורא יבחין בין "פרמטר חסר" (הודעה שאומרת מה לתקן) לבין כשל-הפקה
// כללי. אותה תבנית כמו `RLS_DENIED` ב-`02_customers/api.js`.
export const MISSING_VAT_CODE = 'MISSING_VAT'

// מבנה הקלט (ה-view-model שצעד 3.4 בונה מתוך ה-DB):
//   quoteId · issueDate · validUntil
//   customer { companyName, companyNumber, contactName, phone }
//   event    { name, date, location, startTime, endTime }
//   lines[]  { sku, itemName, qty, unitPrice, color, notes }
//   appliedCustomerDiscount · manualDiscount · vatRate · notes
// הסכומים **לא** מתקבלים מבחוץ אלא מחושבים כאן מ-pricing.js: אחרת ה-PDF יכול להציג
// סכום שונה מהמסך, וזה בדיוק המסמך שהלקוח חותם עליו.
export function buildQuoteDocument(quote) {
  // אותה פונקציית-אימות שמסך-הבנייה משתמש בה (`parseVatPercent`), כדי ששני המקומות
  // לא יוכלו לחלוק על השאלה "האם המע"מ ידוע": null = חסר / ריק / לא-מספר / מחוץ ל-0–100.
  const vatRate = parseVatPercent(quote?.vatRate)
  if (vatRate === null) {
    throw Object.assign(new Error(MISSING_VAT_MESSAGE), { code: MISSING_VAT_CODE })
  }

  const lines = quote?.lines ?? []
  const totals = computeQuoteTotals(
    lines.map((l) => ({ qty: l.qty, unitPrice: l.unitPrice })),
    quote?.appliedCustomerDiscount ?? 0,
    quote?.manualDiscount ?? 0,
    vatRate,
  )
  const customer = quote?.customer ?? {}
  const event = quote?.event ?? {}
  const timeRange = formatTimeRange(event.startTime, event.endTime)

  return (
    <Document title={`הצעת מחיר ${quote?.quoteId ?? ''}`} author="REG-IN" language="he">
      <Page size="A4" style={styles.page}>
        <View style={styles.head}>
          <Image src={regInLogo} style={styles.logo} />
          <View>
            <Text style={styles.docTitle}>הצעת מחיר ללקוח</Text>
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>מספר הצעה</Text>
                <Ltr>{String(quote?.quoteId ?? '—')}</Ltr>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>תאריך הפקה</Text>
                <Ltr>{formatDate(quote?.issueDate)}</Ltr>
              </View>
              <View style={[styles.metaRow, styles.metaRowLast]}>
                <Text style={styles.metaKey}>תוקף ההצעה עד</Text>
                <Ltr>{formatDate(quote?.validUntil)}</Ltr>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.rule} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטי הלקוח</Text>
          <View style={styles.pairs}>
            <Pair label="לכבוד" value={customer.companyName ?? '—'} />
            <Pair label={'ח"פ'} value={customer.companyNumber ?? '—'} ltr />
            <Pair label="איש קשר" value={customer.contactName ?? '—'} />
            <Pair label="טלפון" value={customer.phone ?? '—'} ltr />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטי הפרויקט</Text>
          <View style={styles.pairs}>
            <Pair label="הנדון" value={event.name ?? '—'} />
            <Pair label="תאריך האירוע" value={formatDate(event.date)} ltr />
            <Pair label="מיקום" value={event.location ?? '—'} />
            {timeRange && <Pair label="שעות" value={timeRange} ltr />}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פירוט שירותים ועלויות</Text>
          <LinesTable lines={lines} />
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>סיכום הצעת המחיר</Text>
          <View style={styles.totals}>
            <TotalRow label={'סה"כ לפני הנחה'} value={formatShekelWhole(totals.subtotal)} />
            {/* F10: שתי שורות הנחה נפרדות ולא אחת מאוחדת — הלקוח רואה מה מגיע לו כלקוח
                קבוע ומה ניתן לו נקודתית להצעה הזו. */}
            <TotalRow
              label={`הנחת לקוח (${quote?.appliedCustomerDiscount ?? 0}%)`}
              value={discountText(totals.subtotal, quote?.appliedCustomerDiscount)}
              style={styles.totalDiscount}
            />
            <TotalRow
              label={`הנחה נוספת (${quote?.manualDiscount ?? 0}%)`}
              value={discountText(totals.subtotal, quote?.manualDiscount)}
              style={styles.totalDiscount}
            />
            <TotalRow
              label={'סה"כ לפני מע"מ'}
              value={formatShekelWhole(totals.preVat)}
              style={styles.totalPreVat}
            />
            <TotalRow label={`מע"מ (${vatRate}%)`} value={formatShekelWhole(totals.vatAmount)} />
            <View style={styles.grand}>
              <Text>סה&quot;כ סופי לתשלום</Text>
              <Ltr>{formatShekelWhole(totals.total)}</Ltr>
            </View>
          </View>
        </View>

        {/* LOCAL-6 (הכרעת-ישי 23/07): בלוק ההערות **אחרי** מפל-הסכומים ולפני התנאים —
            כדי שזרימת-הכסף תיקרא ברצף: שורות ⟵ סכומים ⟵ הערות ⟵ תנאים. */}
        {quote?.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>הערות</Text>
            <Text style={styles.notesBox}>{quote.notes}</Text>
          </View>
        ) : null}

        {/* break: התנאים פותחים תמיד עמוד חדש (הכרעת-ישי 29/07) — עמוד 1 נשאר ההצעה
            העסקית לבדה, והתנאים לא נדחסים ולא שוברים אותה באמצע. */}
        <View style={styles.section} break>
          <Text style={styles.sectionTitle}>תנאים כלליים</Text>
          {QUOTE_TERMS.map((term) => (
            <View key={term} style={styles.term}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.termText}>{term}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Ltr>REG-IN · Events | Registration | Solutions</Ltr>
          <Text render={({ pageNumber, totalPages }) => `עמוד ${pageNumber} מתוך ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

// סכום ההנחה בפועל לשורת-התצוגה. מוצג עם מינוס מוביל כדי שהמפל ייקרא כחיסור.
function discountText(subtotal, percent) {
  const amount = (Number(subtotal ?? 0) * Number(percent ?? 0)) / 100
  return amount > 0 ? `-${formatShekelWhole(amount)}` : formatShekelWhole(0)
}

// ה-API היחיד שהמסכים צריכים: נתוני-הצעה ⇒ Blob להורדה/צירוף.
// ⏸️ `@public` הוא תג של knip: הייצוא נבנה ואומת בצעד 3.1, אבל הקורא שלו (כפתור
// "הפק PDF") נבנה בצעד 3.4 — בלי התג knip היה מסמן אותו כקוד-מת. התג ממוקד לייצוא
// הזה בלבד, כך שכל ייצוא אחר שימות בקובץ עדיין ייתפס.
// 🔁 הסרה: כשצעד 3.4 מחבר את הכפתור (docs/micro_guides/module-3.md).
/** @public */
export async function renderQuotePdfBlob(quote) {
  return pdf(buildQuoteDocument(quote)).toBlob()
}

// שם הקובץ שהלקוח יראה בתיבת-הדואר. אנגלית בכוונה: שם-קובץ עברי נשבר בחלק
// משרתי-הדואר ובחלק ממערכות-ההפעלה של הלקוחות.
export function quotePdfFileName(quoteId) {
  return `REG-IN-quote-${quoteId ?? 'draft'}.pdf`
}
