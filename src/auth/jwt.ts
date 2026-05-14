/** JWT payload’daki exp (saniye) değerini epoch ms cinsinden döndürür */
export function getJwtExpiryMs(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    const json = atob(base64)
    const payload = JSON.parse(json) as { exp?: unknown }
    if (typeof payload.exp !== 'number') return null
    return payload.exp * 1000
  } catch {
    return null
  }
}

/**
 * Süresi doldu mu (varsayılan 1 dk önce yenile — sunucu saat kayması).
 * exp okunamazsa false (önce API’ye bırakırız).
 */
export function isAccessTokenExpired(
  token: string,
  skewMs = 60_000,
): boolean {
  const exp = getJwtExpiryMs(token)
  if (exp === null) return false
  return Date.now() >= exp - skewMs
}

/** exp’e kalan süre; geçmişse 0; exp yoksa null */
export function msUntilJwtExpiry(
  token: string,
  skewMs = 60_000,
): number | null {
  const exp = getJwtExpiryMs(token)
  if (exp === null) return null
  return Math.max(0, exp - Date.now() - skewMs)
}
