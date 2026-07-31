import { setupServer } from 'msw/node'

/** Shared msw server; each test file installs the handlers it needs. */
export const server = setupServer()
