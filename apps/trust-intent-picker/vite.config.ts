import { createReadStream, existsSync, statSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

const appRoot = dirname(fileURLToPath(import.meta.url))
const repoPublic = join(appRoot, '../../public')
const base = '/trust-intent-picker/'

const MIME: Record<string, string> = {
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
}

/** Serve repo-root /public/* when running Vite alone (theme.css, logo, etc.). */
function serveRepoPublic(): Plugin {
  return {
    name: 'serve-repo-public',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        const match = url.match(/^(?:\/trust-intent-picker)?(\/public(?:\/.*)?)$/)
        if (!match) return next()

        const subPath = match[1]!.slice('/public'.length) || '/'
        const filePath = join(repoPublic, subPath)
        if (!filePath.startsWith(repoPublic) || !existsSync(filePath)) {
          return next()
        }

        const stat = statSync(filePath)
        if (!stat.isFile()) return next()

        res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream')
        createReadStream(filePath).pipe(res)
      })
    },
  }
}

export default defineConfig({
  base,
  build: {
    outDir: 'dist',
  },
  plugins: [serveRepoPublic()],
})
