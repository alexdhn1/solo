const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined

if (!API_URL) {
  if (import.meta.env.PROD) {
    // A production bundle without a backend URL is a broken build: fail loudly (C13).
    throw new Error(
      'VITE_APPS_SCRIPT_URL is missing. Set it in the build environment (cf. .env.example).',
    )
  }
  // Keep this warning non-fatal for local dev / unit tests that don't hit network.
  console.warn('VITE_APPS_SCRIPT_URL is not set; API client calls may fail.')
}

export const apiEnv = {
  apiUrl: API_URL ?? '',
}
