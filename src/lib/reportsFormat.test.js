// בדיקות-היחידה של עיצוב-המספרים של מודול 11. הן קיימות בשביל דבר אחד: 📐4 ("דיוק אחיד")
// הוא כלל שאי-אפשר לראות שהופר — `60%` ו-`60.1%` שניהם נראים נכון, והפער מתגלה רק כששני
// דפים מציגים את אותו מדד אחרת. בדיקה היא המקום היחיד שבו ההפרה צועקת.

import { describe, it, expect } from 'vitest'
import {
  NO_VALUE,
  formatByType,
  formatDelta,
  formatGini,
  formatIsraelDate,
  formatMoney,
  formatPercent,
  formatWindowLabel,
  isolateLtr,
} from '@/lib/reportsFormat'

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
