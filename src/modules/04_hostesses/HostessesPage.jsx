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
import RepositoryTab from './RepositoryTab'
import HostessFormDialog from './HostessFormDialog'
import HostessViewCard from './HostessViewCard'

const TABS = {
  overview: 'מעקב פניות ושיבוצים',
  repository: 'מאגר דיילות',
}

export default function HostessesPage() {
  // ⚠️ ברירת-המחדל היא **מאגר דיילות** כל עוד משטח 1 לא נבנה (צעד 3.3) — פתיחה על
  // לשונית ריקה הייתה נראית כמו מסך שבור. הסדר החזותי נשאר כמצויר במוקאפ.
  const [tab, setTab] = useState('repository')

  // מפתח-רענון: כל שמירה מגדילה אותו, והטבלה טוענת מחדש. 🚫 לא state שמועבר פנימה —
  // הנתונים חיים בשכבת-ה-API, ומצב-מסך שמשכפל אותם מתיישן בשקט.
  const [reloadKey, setReloadKey] = useState(0)
  const [formHostessId, setFormHostessId] = useState(undefined) // undefined=סגור · null=חדשה · מספר=עריכה
  const [cardHostessId, setCardHostessId] = useState(null)

  function handleSaved() {
    setFormHostessId(undefined)
    setReloadKey((k) => k + 1)
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
          <p
            className="py-10 text-center text-sm text-slate-500"
            data-testid="overview-placeholder"
          >
            מבט-על השיבוצים ייבנה בצעד הבא של המודול.
          </p>
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
