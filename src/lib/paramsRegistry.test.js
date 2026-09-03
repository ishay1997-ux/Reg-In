import { describe, it, expect } from 'vitest'
import {
  PARAM_REGISTRY,
  PARAM_GROUPS,
  getParamEntry,
  validateParamValue,
  weightsSumOk,
  distanceOrderOk,
  matchesParamSearch,
  parseForDisplay,
} from './paramsRegistry'
import { PRICING_PARAM_NAMES } from './pricing'
import { HOSTESS_PARAM_NAMES } from './hostesses'
import { SMART_MATCH_PARAM_NAMES } from './smartMatch'
import { QUOTE_SCREEN_PARAM_NAMES } from './quotes'
import { CANCELLATION_PARAM_NAMES } from './projectCancellation'

// ⚠️ **קבוע-בדיקה מתוארך, לא לגזור-מחדש בלי מדידה חדשה.** ה-Seed החי **אחרי מיגרציה A**
// (נמדד 02/09/2026 21:20 — 43 שמות, מוזרק ע"י האורכסטרטור מהמדריך). שם שגוי בתו אחד כאן
// היה הופך את בדיקת-שני-הכיוונים לחסרת-משמעות (עוברת גם על מרשם שגוי).
const LIVE_SEED_PARAM_NAMES = {
  pricing_timing: [
    'אחוז_מעמ',
    'יחס_אורחים_לדיילת',
    'ימי_תוקף_הצעה',
    'סכום_נסיעות_למשמרת',
    'שכר_מינימום_שעתי',
    'תנאי_תשלום_ימים',
    'ימי_אזהרה_הצעה_פגה',
  ],
  control_alerts: [
    'אחוז_פיצוי_ביטול_חלקי',
    'ימי_אזהרה_קדם_אירוע',
    'סף_לקוח_רדום_ימים',
    'שעות_פיצוי_ביטול_חלקי',
    'שעות_פיצוי_ביטול_מלא',
    'שעות_תזכורת_לדיילת',
    'סף_שביעות_רצון',
    'סף_לוגיסטיקה_ימי_עסקים',
  ],
  smart_match: [
    'גולפוסט_מרחק_קמ',
    'חלון_חישוב_חודשים',
    'חלון_חישוב_מורחב_חודשים',
    'לא_ענתה_ל_N',
    'מינימום_תשובות_להצגת_ציון',
    'מרכיב_אמינות_פעיל',
    'משקולת_אמינות',
    'משקולת_היענות',
    'משקולת_קרבה',
    'קבוע_ריסון_m',
    'שיעור_בונוס_הוגנות_לשבוע',
    'שער_מרחק_קמ',
    'תקרת_שבועות_הוגנות',
  ],
  shift_invites: ['שעות_סף_זימון_לפני_אירוע', 'שעות_תוקף_זימון', 'שעות_אירוע_דחוף'],
  templates: [
    'תבנית_אישור_סופי_שיבוץ',
    'תבנית_זימון_משמרת',
    'תבנית_מייל_אירוע_בוטל',
    'תבנית_מייל_ביטול_משמרת',
    'תבנית_מייל_דוח_שכר',
    'תבנית_מייל_הצעת_מחיר',
    'תבנית_מייל_חשבונית_מס',
    'תבנית_מייל_משוב_לקוח',
    'תבנית_מייל_פרטי_האירוע_השתנו',
    'תבנית_מייל_שחרור_משמרת',
    'תבנית_תזכורת_משמרת',
  ],
  integration_tech: ['מייל_משרד_רואי_חשבון'],
}

const LIVE_SEED_NAMES_FLAT = Object.values(LIVE_SEED_PARAM_NAMES).flat()

describe('PARAM_REGISTRY — 43 שורות, זהות-בית לזרע החי אחרי מיגרציה A (שני כיוונים)', () => {
  it('43 שורות בדיוק', () => {
    expect(PARAM_REGISTRY).toHaveLength(43)
    expect(LIVE_SEED_NAMES_FLAT).toHaveLength(43)
  })

  it('כל שם במרשם קיים בזרע החי (כיוון א׳ — לא נשאר שם-רפאים במרשם)', () => {
    const seedSet = new Set(LIVE_SEED_NAMES_FLAT)
    for (const entry of PARAM_REGISTRY) {
      expect(seedSet.has(entry.name), `"${entry.name}" במרשם ואינו בזרע החי`).toBe(true)
    }
  })

  it('כל שם בזרע החי קיים במרשם (כיוון ב׳ — לא נשארה שורה בלי הגדרת-תצוגה)', () => {
    const registrySet = new Set(PARAM_REGISTRY.map((entry) => entry.name))
    for (const name of LIVE_SEED_NAMES_FLAT) {
      expect(registrySet.has(name), `"${name}" בזרע החי ואינו במרשם`).toBe(true)
    }
  })

  it('אין שם כפול במרשם', () => {
    const names = PARAM_REGISTRY.map((entry) => entry.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('כל שורה נושאת group שקיים ב-PARAM_GROUPS', () => {
    const groupTypes = new Set(PARAM_GROUPS.map((g) => g.type))
    for (const entry of PARAM_REGISTRY) {
      expect(groupTypes.has(entry.group), `"${entry.name}" עם group לא-מוכר: ${entry.group}`).toBe(
        true,
      )
    }
  })

  it('כל שורה נושאת kind אחד מתוך הסט הרשום ב-Q-3', () => {
    const validKinds = new Set([
      'percent',
      'int',
      'decimal',
      'weight',
      'boolean',
      'email',
      'url',
      'templates',
    ])
    for (const entry of PARAM_REGISTRY) {
      expect(validKinds.has(entry.kind), `"${entry.name}" עם kind לא-מוכר: ${entry.kind}`).toBe(
        true,
      )
    }
  })
})

// ⚠️ בדיקת-תת-קבוצה במתכוון, לא שוויון: סשן מקביל אחר מוסיף באותו הרגע את שלושת שמות
// ה-shift_invites ל-HOSTESS_PARAM_NAMES ואת ימי_אזהרה_הצעה_פגה ל-QUOTE_SCREEN_PARAM_NAMES.
// הבדיקה כאן חייבת לעבור גם לפני וגם אחרי אותה תוספת — קבצים אלה לא נערכים כאן.
describe('המרשם מכיל את כל חמש רשימות-השמות הקיימות (תת-קבוצה, לא שוויון)', () => {
  it.each([
    ['PRICING_PARAM_NAMES', PRICING_PARAM_NAMES],
    ['HOSTESS_PARAM_NAMES', HOSTESS_PARAM_NAMES],
    ['SMART_MATCH_PARAM_NAMES', SMART_MATCH_PARAM_NAMES],
    ['QUOTE_SCREEN_PARAM_NAMES', QUOTE_SCREEN_PARAM_NAMES],
    ['CANCELLATION_PARAM_NAMES', CANCELLATION_PARAM_NAMES],
  ])('%s ⊆ PARAM_REGISTRY', (_label, namesMap) => {
    const registrySet = new Set(PARAM_REGISTRY.map((entry) => entry.name))
    for (const name of Object.values(namesMap)) {
      expect(registrySet.has(name), `"${name}" חסר במרשם`).toBe(true)
    }
  })
})

describe('getParamEntry — fallback לשורה ללא הגדרת-תצוגה (§2.8, לא מוסתר לעולם)', () => {
  it('שם קיים מחזיר את השורה מהמרשם', () => {
    expect(getParamEntry('אחוז_מעמ').label).toBe('אחוז מע"מ')
  })

  it('שם לא-מוכר מחזיר שם גולמי + kind text + ההערה הנעולה', () => {
    const entry = getParamEntry('פרמטר_חדש_שלא_הוגדר')
    expect(entry).toEqual({
      name: 'פרמטר_חדש_שלא_הוגדר',
      label: 'פרמטר_חדש_שלא_הוגדר',
      hint: 'הגדרה ללא הגדרת-תצוגה',
      kind: 'text',
      group: null,
    })
  })
})

describe('validateParamValue — טבלת קבלה/דחייה לכל kind (Q-3)', () => {
  it.each([
    ['percent', '18', true],
    ['percent', '0', true],
    ['percent', '100', true],
    ['percent', '100.5', false],
    ['percent', '-1', false],
    ['percent', '', false],
    ['int', '30', true],
    ['int', '1', true],
    ['int', '0', false],
    ['int', '-3', false],
    ['int', '2.5', false],
    ['int', '', false],
    ['decimal', '22.60', true],
    ['decimal', '0', true],
    ['decimal', '-1', false],
    ['decimal', '', false],
    ['weight', '0.40', true],
    ['weight', '0', true],
    ['weight', '1', true],
    ['weight', '1.01', false],
    ['weight', '-0.1', false],
    ['weight', '', false],
    ['boolean', 'true', true],
    ['boolean', 'false', true],
    ['boolean', 'TRUE', true],
    ['boolean', 'yes', false],
    ['boolean', '1', false],
    ['email', 'office@cpa-firm.co.il', true],
    ['email', 'לא-מייל', false],
    ['email', '', false],
    ['url', 'https://reg-in.example.com/x', true],
    ['url', 'http://reg-in.example.com/x', false],
    ['url', 'לא-קישור', false],
    ['url', '', false],
    ['templates', '', true],
    ['templates', 'כל טקסט — הולידציה האמיתית ב-emailTemplates.js', true],
  ])('kind=%s value=%p ⇒ ok=%p', (kind, value, expectedOk) => {
    const result = validateParamValue({ kind }, value)
    expect(result.ok).toBe(expectedOk)
    if (!expectedOk) {
      expect(typeof result.message).toBe('string')
      expect(result.message.length).toBeGreaterThan(0)
    }
  })

  it('kind לא-מוכר (fallback text) תמיד ok — הולידציה בו אינה כאן', () => {
    expect(validateParamValue({ kind: 'text' }, 'כל דבר')).toEqual({ ok: true })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 🔬 **הפגם שזה נועל (נמדד 03/09/2026, סקירת-UX בהקשר-טרי):** `min`/`max`/`decimals`
// שבשורת-המרשם היו **מטא-דאטה מתה** — ההודעה הבטיחה כלל, ואף שורת-קוד לא אכפה אותו.
// שלוש מדידות שהתקבלו כתקינות: `אחוז_מעמ = 17.555` · `משקולת_קרבה = 0.333333` ·
// `סף_שביעות_רצון = 99`. הבדיקות כאן נכשלות **בדיוק** אם המטא-דאטה תתעלם שוב.
// ─────────────────────────────────────────────────────────────────────────────

const NUMERIC_KINDS = new Set(['percent', 'int', 'decimal', 'weight'])
const BOUNDED_ENTRIES = PARAM_REGISTRY.filter(
  (entry) =>
    NUMERIC_KINDS.has(entry.kind) &&
    (entry.min != null || entry.max != null || entry.decimals != null),
)

// ערך תקין באמצע-הטווח של השורה — נקודת-ההשוואה שמונעת בדיקה ש"עוברת" כי הכול נפסל.
function inRangeValue(entry) {
  const decimals = entry.decimals ?? 0
  if (entry.kind === 'int') return String(entry.min ?? 1)
  if (entry.min != null && entry.max != null) {
    return ((entry.min + entry.max) / 2).toFixed(decimals)
  }
  return ((entry.min ?? 0) + 1).toFixed(decimals)
}

describe('validateParamValue — min/max/decimals של השורה נאכפים, לא רק מוצהרים (A2)', () => {
  it('יש שורות שמכריזות גבולות (אחרת הבדיקה למטה ריקה ותמיד "עוברת")', () => {
    expect(BOUNDED_ENTRIES.length).toBeGreaterThanOrEqual(10)
  })

  // ⚠️ `it.each` על **המרשם החי** ולא על רשימה כתובה-ביד: שורה חדשה עם גבולות נכנסת
  // לבדיקה מעצמה, ואי-אפשר להוסיף מטא-דאטה שאיש אינו אוכף.
  it.each(BOUNDED_ENTRIES.map((entry) => [entry.name, entry]))(
    '%s — הגבולות שהשורה מכריזה נאכפים על הערך',
    (_name, entry) => {
      const decimals = entry.decimals ?? 0
      const step = entry.decimals ? Number(`1e-${entry.decimals}`) : 1

      // ① ערך תקין באמצע הטווח חייב לעבור.
      expect(validateParamValue(entry, inRangeValue(entry)).ok).toBe(true)

      // ② צעד אחד מתחת ל-min ⇒ נפסל.
      if (entry.min != null) {
        expect(validateParamValue(entry, (entry.min - step).toFixed(decimals)).ok).toBe(false)
      }
      // ③ צעד אחד מעל ל-max ⇒ נפסל.
      if (entry.max != null) {
        expect(validateParamValue(entry, (entry.max + step).toFixed(decimals)).ok).toBe(false)
      }
      // ④ ספרה אחת יותר מהמוצהר ⇒ נפסל — **בתוך הטווח**, כדי שהפסילה תהיה על הספרות בלבד.
      if (entry.decimals) {
        const tooPrecise = `${inRangeValue(entry)}1`
        expect(Number(tooPrecise)).toBeGreaterThanOrEqual(entry.min ?? 0)
        if (entry.max != null) expect(Number(tooPrecise)).toBeLessThanOrEqual(entry.max)
        expect(validateParamValue(entry, tooPrecise).ok).toBe(false)
      }
    },
  )

  it.each([
    ['אחוז_מעמ', '17.555', 'ערך חוקי: מספר בין 0 ל-100, עד שתי ספרות אחרי הנקודה'],
    ['משקולת_קרבה', '0.333333', 'ערך חוקי: מספר בין 0 ל-1, עד שתי ספרות אחרי הנקודה'],
    ['סף_שביעות_רצון', '99', 'ערך חוקי: מספר שלם בין 1 ל-5'],
  ])(
    'שלוש המדידות של 03/09 — %s = %s נפסל, וההודעה נושאת את המספרים הנאכפים',
    (name, value, message) => {
      const result = validateParamValue(getParamEntry(name), value)
      expect(result.ok).toBe(false)
      expect(result.message).toBe(message)
    },
  )

  it('ריק אומר "חסר ערך" ולא טווח — לכל קינד מספרי (C6)', () => {
    for (const entry of BOUNDED_ENTRIES) {
      expect(validateParamValue(entry, '')).toEqual({
        ok: false,
        message: 'יש למלא ערך — שדה ריק אינו 0',
      })
    }
  })

  it('קינד לא-מספרי (מייל) שומר על הודעת-הקינד שלו גם כשהוא ריק', () => {
    expect(validateParamValue(getParamEntry('מייל_משרד_רואי_חשבון'), '').message).toBe(
      'ערך חוקי: כתובת מייל תקינה',
    )
  })
})

describe('weightsSumOk — הסכימה ל-1.00 (±0.005)', () => {
  it('0.40/0.35/0.25 (הזרע החי) ⇒ תקין', () => {
    expect(weightsSumOk([0.4, 0.35, 0.25])).toBe(true)
  })

  it('0.40/0.35/0.30 ⇒ מאדים (סכום 1.05)', () => {
    expect(weightsSumOk([0.4, 0.35, 0.3])).toBe(false)
  })

  it('בתוך הסבילות (0.003 סטייה) ⇒ תקין', () => {
    expect(weightsSumOk([0.4, 0.35, 0.253])).toBe(true)
  })
})

describe('distanceOrderOk — גולפוסט ≤ שער', () => {
  it('40/80 (הזרע החי) ⇒ תקין', () => {
    expect(distanceOrderOk(40, 80)).toBe(true)
  })

  it('גולפוסט 90 / שער 80 ⇒ מאדים', () => {
    expect(distanceOrderOk(90, 80)).toBe(false)
  })

  it('שווים ⇒ תקין (≤, לא <)', () => {
    expect(distanceOrderOk(80, 80)).toBe(true)
  })

  it('ערך חסר משני הצדדים ⇒ true (אין מה לפסול לפני שהשדות עצמם תקינים)', () => {
    expect(distanceOrderOk(null, 80)).toBe(true)
    expect(distanceOrderOk(40, undefined)).toBe(true)
  })
})

describe('matchesParamSearch — חיפוש בשני השמות', () => {
  const gateEntry = getParamEntry('שער_מרחק_קמ')

  it('מוצא לפי תת-מחרוזת בתווית העברית', () => {
    expect(matchesParamSearch(gateEntry, 'מרחק')).toBe(true)
  })

  it('מוצא לפי שם-המסד הגולמי', () => {
    expect(matchesParamSearch(gateEntry, 'שער_מרחק_קמ')).toBe(true)
  })

  it('לא-רגיש לרישיות באנגלית (שם-מסד עם אותיות לטיניות)', () => {
    const entry = getParamEntry('קבוע_ריסון_m')
    expect(matchesParamSearch(entry, 'RISUN'.toLowerCase())).toBe(false) // אין "risun" באף שדה — שלילי-אמת
    expect(matchesParamSearch(entry, 'ריסון')).toBe(true)
  })

  it('שאילתה ריקה מתאימה לכול', () => {
    expect(matchesParamSearch(gateEntry, '')).toBe(true)
  })

  it('אינה מוצאת מחרוזת שאינה קיימת', () => {
    expect(matchesParamSearch(gateEntry, 'תבנית_מייל')).toBe(false)
  })
})

describe('parseForDisplay — פענוח text⇒ערך-תצוגה לפי kind', () => {
  it('מספרים: מחרוזת ⇒ מספר, ריק ⇒ null (לא 0 — מלכודת Number(""))', () => {
    expect(parseForDisplay({ kind: 'int' }, '30')).toBe(30)
    expect(parseForDisplay({ kind: 'percent' }, '')).toBeNull()
    expect(parseForDisplay({ kind: 'decimal' }, '   ')).toBeNull()
    expect(parseForDisplay({ kind: 'weight' }, '0.40')).toBe(0.4)
  })

  it('בוליאני: "true"/"false" ⇒ boolean, אחרת null', () => {
    expect(parseForDisplay({ kind: 'boolean' }, 'true')).toBe(true)
    expect(parseForDisplay({ kind: 'boolean' }, 'false')).toBe(false)
    expect(parseForDisplay({ kind: 'boolean' }, 'שבור')).toBeNull()
  })

  it('email/url/templates/text: מוחזרים כטקסט גולמי', () => {
    expect(parseForDisplay({ kind: 'email' }, 'a@b.co')).toBe('a@b.co')
    expect(parseForDisplay({ kind: 'templates' }, 'שלום [שם_דיילת]')).toBe('שלום [שם_דיילת]')
    expect(parseForDisplay({ kind: 'text' }, undefined)).toBe('')
  })
})

describe('PARAM_GROUPS — 6 קבוצות בתוויות הנעולות (§3.7)', () => {
  it('6 קבוצות, כל אחת עם type+label', () => {
    expect(PARAM_GROUPS).toHaveLength(6)
    const byType = Object.fromEntries(PARAM_GROUPS.map((g) => [g.type, g.label]))
    expect(byType).toEqual({
      pricing_timing: 'תמחור ותזמון',
      control_alerts: 'בקרה והתראות',
      shift_invites: 'שיבוץ וזימונים',
      templates: 'תבניות מייל',
      smart_match: 'התאמת דיילות',
      integration_tech: 'טכני',
    })
  })

  it('כל group שמופיע במרשם קיים גם ברשימת-הקבוצות, ולהפך — אין קבוצה ריקה', () => {
    const usedGroups = new Set(PARAM_REGISTRY.map((entry) => entry.group))
    const declaredGroups = new Set(PARAM_GROUPS.map((g) => g.type))
    expect(usedGroups).toEqual(declaredGroups)
  })
})

describe('V-4 — התוויות המתוקנות של שער/גולפוסט (§3.7)', () => {
  it('שער_מרחק_קמ נושא את התווית המתוקנת, לא את תווית-המוקאפ השגויה', () => {
    expect(getParamEntry('שער_מרחק_קמ').label).toBe('מרחק שמעבר לו הדיילת נפסלת')
  })

  it('גולפוסט_מרחק_קמ נושא את תווית-המוקאפ המקורית (זו כן הייתה נכונה)', () => {
    expect(getParamEntry('גולפוסט_מרחק_קמ').label).toBe('מרחק שבו ציון-הקרבה מגיע ל-0')
  })
})

// 🔴 ממצא F-4 (אודיט-סגירת מ9, 03/09/2026). התקרה על שכר-המינימום היא היחידה שנוספה באודיט,
// כי היא היחידה שנמדדה לה השלכה חוצת-מודול: הטריגר `enforce_hostess_min_wage` דוחה כל שמירת
// דיילת שתעריפה נמוך מהערך, ולכן `3500` במקום `35` נועל את כל מסלול-השמירה של מודול 4.
// 22 הפרמטרים המספריים האחרים נשארו בלי תקרה **במכוון** — 22 הכרעות-מוצר, לישי בבוקר.
describe('שכר_מינימום_שעתי — תקרת-שפיות (F-4)', () => {
  const entry = getParamEntry('שכר_מינימום_שעתי')

  it('הערך החי (35) והתעריף הגבוה שנמדד (52) עוברים', () => {
    expect(validateParamValue(entry, '35').ok).toBe(true)
    expect(validateParamValue(entry, '52').ok).toBe(true)
    expect(validateParamValue(entry, '200').ok).toBe(true)
  })

  it('הקלדה של 3500 במקום 35 נדחית — וההודעה נוקבת באותה תקרה שהיא אוכפת', () => {
    const result = validateParamValue(entry, '3500')
    expect(result.ok).toBe(false)
    expect(result.message).toContain('200')
  })
})
