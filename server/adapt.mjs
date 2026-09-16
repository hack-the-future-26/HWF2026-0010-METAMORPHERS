/** Same decision rules as src/lib/adaptEngine.ts — keep thresholds in sync. */

function outdoorStop(act, places) {
  const p = places.find((x) => x.id === act.placeId)
  if (p) return p.indoor === false && (p.weatherSensitive || (p.styles || []).includes('beaches') || (p.styles || []).includes('nature'))
  const blob = `${act.title || ''} ${act.subtitle || ''}`.toLowerCase()
  return /beach|park|garden|viewpoint|fort|fortress|boating|statue|trail|outdoor/.test(blob)
}

function indoorAlt(places, avoid) {
  return places.find(
    (p) =>
      p.indoor &&
      !avoid.includes(p.id) &&
      (p.category === 'attraction' || p.category === 'cafe' || p.category === 'restaurant' || p.category === 'shopping'),
  )
}

export function evaluateTripConditions({ itinerary, weather, places = [] }) {
  if (!itinerary || !weather || weather.unavailable) {
    return { changed: false, reason: 'No itinerary or live weather to evaluate.' }
  }
  const acts = (itinerary.daysPlan || []).flatMap((d) => d.activities || [])
  const avoid = acts.map((a) => a.placeId).filter(Boolean)
  const rain = weather.rainProbability >= 70 || ['rain', 'heavy-rain', 'storm'].includes(weather.condition)
  const heat = (weather.apparentTempC ?? weather.tempC) >= 38

  const hit = rain
    ? acts.find((a) => a.kind === 'place' && outdoorStop(a, places))
    : heat
      ? acts.find((a) => {
          const p = places.find((x) => x.id === a.placeId)
          return a.kind === 'place' && p && !p.indoor
        })
      : null

  if (!hit) {
    return {
      changed: false,
      trigger: rain
        ? { type: 'weather', severity: 'high', value: weather.rainProbability }
        : heat
          ? { type: 'heat', severity: 'high', value: weather.tempC }
          : { type: 'none', severity: 'low', value: weather.rainProbability || weather.tempC || 0 },
      reason: 'No weather-sensitive outdoor stop needed a change.',
    }
  }

  const alt = indoorAlt(places, avoid.filter((id) => id !== hit.placeId))
  if (!alt) {
    return {
      changed: false,
      trigger: { type: rain ? 'weather' : 'heat', severity: 'high', value: rain ? weather.rainProbability : weather.tempC },
      affectedActivity: hit,
      reason: 'An outdoor stop is at risk, but no indoor OpenStreetMap alternative is loaded.',
    }
  }

  const trigger = rain
    ? { type: 'weather', severity: 'high', value: weather.rainProbability }
    : { type: 'heat', severity: 'high', value: weather.tempC }

  return {
    changed: true,
    trigger,
    affectedActivity: hit,
    replacementActivity: { title: alt.name, placeId: alt.id, indoor: true },
    reason: rain
      ? `Rain probability is ${weather.rainProbability}%. ${hit.title} is outdoors, so it is replaced with ${alt.name}, an indoor alternative.`
      : `Temperature is ${weather.tempC}°C. ${hit.title} is outdoors, so it is replaced with ${alt.name}.`,
    routeChanges: { kmDelta: 0, minutesDelta: 0 },
    budgetChanges: { estimatedSavings: 0 },
  }
}
