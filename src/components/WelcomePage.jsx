// דף נחיתה זמני - ברירת המחדל אחרי התחברות, עד שמסך הבית האמיתי (מודול 7, src/modules/07_dashboard/) ייבנה.

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        ברוכים הבאים לכלים הניהוליים של REG-IN
      </h1>
      <p className="text-slate-500">בחרו מודול מהתפריט מימין כדי להתחיל.</p>
    </div>
  )
}
