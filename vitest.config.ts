import { defineConfig } from 'vitest/config'
import type { PluginOption } from 'vite'
import path from 'path'

// Load React plugin synchronously with try-catch fallback
// to gracefully handle missing optional devDependencies in CI.
let reactPlugin: PluginOption = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const plugin = require('@vitejs/plugin-react').default
  reactPlugin = plugin()
} catch (err: unknown) {
  // Graceful fallback: continue without the plugin.
  // Tests can still run (jsdom environment) even if the plugin is absent.
  const errMsg = (err && typeof err === 'object' && 'message' in err) ? (err as { message: string }).message : String(err)
  console.warn('Could not load @vitejs/plugin-react in vitest config:', errMsg)
}

const plugins: PluginOption[] = reactPlugin ? [reactPlugin] : []

export default defineConfig({
  plugins,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    // Run only project tests under `tests/` and avoid running downstream
    // package tests that may be present under `node_modules/`.
    include: ['tests/**/*.test.*', 'tests/**/*.spec.*'],
    // Exclude Playwright E2E files so Vitest runs unit tests only
    exclude: ['node_modules/**', 'tests/e2e.spec.ts', 'tests/e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
