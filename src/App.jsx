// ============================================================================
// App — עץ הניתוב הראשי של המערכת
// ----------------------------------------------------------------------------
// <AuthProvider> עוטף את כל ה-Router כך שלכל מסך יש גישה ל"מי אני ומה מותר לי".
// מבנה הנתיבים:
//   • /login — הנתיב הציבורי היחיד, מחוץ ל-MainLayout (בלי סרגלים, בלי הגנת session).
//   • כל השאר — מקוננים תחת <MainLayout> שאוכף session פעיל + status='active'.
//       – / (WelcomePage) ו-/profile נגישים לכל משתמש מחובר.
//       – /system/* — מנכ"ל בלבד (ProtectedRoute allow={CEO_ROLE_NAME}); מאחד
//         ניהול-משתמשים/הרשאות/פרמטרים תחת טאבים עם URL אמיתי לכל אחד.
//       – מודולים עסקיים (customers/quotes/...) — כל אחד חסום לפי הרשאת המודול שלו
//         (allow="<module_name>"); כרגע מציגים UnderConstruction עד שייבנו.
// ProtectedRoute כאן = שכבת הגנה שנייה מעל סינון-התפריט ב-Sidebar ומעל RLS ב-DB (הגנה לעומק).
// ============================================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/contexts/AuthContext"
import { CEO_ROLE_NAME } from "@/lib/constants"
import MainLayout from "@/components/layout/MainLayout"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import LoginPage from "@/modules/01_auth/LoginPage"
import SystemManagementPage from "@/modules/01_auth/SystemManagementPage"
import UsersManagementPage from "@/modules/01_auth/UsersManagementPage"
import PermissionsMatrixPage from "@/modules/01_auth/PermissionsMatrixPage"
import WelcomePage from "@/components/WelcomePage"
import UnderConstruction from "@/components/UnderConstruction"
import ProfileSettingsPage from "@/components/ProfileSettingsPage"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<MainLayout />}>
            <Route index element={<WelcomePage />} />
            {/* נגיש לכל משתמש מחובר בלי קשר לתפקיד - בכוונה בלי ProtectedRoute, MainLayout כבר חוסם לא-מחוברים/מוקפאים */}
            <Route path="profile" element={<ProfileSettingsPage />} />

            <Route
              path="system"
              element={
                <ProtectedRoute allow={CEO_ROLE_NAME}>
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
                  <UnderConstruction moduleName="לקוחות" />
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
                  <UnderConstruction moduleName="גיוס" />
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
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
