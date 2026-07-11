// ============================================================================
// App — עץ הניתוב הראשי של המערכת
// ----------------------------------------------------------------------------
// <AuthProvider> עוטף את כל ה-Router כך שלכל מסך יש גישה ל"מי אני ומה מותר לי".
// מבנה הנתיבים:
//   • /login — הנתיב הציבורי היחיד, מחוץ ל-MainLayout (בלי סרגלים, בלי הגנת session).
//   • כל השאר — מקוננים תחת <MainLayout> שאוכף session פעיל + status='active'.
//       – / (WelcomePage) ו-/profile נגישים לכל משתמש מחובר.
//       – /system/* — permission-driven (ProtectedRoute allow={SYSTEM_MODULES}): נגיש למי
//         שיש לו edit/view על "ניהול הרשאות"/"הגדרות מערכת" (כרגע המנכ"ל בלבד לפי ה-seed,
//         אך מונע-הרשאה ולא role קשיח); מאחד ניהול-משתמשים/הרשאות/פרמטרים תחת טאבים.
//       – מודולים עסקיים (customers/quotes/...) — כל אחד חסום לפי הרשאת המודול שלו
//         (allow="<module_name>"); כרגע מציגים UnderConstruction עד שייבנו.
// ProtectedRoute כאן = שכבת הגנה שנייה מעל סינון-התפריט ב-Sidebar ומעל RLS ב-DB (הגנה לעומק).
// ============================================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import { ToastProvider } from '@/components/ToastProvider'
import { SYSTEM_MODULES } from '@/lib/constants'
import MainLayout from '@/components/layout/MainLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import ErrorBoundary from '@/components/ErrorBoundary'
import LoginPage from '@/modules/01_auth/LoginPage'
import SystemManagementPage from '@/modules/01_auth/SystemManagementPage'
import UsersManagementPage from '@/modules/01_auth/UsersManagementPage'
import PermissionsMatrixPage from '@/modules/01_auth/PermissionsMatrixPage'
import CustomersPage from '@/modules/02_customers/CustomersPage'
import WelcomePage from '@/components/WelcomePage'
import UnderConstruction from '@/components/UnderConstruction'
import ProfileSettingsPage from '@/components/ProfileSettingsPage'
import NotFound from '@/components/NotFound'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          {/* ConfirmProvider + ToastProvider עוטפים את כל המסכים כדי ש-useConfirm()/useToast() יהיו
              זמינים בכולם (חלון-וידוא + התראות אחידים על פני המערכת). */}
          <ConfirmProvider>
            <ToastProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<MainLayout />}>
                  <Route index element={<WelcomePage />} />
                  {/* נגיש לכל משתמש מחובר בלי קשר לתפקיד - בכוונה בלי ProtectedRoute, MainLayout כבר חוסם לא-מחוברים/מוקפאים */}
                  <Route path="profile" element={<ProfileSettingsPage />} />

                  <Route
                    path="system"
                    element={
                      <ProtectedRoute allow={SYSTEM_MODULES}>
                        <SystemManagementPage />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="users" replace />} />
                    <Route path="users" element={<UsersManagementPage />} />
                    <Route path="permissions" element={<PermissionsMatrixPage />} />
                    <Route path="params" element={<UnderConstruction moduleName="פרמטרים" />} />
                  </Route>
                  <Route path="users" element={<Navigate to="/system/users" replace />} />

                  <Route
                    path="customers"
                    element={
                      <ProtectedRoute allow="לקוחות">
                        <CustomersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="quotes"
                    element={
                      <ProtectedRoute allow="הצעות מחיר">
                        <UnderConstruction moduleName="הצעות מחיר" />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="projects"
                    element={
                      <ProtectedRoute allow="פרויקטים">
                        <UnderConstruction moduleName="פרויקטים" />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="hostesses"
                    element={
                      <ProtectedRoute allow="דיילות">
                        <UnderConstruction moduleName="דיילות" />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="logistics"
                    element={
                      <ProtectedRoute allow="לוגיסטיקה">
                        <UnderConstruction moduleName="לוגיסטיקה" />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="finance"
                    element={
                      <ProtectedRoute allow="כספים">
                        <UnderConstruction moduleName="כספים" />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="reports"
                    element={
                      <ProtectedRoute allow='דו"חות'>
                        <UnderConstruction moduleName='דו"חות' />
                      </ProtectedRoute>
                    }
                  />
                  {/* catch-all: נתיב לא-מוכר בתוך המעטפת ⇒ 404 במקום מסך-לבן. לא-מחובר מופנה
                      ל-login ע"י MainLayout לפני שמגיעים לכאן (תיקון 11/07). */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </ToastProvider>
          </ConfirmProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
