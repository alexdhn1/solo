import { expect, test, type Page } from '@playwright/test'

const APP_PATH = '/solo/'
const API_GLOB = 'https://api.e2e.test/exec*'
const IMAGE_GLOB = 'https://lh3.googleusercontent.com/**'

const SLOTS = [
  { rowIndex: 2, label: 'Ven 25 → Mar 29 avr', dateDebut: '2026-04-25', dateFin: '2026-04-29' },
  { rowIndex: 3, label: 'Ven 2 → Mar 6 mai', dateDebut: '2026-05-02', dateFin: '2026-05-06' },
]

/** Mock the whole network: the Apps Script backend and the remote images. */
async function mockBackend(page: Page, postBody: Record<string, unknown>) {
  await page.route(IMAGE_GLOB, (route) => route.abort())
  await page.route(API_GLOB, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ json: postBody })
      return
    }
    await route.fulfill({ json: SLOTS })
  })
}

test.describe('réservation solo', () => {
  test('happy path : le créneau est réservé et confirmé', async ({ page }) => {
    const posted: unknown[] = []
    await mockBackend(page, { success: true, message: 'Réservation confirmée, à très vite 🎉' })
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().startsWith('https://api.e2e.test/exec')) {
        posted.push(JSON.parse(req.postData() ?? '{}'))
      }
    })

    await page.goto(APP_PATH)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Week-end duo en cavale')

    const slotSelect = page.getByLabel('Créneau disponible 📅')
    await expect(slotSelect).toBeVisible()
    await slotSelect.selectOption('3')
    await page.getByLabel('Tu restes quand ? 🗓️').selectOption('Samedi → Dimanche')
    await page.getByLabel('Ton prénom / nom 👤').fill('Thomas')
    await page.getByLabel('Ton email 📧').fill('thomas@exemple.com')
    await page.getByLabel('Un petit mot 💬').fill("J'apporte du fromage")

    await page.getByRole('button', { name: /je réserve/i }).click()

    await expect(page.getByText('Réservation confirmée, à très vite 🎉')).toBeVisible()
    expect(posted).toHaveLength(1)
    expect(posted[0]).toMatchObject({
      action: 'soloReservation',
      rowIndex: 3,
      label: 'Ven 2 → Mar 6 mai',
      nom: 'Thomas',
      email: 'thomas@exemple.com',
      joursChoisis: 'Samedi → Dimanche',
    })
  })

  test('STALE_SLOT : la liste est rechargée et la sélection réinitialisée', async ({ page }) => {
    await mockBackend(page, {
      success: false,
      code: 'STALE_SLOT',
      message: 'Ce créneau a changé, recharge la page.',
    })

    await page.goto(APP_PATH)

    const slotSelect = page.getByLabel('Créneau disponible 📅')
    await slotSelect.selectOption('2')
    await page.getByLabel('Ton prénom / nom 👤').fill('Thomas')
    await page.getByLabel('Ton email 📧').fill('thomas@exemple.com')
    await page.getByRole('button', { name: /je réserve/i }).click()

    await expect(page.getByText('Ce créneau a changé, recharge la page.')).toBeVisible()
    await expect(slotSelect).toHaveValue('')
  })
})
