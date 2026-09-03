// שומר-רגרסיה: כל מסך תחת <MainLayout> ב-App.jsx חייב <ProtectedRoute> (משלו או מהורה) —
// חוץ מ-index/profile/catch-all שנפתחים בכוונה. src/CLAUDE.md: "מסך חדש הוא פתוח כברירת-מחדל.
// אין lint, אין טסט, אין אזהרה" — הבדיקה הזו היא הטסט שהיה חסר.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'

const traverseAst = traverse.default ?? traverse

// מסכים שבכוונה פתוחים לכל משתמש מחובר-ופעיל — MainLayout עצמו כבר חוסם לא-מחוברים/מוקפאים.
// 'my-settings' (מודול 9, A-9/§4.4, 02/09/2026): "יש לה ≥1 פרמטר בבעלותה" אינה הרשאת-מודול
// שאפשר לבטא ב-`allow`, ולכן אינה יכולה לקבל `<ProtectedRoute>` — הבעלות עצמה, לא ה-UI,
// היא הקיר (RLS על `owner_role_id`). אותו תקדים בדיוק כמו 'profile' משורה מעליי.
const ALLOWED_UNPROTECTED = new Set(['__index__', 'profile', 'my-settings', '*'])

function isJSXElementNamed(node, name) {
  return node?.type === 'JSXElement' && node.openingElement.name.name === name
}

function getAttr(routeNode, attrName) {
  return routeNode.openingElement.attributes.find(
    (a) => a.type === 'JSXAttribute' && a.name.name === attrName,
  )
}

function routeLabel(routeNode) {
  const pathAttr = getAttr(routeNode, 'path')
  if (pathAttr) return pathAttr.value.value
  if (getAttr(routeNode, 'index')) return '__index__'
  return '(ללא path)'
}

function routeChildren(routeNode) {
  return routeNode.children.filter((c) => isJSXElementNamed(c, 'Route'))
}

// סורקת את עץ ה-<Route> שמקונן תחת <Route element={<MainLayout />}> ומחזירה את רשימת
// המסלולים ש"חושפים" מסך (יש להם element שאינו <Navigate>) בלי הגנת <ProtectedRoute>
// — לא משלהם ולא בירושה מ-Route-אב (הגנה שעוטפת את ה-element של ההורה חוסמת גם את
// ה-<Outlet> שמרנדר את הילדים, ולכן ילד ללא עטיפה משלו עדיין מוגן).
export function findUnprotectedRoutes(source) {
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] })
  const violations = []
  let mainLayoutRouteNode = null

  traverseAst(ast, {
    JSXElement(nodePath) {
      const elementAttr = getAttr(nodePath.node, 'element')
      const value = elementAttr?.value
      if (
        value?.type === 'JSXExpressionContainer' &&
        isJSXElementNamed(value.expression, 'MainLayout')
      ) {
        mainLayoutRouteNode = nodePath.node
      }
    },
  })

  if (!mainLayoutRouteNode) {
    throw new Error(
      'לא נמצא <Route element={<MainLayout />}> — מבנה App.jsx השתנה, לעדכן את הבדיקה',
    )
  }

  function walk(routeNode, inheritedProtected) {
    const label = routeLabel(routeNode)
    const elementAttr = getAttr(routeNode, 'element')
    const exprNode =
      elementAttr?.value?.type === 'JSXExpressionContainer' ? elementAttr.value.expression : null

    const ownProtected = isJSXElementNamed(exprNode, 'ProtectedRoute')
    const isNavigate = isJSXElementNamed(exprNode, 'Navigate')
    const isProtectedHere = inheritedProtected || ownProtected

    if (exprNode && !isNavigate && !isProtectedHere && !ALLOWED_UNPROTECTED.has(label)) {
      violations.push(label)
    }

    routeChildren(routeNode).forEach((child) => walk(child, isProtectedHere))
  }

  routeChildren(mainLayoutRouteNode).forEach((child) => walk(child, false))

  return violations
}

describe('App.jsx — כל מסך תחת MainLayout מוגן', () => {
  it('אין מסלול חדש שנשאר פתוח בטעות', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/App.jsx'), 'utf8')
    expect(findUnprotectedRoutes(source)).toEqual([])
  })

  // הטקס שישי דרש 29/07: להוכיח שהשומר באמת נכשל, לא רק שהוא עובר. כאן זה קבוע כבדיקה —
  // מסלול "customers" בעץ מזויף בלי <ProtectedRoute> חייב להיתפס.
  it('השומר תופס מסלול חשוף (מבחן-אדום מבוקר על עותק-בדיקה)', () => {
    const fakeSource = `
      function App() {
        return (
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<MainLayout />}>
              <Route index element={<WelcomePage />} />
              <Route path="profile" element={<ProfileSettingsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        )
      }
    `
    expect(findUnprotectedRoutes(fakeSource)).toEqual(['customers'])
  })

  it('הגנה על Route-אב מגינה גם על ילדיו המקוננים (למשל system/*)', () => {
    const fakeSource = `
      function App() {
        return (
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<WelcomePage />} />
              <Route
                path="system"
                element={<ProtectedRoute allow={SYSTEM_MODULES}><SystemManagementPage /></ProtectedRoute>}
              >
                <Route index element={<Navigate to="users" replace />} />
                <Route path="users" element={<UsersManagementPage />} />
              </Route>
            </Route>
          </Routes>
        )
      }
    `
    expect(findUnprotectedRoutes(fakeSource)).toEqual([])
  })
})
