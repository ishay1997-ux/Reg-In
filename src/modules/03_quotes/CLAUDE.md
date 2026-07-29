<div dir="rtl">

# מודול 3 — הצעות מחיר · מוקשים

> 🔨 **מודול בבנייה — Phase 2 (לוגיקה עסקית).** המוסכמות הכלליות: `src/CLAUDE.md`. כאן רק מה
> שייחודי למודול הזה. היסטוריית הבנייה: `docs/micro_guides/module-3.md`.
> ⚠️ הקובץ הזה עדיין חלקי במכוון — הוא גדל עם כל צעד (כלל ברזל 15). היום מתועד רק מה שקיים:
> `src/lib/pricing.js` · `src/lib/catalog.js` · `validators.js` (תוספת) · `api.js` (הקובץ הזה)
> ‏· `01_auth/pricesApi.js`. אין עדיין מסכים — Phase 3.

- **`createQuote`/`saveQuoteEdit` הן עטיפות דקות סביב RPCs, לא כתיבות ישירות** — `create_quote`/
  ‏`replace_quote_lines` (מיגרציה `20260723115000`, F17). ה-`header`/`lines` שנשלחים הם `jsonb`
  שנקרא בשרת עם `->>'key'` — **מפתח שגוי בעצם ה-object לא נכשל בזמן-קריאה**: הוא הופך ל-`NULL`
  בשרת. עבור עמודות `NOT NULL` (כמו `customer_id`) זה מתפוצץ ב-INSERT (רועש, נתפס). עבור עמודות
  עם `coalesce(...,0)` (כמו `manual_discount`) **מפתח מוקלד-לא-נכון הופך בשקט ל-0**, לא לשגיאה.
  שמות-המפתחות המדויקים חייבים להישאר תואמים למיגרציה בית-בבית: `customer_id, event_name,
  recommended_hostess_count, estimated_guests, estimated_event_date, estimated_location,
  estimated_start_time, estimated_end_time, applied_customer_discount, manual_discount, notes`
  (header) ו-`sku, qty, closing_unit_price, color, notes` (כל אובייקט ב-lines).
- **`line_number` ו-`closing_unit_cost` נקבעים בשרת ולא נשלחים מהלקוח** — ה-RPC ממספר לפי סדר
  ה-array (`with ordinality`) ומקפיא עלות מ-`products.cost` באותו רגע. שליחת שדות האלה מה-UI
  היא no-op (השרת מתעלם מהם).
- **`rejectQuote` הוא היחיד שכותב ישירות ל-`quotes.update()`, לא דרך RPC** — מותר כי טריגר-הנעילה
  (§7.50) מתיר UPDATE כל עוד ה-status **הישן** הוא `in_progress`, וזה בדיוק התנאי היחיד שממנו
  מותר לדחות. שינוי סטטוס אחר (למשל "לבטל דחייה") **לא** יעבוד באותה צורה — ינחת על טריגר-הנעילה.
- **`getPricingCatalog()` מחזיר מוצרים `status='active'` בלבד** (§7.34) — לא את כל 11 המוצרים.
  מסך "מחירים" (`pricesApi.listProducts()`) הוא זה שמחזיר את כולם, כולל לא-פעילים.
- **⚠️ `listQuotes()` היא בלי פרמטר-סינון — מסננים בצד-הלקוח.** הבלופרינט הבטיח `listQuotes(filters)`;
  הקוד מחקה את מודול 2 (`listCustomers()` + `matchesCustomerFilters`) ומביא את כל מה שה-RLS מתיר.
  **מסך-הניהול (צעד 3.3) חייב לסנן/למיין בתצוגה** — הטאבים, המונים, ותגית "פג בקרוב" כולם צד-לקוח.
  ‏🔁 הקריאה מושכת גם `quote_services(*)` לכל שורה, והצעות **נצברות** (בשונה מלקוחות) — זה המקום
  הראשון שיצטרך סינון-בשאילתה אם הטבלה תגדל. הסטייה מתועדת ב-`module-3.md` §9 (29/07).
- **‏`src/lib/pricing.js` הוא מקור-האמת היחיד לחישוב** — `api.js` **לא** מחשב סכומים; שורות
  שמגיעות מה-DB (`closing_unit_price`) ממופות לצורת `{qty, unitPrice}` בצד-הקורא (UI, Phase 3),
  לא כאן. F26: אין כאן ואף לא ב-`pricing.js` שום סמנטיקת-זמן ("משמרת"/"שעה").
- **⏸️ פטור-knip זמני** על `api.js` (וגם `01_auth/pricesApi.js`) — `knip.jsonc`, עד שמסכי-Phase 3
  יובאו אותם. הסרה: כשצעדים 3.2/3.3/3.6 מחברים בפועל (ר' הערה מלאה בקובץ `knip.jsonc` עצמו).

</div>
