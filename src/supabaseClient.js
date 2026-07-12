import { createClient } from '@supabase/supabase-js'

// משיכת המפתחות בצורה מאובטחת מתוך קובץ ההגדרות שיצרנו
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// יצירת צינור החיבור הרשמי והפעלתו.
// storage: sessionStorage (במקום localStorage ברירת-המחדל) — ה-session נמחק כשסוגרים את
// הלשונית/הדפדפן, ולכן במחשב משותף (עמדת אירוע) משתמש לא נשאר מחובר אחרי סגירה. הוא כן שורד
// רענון דף ו-HMR באותה לשונית. הערה: מי שהיה מחובר ב-localStorage לפני השינוי יצטרך להתחבר
// פעם אחת מחדש. (החלטת אבטחה "סבירה" למערכת פנימית, ראו PROJECT_MASTER §5.1.)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
})
