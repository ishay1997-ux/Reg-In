import { describe, it, expect } from 'vitest'
import {
  MAX_GEOCODE_ATTEMPTS,
  buildHostessAddress,
  buildGeocodeCandidates,
  localityMatchesAddress,
  parseGeocodeResult,
} from './geocode'

// 🎯 כל המקרים כאן נלקחו **ממדידה חיה מול Nominatim ב-09/08/2026**, לא מהדמיון.
// המדידות שמאחורי הבדיקות (`countrycodes=il`, ‏limit=1):
//   ‏`דיזנגוף 100, תל אביב`        → 32.079249 / 34.774114 · city `תל־אביב–יפו`   ✅ מספר-בית
//   ‏`הרצל 50, ראשון לציון`         → 31.966833 / 34.802602                        ✅ מספר-בית
//   ‏`אקספו תל אביב`                → 32.105414 / 34.808422 · city `תל־אביב–יפו`   ✅ מרכז-הכנסים
//   ‏`ירושלים`                      → 31.778847 / 35.225786 · city `ירושלים | القدس`
//   🔴 `אקספו תל אביב, ביתן 2`      → **ריק** (הכתובת האמיתית של פרויקט 8)
//   🔴 `מרכז הכנסים, ירושלים`       → **ריק** (הכתובת האמיתית של פרויקט 3)
//   🔴🔴 `מרכז הכנסים` לבדו          → **אשקלון** — 62 ק"מ מהתשובה הנכונה
//   🔴🔴 `הרצל 50` לבדו              → **נתניה**  — ולא ראשון לציון
// שתי השורות האחרונות הן הסיבה שקיים שומר-היישוב בכלל.

describe('buildHostessAddress', () => {
  it('מחבר כתובת ועיר — והעיר אחרונה, כי היא העוגן של השרשרת', () => {
    expect(buildHostessAddress({ address: 'הרצל 50', city: 'ראשון לציון' })).toBe(
      'הרצל 50, ראשון לציון',
    )
  })

  it('דיילת בלי כתובת מקבלת את העיר לבדה — `city` הוא NOT NULL במסד, ולכן תמיד יש עוגן', () => {
    expect(buildHostessAddress({ address: null, city: 'חולון' })).toBe('חולון')
    expect(buildHostessAddress({ address: '   ', city: 'חולון' })).toBe('חולון')
  })

  it('בלי עיר אין מה לחפש', () => {
    expect(buildHostessAddress({ address: 'הרצל 50', city: '' })).toBe('')
    expect(buildHostessAddress(null)).toBe('')
  })
})

describe('buildGeocodeCandidates', () => {
  // 🔴 הסדר הוא **מהסוף להתחלה** ולא להפך, וזו הכרעה שנולדה ממדידה:
  // הקטע האחרון בכתובת עברית הוא בדרך-כלל היישוב, והוא הניחוש הבטוח.
  it('מנסה קודם את הכתובת המלאה, ואז את הקטעים מהאחרון לראשון', () => {
    expect(buildGeocodeCandidates('מרכז הכנסים, ירושלים')).toEqual([
      'מרכז הכנסים, ירושלים',
      'ירושלים',
      'מרכז הכנסים',
    ])
  })

  it('הכתובת האמיתית של פרויקט 8 — הניסיון שמציל אותה נמצא בשרשרת', () => {
    expect(buildGeocodeCandidates('אקספו תל אביב, ביתן 2')).toContain('אקספו תל אביב')
  })

  it('כתובת בקטע אחד מנוסה פעם אחת — בלי כפילות', () => {
    expect(buildGeocodeCandidates('תל אביב')).toEqual(['תל אביב'])
  })

  it('מנקה פסיקים כפולים ורווחים מיותרים', () => {
    expect(buildGeocodeCandidates('  הרצל 50 ,, ראשון לציון  ')).toEqual([
      'הרצל 50, ראשון לציון',
      'ראשון לציון',
      'הרצל 50',
    ])
  })

  it('כתובת ריקה אינה מייצרת ולו בקשה אחת', () => {
    expect(buildGeocodeCandidates('')).toEqual([])
    expect(buildGeocodeCandidates('   ')).toEqual([])
    expect(buildGeocodeCandidates(null)).toEqual([])
    expect(buildGeocodeCandidates(undefined)).toEqual([])
  })

  it('חסום בתקרה — כתובת ארוכה לא הופכת לשיטפון בקשות', () => {
    const many = buildGeocodeCandidates('א, ב, ג, ד, ה, ו, ז')
    expect(many).toHaveLength(MAX_GEOCODE_ATTEMPTS)
    expect(many[0]).toBe('א, ב, ג, ד, ה, ו, ז')
  })
})

describe('localityMatchesAddress — השומר שמונע קואורדינטה בעיר הלא-נכונה', () => {
  it('🔴 דוחה את המקרה שנמדד: `מרכז הכנסים` לבדו מחזיר אשקלון על כתובת בירושלים', () => {
    expect(localityMatchesAddress({ city: 'אשקלון' }, 'מרכז הכנסים, ירושלים')).toBe(false)
  })

  it('🔴 דוחה את המקרה השני שנמדד: `הרצל 50` לבדו מחזיר נתניה', () => {
    expect(localityMatchesAddress({ city: 'נתניה' }, 'הרצל 50, ראשון לציון')).toBe(false)
  })

  it('מקבל כשהיישוב באמת מופיע בכתובת', () => {
    expect(localityMatchesAddress({ city: 'ראשון לציון' }, 'הרצל 50, ראשון לציון')).toBe(true)
  })

  // המקף שבין "תל" ל"אביב" בתשובת השירות הוא מקף עברי (U+05BE) והמפריד לפני "יפו"
  // הוא קו מפריד (U+2013) — שניהם אינם מופיעים בכתובת שהמנהלת הקלידה.
  it('מתעלם ממקף עברי, קו מפריד ורווחים — `תל־אביב–יפו` מול `תל אביב`', () => {
    expect(localityMatchesAddress({ city: 'תל־אביב–יפו' }, 'אקספו תל אביב, ביתן 2')).toBe(true)
  })

  // Nominatim מחזיר את ירושלים כשם דו-לשוני מופרד בקו אנכי.
  it('מפצל שם דו-לשוני ומקבל אם צד אחד מתאים — `ירושלים | القدس`', () => {
    expect(localityMatchesAddress({ city: 'ירושלים | القدس' }, 'מרכז הכנסים, ירושלים')).toBe(true)
  })

  it('קורא גם `town`/`village`/`municipality`, לא רק `city`', () => {
    expect(localityMatchesAddress({ town: 'חולון' }, 'סוקולוב 3, חולון')).toBe(true)
    expect(localityMatchesAddress({ village: 'כפר ויתקין' }, 'כפר ויתקין')).toBe(true)
    expect(localityMatchesAddress({ municipality: 'מודיעין' }, 'עמק זבולון 1, מודיעין')).toBe(true)
  })

  // 🔴 חוסר-יכולת-לאמת אינו אישור. תשובה בלי שם-יישוב נדחית, והדיילת/האירוע
  // מסומנים "אין קואורדינטות" — שזו התוצאה שהאפיון קבע לחוסר-נתון.
  it('דוחה תשובה שאין בה שום שם-יישוב', () => {
    expect(localityMatchesAddress({ state: 'מחוז המרכז' }, 'הרצל 50, ראשון לציון')).toBe(false)
    expect(localityMatchesAddress(null, 'הרצל 50, ראשון לציון')).toBe(false)
    expect(localityMatchesAddress({}, 'הרצל 50')).toBe(false)
  })
})

describe('parseGeocodeResult', () => {
  const expoHit = [
    {
      lat: '32.1054141',
      lon: '34.8084224',
      address: { city: 'תל־אביב–יפו', country_code: 'il' },
    },
  ]

  it('מחזיר קואורדינטות מספריות מתשובה תקינה', () => {
    expect(parseGeocodeResult(expoHit, 'אקספו תל אביב, ביתן 2')).toEqual({
      lat: 32.1054141,
      lng: 34.8084224,
    })
  })

  it('תשובה ריקה = אין קואורדינטות, לא שגיאה', () => {
    expect(parseGeocodeResult([], 'כתובת שלא קיימת')).toBeNull()
    expect(parseGeocodeResult(null, 'כתובת')).toBeNull()
    expect(parseGeocodeResult({ error: 'boom' }, 'כתובת')).toBeNull()
  })

  it('🔴 דוחה תשובה שהיישוב שלה אינו בכתובת — גם אם הקואורדינטה תקינה לחלוטין', () => {
    const ashkelon = [
      { lat: '31.6692731', lon: '34.5710412', address: { city: 'אשקלון', country_code: 'il' } },
    ]
    expect(parseGeocodeResult(ashkelon, 'מרכז הכנסים, ירושלים')).toBeNull()
  })

  // 🚨 המלכודת שכבר תפסה אותנו היום: `Number(null)` הוא **0**, ו-0/0 הוא נקודה
  // תקינה לגמרי באוקיינוס — כלומר "המרחק המושלם", והדיילת הייתה קופצת לראש הדירוג.
  it('🚨 lat/lng חסרים או ריקים מחזירים null — לעולם לא 0', () => {
    const missing = [{ lat: null, lon: null, address: { city: 'תל אביב' } }]
    const blank = [{ lat: '', lon: '  ', address: { city: 'תל אביב' } }]
    const junk = [{ lat: 'abc', lon: 'def', address: { city: 'תל אביב' } }]
    expect(parseGeocodeResult(missing, 'תל אביב')).toBeNull()
    expect(parseGeocodeResult(blank, 'תל אביב')).toBeNull()
    expect(parseGeocodeResult(junk, 'תל אביב')).toBeNull()
  })

  // בדיקה שנייה ובלתי-תלויה ב-`countrycodes=il`: שומר שנשען על פרמטר יחיד בכתובת
  // ה-URL נשבר בשקט ברגע שמישהו יערוך את השאילתה.
  it('דוחה קואורדינטה מחוץ לגבולות ישראל', () => {
    const paris = [{ lat: '48.8566', lon: '2.3522', address: { city: 'תל אביב' } }]
    expect(parseGeocodeResult(paris, 'תל אביב')).toBeNull()
  })
})
