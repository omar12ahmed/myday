import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

// The release identifier shown at the bottom of every screen: the version in package.json, the Git commit
// the app was built from (marked "+changes" if there were uncommitted changes), and the build date.
function git(cmd: string): string {
  try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { return '' }
}
const version = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version as string
const commit = git('git rev-parse --short HEAD') || 'unknown'
const changed = git('git status --porcelain') !== ''

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative paths, so the built app works from any folder of the site (e.g. /myday/next/).
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(commit + (changed ? '+changes' : '')),
    __APP_BUILT__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
})
