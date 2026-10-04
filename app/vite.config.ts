import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// The release identifier shown at the bottom of every screen: the version in package.json, the Git commit
// the app was built from (marked "+changes" if there were uncommitted changes), and the build date.
function git(cmd: string): string {
  try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { return '' }
}
const version = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version as string
const commit = git('git rev-parse --short HEAD') || 'unknown'
const changed = git('git status --porcelain') !== ''

// Cloud sync settings (see ../supabase/README.md). Every VITE_ variable ends up in the app that browsers
// download, so it must never hold a secret: a Supabase secret or service_role key would give anyone full
// access to the database. Refuse to build rather than publish one.
function isSecretKey(value: string): boolean {
  const v = value.trim()
  if (v.startsWith('sb_secret_')) return true
  const parts = v.split('.')
  if (parts.length !== 3) return false
  try { return JSON.parse(Buffer.from(parts[1], 'base64url').toString()).role === 'service_role' } catch { return false }
}
function checkNoSecrets(mode: string) {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith('VITE_'))) }
  for (const [name, value] of Object.entries(env)) {
    if (value && isSecretKey(value)) {
      throw new Error(`${name} holds a Supabase secret (or service_role) key. VITE_ variables are included in the app that browsers download, so it would be public. Use the publishable key (sb_publishable_…) instead, and keep secret keys out of this project.`)
    }
  }
}

// The service worker (sw/sw.js), so MyDay opens without a connection and can be installed as an app: built with this
// release's identifier and the list of every file it's made of (the built ones and the ones in public/), so each
// release is cached whole and replaces the one before. Only in the built app — never on the dev server.
function serviceWorker(): Plugin {
  const publicFiles = (dir: string): string[] => readdirSync(dir).flatMap(f => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? publicFiles(p) : [relative(fileURLToPath(new URL('./public', import.meta.url)), p)]
  })
  return {
    name: 'myday-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const files = [...new Set(['index.html', ...Object.keys(bundle), ...publicFiles(fileURLToPath(new URL('./public', import.meta.url)))])]
        .filter(f => f !== 'sw.js' && !f.endsWith('.map'))
        .map(f => './' + f.split('\\').join('/'))
        .sort()
      const source = readFileSync(new URL('./sw/sw.js', import.meta.url), 'utf8')
        .replace('__VERSION__', JSON.stringify(`${version}-${commit}${changed ? '-changes' : ''}-${Date.now().toString(36)}`))
        .replace('__FILES__', JSON.stringify(files))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  checkNoSecrets(mode)
  return {
    plugins: [react(), tailwindcss(), serviceWorker()],
    // Relative paths, so the built app works from any folder of the site (e.g. /myday/next/).
    base: './',
    // The AI planner's contract and practice planner are shared with the Edge Function (../supabase/functions/_shared).
    server: { fs: { allow: ['..'] } },
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __APP_COMMIT__: JSON.stringify(commit + (changed ? '+changes' : '')),
      __APP_BUILT__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    },
  }
})
