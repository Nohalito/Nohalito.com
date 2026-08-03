import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    watch: {
      // Running the Vite dev server from WSL against a project stored on the
      // Windows filesystem (/mnt/c/...) means edits saved from the Windows
      // side never trigger inotify events inside WSL. Polling works around
      // that by having chokidar check file mtimes instead of waiting for them.
      usePolling: true,
      interval: 100,
    },
  },
})
