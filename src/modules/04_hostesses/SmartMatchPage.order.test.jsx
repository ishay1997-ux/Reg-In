// 🎯 **הסדר שעל המסך — לא הסדר הנסתר.** הכרעת-ישי 25/09/2026 (אודיט השיבוץ-החכם, פער 1).
//
// 🔑 **למה הקובץ הזה קיים, כי בלעדיו הבאג חי חודש וחצי:** הבדיקה שנקראה "סדר-התצוגה"
// (`smartMatch.test.js`) בדקה את הפלט של `rankCandidates` — והייתה ירוקה בזמן שהמסך הציג את
// מקרה-העוגן של האפיון **הפוך** (דנה ← מיכל ← נועה), כי המסך מיין מחדש לפי "קרבה" בק"מ.
// ⇒ כאן מרנדרים את המסך עצמו, מזינים שורות-מסד גולמיות (לא מועמדות מוכנות), וקוראים את
// **שמות הכרטיסים בסדר ה-DOM**. כל החוליות רצות: הרכבה · חלון · מנוף · דירוג · עדשה · ציור.
//
// 🧮 **המקרה — `spec.md` פריט-חוזה 3 (§3.1–3.2), ולא מספרים שחישבתי:** נועה 7/6 · 30 ק"מ ·
// עבדה לפני 8 שבועות · דנה 12/6 · 8 ק"מ · שבוע · מיכל 1/1 · 20 ק"מ · 3 שבועות · יעל נפסלת
// (55 ק"מ בלי רכב) · שירה נפסלת (אי-זמינות 20–25/08). מרכיב-האמינות כבוי, כמו במקרה.
// ‏**הציפייה, מילה-במילה מהאפיון:** *"סדר-התצוגה: נועה ← מיכל ← דנה. שתי מועמדות אינן ברשימה"*.
//
// ⏱️ **"עבדה לפני N שבועות" נמדד עד תאריך-האירוע** (הכרעת-ישי 25/09/2026, פער 4), ו"עבדה" =
// אירוע שכבר עבר. לכן "היום" כאן הוא 16/08 — 6 ימים לפני האירוע (מעל 72 שעות ⇒ לא דחוף) —
// כדי שהשבוע של דנה (15/08) כבר יהיה מאחוריה.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import SmartMatchPage from './SmartMatchPage'
import { getSmartMatchData } from './api'

vi.mock('./api', () => ({
  getSmartMatchData: vi.fn(),
  createShiftInvites: vi.fn(),
  buildRecommendedRanks: vi.fn(),
  resendInvite: vi.fn(),
  approveFinalAndRelease: vi.fn(),
  markAssignmentStatus: vi.fn(),
  releaseAssignment: vi.fn(),
  setShiftLead: vi.fn(),
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ permissions: { דיילות: 'edit' } }),
}))
vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))
vi.mock('@/components/ConfirmDialog', () => ({ useConfirm: () => vi.fn() }))

const PROJECT_ID = 8
const TODAY = '2026-08-16'
const EVENT = { lat: 32.0853, lng: 34.7818 }

// דיילת שנמצאת בדיוק `km` צפונית לאירוע: על אותו קו-אורך, haversine = R × Δφ בדיוק.
const KM_PER_DEGREE = (6371 * Math.PI) / 180
const northOf = (km) => ({ lat: EVENT.lat + km / KM_PER_DEGREE, lng: EVENT.lng })

const PARAMS = {
  // Smart Match — ערכי-ה-Seed (`research §11.1`), כמו בעוגן של `smartMatch.test.js`.
  משקולת_היענות: '0.40',
  משקולת_אמינות: '0.35',
  משקולת_קרבה: '0.25',
  שער_מרחק_קמ: '80',
  גולפוסט_מרחק_קמ: '40',
  קבוע_ריסון_m: '3',
  חלון_חישוב_חודשים: '12',
  חלון_חישוב_מורחב_חודשים: '24',
  מינימום_תשובות_להצגת_ציון: '3',
  שיעור_בונוס_הוגנות_לשבוע: '0.02',
  תקרת_שבועות_הוגנות: '8',
  לא_ענתה_ל_N: '4',
  מרכיב_אמינות_פעיל: 'false',
  // ספי-הזימון שהמסך קורא באותה שליפה.
  שעות_תוקף_זימון: '48',
  שעות_סף_זימון_לפני_אירוע: '24',
  שעות_אירוע_דחוף: '72',
}

let nextProject = 100
function row(hostessId, status, eventDate = '2026-03-01') {
  nextProject += 1
  return {
    project_id: nextProject,
    hostess_id: hostessId,
    assignment_number: 1,
    assignment_status: status,
    projects: { final_event_date: eventDate, project_status: 'ready', customer_id: 99 },
  }
}
const times = (n, make) => Array.from({ length: n }, make)

// המאגר כשורות-מסד. "עבדה" = שורת `finally_approved` על אירוע שעבר — והיא גם תשובה חיובית,
// ולכן היא חלק מה-N-מתוך-M של אותה דיילת.
function anchorData({ preferences = [] } = {}) {
  const hostesses = [
    { hostess_id: 1, full_name: 'נועה', status: 'active', has_car: true, ...northOf(30) },
    { hostess_id: 2, full_name: 'דנה', status: 'active', has_car: true, ...northOf(8) },
    { hostess_id: 3, full_name: 'מיכל', status: 'active', has_car: true, ...northOf(20) },
    { hostess_id: 4, full_name: 'יעל', status: 'active', has_car: false, ...northOf(55) },
    {
      hostess_id: 5,
      full_name: 'שירה',
      status: 'active',
      has_car: true,
      ...northOf(18),
      hostess_unavailability: [{ start_date: '2026-08-20', end_date: '2026-08-25' }],
    },
  ]
  const assignments = [
    // נועה 7/6 · עבדה 27/06 = 8 שבועות לפני 22/08
    row(1, 'finally_approved', '2026-06-27'),
    ...times(5, () => row(1, 'confirmed_available')),
    row(1, 'declined'),
    // דנה 12/6 · עבדה 15/08 = שבוע לפני
    row(2, 'finally_approved', '2026-08-15'),
    ...times(5, () => row(2, 'confirmed_available')),
    ...times(6, () => row(2, 'declined')),
    // מיכל 1/1 · עבדה 01/08 = 3 שבועות לפני
    row(3, 'finally_approved', '2026-08-01'),
    // יעל 5/2 · שירה 5/3 — נפסלות, אבל נכנסות ל-`C` (0.60 = 18 ÷ 30)
    ...times(2, () => row(4, 'confirmed_available')),
    ...times(3, () => row(4, 'declined')),
    ...times(3, () => row(5, 'confirmed_available')),
    ...times(2, () => row(5, 'declined')),
  ]
  return {
    project: {
      project_id: PROJECT_ID,
      event_name: 'כנס לקוחות שנתי',
      customer_id: 55,
      customer_name: 'מדיטק פתרונות בע"מ',
      final_event_date: '2026-08-22',
      final_start_time: '18:00:00',
      final_end_time: '22:00:00',
      final_location: 'אקספו תל אביב',
      required_hostess_count: 6,
      ...EVENT,
    },
    hostesses,
    assignments,
    sameDayHostessIds: [],
    preferences,
    params: PARAMS,
  }
}

// שמות המועמדות **בסדר שבו הן מצוירות** — הכרטיס, לא המערך.
async function candidateNamesOnScreen() {
  const column = await screen.findByTestId('sm-candidates-column')
  const cards = await within(column).findAllByTestId(/^sm-candidate-\d+$/)
  return cards.map((card) => card.querySelector('b').textContent)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(`${TODAY}T09:00:00Z`))
  nextProject = 100
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('🎯 שיבוץ חכם — הסדר שהמנהלת רואה על המסך', () => {
  it('🎯 ברירת-המחדל היא "המלצת המערכת", והמסך מציג נועה ← מיכל ← דנה (spec.md §3.2)', async () => {
    getSmartMatchData.mockResolvedValue(anchorData())
    render(<SmartMatchPage projectId={PROJECT_ID} onBack={vi.fn()} />)

    expect(await candidateNamesOnScreen()).toEqual(['נועה', 'מיכל', 'דנה'])
    // העדשה הפעילה היא ההמלצה — ולא "קרבה", שהייתה ברירת-המחדל עד 25/09/2026.
    expect(screen.getByTestId('sm-angle-recommended').className).toContain('bg-teal-50')
    expect(screen.getByTestId('sm-angle-proximity').className).not.toContain('bg-teal-50')
  })

  it('🎯 שתי מועמדות אינן על המסך כלל — יעל (מרחק בלי רכב) ושירה (אי-זמינות)', async () => {
    getSmartMatchData.mockResolvedValue(anchorData())
    render(<SmartMatchPage projectId={PROJECT_ID} onBack={vi.fn()} />)

    const names = await candidateNamesOnScreen()
    expect(names).toHaveLength(3)
    expect(names).not.toContain('יעל')
    expect(names).not.toContain('שירה')
  })

  it('🔴 "מצוינת אצל הלקוח" נעוצה בראש גם בהמלצה — אף שהציון שלה הנמוך מהשלוש', async () => {
    getSmartMatchData.mockResolvedValue(
      anchorData({ preferences: [{ hostess_id: 2, preference: 'מצוינת' }] }),
    )
    render(<SmartMatchPage projectId={PROJECT_ID} onBack={vi.fn()} />)

    expect(await candidateNamesOnScreen()).toEqual(['דנה', 'נועה', 'מיכל'])
    expect(
      within(screen.getByTestId('sm-candidate-2')).getByText('מצוינת אצל הלקוח הזה'),
    ).toBeTruthy()
  })

  it('שאר הזוויות נשארות בלחיצה — "קרבה" מציגה דנה ← מיכל ← נועה', async () => {
    // 🛡️ שומר: בלי זה, הבדיקה הראשונה עוברת גם על מסך שמתעלם מהזווית לגמרי.
    getSmartMatchData.mockResolvedValue(anchorData())
    render(<SmartMatchPage projectId={PROJECT_ID} onBack={vi.fn()} />)
    await candidateNamesOnScreen()

    fireEvent.click(screen.getByTestId('sm-angle-proximity'))
    expect(await candidateNamesOnScreen()).toEqual(['דנה', 'מיכל', 'נועה'])
  })

  it('🔴 "תענה הכי מהר" כבויה כשלאף מועמדת אין זמן-תגובה מדוד — ולא ממיינת בהגרלה', async () => {
    // אין אף `responded_at` בנתונים ⇒ הכפתור מכובה ומנומק (`spec.md` §ארבע הזוויות).
    getSmartMatchData.mockResolvedValue(anchorData())
    render(<SmartMatchPage projectId={PROJECT_ID} onBack={vi.fn()} />)
    await candidateNamesOnScreen()

    expect(screen.getByTestId('sm-angle-fastest').disabled).toBe(true)
    expect(screen.getByTestId('sm-angle-note').textContent).toContain('זמן-תגובה')
  })
})

// ⏱️ **אירוע מתחת ל-72 שעות** — "תענה הכי מהר" מתחת ל-72 שעות, אחרת "המלצת המערכת".
// הכרעת-ישי 30/07/2026 (`spec.md` §ארבע הזוויות) עומדת; זו של 25/09 החליפה רק את ה"אחרת".
// "היום" = 20/08 09:00 ⇒ כ-57 שעות לפני 22/08 18:00 (מתחת ל-72, ומעל חלון ה-24).
describe('⏱️ אירוע מתחת ל-72 שעות — ברירת-המחדל תלויה בנתוני-זמן של המועמדות', () => {
  // שלוש תשובות דרך הקישור לכל אחת מ-`hostessHours` — מספיק לחציון (סף 3).
  function withResponseTimes(data, hostessHours) {
    const sent = Date.parse('2026-03-01T09:00:00Z')
    const used = new Map()
    const assignments = data.assignments.map((r) => {
      const hours = hostessHours[r.hostess_id]
      const count = used.get(r.hostess_id) ?? 0
      if (hours === undefined || count >= 3) return r
      used.set(r.hostess_id, count + 1)
      return {
        ...r,
        invite_sent_at: new Date(sent).toISOString(),
        responded_at: new Date(sent + hours * 3_600_000).toISOString(),
      }
    })
    return { ...data, assignments }
  }

  beforeEach(() => {
    vi.setSystemTime(new Date('2026-08-20T09:00:00Z'))
  })

  it('🔴 יש למועמדות זמן-תגובה ⇒ "תענה הכי מהר": דנה (שעה) ← נועה (20 שעות) ← מיכל (לא ידוע)', async () => {
    // הנתונים מבחינים: הסדר הזה שונה גם מההמלצה (נועה←מיכל←דנה) וגם מהקרבה (דנה←מיכל←נועה).
    getSmartMatchData.mockResolvedValue(withResponseTimes(anchorData(), { 1: 20, 2: 1 }))
    render(<SmartMatchPage projectId={PROJECT_ID} onBack={vi.fn()} />)

    expect(await candidateNamesOnScreen()).toEqual(['דנה', 'נועה', 'מיכל'])
    expect(screen.getByTestId('sm-angle-fastest').className).toContain('bg-teal-50')
  })

  it('🔴 אין למועמדות זמן-תגובה ⇒ נופלים להמלצה, לא למיון לפי שדה ריק', async () => {
    getSmartMatchData.mockResolvedValue(anchorData())
    render(<SmartMatchPage projectId={PROJECT_ID} onBack={vi.fn()} />)

    expect(await candidateNamesOnScreen()).toEqual(['נועה', 'מיכל', 'דנה'])
    expect(screen.getByTestId('sm-angle-recommended').className).toContain('bg-teal-50')
    expect(screen.getByTestId('sm-angle-fastest').disabled).toBe(true)
  })
})
