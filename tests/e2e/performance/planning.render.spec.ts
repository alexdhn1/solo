import { expect, test } from '@playwright/test'

test('planning renders in acceptable time', async ({ page }) => {
  const start = Date.now()
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Planning consolide' })).toBeVisible()
  const elapsed = Date.now() - start

  // Smoke threshold for CI stability; stricter thresholds are tracked in observability.
  expect(elapsed).toBeLessThan(5000)
})
