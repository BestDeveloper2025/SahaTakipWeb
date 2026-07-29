import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** NestJS BestSahaTakip — mobil network gradle ile aynı uzak backend */
const BACKEND_ORIGIN = 'http://77.92.152.65:3004'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // CORS açık olmasa bile dev'de tarayıcıdan istek: aynı origin + Vite proxy
      '^/(auth|admin|personnel|service|delivery|report|daily-log|location|customer|version|test-pdf|chronic-issue|remote-service-request|education-content|photo|education-type|education|uploads|apk|api)':
        {
          target: BACKEND_ORIGIN,
          changeOrigin: true,
        },
    },
  },
})
