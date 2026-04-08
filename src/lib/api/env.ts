const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined

if (!API_URL) {
  // Keep this warning non-fatal for local unit tests that don't hit network.
  console.warn('VITE_APPS_SCRIPT_URL is not set; API client calls may fail.')
}

export const apiEnv = {
  apiUrl: API_URL ?? '',
}
