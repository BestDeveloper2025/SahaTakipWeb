import L from 'leaflet'
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getActivePersonnelWithLocation } from '../api/personnel'
import type { ActivePersonnelWithLocation } from '../api/personnel'
import './PersonnelMap.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const defaultMarkerIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const TR_CENTER: [number, number] = [39.1, 35.2]
const DEFAULT_ZOOM = 6

function normalizeCoord(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function MapBoundsSync({ points }: { points: [number, number][] }) {
  const map = useMap()
  const key = useMemo(
    () => JSON.stringify(points),
    [points],
  )

  useEffect(() => {
    if (points.length === 0) {
      map.setView(TR_CENTER, DEFAULT_ZOOM)
      return
    }
    if (points.length === 1) {
      map.setView(points[0], 14)
      return
    }
    const b = L.latLngBounds(points)
    map.fitBounds(b, { padding: [40, 40], maxZoom: 15 })
  }, [map, points, key])

  return null
}

/** Liste veya dışarıdan seçilen personelde haritayı o noktaya götürür */
function MapFlyToTarget({
  target,
}: {
  target: { lat: number; lng: number } | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!target) return
    map.flyTo([target.lat, target.lng], 15, { duration: 0.75 })
  }, [map, target])

  return null
}

type Props = {
  token: string
}

export function PersonnelMap({ token }: Props) {
  const [list, setList] = useState<ActivePersonnelWithLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    setError(null)
    setLoading(true)
    getActivePersonnelWithLocation(token)
      .then((data) => {
        if (!cancelled) setList(data)
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Konumlar yüklenemedi')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const positions = useMemo(() => {
    const out: [number, number][] = []
    for (const p of list) {
      const lat = normalizeCoord(p.latitude)
      const lng = normalizeCoord(p.longitude)
      if (lat !== null && lng !== null) out.push([lat, lng])
    }
    return out
  }, [list])

  const listOnMap = useMemo(() => {
    return list.filter((p) => {
      const lat = normalizeCoord(p.latitude)
      const lng = normalizeCoord(p.longitude)
      return lat !== null && lng !== null
    })
  }, [list])

  const [flyTarget, setFlyTarget] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (
      selectedId &&
      !listOnMap.some((p) => String(p.id) === selectedId)
    ) {
      setSelectedId(null)
    }
  }, [listOnMap, selectedId])

  function goToPersonnel(p: ActivePersonnelWithLocation) {
    const lat = normalizeCoord(p.latitude)
    const lng = normalizeCoord(p.longitude)
    if (lat === null || lng === null) return
    setSelectedId(String(p.id))
    setFlyTarget({ lat, lng })
  }

  function refetch() {
    setError(null)
    setLoading(true)
    getActivePersonnelWithLocation(token)
      .then(setList)
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Konumlar yüklenemedi'),
      )
      .finally(() => setLoading(false))
  }

  const mapStyle: CSSProperties = {
    height: '100%',
    width: '100%',
    minHeight: 240,
  }

  if (!mounted) {
    return (
      <section className="personnel-map-panel" aria-label="Personel haritası">
        <div className="personnel-map-placeholder">Harita yükleniyor…</div>
      </section>
    )
  }

  return (
    <section className="personnel-map-panel" aria-label="Personel haritası">
      <div className="personnel-map-head">
        <h2 className="personnel-map-title">Aktif personel konumları</h2>
        <button
          type="button"
          className="personnel-map-refresh"
          onClick={refetch}
          disabled={loading}
        >
          {loading ? 'Yükleniyor…' : 'Yenile'}
        </button>
      </div>
      {error ? (
        <div className="personnel-map-error" role="alert">
          {error}
        </div>
      ) : null}
      <div className="personnel-map-frame">
        <MapContainer
          center={TR_CENTER}
          zoom={DEFAULT_ZOOM}
          style={mapStyle}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapBoundsSync points={positions} />
          <MapFlyToTarget target={flyTarget} />
          {list.map((p) => {
            const lat = normalizeCoord(p.latitude)
            const lng = normalizeCoord(p.longitude)
            if (lat === null || lng === null) return null
            const id = String(p.id)
            return (
              <Marker key={id} position={[lat, lng]} icon={defaultMarkerIcon}>
                <Popup>
                  <strong>{p.name}</strong>
                  {p.time ? (
                    <>
                      <br />
                      <span className="personnel-map-popup-time">{p.time}</span>
                    </>
                  ) : null}
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {!loading && listOnMap.length > 0 ? (
          <div className="personnel-map-sidebar" aria-label="Haritadaki personel listesi">
            <div className="personnel-map-sidebar-title">Personeller</div>
            <ul className="personnel-map-sidebar-list">
              {listOnMap.map((p) => {
                const id = String(p.id)
                const isOn = selectedId === id
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={`personnel-map-sidebar-btn${isOn ? ' personnel-map-sidebar-btn--on' : ''}`}
                      onClick={() => goToPersonnel(p)}
                      aria-label={`${p.name} konumuna git`}
                      aria-current={isOn ? 'true' : undefined}
                    >
                      <span className="personnel-map-sidebar-name">{p.name}</span>
                      {p.time ? (
                        <span className="personnel-map-sidebar-time">{p.time}</span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </div>
      {!loading && list.length === 0 && !error ? (
        <p className="personnel-map-empty">
          Konum kaydı bulunan aktif personel yok veya henüz güncellenmedi.
        </p>
      ) : null}
    </section>
  )
}
