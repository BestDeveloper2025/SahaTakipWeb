import { API_BASE } from '../config'

export type PersonnelLoginResponse = {
  access_token: string
  userId: string
}

export type PersonnelLoginBody = {
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

/** Backend: POST /auth/personnel-login — userName = personel TC */
export async function personnelLogin(
  body: PersonnelLoginBody,
): Promise<PersonnelLoginResponse> {
  const res = await fetch(`${API_BASE}/auth/personnel-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })

  const data: unknown = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(parseErrorMessage(data))
  }

  const out = data as Partial<PersonnelLoginResponse>
  if (!out.access_token || !out.userId) {
    throw new Error('Sunucu yanıtı geçersiz')
  }

  return { access_token: out.access_token, userId: out.userId }
}
