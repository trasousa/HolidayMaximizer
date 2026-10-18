# 🌴 Holiday Maximizer

Smart PTO planner that finds the "bridge" days between weekends and public holidays, so every vacation day buys as many days off as possible.

## 🔗 Live app
[holidaycalendar.btopencloud.com](https://holidaycalendar.btopencloud.com), a static site on Cloudflare Pages.

## ✨ Features

- **Smart bridges**: suggests the working days that join weekends, holidays and trips you've already booked into one long break. Breaks can span several gaps and run across New Year.
- **National, regional and city holidays**: data comes from the [OpenHolidays API](https://www.openholidaysapi.org) (down to municipality level, e.g. Lisbon's Santo António) and [Nager.Date](https://date.nager.at) (~120 countries). It refreshes weekly, and you can force a refresh from the Holidays tab.
- **Custom holidays**: add municipal, company or personal days off, one-off or yearly.
- **Per-person work week**: Fri/Sat or single-day weekends are supported, with defaults set per country.
- **Compare people**: overlay other profiles' trips on the same calendar.
- **Calendar export**: download an `.ics` file for Google, Outlook or Apple Calendar.

## 💾 Your data stays in the browser

There is no backend. Profiles, trips and settings are stored in **IndexedDB**, in the browser you use:

- The session (current view, profile, tab and overlays) is cached too, so a reload or a later visit opens where you left off.
- The app asks the browser for **persistent storage** so the data isn't evicted under storage pressure. Settings → *Your data* shows whether it was granted.
- Holiday API responses are cached in IndexedDB, so the planner also works offline.
- Use **Settings → Backup / Restore** to move your plan to another browser or device. Data is per origin, so preview deployments (`*.pages.dev`) don't share data with the production domain.

## 📐 Calculation rules

| Rule | Behaviour |
| --- | --- |
| PTO cost | Only working days count: not weekends (per-profile work week), not public or custom holidays. |
| Allowance | Only days inside the planning year count. Overlapping trips are counted once. Categories marked "Free" (remote work, commute…) don't use PTO. |
| Days off / multiplier | The booked days plus the weekends and holidays attached to them. Multiplier = days off ÷ PTO days. |
| Holiday types | Only real days off ("Public", and "Bank" on Nager.Date). Optional days, observances and school holidays are ignored. |
| Bridges | Bounded by free days on both sides, cost between *min* and *max* PTO days, multiplier ≥ *min multiplier*, and (optionally) at least one public holiday. Past breaks are hidden in the current year. Results are ranked by multiplier, then length, keeping at most one longer alternative per period. |

All date maths uses plain `yyyy-MM-dd` strings in UTC, so results don't depend on your time zone.

## 🚀 Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests for the optimizer, stats and holiday parsing
npm run build      # type-check + production build into dist/
```

## ☁️ Deploying to Cloudflare Pages

**Git integration (recommended):** in the Pages project, set:

- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables: none needed (`VITE_APP_MODE` is no longer used and can be removed).

**Direct upload:** `npm run deploy` builds and runs `wrangler pages deploy dist`. The project name comes from `wrangler.toml`.

`public/_headers` caches hashed assets forever and always revalidates `index.html`, so new deploys reach users immediately.
