import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'))

// Datum build-a se racuna ovdje (u trenutku "vite build"), ne rucno -
// tako uvijek odgovara stvarnom trenutku kad je build napravljen.
const buildDate = new Date().toISOString().slice(0, 10).replace(/-/g, '.')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
