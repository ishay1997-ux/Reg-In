// קונטקסט משותף: מי מחובר, מה הסטטוס/תפקיד שלו, ומה מפת ההרשאות שלו (module_name -> permission_level).
// נבנה כדי ש-Sidebar, ProtectedRoute, ו-Topbar לא ישכפלו את אותה שאילתת "מי אני" שוב ושוב.

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/supabaseClient"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null) // { email, fullName, phone, status, roleId, roleName }
  const [permissions, setPermissions] = useState({}) // { [module_name]: 'edit' | 'view' | 'blocked' }

  async function loadUser() {
    setLoading(true)

    const { data: sessionData } = await supabase.auth.getSession()
    const email = sessionData?.session?.user?.email

    if (!email) {
      setUser(null)
      setPermissions({})
      setLoading(false)
      return
    }

    const { data: myRow, error: myRowError } = await supabase
      .from("users")
      .select("email, full_name, phone, status, role_id, roles(role_name)")
      .eq("email", email)
      .single()

    if (myRowError || !myRow) {
      setUser(null)
      setPermissions({})
      setLoading(false)
      return
    }

    setUser({
      email: myRow.email,
      fullName: myRow.full_name,
      phone: myRow.phone,
      status: myRow.status,
      roleId: myRow.role_id,
      roleName: myRow.roles?.role_name || "",
    })

    if (myRow.status === "active") {
      const { data: permRows } = await supabase
        .from("permissions")
        .select("permission_level, modules(module_name)")
        .eq("role_id", myRow.role_id)

      const map = {}
      for (const row of permRows || []) {
        if (row.modules?.module_name) {
          map[row.modules.module_name] = row.permission_level
        }
      }
      setPermissions(map)
    } else {
      setPermissions({})
    }

    setLoading(false)
  }

  useEffect(() => {
    loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setPermissions({})
  }

  return (
    <AuthContext.Provider value={{ loading, user, permissions, reload: loadUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
