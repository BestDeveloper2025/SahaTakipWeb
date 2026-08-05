import { apiPostJson } from './http'

export type MachineListItem = {
  id: string
  name: string
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export async function getAllMachines(token: string): Promise<MachineListItem[]> {
  const data = await apiPostJson<unknown>('/machine/get-all', token, {})
  if (!Array.isArray(data)) {
    throw new Error('Makina listesi alınamadı')
  }
  return (data as Record<string, unknown>[])
    .map((row) => ({
      id: String(row.id ?? row._id ?? ''),
      name: String(row.name ?? ''),
      isDeleted:
        typeof row.isDeleted === 'boolean' ? row.isDeleted : undefined,
      createdAt:
        typeof row.createdAt === 'string' ? row.createdAt : undefined,
      updatedAt:
        typeof row.updatedAt === 'string' ? row.updatedAt : undefined,
    }))
    .filter((m) => m.id && m.name)
}

export async function addMachine(
  token: string,
  name: string,
): Promise<MachineListItem> {
  const data = await apiPostJson<{ machine?: Record<string, unknown> }>(
    '/machine/add',
    token,
    { name: name.trim() },
  )
  const row = data.machine
  if (!row) {
    throw new Error('Makina eklenemedi')
  }
  const id = String(row.id ?? row._id ?? '')
  if (!id) throw new Error('Makina eklenemedi')
  return {
    id,
    name: String(row.name ?? name.trim()),
    isDeleted:
      typeof row.isDeleted === 'boolean' ? row.isDeleted : undefined,
    createdAt:
      typeof row.createdAt === 'string' ? row.createdAt : undefined,
    updatedAt:
      typeof row.updatedAt === 'string' ? row.updatedAt : undefined,
  }
}

export async function updateMachine(
  token: string,
  machineId: string,
  newName: string,
): Promise<void> {
  await apiPostJson('/machine/update', token, {
    machineId,
    newName: newName.trim(),
  })
}

export async function deleteMachine(
  token: string,
  machineId: string,
): Promise<MachineListItem[]> {
  const data = await apiPostJson<unknown>('/machine/delete', token, {
    machineId,
  })
  if (!Array.isArray(data)) {
    throw new Error('Makina silinemedi')
  }
  return (data as Record<string, unknown>[])
    .map((row) => ({
      id: String(row.id ?? row._id ?? ''),
      name: String(row.name ?? ''),
      isDeleted:
        typeof row.isDeleted === 'boolean' ? row.isDeleted : undefined,
      createdAt:
        typeof row.createdAt === 'string' ? row.createdAt : undefined,
      updatedAt:
        typeof row.updatedAt === 'string' ? row.updatedAt : undefined,
    }))
    .filter((m) => m.id && m.name)
}

export function filterMachinesByQuery(
  machines: MachineListItem[],
  query: string,
): MachineListItem[] {
  const q = query.trim().toLocaleLowerCase('tr')
  if (!q) return machines
  return machines.filter((m) =>
    m.name.toLocaleLowerCase('tr').includes(q),
  )
}

export function getMachineNameById(
  machines: MachineListItem[],
  machineId: string,
): string {
  return machines.find((m) => m.id === machineId)?.name ?? ''
}
