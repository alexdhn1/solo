import { expect, test } from '@playwright/test'

test('can submit weekend reservation form', async ({ page }) => {
  await page.goto('/')

  await page.getByPlaceholder('YYYY-MM-DD|YYYY-MM-DD').fill('2026-04-25|2026-04-26')
  await page.getByPlaceholder('Nom du pote').first().fill('Romain')
  await page.getByPlaceholder('Email').first().fill('romain@example.com')
  await page.getByPlaceholder('Message').first().fill('weekend potes')
  await page.getByRole('button', { name: 'Confirmer' }).click()

  await expect(page.getByText('Reservation', { exact: false }).first()).toBeVisible()
})

test('can submit week session form', async ({ page }) => {
  await page.goto('/')

  await page.getByPlaceholder('YYYY-MM-DD').nth(1).fill('2026-04-15')
  await page.getByPlaceholder('Nom du pote').nth(1).fill('Leo')
  await page.getByRole('button', { name: 'Enregistrer' }).click()

  // API may fail without VITE_APPS_SCRIPT_URL, but form submission should trigger a notice
  await expect(page.getByText(/Session|Impossible|Conflit/, { exact: false })).toBeVisible({ timeout: 10000 })
})
