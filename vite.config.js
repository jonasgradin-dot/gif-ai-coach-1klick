import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Gör att /api fungerar även i `npm run dev` (på Vercel körs samma filer som serverfunktioner).
const ROUTES = { '/audio/transcriptions': 'api/audio/transcriptions.js', '/chat/completions': 'api/chat/completions.js' }
const apiDev = (env) => ({
  name: 'api-dev',
  configureServer(server) {
    Object.assign(process.env, env)
    server.middlewares.use('/api', async (req, res) => {
      const path = req.url.split('?')[0], file = ROUTES[path]
      if (!file) { res.statusCode = 404; return res.end() }
      const chunks = []; for await (const c of req) chunks.push(c)
      const request = new Request('http://localhost/api' + path, { method: req.method, headers: req.headers, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined })
      const { POST } = await import(pathToFileURL(resolve(process.cwd(), file)).href)
      const r = await POST(request)
      res.statusCode = r.status; r.headers.forEach((v, k) => res.setHeader(k, v))
      res.end(Buffer.from(await r.arrayBuffer()))
    })
  }
})

export default defineConfig(({ mode }) => ({
  build: { target: 'es2018' }, // fungerar även på äldre iPhone/Android
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
  plugins: [
    react(),
    apiDev(loadEnv(mode, process.cwd(), '')),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      workbox: { navigateFallbackDenylist: [/^\/api\//], cleanupOutdatedCaches: true, clientsClaim: true, skipWaiting: true },
      includeAssets: ['logo.png', 'pitch.svg', 'favicon.png', 'apple-touch-icon.png', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'Båstads GIF – Din coachkompis', short_name: 'GIF Coach', lang: 'sv',
        start_url: '/', display: 'standalone', background_color: '#d9ecd0', theme_color: '#ffffff',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
}))
