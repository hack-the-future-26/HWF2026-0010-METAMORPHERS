# YatraSense

AI travel co-pilot for a hackathon-ready demo: **Understand → Plan → Explore → Monitor → Adapt**.

The UI is fully interactive with Visakhapatnam sample data. Live weather uses [Open-Meteo](https://open-meteo.com/) when the network is available; everything else falls back to a realistic mock layer so the product works offline in demo mode.

## Run

```bash
npm install
npm run dev
```

Open the printed local URL (Vite defaults to `http://localhost:5173`).

## Demo flow (about 3 clicks)

1. Homepage → **Plan My Trip ✨** (Visakhapatnam).
2. Walk the planner or jump to step 8 → **Create My Smart Trip**.
3. Open **My Trip** → **Start Trip** → **DEMO MODE** → **Simulate Rain** → **Replace Activity**.

## Architecture

- `src/types` — User, Trip, Place, Weather, Crowd, Expense, Notification
- `src/services` — API-ready modules (`weatherService`, `mapsService`, `placesService`, `geocodingService`, `routingService`, `eventsService`, `crowdService`, `aiService`). UI never calls third-party APIs directly.
- `src/store/useAppStore.ts` — Zustand + localStorage persistence
- Maps use Leaflet + Carto tiles (no map API key required)

Copy `.env.example` to `.env` when you have provider keys. **Never put secret server keys in `VITE_*` variables** — those are exposed to the browser. Restrict any client keys by HTTP referrer.

## Scripts

- `npm run dev` — local server
- `npm run build` — production bundle
- `npm run preview` — serve the production build
