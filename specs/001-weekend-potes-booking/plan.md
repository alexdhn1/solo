# Implementation Plan: Weekend Potes et Teletravail

**Branch**: `001-weekend-potes-booking` | **Date**: 2026-04-08 | **Spec**: /Users/adah/Documents/Project/solo/specs/001-weekend-potes-booking/spec.md
**Input**: Feature specification from `/specs/001-weekend-potes-booking/spec.md`

## Summary

Site web style pour organiser weekends entre potes et sessions semaine, Google Sheets source canonique, shadcn/ui, flux spec-driven + test-driven.

## Technical Context

**Language/Version**: TypeScript 5.x + Node 20
**Primary Dependencies**: React, Vite, shadcn/ui, Tailwind CSS, zod
**Storage**: Google Sheets via Apps Script JSON
**Testing**: Vitest + Testing Library + Playwright + msw
**Target Platform**: Navigateurs modernes desktop + mobile
**Project Type**: web app frontend
**Performance Goals**: LCP < 2.5s p75, rendu initial < 5s
**Constraints**: compat text/plain possible pour CORS Apps Script
**Scale/Scope**: usage personnel / entourage
**Hosting Strategy**: GitHub Pages
**Google Sheets Contract**: mapping Reservations + Vacances + validation stricte

## Constitution Check

- [x] Principle I: Parcours utilisateurs mesurables
- [x] Principle II: React + shadcn/ui
- [x] Principle III: Google Sheets source canonique
- [x] Principle IV: Quality gates + test-first
- [x] Principle V: Flux GitHub + deployment

## Project Structure

### Documentation (this feature)

```text
specs/001-weekend-potes-booking/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── planning-api-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
├── components/
│   ├── ui/
│   └── planning/
├── features/
│   ├── weekend-booking/
│   ├── week-session/
│   └── planning-overview/
├── lib/
│   ├── api/
│   ├── mapping/
│   ├── validation/
│   └── utils/
└── styles/

tests/
├── unit/
├── integration/
└── e2e/
```

**Structure Decision**: web frontend unique; backend Apps Script externe.
