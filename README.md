# Holiday Maximizer

Holiday Maximizer is a modern PTO optimization companion. Create traveler profiles, fetch public holidays for any supported country, and get AI-free “bridge” suggestions that maximize real days off versus PTO spent. The refreshed UI is mobile-first, context aware, and synchronizes profile data and trips to a lightweight SQLite database so nothing disappears between sessions.

## Architecture

| Layer | Responsibilities |
| --- | --- |
| **React + Vite client** | Feature-based structure (Landing, Planner, Calendar, Suggestions). State is managed through lightweight context plus TanStack Query for API caching. TailwindCSS powers theming, while custom components (glass panels, pill controls) keep visuals cohesive. |
| **Node/Express API** | Serves REST endpoints under `/api/*` and the production build. All profile, vacation, and settings data live in a `better-sqlite3` database located at `data/holidaymax.db`. |
| **Services** | Client-side services fetch public holidays (Nager.Date), normalize country names, generate optimization windows, and build `.ics` exports. |
| **Persistence** | SQLite WAL mode ensures durability while staying lightweight enough to run inside the same container. Volume-mount `./data` to keep history across deploys. |

## Prerequisites

- Node.js 20+
- npm 10+

## Local Development

```bash
# Install dependencies
npm install

# Run API + Vite dev server concurrently (http://localhost:3000)
```

Dev mode starts two processes:

1. `server/app.js` on port **4173** for API + SQLite.
2. Vite dev server on **3000** with a proxy so the browser can call `/api/*` without CORS headaches.

Environment overrides go in `.env.local` (already git‑ignored). For example:

```
VITE_API_PROXY=http://localhost:4173
```

## Production Build

```bash
npm run build     # bundles the React app into dist/
npm start         # serves dist + API via Express (uses SQLite in ./data)
```

The same Express server powers both the API and static assets, simplifying deployment.

## Docker

`docker-compose.yml` builds the production image, wires environment variables, and exposes port **4173**.

```bash
docker compose up --build
```

SQLite data lives in `/app/data` inside the container. Mount a host volume if you need persistence:

```yaml
  driver: local

services:
  web:
    volumes:
      - ./data:/app/data
```

## Key Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Launch Express API + Vite dev server |
| `npm run build` | Create production React build |
| `npm start` | Serve built assets + API from Node |
| `docker compose up --build` | Build + run containerized stack |

## Feature Highlights

- Glassmorphism-inspired UI with responsive calendar grid / horizontal pills on touch devices
- Query-driven profile storage so mutations automatically sync across tabs
- Quick toggles to compare partner or teammate calendars via subtle overlays
- `.ics` export with filters for weekends/holidays + commute metadata
- Settings modal to tune minimum PTO, max PTO, and efficiency floor per planning year

## Data Flow

1. Landing page writes profile metadata to `/api/profiles` (SQLite).
2. Planner view hydrates a profile by fetching holidays from Nager.Date, then runs the optimized bridge algorithm locally.
3. Accepting a suggestion creates a vacation row; the query cache refreshes automatically.
4. Exporting trips streams an `.ics` file generated entirely client-side.

## Limitations & Next Steps

- No automated tests yet; integrate Vitest + React Testing Library before shipping to prod.
- Settings are global today—per-profile overrides are on the roadmap.
- Holiday descriptions rely on the upstream API; consider enriching with editorial copy later.
