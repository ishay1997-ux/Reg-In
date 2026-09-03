// שתי איקונות-הממד של צ'יפ-הלוח (איוש/לוגיסטיקה) — עותק-SVG של הסמלים מהמוקאפ המאושר
// (‏`symbol#i-person` / `symbol#i-box`), כי הדפוס "מלא=הושלם, מתאר=חסר" הוא חוזה-נגישות
// לעיוורי-צבעים של המוקאפ עצמו — לא בחירת lucide-react. size-3 קבוע (12px, כמו `.dim-ico`
// במוקאפ) ולא size-4 הכללי: הצ'יפ צפוף מאוד (עד שני צ'יפים ביום, כל אחד עם שני סמלים).
//
// הצבעים קבועים ובלתי-תלויים בצבע-הצ'יפ עצמו (בדיוק כמו במוקאפ: `.dim-ico.ok`/`.dim-ico.miss`
// אינם משתנים לפי r/y/g של הצ'יפ שמסביב) — ok-ink ירוק למלא, danger-ink אדום למתאר. זו בדיוק
// אותה שתי-גוונים כמו `--ok-ink`/`--danger-ink` במוקאפ (green-700/red-700 של Tailwind תואמים
// לגוונים בייט-לבייט: #15803D ו-#B91C1C).

function PersonPath() {
  return (
    <>
      <circle cx="6" cy="3.6" r="2.1" />
      <path d="M2 10.3c0-2.4 1.8-3.9 4-3.9s4 1.5 4 3.9" />
    </>
  )
}

function BoxPath() {
  return (
    <>
      <rect x="1.4" y="3" width="9.2" height="7.2" rx="1" />
      <path d="M1.4 5.6h9.2M6 3v7.2" />
    </>
  )
}

function DimIcon({ filled, children }) {
  const tone = filled ? 'text-green-700' : 'text-red-700'
  return (
    <svg
      viewBox="0 0 12 12"
      className={`size-3 shrink-0 ${tone}`}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={filled ? 0 : 1.6}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// filled = staffingCell-equivalent "מאויש" (confirmed >= required) — איוש.
export function StaffingIcon({ filled }) {
  return (
    <DimIcon filled={filled}>
      <PersonPath />
    </DimIcon>
  )
}

// filled = logisticsCell-equivalent "מוכן" (total===0 || ready===total) — לוגיסטיקה.
export function LogisticsIcon({ filled }) {
  return (
    <DimIcon filled={filled}>
      <BoxPath />
    </DimIcon>
  )
}
