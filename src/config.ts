/**
 * Geliştirme (`npm run dev`): varsayılan boş → istekler `/admin/...` gibi aynı
 * origin’e gider, `vite.config.ts` proxy’si Nest’e (localhost:3004) iletir.
 *
 * Üretim build veya doğrudan API: `.env` içinde `VITE_API_BASE=http://localhost:3004`
 * (veya uzak sunucu). Boş bırakırsanız prod’da varsayılan localhost:3004 kullanılır.
 */
const RAW_API = import.meta.env.VITE_API_BASE as string | undefined

export const API_BASE: string =
  typeof RAW_API === 'string' && RAW_API.trim() !== ''
    ? RAW_API.trim().replace(/\/$/, '')
    : import.meta.env.DEV
      ? ''
      : 'http://localhost:3004'