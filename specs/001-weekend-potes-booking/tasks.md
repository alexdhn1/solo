# Tasks: Weekend Potes et Teletravail

**Input**: Design documents from `/specs/001-weekend-potes-booking/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test-first obligatoire sur les regles metier critiques (mapping, validation, conflits, fallback).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `frontend/src/`, `backend/src/`
- Paths shown below assume single web project - adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialiser la base projet, les outils qualite et la structure cible.

- [x] T001 Initialize React + TypeScript + Vite project configuration in package.json
- [x] T002 Configure Tailwind and shadcn/ui base setup in components.json
- [x] T003 [P] Add lint scripts and ESLint configuration in eslint.config.js
- [x] T004 [P] Add type-check script and TS project references in tsconfig.json
- [x] T005 [P] Create source folder scaffolding for features and libs in src/app/.gitkeep
- [x] T006 [P] Create test folder scaffolding for unit/integration/e2e in tests/unit/.gitkeep

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Etablir les contrats partages, le client API resilient et les gardes de validation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Define environment variables contract for Apps Script endpoint in src/lib/api/env.ts
- [x] T008 [P] Implement typed API client with text/plain compatibility in src/lib/api/client.ts
- [x] T009 [P] Implement zod schemas for Reservations and Vacances in src/lib/validation/sheetsSchemas.ts
- [x] T010 [P] Implement mapping rules and parsers for sheet rows in src/lib/mapping/sheetMappers.ts
- [x] T011 Implement planning conflict detection utilities in src/lib/utils/conflictRules.ts
- [x] T012 Implement global fallback/error state model for source failures in src/lib/utils/sourceFallback.ts
- [x] T013 Configure CI quality gates (lint, typecheck, unit, integration) in .github/workflows/ci.yml

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Reserver un weekend entre potes (Priority: P1) 🎯 MVP

**Goal**: Permettre une reservation weekend unique, avec prevention stricte des conflits.

**Independent Test**: Creer une reservation valide puis tenter une reservation en conflit; la premiere est acceptee, la seconde refusee avec message clair.

### Tests for User Story 1 (TDD first)

- [x] T014 [P] [US1] Add unit tests for weekend reservation schema validation in tests/unit/validation/weekendReservation.schema.test.ts
- [x] T015 [P] [US1] Add unit tests for weekend conflict rules in tests/unit/utils/weekendConflictRules.test.ts
- [x] T016 [P] [US1] Add integration test for reserveWeekend API flow with mock responses in tests/integration/api/reserveWeekend.integration.test.ts

### Implementation for User Story 1

- [x] T017 [P] [US1] Implement weekend reservation domain model helpers in src/features/weekend-booking/model.ts
- [x] T018 [US1] Implement reserveWeekend service orchestration in src/features/weekend-booking/service.ts
- [x] T019 [P] [US1] Build weekend reservation form UI with shadcn/ui primitives in src/features/weekend-booking/components/WeekendReservationForm.tsx
- [x] T020 [P] [US1] Build weekend availability card list UI in src/features/weekend-booking/components/WeekendAvailabilityList.tsx
- [x] T021 [US1] Wire reservation feature state and actions in src/features/weekend-booking/index.tsx
- [x] T022 [US1] Add user-facing conflict and success feedback handling in src/features/weekend-booking/feedback.ts

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Planifier des sessions teletravail en semaine (Priority: P2)

**Goal**: Permettre la creation et modification de sessions semaine sans chevauchement invalide.

**Independent Test**: Creer une session semaine valide, modifier son horaire, puis verifier qu'un creneau conflictuel est bloque.

### Tests for User Story 2 (TDD first)

- [x] T023 [P] [US2] Add unit tests for week session validation and weekday constraints in tests/unit/validation/weekSession.schema.test.ts
- [x] T024 [P] [US2] Add unit tests for week session conflict detection in tests/unit/utils/weekSessionConflictRules.test.ts
- [x] T025 [P] [US2] Add integration test for upsertWeekSession API flow in tests/integration/api/upsertWeekSession.integration.test.ts

### Implementation for User Story 2

- [x] T026 [P] [US2] Implement week session domain model helpers in src/features/week-session/model.ts
- [x] T027 [US2] Implement create/update week session service in src/features/week-session/service.ts
- [x] T028 [P] [US2] Build week session editor form with shadcn/ui controls in src/features/week-session/components/WeekSessionEditor.tsx
- [x] T029 [P] [US2] Build week timeline slots view in src/features/week-session/components/WeekSessionTimeline.tsx
- [x] T030 [US2] Wire week session feature state and actions in src/features/week-session/index.tsx

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Visualiser un planning consolide et fiable (Priority: P3)

**Goal**: Afficher une vue planning unifiee (weekend + semaine + indisponibilites) avec fiabilite et fallback.

**Independent Test**: Charger un jeu mixte de donnees valides/invalides et verifier rendu consolide, signalement des conflits et fallback en cas de source indisponible.

### Tests for User Story 3 (TDD first)

- [x] T031 [P] [US3] Add unit tests for planning view model composition in tests/unit/mapping/planningViewModel.test.ts
- [x] T032 [P] [US3] Add unit tests for source fallback behavior in tests/unit/utils/sourceFallback.test.ts
- [x] T033 [P] [US3] Add integration test for getPlanning end-to-end mapping in tests/integration/api/getPlanning.integration.test.ts

### Implementation for User Story 3

- [x] T034 [P] [US3] Implement consolidated planning view-model builder in src/features/planning-overview/viewModel.ts
- [x] T035 [P] [US3] Implement planning fetch-and-normalize service in src/features/planning-overview/service.ts
- [x] T036 [P] [US3] Build consolidated planning board UI in src/features/planning-overview/components/PlanningBoard.tsx
- [x] T037 [P] [US3] Build source error and empty-state UI blocks with shadcn/ui in src/features/planning-overview/components/PlanningFallbackState.tsx
- [x] T038 [US3] Wire planning overview screen into application shell in src/app/App.tsx

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Stabiliser la qualite transverse, performance et livraison.

- [x] T039 [P] Add accessibility checks for core interactive components in tests/e2e/accessibility/planning.a11y.spec.ts
- [x] T040 [P] Add performance smoke test for initial planning render in tests/e2e/performance/planning.render.spec.ts
- [x] T041 Update developer documentation and runbook in specs/001-weekend-potes-booking/quickstart.md
- [x] T042 Configure GitHub Pages deployment workflow for build artifacts in .github/workflows/deploy.yml
- [x] T043 [P] Add end-to-end happy path for weekend reservation and week session in tests/e2e/user-journeys/planningFlows.spec.ts
- [x] T044 Execute constitution compliance checklist update in specs/001-weekend-potes-booking/checklists/requirements.md
