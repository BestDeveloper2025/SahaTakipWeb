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
import { isAccessTokenExpired, msUntilJwtExpiry } from './jwt'
import {
  clearAuthSession,
  getStoredToken,
  getStoredUserId,
  setAuthSession,
} from './storage'

type Session = {
  token: string | null
  userId: string | null
}

type AuthContextValue = {
  token: string | null
  userId: string | null
  isAuthenticated: boolean
  login: (userName: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredSession(): Session {
  const token = getStoredToken()
  const userId = getStoredUserId()

  if (!token || !userId) {
    if (token || userId) clearAuthSession()
    return { token: null, userId: null }
  }

  if (isAccessTokenExpired(token)) {
    clearAuthSession()
    return { token: null, userId: null }
  }

  return { token, userId }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(() => readStoredSession())

  const token = session.token
  const userId = session.userId

  const logout = useCallback(() => {
    clearAuthSession()
    setSession({ token: null, userId: null })
  }, [])

  /** JWT exp geldiğinde otomatik çıkış (payload’da exp yoksa zamanlayıcı kurulmaz) */
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

  const login = useCallback(async (userName: string, password: string) => {
    const trimmed = userName.trim()
    const res = await adminLogin({
      userName: trimmed,
      password,
    })
    setAuthSession(res.access_token, res.userId)
    setSession({ token: res.access_token, userId: res.userId })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      userId,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, userId, login, logout],
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
