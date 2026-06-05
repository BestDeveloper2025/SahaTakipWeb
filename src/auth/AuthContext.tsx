import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { adminLogin } from '../api/adminAuth'
import { personnelLogin } from '../api/personnelAuth'
import { isAccessTokenExpired, msUntilJwtExpiry } from './jwt'
import {
  clearAuthSession,
  getStoredRole,
  getStoredToken,
  getStoredUserId,
  setAuthSession,
  type AuthRole,
} from './storage'

type Session = {
  token: string | null
  userId: string | null
  role: AuthRole | null
}

type AuthContextValue = {
  token: string | null
  userId: string | null
  role: AuthRole | null
  isAuthenticated: boolean
  isAdmin: boolean
  isPersonnel: boolean
  login: (
    userName: string,
    password: string,
    role: AuthRole,
  ) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredSession(): Session {
  const token = getStoredToken()
  const userId = getStoredUserId()
  const role = getStoredRole()

  if (!token || !userId) {
    if (token || userId) clearAuthSession()
    return { token: null, userId: null, role: null }
  }

  if (isAccessTokenExpired(token)) {
    clearAuthSession()
    return { token: null, userId: null, role: null }
  }

  return {
    token,
    userId,
    role: role ?? 'admin',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(() => readStoredSession())

  const token = session.token
  const userId = session.userId
  const role = session.role

  const logout = useCallback(() => {
    clearAuthSession()
    setSession({ token: null, userId: null, role: null })
  }, [])

  useEffect(() => {
    if (!token) return

    const delay = msUntilJwtExpiry(token)
    if (delay === null) return
    if (delay === 0) {
      logout()
      return
    }

    const id = window.setTimeout(() => logout(), delay)
    return () => window.clearTimeout(id)
  }, [token, logout])

  const login = useCallback(
    async (userName: string, password: string, loginRole: AuthRole) => {
      const trimmed = userName.trim()
      const res =
        loginRole === 'admin'
          ? await adminLogin({ userName: trimmed, password })
          : await personnelLogin({ userName: trimmed, password })

      setAuthSession(res.access_token, res.userId, loginRole)
      setSession({
        token: res.access_token,
        userId: res.userId,
        role: loginRole,
      })
    },
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      userId,
      role,
      isAuthenticated: Boolean(token),
      isAdmin: role === 'admin',
      isPersonnel: role === 'personnel',
      login,
      logout,
    }),
    [token, userId, role, login],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth yalnızca AuthProvider içinde kullanılabilir')
  }
  return ctx
}

export type { AuthRole }
