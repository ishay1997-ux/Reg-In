import { createClient } from '@supabase/supabase-js'

// משיכת המפתחות בצורה מאובטחת מתוך קובץ ההגדרות שיצרנו
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// יצירת צינור החיבור הרשמי והפעלתו
export const supabase = createClient(supabaseUrl, supabaseKey)