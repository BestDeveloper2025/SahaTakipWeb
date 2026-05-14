import { apiGetJson, apiPostJson } from './http'

export type ServiceCustomer = {
  id?: string
  name: string
  orderNumber?: number
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
} | null

/** GET get-all-services / get-in-progress-services öğesi */
export type ServiceListItem = {
  id: string
  assignedPersonnel: string[]
  createdTime: string
  machineName: string
  problemDescription: string
  serviceNumber: string
  serviceType: string
  status: string
  detectedFault?: string
  isUnderWarranty?: boolean | null
  warrantyNote?: string | null
  customer: ServiceCustomer
}

export type AssignedPersonnelDetail = {
  id: string
  name: string
  userTc: string
  isActive: boolean
  profilePhoto?: string
}

/** POST get-service-by-id */
export type ServiceDetail = {
  id: string
  assignedPersonnel: AssignedPersonnelDetail[]
  createdTime: string
  machineName: string
  problemDescription: string
  serviceNumber: string
  serviceType: string
  status: string
  detectedFault?: string
  isUnderWarranty?: boolean | null
  warrantyNote?: string | null
  customer: ServiceCustomer
}

export type EducationTypeRef = { id: string; name: string }

export type EducationContentGroup = {
  typeId: string
  typeName: string
  items: string[]
}

export async function getAllServices(token: string): Promise<ServiceListItem[]> {
  const data = await apiGetJson<unknown>(
    '/service/get-all-services',
    token,
  )
  if (!Array.isArray(data)) throw new Error('Servis listesi alınamadı')
  return data as ServiceListItem[]
}

export async function getInProgressServices(
  token: string,
): Promise<ServiceListItem[]> {
  const data = await apiGetJson<unknown>(
    '/service/get-in-progress-services',
    token,
  )
  if (!Array.isArray(data)) throw new Error('Aktif servis listesi alınamadı')
  return data as ServiceListItem[]
}

export async function getServiceById(
  token: string,
  id: string,
): Promise<ServiceDetail | null> {
  const data = await apiPostJson<ServiceDetail | null>(
    '/service/get-service-by-id',
    token,
    { id },
  )
  return data
}

export async function getServiceEducationTypes(
  token: string,
  serviceId: string,
): Promise<EducationTypeRef[]> {
  const data = await apiPostJson<unknown>(
    '/service/get-service-education-types',
    token,
    { serviceId },
  )
  if (!Array.isArray(data)) return []
  return data as EducationTypeRef[]
}

export async function getEducationContentsByServiceId(
  token: string,
  serviceId: string,
): Promise<EducationContentGroup[]> {
  const data = await apiPostJson<unknown>(
    '/service/get-education-contents-by-service-id',
    token,
    { serviceId },
  )
  if (!Array.isArray(data)) return []
  return data as EducationContentGroup[]
}

export async function getServiceReportUrl(
  token: string,
  serviceId: string,
): Promise<string | null> {
  try {
    const res = await apiPostJson<{ reportUrl?: string }>(
      '/service/get-service-report',
      token,
      { serviceId },
    )
    return res?.reportUrl ?? null
  } catch {
    return null
  }
}
