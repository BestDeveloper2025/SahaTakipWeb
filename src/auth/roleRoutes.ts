import type { AuthRole } from './storage'

export const ADMIN_HOME = '/'
export const PERSONNEL_HOME = '/personel'

export function homePathForRole(role: AuthRole | null): string {
  return role === 'personnel' ? PERSONNEL_HOME : ADMIN_HOME
}

/** Giriş sonrası yönlendirme: personel her zaman kendi alanına; yönetici önceki sayfa veya panel. */
export function pathAfterLogin(role: AuthRole, from?: string): string {
  if (role === 'personnel') return PERSONNEL_HOME
  if (
    from &&
    from !== '/login' &&
    from !== PERSONNEL_HOME &&
    !from.startsWith('/personel/')
  ) {
    return from
  }
  return ADMIN_HOME
}

export function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_HOME || pathname.startsWith('/servisler')
}

export function isPersonnelPath(pathname: string): boolean {
  return pathname === PERSONNEL_HOME || pathname.startsWith('/personel/')
}
