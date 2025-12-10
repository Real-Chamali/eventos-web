import { defineConfig } from 'vitest/config'
import path from 'path'

// Load React plugin lazily to avoid config load failures in CI environments
// where top-level ESM interop or optional devDependencies might not be present.
export default defineConfig(async () => {
  const plugins = [] as any[]
  try {
    // dynamic import to avoid hard failure if plugin cannot be resolved
    // (some CI runners may not resolve optional devDependencies the same way)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const reactPlugin = (await import('@vitejs/plugin-react')).default
    plugins.push(reactPlugin())
  } catch (err) {
    // Graceful fallback: continue without the plugin.
    // Tests can still run (jsdom environment) even if the plugin is absent.
    // Log to console so CI logs reveal the fallback reason.
    // eslint-disable-next-line no-console
    console.warn('Could not load @vitejs/plugin-react in vitest config:', err?.message ?? err)
  }

  return {
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
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'tests/',
        ],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  }
})
