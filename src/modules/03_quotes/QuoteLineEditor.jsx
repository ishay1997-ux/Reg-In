// טבלת מפרט השירותים במסך בניית ההצעה.
//
// ⚠️ המחיר ליחידה **אינו נערך** (הכרעת-ישי 29/07/2026): כל מטרת המודול לפי האפיון היא
// "אחידות מחירים בארגון". מי שרוצה להוזיל משתמש בהנחה הידנית — שנשמרת ומדווחת — במקום
// לדרוס מחיר-שורה, שינוי שנעלם מכל מעקב עתידי. המחיר נגזר מהמדרגה לפי הכמות (pricing.js),
// והמסך רק **מציג** אותו; אין כאן חישוב-מחיר עצמאי (כלל 14).

import { Plus, Trash2 } from 'lucide-react'
import { computeLineTotal, findMatchingTier, resolveUnitPrice } from '@/lib/pricing'
import { isColorApplicable } from '@/lib/quotes'
import { LINE_COLORS, NO_COLOR_LABEL, PRODUCT_CATEGORY_LABELS } from '@/lib/catalog'
import Money from '@/components/Money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// SelectItem עם value="" נזרק ע"י Radix — מחרוזת-סנטינל שממופה בחזרה ל-'' (מוסכמת src/CLAUDE.md).
const NO_COLOR_VALUE = '__none__'

// עיגול-צבע קטן לצד שם-הצבע. הצבעים תואמים ל-CHECK quote_services_color_check.
const COLOR_SWATCH = {
  לבן: '#FFFFFF',
  שחור: '#0F172A',
  אפור: '#64748B',
  טורקיז: '#0D9488',
  כחול: '#1D4ED8',
}

export default function QuoteLineEditor({ lines, products, tiers, onChange, disabled, error }) {
  // §7.34 (הכרעת-ישי 12/07): מוצר שאינו `active` **אינו אופציה** בבורר. הסינון חי כאן ולא
  // בשאילתה (הועבר 31/07/2026, סבב D) — הקטלוג מביא הכול כדי שמוצר מושבת שכבר יושב על
  // שורה קיימת ימשיך להיפתר לשם/קטגוריה/מחיר, ורק ההוספה-מחדש חסומה.
  //
  // ⚠️ **הרשימה נגזרת פר-שורה, ולא פעם אחת לכל הטבלה** (תוקן 31/07/2026, אותו סבב, אחרי
  // שצילום של הרשימה-הפתוחה חשף את הפער). החריג היחיד הוא **המק"ט של השורה עצמה**: הוא
  // חייב להישאר ברשימה כי Radix מרנדר את ה-trigger מהפריט התואם, וסינונו היה מציג
  // "בחירת מוצר..." ריק — כלומר מוחק ויזואלית מוצר ששמור במסד. ⛔ **לא לחשב פעם אחת מחוץ
  // ללולאה עם קבוצת כל המק"טים שבשימוש** — זה מה שהיה כאן, והוא חשף את המוצר המושבת
  // **בכל** שורה, כולל שורה חדשה. זה בדיוק מה שהכרעת-12/07 אוסרת.
  function productGroupsFor(currentSku) {
    return ['hostess', 'site', 'product'].map((category) => ({
      category,
      label: PRODUCT_CATEGORY_LABELS[category],
      items: products.filter(
        (p) => p.category === category && (p.status === 'active' || p.sku === currentSku),
      ),
    }))
  }

  function updateLine(key, patch) {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  // בחירת מוצר / שינוי כמות מחייבים תמחור-מחדש: המדרגה נקבעת לפי הכמות, ולכן 200→201
  // יחידות משנה את המחיר. המחיר מגיע תמיד מ-pricing.js, לעולם לא מחושב כאן.
  //
  // ⚠️ **מוצר שלא נמצא בקטלוג אינו מאפס את השורה** (תוקן 31/07/2026, סבב D). קודם עמד כאן
  // ‏`product ? resolveUnitPrice(...) : 0` ו-`product?.category ?? null`, ולכן מק"ט שלא נפתר
  // הפיל את השורה ל-**0 ₪ בשקט** ומחק את הקטגוריה (⇒ ספירת-הדיילות 0 ⇒ שמירה חסומה בהודעה
  // שאי-אפשר לפעול לפיה). היום הקטלוג כולל גם מושבתים, ולכן המסלול הזה נדיר — אבל הוא עדיין
  // אפשרי (מק"ט שנמחק מהמסד), ו**מחיר-אפס שנשמר בשקט הוא בדיוק הכשל שהמודול הזה בנוי למנוע**.
  // הנפילה-לאחור: שומרים על ערכי-השורה הקיימים. ⛔ לא להחזיר `: 0`.
  function repriceLine(line, patch) {
    const nextSku = patch.sku ?? line.sku
    const nextQty = patch.qty ?? line.qty
    const product = products.find((p) => p.sku === nextSku)
    if (!product) {
      return { ...patch, itemName: line.itemName ?? '', category: line.category ?? null }
    }
    return {
      ...patch,
      itemName: product.item_name ?? '',
      category: product.category ?? null,
      unitCost: Number(product.cost ?? 0),
      unitPrice: resolveUnitPrice(product, tiers, nextQty),
      // מוצר שאין לו צבע (דיילות/אתר) — מנקים צבע שנבחר קודם, אחרת הוא היה נשמר בשקט.
      color: isColorApplicable(product) ? (patch.color ?? line.color) : '',
    }
  }

  function addLine() {
    onChange([
      ...lines,
      {
        key: `new-${lines.length}-${Date.now()}`,
        sku: '',
        qty: 1,
        unitPrice: 0,
        unitCost: 0,
        color: '',
        notes: '',
      },
    ])
  }

  function removeLine(key) {
    onChange(lines.filter((line) => line.key !== key))
  }

  return (
    <div>
      <div className="overflow-x-auto">
        {/* min-w מכויל כך שהטבלה נכנסת לצד פאנל-הסיכום במסך 1280 בלי גלילה אופקית של העמוד
            (נמדד). רחב מזה — "סה"כ שורה" נדחק אל מחוץ לתצוגה, וזו העמודה שבשבילה פותחים את המסך. */}
        <table
          className="w-full min-w-[40rem] border-collapse text-right text-sm"
          data-testid="quote-lines-table"
        >
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th className="w-[30%] py-2 font-medium">שירות / מוצר</th>
              <th className="w-[13%] py-2 font-medium">צבע</th>
              <th className="w-[10%] py-2 text-left font-medium">כמות</th>
              <th className="w-[14%] py-2 text-left font-medium">מחיר ליחידה</th>
              <th className="w-[14%] px-2 py-2 text-left font-medium">{'סה"כ שורה'}</th>
              {/* px-2 בכותרות: בלעדיו הכותרת המיושרת-שמאלה של "סה"כ שורה" נדבקת לכותרת
                  "הערה" המיושרת-ימינה שלצידה, והשתיים נקראות כמילה אחת. */}
              <th className="w-[15%] px-2 py-2 font-medium">הערה</th>
              <th className="w-[4%] py-2">
                <span className="sr-only">פעולות</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const product = products.find((p) => p.sku === line.sku)
              const tier = product ? findMatchingTier(product, tiers, line.qty) : null
              const colorAllowed = isColorApplicable(product)
              return (
                <tr key={line.key} className="border-b border-slate-100">
                  <td className="py-2 pl-2">
                    <Select
                      value={line.sku || undefined}
                      disabled={disabled}
                      onValueChange={(sku) => updateLine(line.key, repriceLine(line, { sku }))}
                    >
                      <SelectTrigger
                        dir="rtl"
                        className="h-9 w-full rounded-lg border-slate-300"
                        data-testid={`quote-line-product-${line.key}`}
                      >
                        <SelectValue placeholder="בחירת מוצר..." />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        {productGroupsFor(line.sku).map((group) =>
                          group.items.length === 0 ? null : (
                            <div key={group.category}>
                              <p className="bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                                {group.label}
                              </p>
                              {/* ⚠️ **בלי סיומת "(מושבת)" על הפריט** (מעבר-המלאי, `src/CLAUDE.md`):
                                  ‏Radix מרנדר את תוכן-הפריט גם ב-trigger הסגור, ולכן היא הייתה
                                  אומרת בדיוק את מה שהתג שמתחת כבר אומר — ובנוסף מייצרת
                                  "שירותי דיילת (4 שעות) (מושבת)", שני זוגות-סוגריים ברצף. */}
                              {group.items.map((p) => (
                                <SelectItem key={p.sku} value={p.sku}>
                                  {p.item_name}
                                </SelectItem>
                              ))}
                            </div>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    {/* המק"ט אינו מוצג (הכרעת-ישי 29/07): הוא קוד-מלאי פנימי שאינו אומר דבר
                        למי שבונה הצעה. הוא כן מודפס ב-PDF ללקוח, שם הוא חלק ממסמך רשמי. */}
                    {/* מוצר שהושבת אחרי שכבר נכנס להצעה (§7.34, הכרעת-ישי 31/07): מסמנים
                        וממשיכים — המחיר השמור נשמר וההצעה ניתנת לשמירה. הכיתוב מסביר למה
                        המוצר לא יופיע בהצעה הבאה, אחרת ההיעלמות הזו נראית כתקלה.
                        amber = אותו גוון-רמז של "האירוע נמשך אל תוך הלילה" במסך הזה (כלל 8). */}
                    {product && product.status !== 'active' && (
                      <span
                        className="mt-1 inline-block rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700"
                        data-testid={`quote-line-inactive-${line.key}`}
                      >
                        מוצר מושבת — לא יוצע בהצעות חדשות
                      </span>
                    )}
                  </td>

                  <td className="py-2 pl-2">
                    {colorAllowed ? (
                      <Select
                        value={line.color || NO_COLOR_VALUE}
                        disabled={disabled}
                        onValueChange={(value) =>
                          updateLine(line.key, { color: value === NO_COLOR_VALUE ? '' : value })
                        }
                      >
                        <SelectTrigger
                          dir="rtl"
                          className="h-9 w-full rounded-lg border-slate-300"
                          data-testid={`quote-line-color-${line.key}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          <SelectItem value={NO_COLOR_VALUE}>{NO_COLOR_LABEL}</SelectItem>
                          {LINE_COLORS.map((color) => (
                            <SelectItem key={color} value={color}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="inline-block size-3 rounded-full border border-slate-300"
                                  style={{ backgroundColor: COLOR_SWATCH[color] }}
                                />
                                {color}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      // הכרעת-ישי: צבע רק לתגים ולשרוכים. שדה ריק ולא פקד מושבת — פקד שאי-אפשר
                      // להפעיל הוא רעש שמזמין לחיצות מיותרות.
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="py-2 pl-2 text-left">
                    <Input
                      type="number"
                      min="1"
                      value={line.qty}
                      disabled={disabled}
                      onChange={(e) =>
                        updateLine(line.key, repriceLine(line, { qty: Number(e.target.value) }))
                      }
                      // ר' ההסבר ב-LtrFieldGroup: השדה נטען עם 1, ובלי בחירה-בכניסה כל
                      // הקלדה מחייבת קודם מחיקה ידנית.
                      onFocus={(e) => e.target.select()}
                      className="h-9 w-16 rounded-lg border-slate-300 text-left [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label="כמות"
                      data-testid={`quote-line-qty-${line.key}`}
                    />
                  </td>

                  <td className="py-2 pl-2 text-left text-slate-700">
                    <Money amount={line.unitPrice} />
                    {/* המדרגה מוצגת **רק כשהיא הוזילה בפועל** את המחיר (הכרעת-ישי 29/07):
                        במדרגה הראשונה המחיר זהה למחיר-הבסיס והכיתוב הוא רעש; כשהכמות הורידה
                        את המחיר, בלעדיו המשתמש רואה מספר שאינו תואם למחירון וחושב שיש תקלה.
                        טווח-המספרים ב-<span dir="ltr"> נפרד מהמילה העברית, אחרת הוא מתהפך. */}
                    {tier && Number(line.unitPrice) < Number(product?.base_price) && (
                      <span className="block whitespace-nowrap text-xs text-slate-400">
                        מדרגה{' '}
                        <span dir="ltr">
                          {tier.min_qty}–{tier.max_qty ?? '∞'}
                        </span>
                      </span>
                    )}
                  </td>

                  <td className="py-2 pl-2 text-left font-semibold text-slate-800">
                    <Money amount={computeLineTotal(line.qty, line.unitPrice)} />
                  </td>

                  <td className="py-2 pl-2">
                    <Input
                      value={line.notes ?? ''}
                      disabled={disabled}
                      onChange={(e) => updateLine(line.key, { notes: e.target.value })}
                      className="h-9 rounded-lg border-slate-300 text-right"
                      aria-label="הערה לשורה"
                      data-testid={`quote-line-notes-${line.key}`}
                    />
                  </td>

                  <td className="py-2 text-center">
                    {!disabled && (
                      // אזור-לחיצה מורחב (size-8) סביב אייקון בגודל התקני size-4 — נגישות
                      // בלי לחרוג מהאחידות הוויזואלית של שאר האייקונים במערכת.
                      <Button
                        type="button"
                        variant="link"
                        title="הסרת פריט"
                        aria-label={`הסרת פריט: ${line.itemName || 'ללא מוצר'}`}
                        onClick={() => removeLine(line.key)}
                        className="h-auto p-0"
                        data-testid={`quote-line-remove-${line.key}`}
                      >
                        <span className="inline-flex size-8 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50">
                          <Trash2 className="size-4" />
                        </span>
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {lines.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-500" data-testid="quote-lines-empty">
          עדיין לא נוספו פריטים להצעה.
        </p>
      )}

      <div className={cn('mt-3 flex items-center gap-3', error && 'flex-col items-start gap-2')}>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            onClick={addLine}
            className="h-auto gap-2 rounded-lg border-slate-300 px-4 py-2 text-slate-700"
            data-testid="quote-line-add"
          >
            <Plus className="size-4" />
            הוספת פריט
          </Button>
        )}
        {error && (
          <p className="text-sm font-medium text-red-600" data-testid="quote-lines-error">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
