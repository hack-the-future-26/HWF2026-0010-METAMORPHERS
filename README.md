# 🧭 YatraSense

![Plan](https://img.shields.io/badge/PLAN-0f766e?style=for-the-badge)
![Adapt](https://img.shields.io/badge/ADAPT-c2410c?style=for-the-badge)
![Live](https://img.shields.io/badge/LIVE-1d4ed8?style=for-the-badge)
![Explore](https://img.shields.io/badge/EXPLORE-7c3aed?style=for-the-badge)
![Food](https://img.shields.io/badge/FOOD-b45309?style=for-the-badge)
![Stay](https://img.shields.io/badge/STAY-0e7490?style=for-the-badge)

A living itinerary for the city in front of you — search a real destination, score live map places to your trip, and rewrite the day when weather shifts.

Hack the Future ’26 · Team **METAMORPHERS** · [HWF2026-0010](https://github.com/hack-the-future-26/HWF2026-0010-METAMORPHERS)

## ☀️ Overview

YatraSense is a travel companion that sits between maps, booking sites, and review dumps. You name a city. It geocodes that city, loads real OpenStreetMap places, weather, and road routes, then scores a multi-day plan to your pace and budget.

It helps you:

- Plan a trip without creating an account
- See named places, food halls, and stays for the city you typed — not a silent fallback city
- Watch the itinerary rewrite when rain or heat actually hits
- Ask why a stop was swapped, in plain language
- Keep a ₹ range honest as the day changes

## ❗ Problem

Maps show pins. Booking apps show rooms. Review sites show opinions. None of them keep a day-by-day plan that moves when the city does.

Travellers still copy places into notes, guess a budget, and freeze an outdoor fort on the schedule even when rain is coming. Generic “top ten” lists ignore the neighbourhood you are actually in. Street-level search often lands on the wrong place entirely.

YatraSense treats the itinerary as a living object: score it, route it, then adapt it — and tell you why.

## ✨ Solution

1. **Search a city** — Photon geocoding with an India bias so “Madurai” is Tamil Nadu, not a random lane abroad.
2. **Plan in four steps** — city → when & who → style / pace / move → budget.
3. **Score real map places** — museums, cafes, restaurants, and stays from OSM / Photon, plus catalog famous food for known Indian cities.
4. **Adapt on weather** — rain ≥ 70% or heat ≥ 38°C swaps outdoor stops for indoor ones, recalculates travel and cost, and explains the change.
5. **Go live** — GPS with honest permission states, next stop, rewrite card. Demo Mode runs the same engine (Normal / Heavy Rain / Extreme Heat). It does not invent traffic or crowd percentages.

## 🔑 Features

- Destination search via Photon — empty results stay empty
- Places: Photon-first, slim Overpass backup
- Famous food halls for catalog cities; cafes and restaurants from the live map
- City-bounded hotel search (not street-name lodging)
- Open-Meteo current, hourly, and daily weather
- OSRM road geometry (straight lines are not drawn as routes)
- Personalized scoring (interest, distance, weather, hours, budget)
- Explainable rain / heat adaptation
- LLM assistant via `POST /api/ask` (server `AI_API_KEY` only — never `VITE_*`)
- Estimated budget with **Optimize my trip**

## 🔁 Product loop

1. **Landing / Home** — name any city. Featured Indian cities: Hyderabad, Jaipur, Goa, Udaipur, Varanasi, Mumbai, Kochi, Leh.
2. **Plan** — four steps, then generate.
3. **My Trip** — scored days, ₹ range, map, Optimize, Start Trip.
4. **Live** — GPS, next stop, weather, rewrite card.
5. **Explore / Food / Stay / Budget** — live pins and estimates, not a booking checkout.

## 🛠️ Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind, Leaflet, Zustand |
| Backend | Node, Express (`server/index.mjs`) |
| Maps & places | Photon, OpenStreetMap / Overpass |
| Weather | Open-Meteo |
| Routing | OSRM |
| Assistant | Server-side LLM (`AI_API_KEY`) |

```text
User
 ↓
React (Vite)
 ↓
Express API
 ↓
┌──────────┬──────────┬──────────┐
│ OSM      │ Weather  │ OSRM     │
│ Photon   │ OpenMeteo│ Routing  │
└──────────┴──────────┴──────────┘
 ↓
Planning engine
 ↓
AI + adaptation engine
 ↓
Updated itinerary
```

## 📡 Real vs fallback data

| Feed | Live source | If it fails |
| --- | --- | --- |
| Location | Browser GPS | Planned destination centre — never a fake fix |
| Geocoding | Photon via `/api/geocode` | Empty results + “We couldn't find this destination…” |
| Places | Photon + OSM | Previously loaded places, labeled unavailable |
| Weather | Open-Meteo | Cached snapshot labeled CACHED, or Retry |
| Routing | OSRM | **Route unavailable** |
| AI | Server LLM | 503 if `AI_API_KEY` is missing |
| Traffic | None | Unavailable / no provider connected |
| Crowd | None | Unavailable / no provider connected |

Visakhapatnam is **optional sample / Demo catalog data** only. It is never a silent substitute for a failed search.

## 🚀 Setup

```bash
npm install
cp .env.example .env   # add AI_API_KEY for the assistant
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). API: [http://localhost:8787](http://localhost:8787).

```bash
npm run lint
npm run test
npm run build
```

## 🔐 Environment

See `.env.example`. For a full demo:

- `VITE_API_URL` — frontend → backend (`http://localhost:8787` locally)
- `AI_API_KEY` — server only
- `AI_MODEL` — e.g. `openai/gpt-4o-mini` on OpenRouter
- `FRONTEND_ORIGIN` — production CORS allow-list

Never put the AI key in `VITE_*`.

## ☁️ Deployment

GitHub Pages cannot host Express.

1. **Backend** — Render / Railway / Fly: start command `node server/index.mjs`, set `PORT`, `AI_API_KEY`, `AI_MODEL`, `FRONTEND_ORIGIN`.
2. **Frontend** — Vercel: framework Vite, env `VITE_API_URL=https://your-backend.onrender.com`.
3. Confirm the public site can search a city, load weather/places, plan, adapt, and call `/api/ask`.

## 🧪 3-minute demo

1. Landing → search **Hyderabad** → Plan (no login).
2. Four steps: dates, party, Culture + Food + History, ₹8,000 → generate.
3. Confirm named places, weather, map, OSRM hops, budget.
4. Live → Start Trip → allow or deny GPS (deny stays honest).
5. DEMO MODE → **Heavy Rain** → outdoor stop replaced, route/budget recalculated, explanation shown.
6. Ask AI: “Why did you change my itinerary?” then “I only have ₹500 left. What can I do?”

## ⚠️ Limitations

- No live traffic provider
- No live crowd provider
- OSM coverage and tags vary by city
- Costs are **estimates**, not booking quotes
- Photon / Overpass / OSRM public instances have rate limits — the backend caches and throttles
- LLM answers require a configured server key

## 👥 Team

**METAMORPHERS** · Hack the Future 2026 · Project `HWF2026-0010`
