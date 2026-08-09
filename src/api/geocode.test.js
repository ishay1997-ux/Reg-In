import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// כל בדיקה מקבלת מודול טרי, כי ויסות-הקצב מחזיק מצב ברמת-המודול (רגע הבקשה
// האחרונה). בלי איפוס, בדיקה אחת הייתה יורשת את השעון של קודמתה.
async function freshModule() {
  vi.resetModules()
  return import('./geocode')
}

// תשובה במבנה האמיתי של Nominatim, כפי שנמדד 09/08/2026.
function hit(lat, lon, city) {
  return [{ lat: String(lat), lon: String(lon), address: { city, country_code: 'il' } }]
}

const EXPO = hit(32.1054141, 34.8084224, 'תל־אביב–יפו')
const JERUSALEM = hit(31.7788472, 35.2257856, 'ירושלים | القدس')
const ASHKELON = hit(31.6692731, 34.5710412, 'אשקלון')

function mockFetch(...responses) {
  const impl = vi.fn()
  for (const body of responses) {
    impl.mockImplementationOnce(async () => ({ ok: true, json: async () => body }))
  }
  impl.mockImplementation(async () => ({ ok: true, json: async () => [] }))
  vi.stubGlobal('fetch', impl)
  return impl
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

// מריץ את הפעולה ומקדם את הטיימרים המדומים במקביל, כדי שההמתנות של ויסות-הקצב
// לא יתקעו את הבדיקה.
async function runWithTimers(promise) {
  const advance = vi.advanceTimersByTimeAsync(60_000)
  const result = await promise
  await advance
  return result
}

describe('geocodeAddress', () => {
  it('פגיעה בניסיון הראשון — בקשה אחת בלבד', async () => {
    const { geocodeAddress } = await freshModule()
    const fetchMock = mockFetch(EXPO)

    const result = await runWithTimers(geocodeAddress('אקספו תל אביב'))

    expect(result).toEqual({ lat: 32.1054141, lng: 34.8084224 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  // 🔴 המקרה האמיתי של פרויקט 8: הכתובת המלאה מחזירה ריק, והקטע `אקספו תל אביב` פוגע.
  it('ממשיך לניסיון הבא כשהתשובה ריקה — הכתובת האמיתית של פרויקט 8', async () => {
    const { geocodeAddress } = await freshModule()
    const fetchMock = mockFetch([], [], EXPO)

    const result = await runWithTimers(geocodeAddress('אקספו תל אביב, ביתן 2'))

    expect(result).toEqual({ lat: 32.1054141, lng: 34.8084224 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  // 🔴 המקרה האמיתי של פרויקט 3: `מרכז הכנסים` לבדו מחזיר **אשקלון**, שהיא 62 ק"מ
  // מהתשובה הנכונה. השומר דוחה אותה, והשרשרת ממשיכה עד ירושלים.
  it('דוחה פגיעה בעיר הלא-נכונה וממשיך — הכתובת האמיתית של פרויקט 3', async () => {
    const { geocodeAddress } = await freshModule()
    // סדר השרשרת: מלאה (ריק) ⇐ `ירושלים` (פוגעת) — ולכן אשקלון כלל לא נדרשת.
    const fetchMock = mockFetch([], JERUSALEM)

    const result = await runWithTimers(geocodeAddress('מרכז הכנסים, ירושלים'))

    expect(result).toEqual({ lat: 31.7788472, lng: 35.2257856 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('פגיעה שנדחתה על-ידי השומר אינה נחשבת תשובה', async () => {
    const { geocodeAddress } = await freshModule()
    mockFetch(ASHKELON, ASHKELON, ASHKELON, ASHKELON)

    const result = await runWithTimers(geocodeAddress('מרכז הכנסים, ירושלים'))

    expect(result).toBeNull()
  })

  it('כל הניסיונות נכשלו ⇒ null, וזה מצב תקין ולא שגיאה', async () => {
    const { geocodeAddress } = await freshModule()
    mockFetch([], [], [], [])

    await expect(runWithTimers(geocodeAddress('כתובת שאינה קיימת, שום מקום'))).resolves.toBeNull()
  })

  // 🔴 הכלל שאסור לשבור: כשל-רשת **לעולם אינו זורק אל תוך מסלול-השמירה**.
  // האפיון קובע `נכשל ⇒ נשמרת בכל מקרה` — קריאה שזורקת הייתה הופכת תקלת-אינטרנט
  // רגעית לכישלון שמירה של דיילת.
  it('🔴 כשל רשת אינו זורק, וממשיך לניסיון הבא', async () => {
    const { geocodeAddress } = await freshModule()
    const fetchMock = vi.fn()
    fetchMock.mockRejectedValueOnce(new Error('network down'))
    fetchMock.mockImplementation(async () => ({ ok: true, json: async () => EXPO }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await runWithTimers(geocodeAddress('אקספו תל אביב, ביתן 2'))

    expect(result).toEqual({ lat: 32.1054141, lng: 34.8084224 })
  })

  it('🔴 תשובת שגיאה מהשרת אינה זורקת', async () => {
    const { geocodeAddress } = await freshModule()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })),
    )

    await expect(runWithTimers(geocodeAddress('אקספו תל אביב'))).resolves.toBeNull()
  })

  it('כתובת ריקה אינה מייצרת ולו בקשה אחת', async () => {
    const { geocodeAddress } = await freshModule()
    const fetchMock = mockFetch(EXPO)

    await expect(runWithTimers(geocodeAddress('  '))).resolves.toBeNull()
    await expect(runWithTimers(geocodeAddress(null))).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('השאילתה נושאת את סינון-ישראל ואת פרטי-הכתובת שהשומר צריך', async () => {
    const { geocodeAddress } = await freshModule()
    const fetchMock = mockFetch(EXPO)

    await runWithTimers(geocodeAddress('אקספו תל אביב'))

    // נקרא דרך `searchParams` ולא כהשוואת-מחרוזת: רווח מקודד `+` ולא `%20`,
    // ובדיקה שנצמדת לקידוד הייתה נכשלת על כתובת נכונה לחלוטין. אומת מול השירות
    // החי 09/08/2026 — שתי הצורות מחזירות את אותה תוצאה בדיוק.
    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.searchParams.get('countrycodes')).toBe('il')
    expect(url.searchParams.get('addressdetails')).toBe('1')
    expect(url.searchParams.get('format')).toBe('json')
    expect(url.searchParams.get('limit')).toBe('1')
    expect(url.searchParams.get('q')).toBe('אקספו תל אביב')
  })

  // תנאי-השימוש של Nominatim, כפי שנקראו 09/08/2026: **בקשה אחת בשנייה לכל היותר.**
  it('מכבד את מגבלת בקשה-אחת-בשנייה בין ניסיון לניסיון', async () => {
    const { geocodeAddress, GEOCODE_MIN_INTERVAL_MS } = await freshModule()
    const stamps = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        stamps.push(Date.now())
        return { ok: true, json: async () => [] }
      }),
    )

    await runWithTimers(geocodeAddress('א, ב, ג'))

    expect(stamps.length).toBeGreaterThan(1)
    for (let i = 1; i < stamps.length; i++) {
      expect(stamps[i] - stamps[i - 1]).toBeGreaterThanOrEqual(GEOCODE_MIN_INTERVAL_MS)
    }
  })
})
