# Agent / Developer Guide

## High-Level Architecture

Holiday Maximizer is now a small full-stack app:

1. **React + Vite client (`src/`)**
   - Feature-based folders (`features/landing`, `features/planner`, etc.)
   - TailwindCSS + custom glassmorphism tokens handle styling.
   - Context keeps view/UI state, while TanStack Query caches server data.

2. **Node/Express server (`server/app.js`)**
   - Exposes `/api/*` endpoints for profiles, vacations, and global settings.
   - Serves the production `dist/` bundle in production mode.

3. **SQLite persistence (`data/holidaymax.db`)**
   - `profiles` table stores traveler metadata.
   - `vacations` table stores PTO ranges + commute data.
   - `app_settings` table stores optimizer defaults (year, PTO bounds, efficiency).
   - Enabled WAL + foreign keys for durability.

## Client Data Flow

1. Landing page uses profile mutations (`useCreateProfileMutation`, etc.) to talk to the API and keeps selections in `PlannerContext`.
2. Planner view hydrates the active profile by:
   - Normalizing the ISO country via `locationService`.
   - Fetching public holidays from Nager.Date (`holidayService`).
   - Running `generateSmartSuggestions` to compute efficient “bridges”.
3. Accepting a suggestion or adding a trip calls the vacation mutations and invalidates the shared `profiles` query, so every component sees fresh data.
4. Exporting uses `generateICSFile` entirely on the client.

## Key Modules

- `src/features/planner/hooks/useProfileHydration.ts`: orchestrates holiday fetch + suggestion generation per profile/year.
- `src/lib/services/*`: shared utility modules (holiday fetcher, location normalizer, optimizer, ICS exporter).
- `src/app/providers/AppProviders.tsx`: bootstraps QueryClient + planner context.

## Local vs Production Behavior

- **Dev (`npm run dev`)**: runs Express on `4173` and Vite on `3000` with a proxy for `/api`.
- **Production (`npm run build && npm start`)**: Express serves both API routes and the static assets so only one container/process is required.

## Important Notes

- All persistent data is in the SQLite file under `data/`. Mount that directory in Docker if you need durable storage.
- When changing optimizer settings (year/PTO bounds), invalidate existing hydration so calendars refresh with the new criteria.
- We intentionally avoided automated tests in this pass per request; wire up Vitest before making future behavioral changes.
- The `Holiday` type still supports an optional `description` field should you re-introduce AI-enriched context later.
