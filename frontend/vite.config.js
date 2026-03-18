import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  let allowedHosts = []
  const apiBase = env.VITE_API_BASE_URL
  let apiOriginPattern = null
  if (apiBase) {
    try {
      const url = new URL(apiBase)
      allowedHosts = [url.hostname]
      // Escape origin for use in a RegExp
      const escapedOrigin = url.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      apiOriginPattern = new RegExp(`^${escapedOrigin}`)
    } catch {
      // ignore malformed URLs; dev server will still run on localhost
    }
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['teamwork.png', 'vite.svg', 'robots.txt', 'sitemap.xml'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            // Network-first for API requests hitting the Spring Boot backend
            apiOriginPattern && {
              urlPattern: apiOriginPattern,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // Stale-while-revalidate for images/avatars
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'image-cache',
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ].filter(Boolean),
        },
      }),
    ],
    server: {
      allowedHosts,
      // optional: if you are also calling backend via https
      cors: true,
    },
  }
})
