export type AuthRole = 'admin' | 'personnel'

const TOKEN_KEY = 'sahatakip_admin_access_token'
const USER_ID_KEY = 'sahatakip_admin_user_id'
const ROLE_KEY = 'sahatakip_auth_role'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY)
}

export function getStoredRole(): AuthRole | null {
  const r = localStorage.getItem(ROLE_KEY)
  if (r === 'admin' || r === 'personnel') return r
  return null
}

export function setAuthSession(
  token: string,
  userId: string,
  role: AuthRole,
): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_ID_KEY, userId)
  localStorage.setItem(ROLE_KEY, role)
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(ROLE_KEY)
}
