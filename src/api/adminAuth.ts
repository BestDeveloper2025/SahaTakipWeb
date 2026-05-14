import { API_BASE } from '../config'

export type AdminLoginResponse = {
  access_token: string
  userId: string
}

export type AdminLoginBody = {
  userName: string
  password: string
}

function parseErrorMessage(data: unknown): string {
  if (
    data &&
    typeof data === 'object' &&
    'message' in data &&
    data.message !== undefined
  ) {
    const m = (data as { message: unknown }).message
    if (Array.isArray(m)) return m.join(', ')
    if (typeof m === 'string') return m
  }
  return 'Giriş başarısız'
}

export async function adminLogin(
  body: AdminLoginBody,
): Promise<AdminLoginResponse> {
  const res = await fetch(`${API_BASE}/admin/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })

  const data: unknown = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(parseErrorMessage(data))
  }

  const out = data as Partial<AdminLoginResponse>
  if (!out.access_token || !out.userId) {
    throw new Error('Sunucu yanıtı geçersiz')
  }

  return { access_token: out.access_token, userId: out.userId }
}
