import { apiGetJson } from './http'

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
