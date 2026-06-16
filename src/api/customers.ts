import { apiPostJson } from './http'

/** POST /customer/get-all öğesi */
export type CustomerListItem = {
  id: string
  name: string
  orderNumber: number
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export type CustomerNormalService = {
  id: string
  serviceNumber: string
  serviceType: string
  machineName: string
  problemDescription: string
  status: string
  createdTime: string
  workedMinutes: number
  workedText: string
}

export type CustomerRemoteService = {
  id: string
  personnelId: string
  personnelName: string
  machineName: string
  serviceDescription: string
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
  durationText: string
}

export type CustomerTimeTotals = {
  totalMinutes: number
  totalText: string
  normalServiceMinutes: number
  normalServiceText: string
  remoteServiceMinutes: number
  remoteServiceText: string
}

export type CustomerRemoteUsage = {
  quotaHours: number
  quotaMinutes: number
  usedMinutes: number
  usedHours: number
  usedText: string
  remainingMinutes: number
  exceeded: boolean
  excessMinutes: number
  excessText: string
  billedMinutes: number
  billedText: string
  unbilledMinutes: number
  unbilledText: string
}

export type RemoteBillingRecord = {
  id: string
  customerId: string
  billedMinutes: number
  billedText: string
  billedDate: string
  note: string
  createdAt: string
}

export type UnbilledCustomer = {
  customerId: string
  customerName: string
  orderNumber: number
  excessMinutes: number
  excessText: string
  billedMinutes: number
  billedText: string
  unbilledMinutes: number
  unbilledText: string
}

/** POST /customer-summary/detail */
export type CustomerSummary = {
  customerId: string
  customerName: string
  orderNumber: number
  totals: CustomerTimeTotals
  remoteUsage: CustomerRemoteUsage
  normalServices: CustomerNormalService[]
  remoteServices: CustomerRemoteService[]
}

export async function getAllCustomers(
  token: string,
): Promise<CustomerListItem[]> {
  const data = await apiPostJson<unknown>('/customer/get-all', token, {})
  if (!Array.isArray(data)) throw new Error('Müşteri listesi alınamadı')
  return data as CustomerListItem[]
}

export async function getCustomerSummary(
  token: string,
  customerId: string,
): Promise<CustomerSummary> {
  return apiPostJson<CustomerSummary>('/customer-summary/detail', token, {
    customerId,
  })
}

export async function getBillingHistory(
  token: string,
  customerId: string,
): Promise<RemoteBillingRecord[]> {
  const data = await apiPostJson<{ records: RemoteBillingRecord[] }>(
    '/customer-summary/billing-history',
    token,
    { customerId },
  )
  return data.records ?? []
}

export async function recordRemoteBilling(
  token: string,
  customerId: string,
  options?: { billedMinutes?: number; note?: string; billedDate?: string },
): Promise<RemoteBillingRecord> {
  return apiPostJson<RemoteBillingRecord>(
    '/customer-summary/record-billing',
    token,
    { customerId, ...options },
  )
}

export async function getUnbilledCustomers(
  token: string,
): Promise<UnbilledCustomer[]> {
  const data = await apiPostJson<{ customers: UnbilledCustomer[] }>(
    '/customer-summary/unbilled-customers',
    token,
    {},
  )
  return data.customers ?? []
}
