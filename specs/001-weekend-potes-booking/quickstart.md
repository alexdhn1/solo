# Quickstart

## Prerequisites

- Node 20+
- npm 10+
- Optional: `VITE_APPS_SCRIPT_URL` for real API calls

## Local Development

1. `npm install`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test:unit`
5. `npm run test:integration`
6. `npm run dev`

## E2E and Build Validation

1. `npm run test:e2e`
2. `npm run build`
3. `npm run preview`

## CI/Delivery Expectations

- Pull request must pass lint + typecheck + unit + integration checks.
- Deployment to GitHub Pages runs from main/master after merge.
- Keep Google Sheets mappings and fallback behavior validated by tests.
