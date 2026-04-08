# Constitution & Engineering Principles

This document serves as the foundation for the `/speckit.constitution` directive, establishing the core principles for code quality, testing, user experience, and performance for the Planning / Reservations Dashboard.

## 1. Code Quality

- **Clean & Readable**: Strive for self-documenting code. Use meaningful variable and function names. A few well-named variables are better than a paragraph of comments.
- **Component-Driven Development**: All UI elements should be modular and reusable. With React and Shadcn/UI, encapsulate style, behavior, and markup into cohesive elements.
- **Strict Typing**: TypeScript is mandatory. Do not use `any`. Always define interfaces for Google Sheets data (e.g., `Reservation`, `VacationEntry`) to prevent runtime errors and catch structural mismatches early.
- **DRY (Don't Repeat Yourself) yet pragmatic**: Extract common logic into hooks (e.g., `usePlanning`) or utilities, but don't over-abstract if it makes the code harder to read.
- **SOLID Principles**: Keep components focused on a single responsibility. Separate data fetching from UI rendering.

## 2. Testing Standards

- **Unit Testing Core Logic**: Critical business rules must be unit-tested (e.g., detecting if a weekend is blocked because Alex/Jenna are on vacation or Jenna is on guard duty). Use `Vitest` for fast execution.
- **Testing Data Fetchers**: Mock external APIs (the Google Apps Script URLs) to test how the UI handles network states (loading, success, error, empty).
- **Component Tests**: Use React Testing Library to verify that UI components render correctly given specific props.
- **Accessibility Checks**: Use axe or similar tools in CI or tests to ensure ARIA labels exist and the UI is navigable via keyboard.

## 3. User Experience (UX) Consistency

- **Shadcn/UI First**: Rely on Shadcn/UI components as the source of truth for the design system. All interactive elements must adhere to the design language defined by these components (colors, radii, spacing, accessibility).
- **No Friction Navigation**: The application requires no authentication, meaning users should find what they need in 1-2 clicks. The Role Selection screen must be obvious and immediate.
- **Premium Aesthetics**: Uphold a high standard of visual design. Avoid raw generic colors; stick to the calculated HSL variables from the Shadcn theme. Implement subtle micro-interactions to make the interface feel alive.
- **Responsive by Default**: Mobile-first approach. Since the web app is hosted on GitHub Pages (not inside an iFrame), we have full support for CSS media queries and Tailwind responsive prefixes. Keep interactions touch-friendly.

## 4. Performance Requirements

- **Static Generation Edge**: Use Vite to build highly optimized static assets (HTML/CSS/JS) to be served from the edge via GitHub Pages.
- **Optimized Data Fetching**: Since Google Apps Script APIs can be slow (1-3 seconds response time), the UI must instantly provide feedback (Skeletons, Spinners) and aggressively cache the initial dataset to prevent redundant fetching on subsequent screen changes.
- **Minimal Bundle Size**: Take care not to import heavy libraries if standard JS features will suffice. Rely on lightweight libraries (e.g., `date-fns` over `moment.js` if needed at all).
- **Smooth Animations**: Any animations must rely on CSS transitions or lightweight Framer Motion usage, maintaining 60fps on mobile devices. No layout-thrashing animations.

---
*By committing to these standard principles, we ensure that the project remains maintainable, scalable, and a pleasure for its users.*
