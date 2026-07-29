import { apiGetJson, apiPostJson } from './http'

/** Backend: GET /personnel/get-active-personnel-with-location */
export type ActivePersonnelWithLocation = {
  id: string
  name: string
  latitude: number
  longitude: number
  time: string
}

/** Backend: GET /personnel/get-active-personnel */
export type ActivePersonnelListItem = {
  id?: string
  _id?: string
  name: string
  userTc?: string
  isActive?: boolean
  profilePhoto?: string
}

/** Backend: GET /personnel/get-all-personnel — admin listesi */
export type PersonnelListItem = {
  id: string
  name: string
  userTc: string
  isActive: boolean
  profilePhoto?: string | null
  isPaswordChanged?: boolean
}

export async function getActivePersonnelWithLocation(
  token: string,
): Promise<ActivePersonnelWithLocation[]> {
  const data = await apiGetJson<unknown>(
    '/personnel/get-active-personnel-with-location',
    token,
  )
  if (!Array.isArray(data)) {
    throw new Error('Beklenmeyen sunucu yanıtı')
  }
  return data as ActivePersonnelWithLocation[]
}

export async function getActivePersonnel(
  token: string,
): Promise<ActivePersonnelListItem[]> {
  const data = await apiGetJson<unknown>(
    '/personnel/get-active-personnel',
    token,
  )
  if (!Array.isArray(data)) {
    throw new Error('Beklenmeyen sunucu yanıtı')
  }
  return data as ActivePersonnelListItem[]
}

/** Mobil AdminApiService.getAllPersonnel ile aynı */
export async function getAllPersonnel(
  token: string,
): Promise<PersonnelListItem[]> {
  const data = await apiGetJson<unknown>('/personnel/get-all-personnel', token)
  if (!Array.isArray(data)) {
    throw new Error('Personel listesi alınamadı')
  }
  return (data as Record<string, unknown>[])
    .map((row) => {
      const id = String(row.id ?? row._id ?? '')
      return {
        id,
        name: String(row.name ?? ''),
        userTc: String(row.userTc ?? ''),
        isActive: Boolean(row.isActive),
        profilePhoto:
          typeof row.profilePhoto === 'string' ? row.profilePhoto : null,
        isPaswordChanged: Boolean(row.isPaswordChanged),
      }
    })
    .filter((p) => p.id)
}

/** Mobil AdminApiService.addPersonnel — POST /personnel/create-personnel */
export async function createPersonnel(
  token: string,
  payload: { name: string; userTc: string },
): Promise<void> {
  await apiPostJson<{ message?: string }>(
    '/personnel/create-personnel',
    token,
    payload,
  )
}
