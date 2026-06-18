import { apiPostJson } from './http'
import type { CustomerListItem, CustomerRemoteUsage } from './customers'
import { getAllCustomers } from './customers'

export type { CustomerListItem }

export type CreateRemoteServicePayload = {
  personnelID: string
  customerID: string
  machineName: string
  serviceDescription: string
  date: string
  startTime: string
  endTime: string
}

export async function getPersonnelCustomers(
  token: string,
): Promise<CustomerListItem[]> {
  return getAllCustomers(token)
}

export async function getRemoteUsage(
  token: string,
  customerId: string,
): Promise<CustomerRemoteUsage> {
  return apiPostJson<CustomerRemoteUsage>(
    '/customer-summary/remote-usage',
    token,
    { customerId },
  )
}

export async function createRemoteService(
  token: string,
  payload: CreateRemoteServicePayload,
): Promise<{ message: string }> {
  return apiPostJson<{ message: string }>(
    '/remote-service-request/create',
    token,
    payload,
  )
}

/** Bugünün tarihi DD-MM-YYYY (mobil ile aynı). */
export function getCurrentDateDDMMYYYY(): string {
  const today = new Date()
  const day = String(today.getDate()).padStart(2, '0')
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const year = today.getFullYear()
  return `${day}-${month}-${year}`
}

export function durationMinutes(startTime: string, endTime: string): number {
  const s = startTime.split(':')
  const e = endTime.split(':')
  if (s.length !== 2 || e.length !== 2) return 0
  const startMin =
    (Number.parseInt(s[0], 10) || 0) * 60 + (Number.parseInt(s[1], 10) || 0)
  const endMin =
    (Number.parseInt(e[0], 10) || 0) * 60 + (Number.parseInt(e[1], 10) || 0)
  let diff = endMin - startMin
  if (diff < 0) diff += 24 * 60
  return diff < 0 ? 0 : diff
}

export function minutesToText(totalMinutes: number): string {
  const safe = totalMinutes < 0 ? 0 : totalMinutes
  const hh = String(Math.floor(safe / 60)).padStart(2, '0')
  const mm = String(safe % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

export function buildQuotaWarningMessage(
  quotaHours: number,
  usedMinutes: number,
  newEntryMinutes: number,
  projectedMinutes: number,
): string {
  const quotaText =
    quotaHours % 1 === 0 ? String(quotaHours) : String(quotaHours)
  return (
    `Bu müşteri için tanımlı ${quotaText} saatlik uzaktan servis kotası aşılıyor.\n\n` +
    `Şu ana kadar kullanılan: ${minutesToText(usedMinutes)}\n` +
    `Bu kayıt: ${minutesToText(newEntryMinutes)}\n` +
    `Toplam: ${minutesToText(projectedMinutes)}\n\n` +
    `Kotayı aşan süre faturalandırılacaktır. Kaydı oluşturmak istiyor musunuz?`
  )
}
