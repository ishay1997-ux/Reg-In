// ============================================================================
// App — עץ הניתוב הראשי של המערכת
// ----------------------------------------------------------------------------
// <AuthProvider> עוטף את כל ה-Router כך שלכל מסך יש גישה ל"מי אני ומה מותר לי".
// מבנה הנתיבים:
//   • /login — מחוץ ל-MainLayout (בלי סרגלים, בלי הגנת session).
//   • /shift/:token — משטח 5, הדף הציבורי לאישור משמרת. **הנתיב היחיד שנצרך ע"י אדם
//     בלי חשבון כלל** (‏/login לפחות מוביל להתחברות; זה לא). מחוץ ל-MainLayout, בלי
//     ProtectedRoute, והגנתו כולה בשתי פונקציות-DB. ר' ההערה המלאה בגוף הקובץ.
//     *(השורה הזו אמרה "‏/login — הנתיב הציבורי היחיד" עד 10/08/2026, צעד 3.6.)*
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
import PricesManagementPage from '@/modules/01_auth/PricesManagementPage'
import CustomersPage from '@/modules/02_customers/CustomersPage'
import CustomerDetailsPage from '@/modules/02_customers/CustomerDetailsPage'
import QuoteBuilderPage from '@/modules/03_quotes/QuoteBuilderPage'
import QuotesPage from '@/modules/03_quotes/QuotesPage'
import HostessesPage from '@/modules/04_hostesses/HostessesPage'
import LogisticsPage from '@/modules/05_logistics/LogisticsPage'
import ProjectsPage from '@/modules/06_projects/ProjectsPage'
import ProjectCardPage from '@/modules/06_projects/ProjectCardPage'
import PublicConfirmPage from '@/modules/04_hostesses/PublicConfirmPage'
import FinancePage from '@/modules/08_finance/FinancePage'
import PublicFeedbackPage from '@/modules/08_finance/PublicFeedbackPage'
import ParamsTab from '@/modules/09_settings/ParamsTab'
import MySettingsPage from '@/modules/09_settings/MySettingsPage'
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

                {/* 🔴 משטח 5 — הדף הציבורי לאישור/סירוב משמרת. **מחוץ ל-MainLayout ובלי
                    ProtectedRoute, בכוונה מלאה**: מי שפותחת אותו היא דיילת בטלפון שלה,
                    שקיבלה קישור במייל — **אין לה חשבון ולא יהיה לה**. עטיפה בהגנה כלשהי
                    תשבור את הדף בדיוק עבור מי שהוא נבנה בשבילה.
                    🔴 **הנתיב `/shift/:token` נעול ואינו בחירה** — `confirmUrlFor`
                    (`src/lib/shiftEmails.js:26`) כבר צרב אותו לתוך זימונים שנשלחו, ומייל
                    אי-אפשר להחזיר. שינוי-נתיב אינו נכשל בקול: הוא מייצר 404 לדיילת
                    שמחזיקה קישור ששלחנו, והמנהלת רואה שיבוץ שפשוט לא נענה.
                    ℹ️ **‏`App.routes.test.jsx` אינו נוגע במסלול הזה** — הוא סורק אך ורק
                    את הצאצאים של `<Route element={<MainLayout />}>`. ‏`/login` הוא אותו
                    תקדים בדיוק, והוא אינו ב-`ALLOWED_UNPROTECTED`. 🚫 **ולכן גם אין
                    להוסיף אותו לשם:** רשומה כזו הייתה משתיקה את השומר אם מישהו יעביר את
                    הדף לתוך MainLayout בעתיד — כלומר בדיוק במקרה שבו הוא נחוץ. */}
                <Route path="/shift/:token" element={<PublicConfirmPage />} />

                {/* משטח 8 (S4) — הדף הציבורי למשוב-לקוח. **אותו תקדים מדויק כמו `/shift/:token`
                    ממש מעליו**: מי שפותחת אותו היא לקוחה-חיצונית שקיבלה קישור במייל-הסקר של
                    מ6 — **אין לה חשבון ולא יהיה לה**. מחוץ ל-MainLayout, בלי ProtectedRoute.
                    🔴 **הנתיב `/feedback/:token` נעול ואינו בחירה** — `mint_feedback_token`
                    כבר צורב אותו ל-`projects.feedback_token`, ומייל-סקר אי-אפשר להחזיר.
                    ℹ️ **`App.routes.test.jsx` אינו נוגע במסלול הזה** — הוא סורק אך ורק את
                    הצאצאים של `<Route element={<MainLayout />}>`, ומסלול זה אינו כזה, בדיוק
                    כמו `/shift/:token` ו-`/login`. 🚫 **ולכן גם אין להוסיף אותו ל-
                    `ALLOWED_UNPROTECTED`** — מאותו נימוק שכבר נכתב מעל: רשומה כזו הייתה
                    משתיקה את השומר אם מישהו יעביר את הדף לתוך MainLayout בעתיד. */}
                <Route path="/feedback/:token" element={<PublicFeedbackPage />} />

                <Route element={<MainLayout />}>
                  <Route index element={<WelcomePage />} />
                  {/* נגיש לכל משתמש מחובר בלי קשר לתפקיד - בכוונה בלי ProtectedRoute, MainLayout כבר חוסם לא-מחוברים/מוקפאים */}
                  <Route path="profile" element={<ProfileSettingsPage />} />
                  {/* מודול 9, צעד 3.4 (A-9/R-2) — "ההגדרות שלי". אותו תקדים בדיוק כמו /profile:
                      בכוונה בלי ProtectedRoute משלה, כי "יש לה ≥1 פרמטר בבעלותה" אינו ניתן
                      לביטוי כהרשאת-מודול — ה-RLS (`owner_role_id`) הוא הקיר, לא ה-UI (§4.4). */}
                  <Route path="my-settings" element={<MySettingsPage />} />

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
                    {/* מודול 3 §7.84 — תחזוקת קטלוג/מדרגות/2 פרמטרי-תמחור; כתיבה CEO בלבד (RLS) */}
                    <Route path="prices" element={<PricesManagementPage />} />
                    {/* מודול 9 (צעד 3.1, 02/09/2026): הוחלף UnderConstruction במסך האמיתי.
                        השומר יורש מ-`system` (allow={SYSTEM_MODULES}) ולכן אין עטיפה משלו. */}
                    <Route path="params" element={<ParamsTab />} />
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
                  {/* עמוד-הלקוח (צעד 3.5) — היה חלון עד 30/07/2026.
                      ⚠️ `<ProtectedRoute>` אינו אופציונלי: מסלול תחת MainLayout בלי עטיפה גלוי
                      לכל משתמש מחובר, בלי lint ובלי אזהרה (src/CLAUDE.md). */}
                  <Route
                    path="customers/:customerId"
                    element={
                      <ProtectedRoute allow="לקוחות">
                        <CustomerDetailsPage />
                      </ProtectedRoute>
                    }
                  />
                  {/* מודול 3 — מסך הניהול (3.3) ומסך הבנייה/עריכה (3.2). */}
                  <Route
                    path="quotes"
                    element={
                      <ProtectedRoute allow="הצעות מחיר">
                        <QuotesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="quotes/new"
                    element={
                      <ProtectedRoute allow="הצעות מחיר">
                        <QuoteBuilderPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="quotes/:quoteId/edit"
                    element={
                      <ProtectedRoute allow="הצעות מחיר">
                        <QuoteBuilderPage />
                      </ProtectedRoute>
                    }
                  />
                  {/* מודול 6 (צעד 4.1) — השומר היה נכון מהיום הראשון; הוחלף רק ה-element.
                      הוקדם מ-phase-4 בורדיקט בנה-עכשיו: קישור "לכרטיס →" ממשטח 8 היה 404 חי,
                      והאפיון אוסר זאת במפורש (screens-approved §⑨). */}
                  <Route
                    path="projects"
                    element={
                      <ProtectedRoute allow="פרויקטים">
                        <ProjectsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="projects/:id"
                    element={
                      <ProtectedRoute allow="פרויקטים">
                        <ProjectCardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="hostesses"
                    element={
                      <ProtectedRoute allow="דיילות">
                        <HostessesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="logistics"
                    element={
                      // ‏3.3 (מודול 5, 26/08/2026): הוחלף UnderConstruction במסך האמיתי.
                      // השומר עצמו לא נגע — `allow` זהה-בייט לשורת `modules` (כרטיס §⑨).
                      <ProtectedRoute allow="לוגיסטיקה">
                        <LogisticsPage />
                      </ProtectedRoute>
                    }
                  />
                  {/* מודול 8 (צעד 3.5) — הוחלף UnderConstruction במסך האמיתי. השומר עצמו
                      לא נגע — `allow` זהה-בייט לשורת `modules` (כרטיס §⑨, כמו תקדים מ5). */}
                  <Route
                    path="finance"
                    element={
                      <ProtectedRoute allow="כספים">
                        <FinancePage />
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
