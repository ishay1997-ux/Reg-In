// הרצה לפני כל קובץ בדיקה - מוסיף matchers של jest-dom (toBeInTheDocument וכו')
// ומנקה את ה-DOM אחרי כל בדיקה כדי שבדיקות לא ידלפו אחת לשנייה.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
