import { apiGetJson, apiPostJson } from './http'

/** POST /daily-log/get-service-logs satırı */
export type ServiceDailyLogItem = {
  serviceID: string
  personnelID: string
  personnelName?: string
  note?: string
  photoUrls?: string[]
  startTime?: string
  endTime?: string | null
  date?: string
}

export type WorkReportDay = {
  date: string
  start: string
  end: string | null
  status: 'COMPLETED' | 'IN_PROGRESS'
  workedMinutes: number | null
  workedText: string | null
}

export type WorkReportPerson = {
  personnelID: string
  personnelName: string
  days: WorkReportDay[]
  totalMinutes: number
  totalText: string
}

export type ServiceWorkReport = {
  serviceID: string
  people: WorkReportPerson[]
}

export type ServiceExpenseRow = {
  id: string
  serviceId: string
  personnelId: string
  personnelName: string
  amount: number
  currency: string
  description: string
  photoUrl: string | null
}

export type ServiceExpensesResponse = {
  totals: { TRY: number; USD: number; EUR: number }
  expenses: ServiceExpenseRow[]
}

/** Bazı ortamlarda interceptor { data: ... } sarımı olabilir. */
function normalizeExpensesResponse(
  raw: unknown,
): ServiceExpensesResponse | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (
    'totals' in r &&
    'expenses' in r &&
    Array.isArray(r.expenses) &&
    r.totals &&
    typeof r.totals === 'object'
  ) {
    return r as ServiceExpensesResponse
  }
  const inner = r.data
  if (inner && typeof inner === 'object') {
    const d = inner as Record<string, unknown>
    if (
      'totals' in d &&
      'expenses' in d &&
      Array.isArray(d.expenses) &&
      d.totals &&
      typeof d.totals === 'object'
    ) {
      return d as ServiceExpensesResponse
    }
  }
  return null
}

function mapAdminExpenseToRow(e: {
  id: string
  serviceId: string
  amount: number
  currency: string
  description: string
  photoUrl: string | null
  personnel: { id: string; name: string }
}): ServiceExpenseRow {
  return {
    id: e.id,
    serviceId: e.serviceId,
    personnelId: e.personnel.id,
    personnelName: e.personnel.name,
    amount: e.amount,
    currency: e.currency,
    description: e.description,
    photoUrl: e.photoUrl,
  }
}

function computeTotalsForRows(
  rows: ServiceExpenseRow[],
): ServiceExpensesResponse['totals'] {
  const totals = { TRY: 0, USD: 0, EUR: 0 }
  for (const e of rows) {
    const c = e.currency as keyof typeof totals
    if (c in totals) totals[c] += e.amount
  }
  return totals
}

type AdminAllExpensesResponse = {
  totals: { TRY: number; USD: number; EUR: number }
  expenses: Array<{
    id: string
    serviceId: string
    amount: number
    currency: string
    description: string
    photoUrl: string | null
    personnel: { id: string; name: string }
  }>
}

/**
 * Önce servise özel endpoint; boş veya hata olursa (eski sunucuda route yok vb.)
 * yönetici `all-expenses` listesinden bu servise filtrelenir.
 */
export async function getServiceAllExpenses(
  token: string,
  serviceId: string,
): Promise<ServiceExpensesResponse> {
  const empty: ServiceExpensesResponse = {
    totals: { TRY: 0, USD: 0, EUR: 0 },
    expenses: [],
  }

  let primary: ServiceExpensesResponse | null = null
  try {
    const raw = await apiPostJson<unknown>(
      '/service/get-all-expenses-for-service',
      token,
      { serviceId },
    )
    primary = normalizeExpensesResponse(raw)
  } catch {
    primary = null
  }

  if (primary && primary.expenses.length > 0) {
    return primary
  }

  try {
    const admin = await apiGetJson<AdminAllExpensesResponse>(
      '/service/admin/all-expenses',
      token,
    )
    const list = Array.isArray(admin.expenses) ? admin.expenses : []
    const sid = String(serviceId).trim()
    const filtered = list
      .filter((e) => String(e.serviceId).trim() === sid)
      .map(mapAdminExpenseToRow)
    if (filtered.length > 0) {
      return {
        totals: computeTotalsForRows(filtered),
        expenses: filtered,
      }
    }
  } catch {
    /* yoksay */
  }

  return primary ?? empty
}

export type ServiceDeliveryDetails = {
  serviceId: string
  deliveryId?: string
  note?: string
  reportUrl?: string
  personnelName?: string
  date?: string
}

export async function getServiceDailyLogs(
  token: string,
  serviceId: string,
): Promise<ServiceDailyLogItem[]> {
  try {
    const res = await apiPostJson<{ dailyLogs?: ServiceDailyLogItem[] }>(
      '/daily-log/get-service-logs',
      token,
      { serviceID: serviceId },
    )
    return Array.isArray(res?.dailyLogs) ? res.dailyLogs : []
  } catch {
    return []
  }
}

export async function getServiceWorkReport(
  token: string,
  serviceId: string,
): Promise<ServiceWorkReport | null> {
  try {
    return await apiGetJson<ServiceWorkReport>(
      `/daily-log/report/by-service/${encodeURIComponent(serviceId)}`,
      token,
    )
  } catch {
    return null
  }
}

export async function getServiceDeliveryDetails(
  token: string,
  serviceId: string,
): Promise<ServiceDeliveryDetails | null> {
  try {
    return await apiPostJson<ServiceDeliveryDetails>(
      '/delivery/get-delivery-details-by-service',
      token,
      { serviceId },
    )
  } catch {
    return null
  }
}
