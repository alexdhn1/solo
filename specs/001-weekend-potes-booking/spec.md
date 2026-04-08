# Feature Specification: Weekend Potes et Teletravail

**Feature Branch**: `001-weekend-potes-booking`
**Created**: 2026-04-08
**Status**: Draft
**Input**: User description: "site style pour reserver weekends potes + teletravail semaine, Google Sheets source de verite"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reserver un weekend entre potes (Priority: P1)

En tant qu'hote, je veux proposer un weekend a un pote unique quand je suis disponible.

**Why this priority**: Valeur principale immediate.

**Independent Test**: Reservation valide acceptee, reservation en conflit refusee.

**Acceptance Scenarios**:

1. **Given** un weekend disponible, **When** je reserve, **Then** la reservation est confirmee.
2. **Given** un weekend bloque, **When** je reserve, **Then** la reservation est refusee avec message explicite.

---

### User Story 2 - Planifier des sessions teletravail en semaine (Priority: P2)

En tant qu'hote, je veux planifier des sessions semaine avec un pote.

**Why this priority**: Augmente l'usage hors weekend.

**Independent Test**: Creation/modification valide, conflit detecte et bloque.

**Acceptance Scenarios**:

1. **Given** un creneau libre, **When** je cree une session, **Then** elle est enregistree.
2. **Given** un creneau conflictuel, **When** je valide, **Then** le systeme refuse la session.

---

### User Story 3 - Visualiser un planning consolide et fiable (Priority: P3)

En tant qu'hote, je veux voir une vue unique weekends + semaine + indisponibilites.

**Why this priority**: Evite erreurs et doubles saisies.

**Independent Test**: Chargement d'un jeu mixte avec rendu coherent et fallback en erreur source.

**Acceptance Scenarios**:

1. **Given** des donnees valides multi-sources, **When** j'ouvre le planning, **Then** la vue consolidee est coherente.

---

## Constitution Alignment *(mandatory)*

- **CA-001 Stack Direction**: React moderne + shadcn/ui.
- **CA-002 Source of Truth**: Google Sheets canonique.
- **CA-003 Data Contract**: Mapping explicite + validation + fallback.
- **CA-004 Quality Gates**: Lint + typecheck + tests unitaires/integration.
- **CA-005 GitHub Delivery**: PR + CI + deploiement GitHub.

## Edge Cases

- Source Sheets indisponible ou lente
- Lignes invalides (date/statut)
- Reservations concurrentes meme creneau
- Aucun creneau disponible

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Reserver un weekend pour un seul pote.
- **FR-002**: Bloquer les reservations en conflit.
- **FR-003**: Creer/modifier des sessions semaine.
- **FR-004**: Afficher une vue consolidee fiable.
- **FR-005**: Utiliser Google Sheets comme source canonique.
- **FR-006**: Valider les donnees source et ignorer les invalides proprement.
- **FR-007**: Signaler clairement les conflits.
- **FR-008**: Publier via workflow GitHub avec qualite validee.

### Key Entities *(include if feature involves data)*

- **WeekendReservation**
- **WeekSession**
- **AvailabilityBlock**
- **PlanningViewItem**
- **SheetMappingRule**

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% des reservations valides completes en moins de 2 minutes.
- **SC-002**: 100% des conflits detectes et refuses.
- **SC-003**: 95% des chargements planning en moins de 5 secondes (reseau normal).
- **SC-004**: Erreur mapping lignes valides < 1%.

## Assumptions

- Structure Reservations/Vacances stable
- Usage personnel/entourage
- Deploiement pilote depuis GitHub
