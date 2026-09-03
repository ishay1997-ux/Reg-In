// מחולל-אקראי **קבוע** (seeded) לגנרטור נתוני-ההדגמה — `seed-data-spec.md §ו׳3 ②`.
// `Math.random()` אסור כאן בכוונה: הרצה שנייה של הגנרטור חייבת לייצר בדיוק אותה תוכנית,
// אחרת עוגני-הבדיקה (§א׳) זזים בין ריצות בלי שאיש נגע בקוד. mulberry32 קטן, ידוע, ומספיק.

// FNV-1a על מחרוזת ⇒ מספר-זרע. אותו גיבוב שכבר חי ב-`src/lib/smartMatch.js` (tieBreakKey)
// — כאן כדי שמזהה-אצווה קריא ("seed-2026-09-04-a") יהפוך לזרע מספרי יציב.
export function hashSeed(text) {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

export function createRng(seed) {
  let state = typeof seed === 'number' ? seed >>> 0 : hashSeed(String(seed))

  // mulberry32 — מחזיר מספר ב-[0,1).
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    // שלם בטווח סגור [min, max].
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    // ממשי בטווח [min, max).
    float: (min, max) => min + next() * (max - min),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    // בחירה משוקללת: items = [{ weight, value }] — משקל 0 לעולם אינו נבחר.
    weighted(items) {
      const total = items.reduce((sum, item) => sum + Math.max(item.weight, 0), 0)
      if (total <= 0) return null
      let roll = next() * total
      for (const item of items) {
        roll -= Math.max(item.weight, 0)
        if (roll < 0) return item.value
      }
      return items.at(-1).value
    },
    // ערבוב פישר-ייטס על עותק.
    shuffle(arr) {
      const copy = [...arr]
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    },
    // התפלגות נורמלית מקורבת (Box–Muller) — לרעש סביב קו-מגמה.
    gauss(mean = 0, stdDev = 1) {
      const u = 1 - next()
      const v = next()
      return mean + stdDev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    },
  }
}
