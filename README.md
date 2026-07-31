# solo-booking

Page de réservation des « week-ends duo » à St-Georges-sur-Cher.
Front React + Vite déployé sur GitHub Pages sous `/solo/`, backend Google Apps
Script (feuille de calcul + mail de confirmation) dont le code vit dans
[`appscript/`](./appscript).

## Stack

| Brique | Choix |
|---|---|
| Build | Vite 8 (`base: '/solo/'`) |
| UI | React 19, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn / Base UI |
| Validation | zod (réponses API **et** formulaire) |
| Tests | Vitest + Testing Library + msw (unitaires/intégration), Playwright (e2e) |
| Qualité | TypeScript strict, ESLint `recommendedTypeChecked` |

## Prérequis

- Node.js 20 ou plus
- npm 10 ou plus

## Installation

```bash
npm install
cp .env.example .env.local   # puis renseigner l'URL du déploiement Apps Script
npm run dev                  # http://localhost:5173/solo/
```

## Configuration

Une seule variable d'environnement, préfixée `VITE_` pour être exposée au bundle :

| Variable | Obligatoire | Description |
|---|---|---|
| `VITE_APPS_SCRIPT_URL` | oui en production | URL `.../exec` du déploiement « Web app » du script Apps Script |

En développement, l'absence de la variable produit un simple avertissement en
console. **En build de production, l'application lève une erreur au démarrage**
si la variable est vide : un bundle sans backend est un bundle cassé.

## Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | serveur de dev Vite avec HMR |
| `npm run build` | `tsc -b` puis build de production dans `dist/` |
| `npm run preview` | sert le build de production |
| `npm run lint` | ESLint (règles typées) sur tout le repo |
| `npm run typecheck` | `tsc -b` seul, sans émettre |
| `npm run test` | toute la suite Vitest |
| `npm run test:unit` | `tests/unit` uniquement |
| `npm run test:integration` | `tests/integration` uniquement |
| `npm run test:coverage` | couverture v8, seuil `lines: 70` |
| `npm run test:e2e` | Playwright (`tests/e2e`), réseau mocké, lance le serveur de dev |

Pour l'e2e la première fois : `npx playwright install chromium`.

## Architecture

```
src/
  App.tsx                                  composition de la page (< 40 lignes)
  components/ui/button.tsx                 primitive shadcn
  features/solo-booking/
    content.ts                             textes, images, options (contenu éditorial)
    formSchema.ts                          schéma zod du formulaire + messages FR
    components/                            BackgroundLayer, PageHeader, HeroSection,
                                           VibesSection, BookingPanel, SoloForm,
                                           FeedbackBanner
    hooks/
      useSoloWeekends.ts                   fetch + abort + retry + refetch de la liste
      useSoloReservation.ts                POST + feedback + reset
      useSoloBooking.ts                    glue des deux + sélection courante
  lib/api/
    env.ts                                 lecture/validation de la variable d'env
    schemas.ts                             schémas zod de l'API
    client.ts                              fetch typé (timeout 15 s, 1 retry sur le GET)
tests/
  unit/                                    Vitest + Testing Library (composants, client)
  integration/App.test.tsx                 parcours complet avec msw
  e2e/booking.spec.ts                      Playwright, réseau mocké via page.route
```

## Contrat d'API

- `GET {VITE_APPS_SCRIPT_URL}?action=getSoloWeekends` → `SoloWeekendSlot[]`
  (`{ rowIndex, label, dateDebut, dateFin }`), déjà filtré des dates bloquées par
  les réservations de groupe.
- `POST {VITE_APPS_SCRIPT_URL}` (content-type `text/plain` pour éviter le
  preflight CORS d'Apps Script) avec
  `{ action: 'soloReservation', rowIndex, label, nom, email, message, joursChoisis }`.
  Le backend vérifie que `label` correspond bien au contenu de `rowIndex` :
  **c'est l'identifiant de créneau stable**.
- Réponse : `{ success: boolean, code?: string, message: string }`.
  Codes connus : `STALE_SLOT`, `ALREADY_BOOKED`, `PAST_SLOT`, `INVALID_INPUT`,
  `CONFLICT_GROUP`.
- Sur tout `success: false`, le front recharge la liste complète et réinitialise
  la sélection ; sur succès, le créneau réservé disparaît de la liste.

## Déploiement

- **Front** : workflow GitHub Actions `.github/workflows/deploy.yml` (build Vite
  puis publication sur GitHub Pages). Le secret de dépôt
  `VITE_APPS_SCRIPT_URL` doit être renseigné.
- **Backend** : voir `appscript/` — copier les fichiers `.gs` dans le projet Apps
  Script, renseigner les Script Properties, puis redéployer la Web app (« Nouvelle
  version », accès « Tout le monde »).
- **CI** : `.github/workflows/ci.yml` exécute lint, typecheck, tests unitaires,
  tests d'intégration, build et e2e sur chaque PR.
