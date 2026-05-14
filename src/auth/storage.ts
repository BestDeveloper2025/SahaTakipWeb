const TOKEN_KEY = 'sahatakip_admin_access_token'
const USER_ID_KEY = 'sahatakip_admin_user_id'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY)
}

export function setAuthSession(token: string, userId: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_ID_KEY, userId)
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
}
