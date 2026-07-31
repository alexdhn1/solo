import { defineConfig } from '@playwright/test'

/** The e2e suite mocks every network call, so any well-formed URL will do. */
export const E2E_API_URL = 'https://api.e2e.test/exec'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    headless: true,
    baseURL: 'http://127.0.0.1:4173',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/solo/',
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      VITE_APPS_SCRIPT_URL: E2E_API_URL,
    },
  },
})
