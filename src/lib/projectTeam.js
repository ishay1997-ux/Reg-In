// הלוגיקה הטהורה של לשונית "צוות דיילות" (מודול 6 · משטח 4) — כלל 14: המשפטים,
// המיון והמונים של הלשונית נולדים כאן עם בדיקות; הקומפוננטה רק מרנדרת.
// **טהור** — בלי Supabase, בלי DOM, בלי שעון: "עכשיו" מוזרק כפרמטר (המוסכמה של hostesses.js).
//
// 🔴 התוויות עצמן אינן כאן — הן מ-src/lib/hostesses.js ("אל תמציא נוסח חדש", spec §1.2).
// כאן חי מה שהלשונית מוסיפה מעליהן: עמודת "מה זה אומר" (משפט, לעולם לא ציון — §1.8),
// המשפט-האדום-היחיד של המסך, וסדר "בפנים · פתוח · יצא".

import { INVITE_VALIDITY_HOURS } from '@/lib/hostesses'
import { formatTimestamp } from '@/lib/dates'

// ── המחרוזות הנעולות של הלשונית ──────────────────────────────────────────────
// "הפרויקט בוטל — …" מילולי מהמוקאפ המאושר; משפט-ההרשאה הושלם מהבסיס הנעול
// "אין לך הרשאה לצפות ב…" (§3.7) — הכרעת-הכרטיס ⑧-8(ב): הודעה מפורשת, לא לשונית ריקה.
export const CANCELLED_SCOPE_REASON = 'הפרויקט בוטל — לא ניתן לשנות תכולה.'
export const TEAM_NO_PERMISSION_SENTENCE = 'אין לך הרשאה לצפות בצוות הדיילות.'
export const NO_INVITES_TITLE = 'טרם נשלח אף זימון לאירוע הזה.'
export const SORT_LINE = 'ממוין: בפנים · פתוח · יצא'
export const SCOPE_NOTE =
  'שינוי הכמות נרשם כשינוי-תכולה עם סיבה; ההצעה נשארת קפואה. אין חסימת-זמן — שינוי מאוחר נרשם ומסומן כמאוחר.'
export const SMART_MATCH_CLARIFICATION = 'השליחה בשיבוץ החכם נעשית ע"י מנהלת הגיוס.'
export const RAW_STATUS_NOTE = 'כאן מוצג הסטטוס הגולמי כפי שנרשם — לא התווית הנגזרת שלמעלה'
// ‏ζ (צעד 3.0): תג אחראית-המשמרת בלי ★ — הגליף כבר אומר "התרשמות" ב-RatingStars.
export const SHIFT_LEAD_LABEL = 'אחראית משמרת'

// ── עמודת "מה זה אומר" — משפט לכל מצב-תצוגה, לעולם לא ציון (§1.8) ────────────
// הנוסחים לשורות המצוירות (אושרה-סופית-אחראית · פג-תוקף · שוחררה · ביטלה) מילוליים
// מהמוקאפ המאושר; לשאר המצבים (שאינם מצוירים) נגזרו באותה רוח — `הנחתי`, מדווח.
export function assignmentMeaning({
  status,
  expired = false,
  completed = false,
  isShiftLead = false,
  daysWithoutAnswer = null,
  expiredOnText = null,
  hoursLeft = null,
} = {}) {
  if (completed) return 'האירוע התקיים והיא עבדה בו — השיבוץ הושלם.'
  if (expired) {
    const wait =
      daysWithoutAnswer == null || daysWithoutAnswer <= 0
        ? ''
        : daysWithoutAnswer === 1
          ? 'יום אחד ללא מענה, '
          : `${daysWithoutAnswer} ימים ללא מענה, `
    const when = expiredOnText ? ` ב-${expiredOnText}` : ''
    return `${wait}והקישור פג${when}. אין ממה לחכות — היא לא תוכל לענות; הפעולה הבאה היא זימון חדש.`
  }
  switch (status) {
    case 'finally_approved':
      return isShiftLead
        ? 'בפנים. היא אחראית המשמרת של האירוע — אחת לאירוע, ורק על מי שאושרה סופית.'
        : 'בפנים — אושרה סופית לאירוע.'
    case 'pending':
      return hoursLeft == null
        ? 'ממתינה למענה — הקישור עדיין חי.'
        : hoursLeft === 1
          ? 'ממתינה למענה — הקישור חי עוד שעה אחת.'
          : `ממתינה למענה — הקישור חי עוד ${hoursLeft} שעות.`
    case 'confirmed_available':
      return 'אישרה זמינות וממתינה לאישור סופי ממך.'
    case 'declined':
      return 'סירבה לזימון. זימון חוזר פותח סבב חדש — הסירוב נשמר בהיסטוריה.'
    case 'released':
      return 'אנחנו ויתרנו עליה. שחרור אינו נספר לה לרעה בשום מקום.'
    case 'approval_withdrawn':
      return 'היא חזרה בה אחרי שאושרה — כאן נפתח החוסר. שלא כמו שחרור, ביטול שלה כן נספר באמינות ההגעה שלה.'
    default:
      return '—'
  }
}

// ── המשפט-האדום-היחיד של המסך ────────────────────────────────────────────────
// המילים נושאות אותו גם בלי הצבע (§3.4). המקרה החי (#8: כל הזימונים הפתוחים פגו) הוא
// הנוסח המאושר מילה-במילה; שאר הענפים נגזרו — `הנחתי`. אין חוסר ⇒ null ("לא בכוח").
export function teamHeadline({ gap, pendingLive = 0, pendingExpired = 0 } = {}) {
  const missing = Number(gap) || 0
  if (missing <= 0) return null
  const lead = missing === 1 ? '⚠ חסרה דיילת אחת' : `⚠ חסרות ${missing} דיילות`
  if (pendingExpired > 0 && pendingLive === 0) {
    const opening =
      pendingExpired === 1
        ? 'הזימון הפתוח היחיד פג'
        : pendingExpired === 2
          ? 'שני הזימונים הפתוחים פגו'
          : `${pendingExpired} הזימונים הפתוחים פגו`
    return {
      lead,
      rest: `— ${opening} אחרי 48 שעות, כלומר אין קישור חי: גם דיילת שתרצה לאשר עכשיו לא תוכל. הפעולה הבאה היא זימון חדש, לא המתנה.`,
    }
  }
  if (pendingLive > 0) {
    const live =
      pendingLive === 1 ? 'זימון אחד ממתין למענה' : `${pendingLive} זימונים ממתינים למענה`
    return { lead, rest: `— ${live}.` }
  }
  return { lead, rest: '— אין אף זימון פתוח. הפעולה הבאה היא זימון חדש.' }
}

// שורת-המשנה של אריח "חסרות" — "אין אף זימון חי" (המוקאפ) כשכל הפתוחים פגו;
// מונה-ממתינים כשיש חיים. gap=0 ⇒ null.
export function missingTileSub({ gap, pendingLive = 0, pendingExpired = 0 } = {}) {
  const missing = Number(gap) || 0
  if (missing <= 0) return null
  if (pendingLive > 0) {
    return pendingLive === 1 ? 'זימון אחד ממתין למענה' : `${pendingLive} זימונים ממתינים למענה`
  }
  if (pendingExpired > 0) return 'אין אף זימון חי'
  return 'אין אף זימון פתוח'
}

// ── סדר "בפנים · פתוח · יצא" ─────────────────────────────────────────────────
// הסדר הוא ערוץ-מידע (§3.4③, הכרעת-הכרטיס ⑧-2): מי-בפנים לפני מי-פתוח לפני מי-שיצא.
// הדירוג הפנימי (declined לפני released לפני approval_withdrawn) והזימון-החדש-קודם
// בתוך קבוצה נגזרו מסדר-השורות שהמוקאפ מצייר — `הנחתי`.
const TEAM_RANK = {
  finally_approved: 0,
  confirmed_available: 1,
  pending: 2,
  declined: 3,
  released: 4,
  approval_withdrawn: 5,
}

export function sortTeamRows(rows) {
  return [...(rows ?? [])].sort((a, b) => {
    const rank = (TEAM_RANK[a.assignment_status] ?? 9) - (TEAM_RANK[b.assignment_status] ?? 9)
    if (rank !== 0) return rank
    const aInvite = String(a.invite_sent_at ?? '')
    const bInvite = String(b.invite_sent_at ?? '')
    if (aInvite !== bInvite) return bInvite.localeCompare(aInvite)
    // שובר-שוויון יציב — בלעדיו שתי שורות באותו רגע-זימון מתחלפות בין רענונים.
    return String(a.hostess_id ?? '').localeCompare(String(b.hostess_id ?? ''))
  })
}

// שורות "יצא" (שוחררה · ביטלה) מעומעמות — tr.muted במוקאפ.
export function isMutedTeamRow(status) {
  return status === 'released' || status === 'approval_withdrawn'
}

// רגע-התפוגה של זימון: invite_sent_at + 48 שעות, בפורמט DD/MM HH:MM (שעון ישראל).
export function inviteExpiryText(inviteSentAt) {
  const sent = Date.parse(inviteSentAt ?? '')
  if (Number.isNaN(sent)) return null
  return formatTimestamp(new Date(sent + INVITE_VALIDITY_HOURS * 3_600_000).toISOString())
}

// "4 ימים ללא מענה" — ימים שלמים מרגע-השליחה ועד עכשיו.
export function daysWithoutAnswer(inviteSentAt, nowIso) {
  const sent = Date.parse(inviteSentAt ?? '')
  const now = Date.parse(nowIso ?? '')
  if (Number.isNaN(sent) || Number.isNaN(now) || now < sent) return null
  return Math.floor((now - sent) / 86_400_000)
}

// ── הערת-השוליים של היסטוריית-הסבבים — מספרים חיים, לא מועתקים ───────────────
// "9 שורות במסד, 6 דיילות על המסך" — הקיפול של MAX(assignment_number) גלוי במספרים.
export function historyFootnote(rowCount, hostessCount) {
  const rowsText = rowCount === 1 ? 'שורה אחת במסד' : `${rowCount} שורות במסד`
  const hostessText = hostessCount === 1 ? 'דיילת אחת על המסך' : `${hostessCount} דיילות על המסך`
  return `${rowsText}, ${hostessText}: הסטטוס הקובע לכל דיילת הוא של הסבב האחרון שלה. הסבבים הקודמים נשמרים ואינם נמחקים.`
}

// היסטוריית-הסבבים ממוינת סבב→תאריך (המוקאפ: "ממוינות סבב→תאריך").
export function sortRoundsHistory(rows) {
  return [...(rows ?? [])].sort((a, b) => {
    const round = Number(a.assignment_number ?? 0) - Number(b.assignment_number ?? 0)
    if (round !== 0) return round
    const aInvite = String(a.invite_sent_at ?? '')
    const bInvite = String(b.invite_sent_at ?? '')
    if (aInvite !== bInvite) return aInvite.localeCompare(bInvite)
    return String(a.hostess_id ?? '').localeCompare(String(b.hostess_id ?? ''))
  })
}

// ── וריאנט "פרויקט שבוטל" ────────────────────────────────────────────────────
// "3 הדיילות המאושרות שוחררו אוטומטית" שבמוקאפ נוקב במונה שאינו נשמר במסד (המעטפת של
// cancel_project חולפת); המונה החי הוא שורות-שוחררה הקובעות — הנוסח ניטרלי בהתאם
// (שחרור-הביטול תופס גם מי שהייתה pending, לא רק מאושרות). `הנחתי`, מדווח.
export function cancelledReleasedSentence(releasedCount) {
  const count = Number(releasedCount) || 0
  if (count <= 0) return 'אין מה לבחור ואין חוסר — האירוע אינו מתקיים.'
  const released =
    count === 1
      ? 'דיילת אחת שוחררה אוטומטית וקיבלה הודעה'
      : `${count} דיילות שוחררו אוטומטית וקיבלו הודעה`
  return `${released}. אין מה לבחור ואין חוסר — האירוע אינו מתקיים.`
}

// ── מקטע "שינויי-תכולה בכמות הדיילות" ────────────────────────────────────────
// הלשונית מציגה רק שינויי-כמות-דיילות — change_target הוא המבחין שהכרטיס דרש
// (🗄️ דרישה 2: "אחרת הלשונית תציג גם שינויי-תגים").
export function hostessCountChanges(changes) {
  return (changes ?? []).filter((change) => change?.change_target === 'hostess_count')
}

// שורת-העובדה כשאין שינויים — נוסח המוקאפ עם המספרים החיים.
export function scopeFactSentence({ required, approvedOnText } = {}) {
  const since = approvedOnText ? ` (${approvedOnText})` : ''
  return `הכמות עומדת על ${Number(required) || 0} מאז אישור ההצעה${since}. כל שינוי יופיע כאן בשורה משלו — מה השתנה · בכמה · מי ביצע · מתי · והסיבה שנרשמה. ההצעה עצמה נשארת קפואה ואינה משתנה לעולם.`
}
