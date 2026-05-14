import type { ServiceListItem } from '../api/service'
import './ServiceStatusBadge.css'

type Props = {
  status: string
}

const LABELS: Record<string, string> = {
  IN_PROGRESS: 'Devam ediyor',
  NOT_INITIALIZED: 'Başlamadı',
  COMPLETED: 'Tamamlandı',
}

export function ServiceStatusBadge({ status }: Props) {
  const label = LABELS[status] ?? status
  const mod =
    status === 'COMPLETED'
      ? 'done'
      : status === 'IN_PROGRESS'
        ? 'active'
        : 'idle'

  return (
    <span className={`svc-badge svc-badge--${mod}`} title={status}>
      {label}
    </span>
  )
}

export function formatServiceDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function serviceListKey(s: ServiceListItem): string {
  return String(s.id)
}
