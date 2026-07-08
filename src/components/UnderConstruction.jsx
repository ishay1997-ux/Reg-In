// Placeholder גנרי למודולים שעדיין לא נבנו (2-6, 8-11). מציג רק שם מודול, בלי לוגיקה.

export default function UnderConstruction({ moduleName }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-4xl mb-3">🚧</p>
      <h1 className="text-xl font-bold text-slate-800 mb-1">{moduleName}</h1>
      <p className="text-slate-500">המסך הזה עדיין בבנייה.</p>
    </div>
  )
}
