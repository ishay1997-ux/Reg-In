// תוויות-תצוגה ורשימות-קבועות לקטלוג של מודול 3 (products/price_tiers/quote_services).
// כל רשימה כאן היא העתק מודע של אילוץ-CHECK מקביל ב-DB — לא המצאה. לוגיקת-מחיר (מדרגות,
// חישוב) חיה ב-src/lib/pricing.js (LOCAL-3) — הקובץ הזה עוסק אך ורק בתרגום-לעברית ובקבועים.

// products.category — מיפוי ל-CHECK products_category_check.
export const PRODUCT_CATEGORY_LABELS = {
  site: 'אתר',
  hostess: 'דיילות',
  product: 'מוצרים',
}

// products.status — מיפוי ל-CHECK products_status_check.
export const PRODUCT_STATUS_LABELS = {
  active: 'פעיל',
  out_of_stock: 'אזל מהמלאי',
  inactive: 'לא פעיל',
}

// products.unit — הערכים כבר בעברית ב-DB (זהה ל-CHECK products_unit_check בית-בבית),
// אין כאן תרגום — רק רשימה סגורה לתפריט-בחירה במסך "מחירים".
export const PRODUCT_UNITS = ['יחידה', 'פרויקט', 'משמרת', 'מטר']

// quote_services.color — מיפוי ל-CHECK quote_services_color_check (§7.41). ה-DB מתיר גם
// NULL ("ללא צבע") — NO_COLOR_LABEL מייצג את זה ב-UI ואינו חלק מרשימת-הערכים החוקיים.
export const LINE_COLORS = ['לבן', 'שחור', 'אפור', 'טורקיז', 'כחול']
export const NO_COLOR_LABEL = 'ללא'
