import { API_BASE } from '../config'

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${p}`
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
  return 'İstek başarısız'
}

export async function apiGetJson<T>(path: string, token: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const data: unknown = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(parseErrorMessage(data))
  }
  return data as T
}

export async function apiPostJson<T>(
  path: string,
  token: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body ?? {}),
  })
  const data: unknown = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(parseErrorMessage(data))
  }
  return data as T
}
