import { apiPostJson } from './http'

/** POST /remote-service-request/get-all — mobil RemoteServiceDto ile aynı */
export type RemoteServiceListItem = {
  id: string
  personnelID: string
  personnelName: string
  teamPersonnelIDs?: string[]
  teamPersonnelNames?: string[]
  customerID: string
  customerName: string
  machineID?: string
  machineName: string
  serviceDescription: string
  date: string
  startTime: string
  endTime: string
  photoUrls: string[]
  createdAt?: string
  updatedAt?: string
}

export async function getAllRemoteServices(
  token: string,
): Promise<RemoteServiceListItem[]> {
  const data = await apiPostJson<unknown>(
    '/remote-service-request/get-all',
    token,
    {},
  )
  if (!Array.isArray(data)) {
    throw new Error('Uzaktan servis listesi alınamadı')
  }
  return (data as Record<string, unknown>[])
    .map((row) => {
      const id = String(row.id ?? row._id ?? '')
      const photoUrls = Array.isArray(row.photoUrls)
        ? row.photoUrls.filter((u): u is string => typeof u === 'string')
        : []
      return {
        id,
        personnelID: String(row.personnelID ?? ''),
        personnelName: String(row.personnelName ?? ''),
        customerID: String(row.customerID ?? ''),
        customerName: String(row.customerName ?? ''),
        machineID: String(row.machineID ?? ''),
        machineName: String(row.machineName ?? ''),
        serviceDescription: String(row.serviceDescription ?? ''),
        date: String(row.date ?? ''),
        startTime: String(row.startTime ?? ''),
        endTime: String(row.endTime ?? ''),
        photoUrls,
        teamPersonnelIDs: Array.isArray(row.teamPersonnelIDs)
          ? row.teamPersonnelIDs.map(String)
          : [],
        teamPersonnelNames: Array.isArray(row.teamPersonnelNames)
          ? row.teamPersonnelNames.map(String)
          : [],
        createdAt:
          typeof row.createdAt === 'string' ? row.createdAt : undefined,
        updatedAt:
          typeof row.updatedAt === 'string' ? row.updatedAt : undefined,
      }
    })
    .filter((r) => r.id)
}

/** Ayrı detail endpoint yok; get-all üzerinden id ile bulur (mobil ile aynı). */
export async function getRemoteServiceById(
  token: string,
  id: string,
): Promise<RemoteServiceListItem | null> {
  const rows = await getAllRemoteServices(token)
  return rows.find((r) => r.id === id) ?? null
}

