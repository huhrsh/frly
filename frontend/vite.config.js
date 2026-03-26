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
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw-custom.js',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['teamwork.png', 'vite.svg', 'robots.txt', 'sitemap.xml'],
        manifest: {
          name: 'fryly',
          short_name: 'fryly',
          description: 'Organise your shared spaces, notes, and reminders',
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: '/teamwork.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          maximumFileSizeToCacheInBytes: 5000000
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      }),
    ],
    server: {
      allowedHosts,
      // optional: if you are also calling backend via https
      cors: true,
    },
  }
})
