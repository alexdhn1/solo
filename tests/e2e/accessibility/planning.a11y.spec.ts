import { expect, test } from '@playwright/test'

test('main sections are accessible by role', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Weekend Potes et Teletravail' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Planning consolide' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Reserver un weekend' })).toBeVisible()
})
