// בדיקות-היחידה של עיצוב-המספרים של מודול 11. הן קיימות בשביל דבר אחד: 📐4 ("דיוק אחיד")
// הוא כלל שאי-אפשר לראות שהופר — `60%` ו-`60.1%` שניהם נראים נכון, והפער מתגלה רק כששני
// דפים מציגים את אותו מדד אחרת. בדיקה היא המקום היחיד שבו ההפרה צועקת.

import { describe, it, expect } from 'vitest'
import {
  NO_VALUE,
  finiteNumber,
  formatAxisTick,
  formatByType,
  formatDelta,
  formatGini,
  formatIsraelDate,
  formatMoney,
  formatPercent,
  formatWindowLabel,
  isolateLtr,
} from '@/lib/reportsFormat'
import { toFiniteNumber } from '@/lib/pricing'

const LRI = '⁦'
const PDI = '⁩'

describe('formatMoney — 📐4: ₪ בלי אגורות', () => {
  it('מעגל לשקל שלם ומפריד אלפים', () => {
    expect(formatMoney(1250)).toBe(`${LRI}1,250 ₪${PDI}`)
    expect(formatMoney(1487575.4)).toBe(`${LRI}1,487,575 ₪${PDI}`)
  })

  it('חסר ⇒ מקף, לעולם לא 0 ₪', () => {
    expect(formatMoney(null)).toBe(NO_VALUE)
    expect(formatMoney(undefined)).toBe(NO_VALUE)
    // 🔴 אפס **שנמדד** הוא עובדה ומוצג כמספר — רק "אין נתון" מקבל מקף (S-2).
    expect(formatMoney(0)).toBe(`${LRI}0 ₪${PDI}`)
  })
})

// 🔴 **בדיקת-הרגרסיה של הפגם שנתפס בעין ב-16/09/2026, ולא באף שער.**
// הגרסה הראשונה של `formatMoney` החזירה מחרוזת חשופה, והמסך הציג **`₪ 46,400`** — הגליף
// משמאל לספרות — בטולטיפ-הגרף ובטבלת-קורא-המסך. ‏`npm run check:bidi` עבר ירוק (הוא סורק
// **קוד-מקור** ולא מחרוזת שנבנית בזמן-ריצה), וכל בדיקות-היחידה עברו ירוק.
// ⇒ הבדיקה הזו היא מה שהופך "ראיתי את זה בצילום" ל"זה לא יחזור".
describe('בידוד-כיווניות בפורמטרים — הרגרסיה של ₪ שנדד שמאלה', () => {
  it('כל פורמט שנושא גליף לא-עברי חוזר מבודד', () => {
    for (const [value, format] of [
      [1250, 'money'],
      [60.1, 'percent'],
      [1500, 'int'],
      [68, 'days'],
      [2.3, 'ratio'],
    ]) {
      const out = formatByType(value, format)
      expect(out.includes(LRI), `${format} אינו מבודד`).toBe(true)
      expect(out.includes(PDI), `${format} אינו נסגר`).toBe(true)
    }
  })

  // ⚠️ ג'יני הוא ספרות ונקודה בלבד — אין בו גליף נייטרלי שינדוד, ולכן הוא **לא** מבודד
  // בכוונה. בידוד מיותר מוסיף תווים בלתי-נראים למחרוזת שנכנסת גם לשמות-קבצים.
  it('ג׳יני אינו מבודד — אין בו מה שינדוד', () => {
    expect(formatGini(0.43)).toBe('0.43')
  })

  it('"אין נתון" אינו מבודד — מקף עברי אינו צריך בידוד', () => {
    expect(formatMoney(null)).toBe(NO_VALUE)
    expect(formatPercent(null)).toBe(NO_VALUE)
  })
})

describe('formatPercent — 📐4: ספרה עשרונית אחת, תמיד', () => {
  it('שלם מקבל אפס אחרי הנקודה ולא נחתך', () => {
    expect(formatPercent(60)).toBe(`${LRI}60.0%${PDI}`)
  })

  it('מעגל לספרה אחת', () => {
    expect(formatPercent(60.14)).toBe(`${LRI}60.1%${PDI}`)
    expect(formatPercent(60.16)).toBe(`${LRI}60.2%${PDI}`)
  })

  // 🔬 **נמדד 16/09/2026, לא הונח — והבדיקה הזו נכתבה קודם עם הציפייה ההפוכה ונפלה.**
  // ‏`60.15` אינו קיים ב-double: הערך המאוחסן הוא `60.1499999999999986`, ולכן `toFixed(1)`
  // מחזיר `60.1` ולא `60.2`. זו **התנהגות נכונה של המספר שנשמר**, לא באג עיגול.
  // ⚠️ הבדיקה קיימת כדי שמי שיראה `60.1%` על המסך על קלט `60.15` לא "יתקן" אותה לחצי-מעלה
  // ידני — תיקון כזה היה משנה את כל האחוזים במודול בגלל מקרה-קצה אחד שאינו שגוי.
  it('חצי-ספרה שאינו ניתן-לייצוג ב-double יורד, וזה מדוד', () => {
    expect((60.15).toFixed(20).startsWith('60.1499')).toBe(true)
    expect(formatPercent(60.15)).toBe(`${LRI}60.1%${PDI}`)
  })

  it('חסר ⇒ מקף, לא 0%', () => {
    expect(formatPercent(null)).toBe(NO_VALUE)
  })
})

describe('formatGini — 📐4: שתי ספרות', () => {
  // 🔑 העוגן: `spec.md §🔢 3.3` מתעד 0.4329 מול 0.4299 על אותה אוכלוסייה. אם השתיים לא
  // מרנדרות אותו דבר, המסך מציג פער-מדידה כאילו הוא ממצא.
  it('שתי המדידות המתועדות של אותו n מרנדרות זהה', () => {
    expect(formatGini(0.4329)).toBe('0.43')
    expect(formatGini(0.4299)).toBe('0.43')
  })

  it('חסר ⇒ מקף', () => {
    expect(formatGini(null)).toBe(NO_VALUE)
  })
})

// 🔴 **‏T1 (אודיט-הסגירה 17/09/2026, ממצא F-05) — בית אחד לאינווריאנט אחד.**
// ‏`finiteNumber` ישבה בשלושה עותקים (`reportsCustomers` · `reportsExecutive` ·
// ‏`reportsHostesses`), **ואחד מהם כבר סטה טקסטואלית** (‏executive גזר את המחרוזת לפני
// ההמרה, השניים האחרים בדקו את הערך והמירו ללא גזירה). ההתנהגות הייתה שקולה — ודווקא לכן
// זה מסוכן: שלושתם מקודדים **כלל אחד** (*"ערך שאינו מספר סופי הוא חוסר, לעולם לא אפס"*)
// והיו חייבים להשתנות יחד. הבדיקות כאן נועלות את מחלקות-הקלט שבהן הם היו יכולים להיפרד.
describe('finiteNumber — "לא נמדד" אינו אפס (T1: עותק אחד לשלושה צרכנים)', () => {
  it('ריק וחוסר ⇒ null, ולא 0', () => {
    expect(finiteNumber(null)).toBeNull()
    expect(finiteNumber(undefined)).toBeNull()
    expect(finiteNumber('')).toBeNull()
  })

  // 🪤 **מחלקת-הקלט שבה שלושת העותקים נכתבו אחרת** — ובדיוק זו שמפרידה אותם מ-
  // ‏`toFiniteNumber` של `pricing.js`, שהיה הבית המתבקש ו**אינו מתאים**: הוא פוסל `''`
  // בלבד, ולכן `Number('  ')` שלו הוא **0**. שורת-`params` שערכה רווחים היא שורה חסרה,
  // לא סף אפס — וזה ההבדל שבגללו הפונקציה הזו קיימת בנפרד.
  it('מחרוזת-רווחים היא חוסר, ולא סף אפס — וזה ההבדל מ-toFiniteNumber', () => {
    expect(finiteNumber('  ')).toBeNull()
    expect(toFiniteNumber('  ')).toBe(0)
  })

  it('מחרוזת-מספר עם רווחים משני הצדדים ⇒ המספר עצמו', () => {
    expect(finiteNumber(' 5 ')).toBe(5)
    expect(finiteNumber('0.87')).toBe(0.87)
    expect(finiteNumber(0)).toBe(0)
  })

  it('ערך שאינו מספר סופי ⇒ null', () => {
    expect(finiteNumber('אבג')).toBeNull()
    expect(finiteNumber(Number.POSITIVE_INFINITY)).toBeNull()
    expect(finiteNumber(Number.NaN)).toBeNull()
  })
})

describe('isolateLtr — בידוד-כיווניות למחרוזת שטוחה', () => {
  it('עוטף בתווי LRI…PDI', () => {
    expect(isolateLtr('1,250 ₪')).toBe(`${LRI}1,250 ₪${PDI}`)
  })

  it('ריק ⇒ ריק, בלי לעטוף כלום', () => {
    expect(isolateLtr('')).toBe('')
    expect(isolateLtr(null)).toBe('')
  })

  // 🔴 הבדיקה שהכלל נולד בשבילה: משפט עברי עם מספר בתוכו — המספר חייב לצאת מבודד, ולא
  // המשפט כולו. זו בדיוק ההמרה ש-`onboarding-layer-contract §5ב` מחייב בכל רמז.
  it('מספר בתוך משפט עברי יוצא מבודד והמשפט נשאר עברי', () => {
    const sentence = `הדוח סופר ${isolateLtr('215')} פרויקטים`
    expect(sentence).toBe(`הדוח סופר ${LRI}215${PDI} פרויקטים`)
    expect(sentence.startsWith('הדוח')).toBe(true)
  })
})

describe('formatDelta — 📐1: הסימן לפני הספרות, באותו בידוד', () => {
  it('חיובי נושא + ושלילי נושא - , שניהם בתוך בידוד אחד', () => {
    expect(formatDelta(12.4, 'percent')).toBe(`${LRI}+12.4%${PDI}`)
    expect(formatDelta(-3, 'percent')).toBe(`${LRI}-3.0%${PDI}`)
  })

  it('כסף נושא את אותו כלל-סימן', () => {
    expect(formatDelta(-1250, 'money')).toBe(`${LRI}-1,250 ₪${PDI}`)
  })

  // 📐1: "—" מותר רק כשאין שינוי — והאריח בלי בסיס-השוואה אינו נכנס לדף מלכתחילה.
  it('אפס-שינוי וחסר שניהם ⇒ מקף', () => {
    expect(formatDelta(0, 'percent')).toBe(NO_VALUE)
    expect(formatDelta(null, 'percent')).toBe(NO_VALUE)
  })

  // 🔴 הרגרסיה שהפונקציה נכתבה כדי למנוע: בידוד מקונן. `int` מבודד בעצמו, ואם הסימן היה
  // נעטף מבחוץ היו יוצאים שני זוגות תווים בלתי-נראים באותה מחרוזת.
  it('פורמט שמבודד בעצמו אינו מייצר בידוד כפול', () => {
    const out = formatDelta(1500, 'int')
    expect(out).toBe(`${LRI}+1,500${PDI}`)
    expect([...out].filter((c) => c === LRI)).toHaveLength(1)
  })
})

describe('formatByType — המיפוי שהחוזה (C8) מכריז עליו', () => {
  it('כל פורמט מוכר מגיע לפונקציה שלו', () => {
    expect(formatByType(1250, 'money')).toBe(`${LRI}1,250 ₪${PDI}`)
    expect(formatByType(60.14, 'percent')).toBe(`${LRI}60.1%${PDI}`)
    expect(formatByType(0.4299, 'gini')).toBe('0.43')
    expect(formatByType(1500, 'int')).toBe(`${LRI}1,500${PDI}`)
    expect(formatByType(68, 'days')).toBe(`${LRI}68${PDI} ימים`)
    expect(formatByType(2.35, 'ratio')).toBe(`${LRI}2.4${PDI}`)
    expect(formatByType('2026-09-16', 'date')).toBe('16/09/2026')
    expect(formatByType(0.8342, 'score')).toBe(`${LRI}0.834${PDI}`)
  })

  // 🔴 **המבחן שמפריד בין `score` ל-`ratio`, ולכן הוא הסיבה ששני הפורמטים קיימים:** שלוש
  // דיילות שציוניהן 0.834 · 0.871 · 0.902 מרנדרות **שלושה ערכים שונים** ב-`score`, ושני
  // ערכים בלבד ב-`ratio` — כלומר העמודה שהדוח ממוין לפיה הייתה מציגה שוויון שאינו קיים.
  it('score מבחין בין ציונים ש-ratio היה משטח, ו-ratio נשאר בספרה אחת', () => {
    const scores = [0.834, 0.871, 0.902]
    expect(new Set(scores.map((s) => formatByType(s, 'score'))).size).toBe(3)
    expect(new Set(scores.map((s) => formatByType(s, 'ratio'))).size).toBe(2)
    expect(formatByType(40.82, 'ratio')).toBe(`${LRI}40.8${PDI}`)
  })

  it('score חסר ⇒ מקף, ואינו 0.000', () => {
    expect(formatByType(null, 'score')).toBe(NO_VALUE)
    expect(formatByType(undefined, 'score')).toBe(NO_VALUE)
    expect(formatByType(0, 'score')).toBe(`${LRI}0.000${PDI}`)
  })

  // 🔑 פורמט שהשרת הוסיף והלקוח עוד לא מכיר — הערך מוצג גולמי, המסך לא נופל.
  it('פורמט לא-מוכר נופל ל-text ולא זורק', () => {
    expect(formatByType('ערך', 'somethingNew')).toBe('ערך')
    expect(formatByType(null, 'somethingNew')).toBe(NO_VALUE)
  })
})

describe('formatIsraelDate', () => {
  it('תאריך-בלבד מתורגם, וחותמת-זמן נדחית במכוון', () => {
    expect(formatIsraelDate('2026-09-16')).toBe('16/09/2026')
    // 🔴 `formatDate` דוחה חותמת כדי לא להציג את התאריך לפי UTC — התנהגות מוסכמת, לא באג.
    expect(formatIsraelDate('2026-09-16T20:33:42.432+00:00')).toBe(NO_VALUE)
    expect(formatIsraelDate(null)).toBe(NO_VALUE)
  })
})

describe('formatWindowLabel — 📐17: התקופה בכותרת-המשנה', () => {
  it('טווח מלא + לקוח, והטווח מבודד כערך אחד', () => {
    expect(
      formatWindowLabel({ from: '2026-01-01', to: '2026-09-06', customerName: 'אלפא סיסטמס בע"מ' }),
    ).toBe(`${LRI}01/01/2026–06/09/2026${PDI} · אלפא סיסטמס בע"מ`)
  })

  it('בלי לקוח ⇒ "כל הלקוחות"', () => {
    expect(formatWindowLabel({ from: '2026-01-01', to: '2026-09-06' })).toBe(
      `${LRI}01/01/2026–06/09/2026${PDI} · כל הלקוחות`,
    )
  })

  it('בלי טווח בכלל ⇒ רק הלקוח, בלי מקף מיותר', () => {
    expect(formatWindowLabel({})).toBe('כל הלקוחות')
  })
})

// 🔴 **תוויות-ציר — נמדד בדפדפן 16/09/2026 שבלי `tickFormatter` ‏Recharts מדפיס `600000`.**
// ⚠️ **ולמה זה לא `formatByType`:** אריח מציג ערך אחד, ציר מציג שישה זה מתחת לזה — ₪ שחוזר
// שש פעמים ו-`.0` שחוזר שש פעמים הם רעש, והיחידה כבר נאמרת בכותרת, במקרא ובטולטיפ.
describe('formatAxisTick — 📐4 על ציר', () => {
  it('כסף ⇒ מפריד-אלפים בלי הגליף ₪', () => {
    expect(formatAxisTick(600000, 'money')).toBe(`${LRI}600,000${PDI}`)
    expect(formatAxisTick(450000, 'money')).toBe(`${LRI}450,000${PDI}`)
  })

  it('אחוז ⇒ הסימן נשאר, והאפס העשרוני יורד', () => {
    expect(formatAxisTick(50, 'percent')).toBe(`${LRI}50%${PDI}`)
    expect(formatAxisTick(12.46, 'percent')).toBe(`${LRI}12.5%${PDI}`)
  })

  it('מונה ⇒ מפריד-אלפים', () => {
    expect(formatAxisTick(1200, 'int')).toBe(`${LRI}1,200${PDI}`)
  })

  // ג'יני/יחס/ציון חיים בטווח קטן — עיגול-לשלם היה מוחק את כל ההבחנה על הציר.
  it('מדד-גיני ויחס שומרים ספרות עשרוניות', () => {
    expect(formatAxisTick(0.43, 'gini')).toBe(`${LRI}0.43${PDI}`)
    expect(formatAxisTick(4.75, 'ratio')).toBe(`${LRI}4.8${PDI}`)
  })

  // 🚫 מקף על ציר נקרא כערך שנמדד — ולכן ערך חסר מחזיר מחרוזת ריקה ולא `—`.
  it('ערך חסר ⇒ ריק, לא מקף', () => {
    expect(formatAxisTick(null, 'money')).toBe('')
    expect(formatAxisTick(undefined, 'int')).toBe('')
    expect(formatAxisTick(null, 'money')).not.toBe(NO_VALUE)
  })

  it('תווית-קטגוריה ופורמט לא-מוכר עוברים כמות-שהם, בלי עיגול ובלי בידוד', () => {
    expect(formatAxisTick('ינואר', 'text')).toBe('ינואר')
    expect(formatAxisTick('2026-09-16', 'date')).toBe('2026-09-16')
    expect(formatAxisTick('ינואר')).toBe('ינואר')
  })
})

// ✏️ `textLtr` — טקסט שאינו עברית ושסדרו הפנימי חייב להישמר (16/09/2026).
// 🔴 **הפגם:** תא `format:'text'` שערכו טווח-ספרות (`1–30`) מרונדר **הפוך** ב-`<td>` של דף
// RTL — המקף הוא תו נייטרלי בין שני רצפי-ספרות, והמסך הציג `30–1`.
describe('formatByType — textLtr', () => {
  it('טווח-ספרות מבודד כיחידה אחת', () => {
    expect(formatByType('1–30', 'textLtr')).toBe(`${LRI}1–30${PDI}`)
    expect(formatByType('90+', 'textLtr')).toBe(`${LRI}90+${PDI}`)
  })

  it('חסר ⇒ מקף, כמו כל פורמט אחר', () => {
    expect(formatByType(null, 'textLtr')).toBe(NO_VALUE)
    expect(formatByType('', 'textLtr')).toBe(NO_VALUE)
  })

  // 🚫 `text` רגיל **אינו** מבודד — שם עברי אינו זקוק לכך, ובידוד מיותר עליו הוא רעש.
  it('text רגיל נשאר חשוף', () => {
    expect(formatByType('1–30', 'text')).toBe('1–30')
    expect(formatByType('אלפא סיסטמס', 'text')).toBe('אלפא סיסטמס')
  })
})

// ✏️ **`id` — מזהה ולא כמות** (פריט [2] של סבב-הראיות, 17/09/2026). נמדד על המסך:
// עמודת *"הצעה"* של מ4 הציגה `1,907` כי ה-RPC הכריז `format:'int'`.
describe('formatByType — id: מזהה בלי מפריד-אלפים', () => {
  it('מספר-הצעה נשאר רצף-ספרות, ובכל זאת מבודד', () => {
    expect(formatByType(1907, 'id')).toBe(`${LRI}1907${PDI}`)
    expect(formatByType(1416, 'id')).toBe(`${LRI}1416${PDI}`)
  })

  // 🔴 המבחן שמפריד בין `id` ל-`int`, והוא הסיבה ששני הפורמטים קיימים.
  it('אותו ערך ב-int נושא פסיק — וזה בדיוק הפגם', () => {
    expect(formatByType(1907, 'int')).toBe(`${LRI}1,907${PDI}`)
    expect(formatByType(1907, 'id')).not.toBe(formatByType(1907, 'int'))
  })

  it('מזהה שאינו מספר אינו נמחק ל-"—"', () => {
    expect(formatByType('Q-1907', 'id')).toBe(`${LRI}Q-1907${PDI}`)
  })

  it('חסר ⇒ מקף', () => {
    expect(formatByType(null, 'id')).toBe(NO_VALUE)
    expect(formatByType('', 'id')).toBe(NO_VALUE)
  })
})

// ✏️ **כ12 · UC37 — התאמת-מספר בעברית** (פריט C2 של הערכת-הניסוח): המסך הציג "⁦1⁩ ימים".
describe('formatByType — days: יחיד ורבים', () => {
  it('‏1 ⇒ "יום", והשאר ⇒ "ימים"', () => {
    expect(formatByType(1, 'days')).toBe(`${LRI}1${PDI} יום`)
    expect(formatByType(0, 'days')).toBe(`${LRI}0${PDI} ימים`)
    expect(formatByType(2, 'days')).toBe(`${LRI}2${PDI} ימים`)
    expect(formatByType(580, 'days')).toBe(`${LRI}580${PDI} ימים`)
  })

  // ⚠️ העיגול קודם להתאמה: `0.6` הוא "יום אחד" על המסך, ולכן גם ביחיד.
  it('הצורה נגזרת מהערך המעוגל, לא מהגולמי', () => {
    expect(formatByType(1.4, 'days')).toBe(`${LRI}1${PDI} יום`)
  })
})

// ✏️ פריטים [3] · [8] · [27] · [28] — הכותרת מצהירה מה שנמדד, ולא מה שנבחר בגלולה.
describe('formatWindowLabel — תווית-השרת, נוסח-הגלולה והשמטת-הלקוח', () => {
  it('תווית-שרת גוברת על הטווח שנגזר מהגלולה', () => {
    expect(
      formatWindowLabel({ from: '2026-01-01', to: '2026-09-16', surfaceLabel: 'כל הזמנים' }),
    ).toBe('כל הזמנים · כל הלקוחות')
  })

  // 🔑 תווית-שרת שכבר נוקבת בלקוח (מ4/מ6) אינה מקבלת אותו פעם שנייה.
  it('הלקוח אינו נאמר פעמיים', () => {
    expect(
      formatWindowLabel({ surfaceLabel: 'כל הזמנים · בטא הפקות', customerName: 'בטא הפקות' }),
    ).toBe('כל הזמנים · בטא הפקות')
  })

  it('תווית-שרת בלי לקוח (מ3) מקבלת את חלק-הלקוח מהמעטפת', () => {
    expect(formatWindowLabel({ surfaceLabel: '2024–2026', customerName: 'בטא הפקות' })).toBe(
      '2024–2026 · בטא הפקות',
    )
  })

  it('בלי טווח ובלי תווית-שרת ⇒ נוסח-הגלולה, ולא אוכלוסייה בלי תאריך', () => {
    expect(formatWindowLabel({ periodLabel: '12 חודשים' })).toBe('12 חודשים · כל הלקוחות')
  })

  // ⚠️ הטווח, כשהוא ידוע, עדיין גובר על נוסח-הגלולה.
  it('טווח ידוע גובר על נוסח-הגלולה', () => {
    expect(
      formatWindowLabel({ from: '2026-01-01', to: '2026-09-06', periodLabel: '12 חודשים' }),
    ).toBe(`${LRI}01/01/2026–06/09/2026${PDI} · כל הלקוחות`)
  })

  // 🔴 משטח שמצהיר `customer_filter_ignored` אינו מהדהד לקוח שאינו מסנן דבר.
  it('hideCustomer ⇒ אין חלק-לקוח בכלל', () => {
    expect(
      formatWindowLabel({
        from: '2026-01-01',
        to: '2026-09-06',
        customerName: 'בטא הפקות',
        hideCustomer: true,
      }),
    ).toBe(`${LRI}01/01/2026–06/09/2026${PDI}`)
    expect(formatWindowLabel({ surfaceLabel: 'נכון להיום', hideCustomer: true })).toBe('נכון להיום')
  })
})
