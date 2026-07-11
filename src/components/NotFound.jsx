// עמוד 404 — נתיב לא-מוכר. בלי catch-all, נתיב שגוי מרנדר null (מסך לבן) בלי סרגל ובלי דרך-חזרה;
// כאן מוצג מסך-שגיאה ידידותי בתוך המעטפת, עם קישור חזרה לדף הבית. (תיקון 11/07.)

import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="flex flex-col items-center justify-center gap-3 py-20 text-center"
      data-testid="not-found"
    >
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="text-lg font-bold text-slate-800">הדף לא נמצא</h1>
      <p className="text-slate-500">הכתובת שביקשתם אינה קיימת במערכת.</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 h-auto py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold"
      >
        חזרה לדף הבית
      </Link>
    </div>
  )
}
