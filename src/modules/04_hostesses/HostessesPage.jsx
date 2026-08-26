// מודול 4 · העמוד הראשי — שתי לשוניות של אותו מסך, בדיוק כפי שהמוקאפים המאושרים מציגים:
// **"מעקב פניות ושיבוצים"** (משטח 1, צעד 3.3) ו-**"מאגר דיילות"** (משטח 3, בנוי).
//
// 🔴 **הלשוניות אינן ניווט אלא שני מבטים על אותו עולם**, ולכן הן חיות בעמוד אחד ולא
// בשני מסלולים: המנהלת עוברת ביניהן עשרות פעמים ביום — היא מאתרת דיילת במאגר וחוזרת
// לראות איזה אירוע עוד חסר. מסלול נפרד היה מאבד את מצב-הסינון בכל מעבר.
//
// שלושת המשטחים שנפתחים מכאן (3ב הוספה · 3ג עריכה · 3ד צפייה) הם **חלונות מעל הטבלה
// ולא עמודים** — `processes-approved.md` מצטט את C5 מפורשות: *"באותו מסך"*.

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import RepositoryTab from './RepositoryTab'
import OverviewTab from './OverviewTab'
import HostessFormDialog from './HostessFormDialog'
import HostessViewCard from './HostessViewCard'
import SmartMatchPage from './SmartMatchPage'
import { resendExpiredInvites } from './api'

const TABS = {
  overview: 'מעקב פניות ושיבוצים',
  repository: 'מאגר דיילות',
}

export default function HostessesPage() {
  // ⚠️ **ברירת-המחדל חזרה למבט-העל** (09/08/2026, צעד 3.3): עד שהמשטח נבנה היא הוסטה
  // זמנית ל"מאגר דיילות" כדי לא לפתוח על לשונית ריקה. עכשיו הסדר הוא כמצויר במוקאפ —
  // וזה גם הסדר הנכון מוצרית: המנהלת נכנסת כדי לראות **איפה חסר**, לא כדי לדפדף במאגר.
  const [tab, setTab] = useState('overview')

  // מפתח-רענון: כל שמירה מגדילה אותו, והטבלה טוענת מחדש. 🚫 לא state שמועבר פנימה —
  // הנתונים חיים בשכבת-ה-API, ומצב-מסך שמשכפל אותם מתיישן בשקט.
  const [reloadKey, setReloadKey] = useState(0)
  const [formHostessId, setFormHostessId] = useState(undefined) // undefined=סגור · null=חדשה · מספר=עריכה
  const [cardHostessId, setCardHostessId] = useState(null)

  // 🔴 **מסך השיבוץ מחליף את העמוד ואינו חלון מעליו** — בשונה מ-3ב/3ג/3ד. זו החלטה
  // שהמוקאפ המאושר קובע: הוא מצייר **מסך מלא** עם `← חזרה למבט-על` משלו, ולא פופ-אפ.
  // 🚫 **ואינו מסלול נפרד** — המנהלת נכנסת ויוצאת עשרות פעמים ביום, ומסלול היה מאבד את
  // מצב-הסינון של המבט-על בכל חזרה. אותו נימוק בדיוק שבגללו הלשוניות אינן ניווט.
  // 🔗 **וכניסה מכרטיס-פרויקט נוחתת ישר על השיבוץ של אותו פרויקט** (ישי, 22/08/2026):
  // ‏`TeamTab` מעביר `state={{ smartMatchProjectId }}`, ואנחנו קוראים אותו **פעם אחת, באתחול**.
  // 🚫 **וזה במכוון אינו מסלול ואינו פרמטר-שאילתה** — ר' ההערה שמעל: מסלול היה מאבד את
  // מצב-הסינון של המבט-על בכל חזרה, וזו בדיוק הסיבה שהמסך הזה אינו כתובת מלכתחילה.
  // ⚠️ **וה-`state` נמחק ב-`onBack`** (`replace: true`), אחרת רענון-דף אחרי חזרה למבט-על
  // היה פותח את השיבוץ מחדש — היסטוריה ששומרת כוונה שהמשתמשת כבר ביטלה.
  const location = useLocation()
  const navigate = useNavigate()
  const [smartMatchProjectId, setSmartMatchProjectId] = useState(
    () => location.state?.smartMatchProjectId ?? null,
  )

  function handleSaved() {
    setFormHostessId(undefined)
    setReloadKey((k) => k + 1)
  }

  if (smartMatchProjectId !== null) {
    return (
      <SmartMatchPage
        projectId={smartMatchProjectId}
        onBack={() => {
          setSmartMatchProjectId(null)
          // מוחק את כוונת-הכניסה מההיסטוריה — אחרת רענון היה פותח את השיבוץ מחדש.
          if (location.state?.smartMatchProjectId != null) {
            navigate(location.pathname, { replace: true, state: null })
          }
          // ⚠️ רענון בחזרה, ולא "רק כשמשהו נשמר": השיבוצים שנשלחו במסך ההוא הם בדיוק
          // מה שמשנה את המונים במבט-על, ומסך שמראה נתון ישן אחרי פעולה נקרא כמו באג.
          setReloadKey((k) => k + 1)
        }}
      />
    )
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-800">דיילות</h1>
        <p className="mt-0.5 text-xs text-slate-500">מאגר הדיילות ומעקב השיבוצים</p>
      </div>

      <div className="rounded-xl bg-white px-4 pb-4 shadow-sm">
        <div className="-mx-4 mb-3 flex items-center gap-1 border-b border-slate-200 px-4">
          {Object.entries(TABS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`border-b-2 px-4 py-2.5 text-sm ${
                tab === key
                  ? 'border-teal-600 font-semibold text-teal-700'
                  : 'border-transparent font-medium text-slate-500'
              }`}
              data-testid={`hostesses-tab-${key}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'repository' ? (
          <RepositoryTab
            reloadKey={reloadKey}
            onAdd={() => setFormHostessId(null)}
            onEdit={(id) => setFormHostessId(id)}
            onOpenCard={(id) => setCardHostessId(id)}
          />
        ) : (
          <OverviewTab
            reloadKey={reloadKey}
            // 🔗 ‏`window.location.origin` ולא קבוע: מייל שנשלח מסביבת-פיתוח חייב להצביע
            // לסביבת-פיתוח, אחרת "בדקתי את הקישור" בודק את הפרודקשן ולא את מה שנבנה.
            onResendExpired={(projectIds) =>
              resendExpiredInvites(projectIds, window.location.origin)
            }
            onOpenSmartMatch={(projectId) => setSmartMatchProjectId(projectId)}
          />
        )}
      </div>

      {formHostessId !== undefined && (
        <HostessFormDialog
          hostessId={formHostessId}
          onClose={() => setFormHostessId(undefined)}
          onSaved={handleSaved}
        />
      )}

      {cardHostessId !== null && (
        <HostessViewCard
          hostessId={cardHostessId}
          onClose={() => setCardHostessId(null)}
          onEdit={(id) => {
            setCardHostessId(null)
            setFormHostessId(id)
          }}
        />
      )}
    </div>
  )
}
